import SwiftUI

struct ChatView: View {
    @EnvironmentObject var session: SagaiSessionManager
    var selectedTab: Binding<Int>? = nil
    var showingRegister: Binding<Bool>? = nil
    var isSideMenuOpen: Binding<Bool>? = nil
    
    @State private var searchText: String = ""
    @State private var activeChatProfile: Profile? = nil
    @State private var pollTimer: Timer? = nil
    
    // Connected profiles (either party accepted connection)
    private var connectedProfiles: [Profile] {
        guard let currentUserId = session.currentUser?.id else { return [] }
        return session.profiles.filter { profile in
            profile.id != currentUserId && session.areConnected(profileId: profile.id)
        }
    }
    
    // Profiles that have an active conversation or are connected
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
        
        let trimmed = searchText.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty {
            return list
        } else {
            let query = trimmed.lowercased()
            return list.filter {
                $0.name.lowercased().contains(query) ||
                $0.clan.lowercased().contains(query) ||
                $0.gotra.lowercased().contains(query)
            }
        }
    }
    
    var body: some View {
        ZStack {
            Color.white.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Top Header Title
                HStack(spacing: 12) {
                    if let isSideMenuOpen = isSideMenuOpen {
                        Button(action: {
                            withAnimation {
                                isSideMenuOpen.wrappedValue = true
                            }
                        }) {
                            Image(systemName: "line.horizontal.3")
                                .foregroundColor(Color.appTextPrimary)
                                .font(.title2)
                                .frame(width: 40, height: 40)
                                .background(Color.appCardBackground)
                                .clipShape(Circle())
                        }
                    }
                    Text("Messages")
                        .font(BrandFonts.displayBold(size: 28))
                        .foregroundColor(Color.appTextPrimary)
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 14)
                .padding(.bottom, 10)
                
                // Clean Search Field (Matching UI Kit)
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(Color.appTextMuted)
                    
                    TextField("Search chats by name, gotra...", text: $searchText)
                        .font(BrandFonts.body(size: 14))
                        .foregroundColor(Color.appTextPrimary)
                    
                    if !searchText.isEmpty {
                        Button(action: { searchText = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 16))
                                .foregroundColor(Color.appTextMuted)
                        }
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color.appCardBackground)
                .cornerRadius(14)
                .padding(.horizontal, 20)
                .padding(.bottom, 12)
                
                // Main Content Area
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 14) {
                        // 1. New Matches Horizontal Story Tray
                        if searchText.isEmpty && !connectedProfiles.isEmpty {
                            newMatchesSection
                            
                            Divider()
                                .background(Color.appDivider)
                                .padding(.horizontal, 20)
                        }
                        
                        // 2. Conversations Section
                        conversationsSection
                    }
                    .padding(.bottom, 24)
                }
                .refreshable {
                    await session.refreshProfilesAsync()
                    session.refreshCurrentUserAbout()
                }
            }
        }
        .navigationBarHidden(true)
        .sheet(item: $activeChatProfile) { profile in
            ChatDetailView(profile: profile, currentUser: session.currentUser)
                .environmentObject(session)
        }
        .onAppear {
            session.refreshCurrentUserAbout()
            session.fetchConnectionsAndGenerateNotifications()
            pollTimer?.invalidate()
            pollTimer = Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { _ in
                session.refreshCurrentUserAbout()
            }
        }
        .onDisappear {
            pollTimer?.invalidate()
            pollTimer = nil
        }
    }
    
    // MARK: - New Matches Section (UI Kit Activity Story Tray)
    private var newMatchesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("New Matches")
                .font(BrandFonts.displayBold(size: 15))
                .foregroundColor(Color.appTextPrimary)
                .padding(.horizontal, 20)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(connectedProfiles) { profile in
                        Button(action: {
                            activeChatProfile = profile
                        }) {
                            VStack(spacing: 6) {
                                ZStack(alignment: .bottomTrailing) {
                                    // Circular Avatar with Gradient Ring
                                    ZStack {
                                        Circle()
                                            .stroke(
                                                LinearGradient(
                                                    colors: [Color.appPrimary, Color.starPurple],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                ),
                                                lineWidth: 2.2
                                            )
                                            .frame(width: 62, height: 62)
                                        
                                        storyAvatarImage(for: profile, size: 54)
                                    }
                                    
                                    // Subtle Online Dot
                                    Circle()
                                        .fill(Color.successGreen)
                                        .frame(width: 13, height: 13)
                                        .overlay(Circle().stroke(Color.white, lineWidth: 2))
                                        .offset(x: -1, y: -1)
                                }
                                
                                Text(profile.name.components(separatedBy: " ").first ?? profile.name)
                                    .font(BrandFonts.body(size: 12, weight: .semibold))
                                    .foregroundColor(Color.appTextPrimary)
                                    .lineLimit(1)
                                    .frame(width: 66)
                            }
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 4)
            }
        }
    }
    
    private func storyAvatarImage(for profile: Profile, size: CGFloat) -> some View {
        AvatarImageView(
            imageSource: profile.img,
            name: profile.name,
            clan: profile.clan,
            contentMode: .fill,
            fallbackFontSize: size * 0.42
        )
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
    
    // MARK: - Conversations Section
    private var conversationsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(searchText.isEmpty ? "Conversations" : "Results")
                .font(BrandFonts.displayBold(size: 15))
                .foregroundColor(Color.appTextPrimary)
                .padding(.horizontal, 20)
            
            if conversationProfiles.isEmpty {
                emptyChatsView
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(conversationProfiles.enumerated()), id: \.element.id) { index, profile in
                        conversationRow(profile: profile)
                        
                        if index < conversationProfiles.count - 1 {
                            Divider()
                                .background(Color.appDivider)
                                .padding(.leading, 84)
                                .padding(.trailing, 20)
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Conversation Row (Matching UI Kit chat_list_item.dart)
    private func conversationRow(profile: Profile) -> some View {
        let lastMsg = SupabaseClient.shared.getLastMessage(
            userAbout: session.currentUser?.about,
            userId: session.currentUser?.id ?? "",
            profileAbout: profile.about,
            profileId: profile.id
        )
        let isUnread = lastMsg != nil && !(lastMsg?.isFromMe ?? true)
        
        return Button(action: {
            activeChatProfile = profile
        }) {
            HStack(spacing: 14) {
                // Avatar with Online dot
                ZStack(alignment: .bottomTrailing) {
                    storyAvatarImage(for: profile, size: 54)
                    
                    Circle()
                        .fill(Color.successGreen)
                        .frame(width: 12, height: 12)
                        .overlay(Circle().stroke(Color.white, lineWidth: 2))
                }
                
                // Name & Message Snippet
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 4) {
                        Text(profile.name)
                            .font(BrandFonts.body(size: 15.5, weight: isUnread ? .bold : .semibold))
                            .foregroundColor(Color.appTextPrimary)
                            .lineLimit(1)
                        
                        if profile.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 13))
                                .foregroundColor(Color.verifiedBlue)
                        }
                        
                        Spacer()
                        
                        if let time = lastMsg?.time, time > 0 {
                            let date = Date(timeIntervalSince1970: time / 1000)
                            Text(formatTimestamp(date))
                                .font(BrandFonts.body(size: 11.5, weight: isUnread ? .bold : .regular))
                                .foregroundColor(isUnread ? Color.appPrimary : Color.appTextMuted)
                        }
                    }
                    
                    HStack {
                        if let last = lastMsg {
                            let prefix = last.isFromMe ? "You: " : ""
                            Text("\(prefix)\(last.text)")
                                .font(BrandFonts.body(size: 13.5, weight: isUnread ? .semibold : .regular))
                                .foregroundColor(isUnread ? Color.appTextPrimary : Color.appTextSecondary)
                                .lineLimit(1)
                        } else {
                            Text("Connected. Tap to message!")
                                .font(BrandFonts.body(size: 13))
                                .foregroundColor(Color.appPrimary)
                                .italic()
                                .lineLimit(1)
                        }
                        
                        Spacer()
                        
                        if isUnread {
                            Circle()
                                .fill(Color.appPrimary)
                                .frame(width: 8, height: 8)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
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
    
    // MARK: - Empty State View
    private var emptyChatsView: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.appCardBackground)
                    .frame(width: 72, height: 72)
                Image(systemName: session.currentUser == nil ? "lock.shield.fill" : "bubble.left.and.bubble.right")
                    .font(.system(size: 30))
                    .foregroundColor(Color.appPrimary)
            }
            .padding(.top, 30)
            
            Text(session.currentUser == nil ? "Sign In to Access Real Chats" : "No Active Conversations Yet")
                .font(BrandFonts.displayBold(size: 16))
                .foregroundColor(Color.appTextPrimary)
            
            Text(session.currentUser == nil ? "Log in to chat in real-time with verified Rajput brides and grooms across the web and app." : "Express a Rishta in Discover or accept connection requests to start real-time messaging.")
                .font(BrandFonts.body(size: 13))
                .foregroundColor(Color.appTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Button(action: {
                if session.currentUser == nil {
                    showingRegister?.wrappedValue = true
                } else {
                    selectedTab?.wrappedValue = 0
                }
            }) {
                HStack(spacing: 6) {
                    Image(systemName: session.currentUser == nil ? "person.crop.circle.badge.plus" : "rectangle.stack.fill")
                    Text(session.currentUser == nil ? "Log In / Register" : "Explore Discover Deck")
                        .font(BrandFonts.bodyBold(size: 13.5))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 22)
                .padding(.vertical, 10)
                .background(
                    LinearGradient(
                        colors: [Color.appPrimary, Color.appSecondary],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(Capsule())
                .shadow(color: Color.appPrimary.opacity(0.3), radius: 6, y: 3)
            }
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }
}
