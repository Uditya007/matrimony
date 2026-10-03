import SwiftUI

struct ChatView: View {
    @EnvironmentObject var session: SagaiSessionManager
    var selectedTab: Binding<Int>? = nil
    
    @State private var selectedSubTab: Int = 0 // 0 = All Conversations, 1 = Connected Matches
    @State private var searchText: String = ""
    @State private var activeChatProfile: Profile? = nil
    
    // Profiles that are connected (either party accepted)
    private var connectedProfiles: [Profile] {
        guard let currentUserId = session.currentUser?.id else { return [] }
        return session.profiles.filter { profile in
            profile.id != currentUserId && session.areConnected(profileId: profile.id)
        }
    }
    
    // Profiles that have active message history or are connected
    private var conversationProfiles: [Profile] {
        guard let currentUser = session.currentUser else { return [] }
        let myChats = SupabaseClient.shared.getProfileChats(aboutText: currentUser.about)
        
        var list = session.profiles.filter { profile in
            guard profile.id != currentUser.id else { return false }
            let hasMyMessages = myChats[profile.id]?.isEmpty == false
            let partnerChats = SupabaseClient.shared.getProfileChats(aboutText: profile.about)
            let hasPartnerMessages = partnerChats[currentUser.id]?.isEmpty == false
            let connected = session.areConnected(profileId: profile.id)
            return hasMyMessages || hasPartnerMessages || connected
        }
        
        // Sort by latest message timestamp descending
        list.sort { p1, p2 in
            let last1 = SupabaseClient.shared.getLastMessage(
                userAbout: currentUser.about,
                userId: currentUser.id,
                profileAbout: p1.about,
                profileId: p1.id
            )?.time ?? 0.0
            
            let last2 = SupabaseClient.shared.getLastMessage(
                userAbout: currentUser.about,
                userId: currentUser.id,
                profileAbout: p2.about,
                profileId: p2.id
            )?.time ?? 0.0
            
            return last1 > last2
        }
        
        if searchText.trimmingCharacters(in: .whitespaces).isEmpty {
            return list
        } else {
            let query = searchText.lowercased()
            return list.filter {
                $0.name.lowercased().contains(query) ||
                $0.clan.lowercased().contains(query) ||
                $0.gotra.lowercased().contains(query)
            }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Search Bar
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.royalGold)
                TextField("Search conversations by name, clan...", text: $searchText)
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(.sandstoneIvory)
                if !searchText.isEmpty {
                    Button(action: { searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.08))
            .cornerRadius(10)
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 6)
            
            // Subtabs
            Picker("SubTabs", selection: $selectedSubTab) {
                Text("All Conversations (\(conversationProfiles.count))").tag(0)
                Text("Connected (\(connectedProfiles.count))").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
            
            let displayedProfiles = selectedSubTab == 0 ? conversationProfiles : connectedProfiles
            
            if displayedProfiles.isEmpty {
                emptyStateView
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        // Quick-tap horizontal stories for connected members
                        if !connectedProfiles.isEmpty && selectedSubTab == 0 {
                            connectedStoriesSection
                        }
                        
                        // Conversations List
                        VStack(spacing: 8) {
                            ForEach(displayedProfiles) { profile in
                                conversationRow(profile: profile)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                }
                .refreshable {
                    await session.refreshProfilesAsync()
                    session.refreshCurrentUserAbout()
                }
            }
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
        .sheet(item: $activeChatProfile) { profile in
            ChatDetailView(profile: profile, currentUser: session.currentUser)
                .environmentObject(session)
        }
        .onAppear {
            session.refreshCurrentUserAbout()
            session.fetchConnectionsAndGenerateNotifications()
        }
    }
    
    // Horizontal row of connected members
    private var connectedStoriesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("CONNECTED LINEAGE")
                .font(BrandFonts.label(size: 10))
                .foregroundColor(.sandstoneIvory.opacity(0.6))
                .tracking(1)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(connectedProfiles) { profile in
                        Button(action: {
                            activeChatProfile = profile
                        }) {
                            VStack(spacing: 6) {
                                ZStack {
                                    avatarView(for: profile, size: 52)
                                    Circle()
                                        .stroke(Color.royalGold, lineWidth: 2)
                                        .frame(width: 54, height: 54)
                                    
                                    // Chat bubble badge
                                    Circle()
                                        .fill(Color.royalGold)
                                        .frame(width: 18, height: 18)
                                        .overlay(
                                            Image(systemName: "bubble.right.fill")
                                                .font(.system(size: 9))
                                                .foregroundColor(.deepMaroon)
                                        )
                                        .offset(x: 18, y: 18)
                                }
                                
                                Text(profile.name.components(separatedBy: " ").first ?? profile.name)
                                    .font(BrandFonts.body(size: 11, weight: .semibold))
                                    .foregroundColor(.sandstoneIvory)
                                    .lineLimit(1)
                                    .frame(width: 60)
                            }
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .padding(.vertical, 6)
    }
    
    // Conversation row card
    private func conversationRow(profile: Profile) -> some View {
        let lastMsg = SupabaseClient.shared.getLastMessage(
            userAbout: session.currentUser?.about,
            userId: session.currentUser?.id ?? "",
            profileAbout: profile.about,
            profileId: profile.id
        )
        
        return Button(action: {
            activeChatProfile = profile
        }) {
            HStack(spacing: 12) {
                // Avatar
                ZStack(alignment: .bottomTrailing) {
                    avatarView(for: profile, size: 50)
                    Circle()
                        .fill(Color.green)
                        .frame(width: 12, height: 12)
                        .overlay(Circle().stroke(Color.deepMaroon, lineWidth: 2))
                }
                
                // Info & Snippet
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(profile.name)
                            .font(BrandFonts.displayBold(size: 15))
                            .foregroundColor(.lightGold)
                            .lineLimit(1)
                        
                        if profile.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 12))
                                .foregroundColor(Color(hex: "#2ecc71"))
                        }
                        
                        Spacer()
                        
                        if let time = lastMsg?.time, time > 0 {
                            let date = Date(timeIntervalSince1970: time / 1000)
                            Text(formatTimestamp(date))
                                .font(BrandFonts.label(size: 10))
                                .foregroundColor(.sandstoneIvory.opacity(0.5))
                        }
                    }
                    
                    HStack(spacing: 6) {
                        Text("\(profile.clan) • \(profile.gotra)")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.royalGold.opacity(0.85))
                        
                        Text("•")
                            .font(.system(size: 8))
                            .foregroundColor(.gray)
                        
                        if let last = lastMsg {
                            let prefix = last.isFromMe ? "You: " : ""
                            Text("\(prefix)\(last.text)")
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(.sandstoneIvory.opacity(0.75))
                                .lineLimit(1)
                        } else {
                            Text("Connected. Tap to message!")
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(.royalGold)
                                .italic()
                        }
                    }
                }
            }
            .padding(12)
            .background(Color.white.opacity(0.06))
            .cornerRadius(12)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.royalGold.opacity(0.2), lineWidth: 1))
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func avatarView(for profile: Profile, size: CGFloat) -> some View {
        Group {
            if let imgName = profile.img, !imgName.isEmpty {
                if imgName.hasPrefix("http") {
                    AsyncImage(url: URL(string: imgName)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                    }
                } else {
                    let localUrl = "https://shreerajputsagaisambandh.com/images/\(imgName).png"
                    AsyncImage(url: URL(string: localUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                    }
                }
            } else {
                Circle()
                    .fill(Color.royalGold)
                    .overlay(
                        Text(String(profile.name.prefix(1)))
                            .font(BrandFonts.displayBold(size: size * 0.45))
                            .foregroundColor(.deepMaroon)
                    )
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(Circle().stroke(Color.royalGold.opacity(0.4), lineWidth: 1))
    }
    
    private func formatTimestamp(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            let formatter = DateFormatter()
            formatter.dateFormat = "h:mm a"
            return formatter.string(from: date)
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "d MMM"
            return formatter.string(from: date)
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Spacer()
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.05))
                    .frame(width: 90, height: 90)
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.royalGold)
            }
            
            Text("No Conversations Yet")
                .font(BrandFonts.displayBold(size: 18))
                .foregroundColor(.lightGold)
            
            Text("Express interest in the Matches tab or accept pending requests in your Inbox to start noble family dialogues.")
                .font(BrandFonts.body(size: 13))
                .foregroundColor(.sandstoneIvory.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 36)
            
            Button(action: {
                selectedTab?.wrappedValue = 1
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "heart.fill")
                    Text("Discover Compatible Matches")
                        .font(BrandFonts.bodyBold(size: 14))
                }
                .foregroundColor(.deepMaroon)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(Color.royalGold)
                .cornerRadius(20)
                .shadow(radius: 4)
            }
            .padding(.top, 10)
            
            Spacer()
        }
    }
}
