import SwiftUI

struct MatchesView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var selectedTab: Int
    @Binding var showingRegister: Bool
    @Binding var isSideMenuOpen: Bool
    @State private var activeFilterTab: Int = 0 // 0 = All, 1 = Gotra Compatible
    @State private var selectedProfileForDetail: Profile? = nil
    @State private var viewMode: Int = 0 // 0 = Swipe Cards, 1 = List Feed
    @State private var showingConnectionSuccess: Bool = false
    @State private var successProfileName: String = ""
    
    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                // View Mode switcher tabs
                viewModeSwitcher
                
                filterTabs
                
                if viewMode == 0 {
                    SwipeDeckView(
                        profiles: filteredMatches,
                        isLocked: isProfileLocked,
                        onUnlock: showRegistration,
                        onConnect: { profile in
                            successProfileName = profile.name
                            showingConnectionSuccess = true
                        }
                    )
                    .frame(maxHeight: .infinity)
                } else {
                    matchesList
                }
            }
            
            // Notification toast popover
            if showingConnectionSuccess {
                Color.black.opacity(0.4)
                    .edgesIgnoringSafeArea(.all)
                    
                VStack(spacing: 16) {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.royalGold)
                    
                    Text("Connection Sent!")
                        .font(BrandFonts.displayBold(size: 18))
                        .foregroundColor(.lightGold)
                    
                    Text("\(successProfileName) has been notified of your interest. You will be alerted once they accept.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(.sandstoneIvory)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.vertical, 24)
                .background(Color.deepMaroon)
                .cornerRadius(16)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.royalGold, lineWidth: 2))
                .padding(30)
                .shadow(radius: 12)
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                        showingConnectionSuccess = false
                    }
                }
            }
        }
        .sheet(item: $selectedProfileForDetail) { profile in
            ProfileDetailView(profile: profile)
                .environmentObject(session)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: {
                    withAnimation {
                        isSideMenuOpen = true
                    }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "line.horizontal.3")
                            .foregroundColor(.lightGold)
                            .font(.title2)
                        
                        Image("logo")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 32, height: 32)
                            .clipShape(Circle())
                            .background(Color.white)
                            .cornerRadius(16)
                            .overlay(Circle().stroke(Color.royalGold, lineWidth: 0.5))
                    }
                }
            }
            ToolbarItem(placement: .principal) {
                Text("Matches")
                    .font(BrandFonts.displayBold(size: 18))
                    .foregroundColor(.lightGold)
            }
        }
    }
    
    private var filterTabs: some View {
        Picker("Filter", selection: $activeFilterTab) {
            Text("All Matches").tag(0)
            Text("Gotra Compatible").tag(1)
        }
        .pickerStyle(SegmentedPickerStyle())
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color.deepMaroon)
    }
    
    private var matchesList: some View {
        ScrollView {
            VStack(spacing: 20) {
                ForEach(filteredMatches) { profile in
                    matchRow(for: profile)
                }
            }
            .padding()
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
    }
    
    private func matchRow(for profile: Profile) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            ProfileSummaryCard(
                profile: profile,
                isLocked: isProfileLocked,
                onUnlockTap: showRegistration,
                onDetailTap: {
                    openDetail(for: profile)
                }
            )
            
            Button(action: {
                handleConnectTap(profileName: profile.name)
            }) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                    Text("Connect Now")
                        .font(BrandFonts.bodyBold(size: 14))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Color.green)
                .cornerRadius(22)
            }
        }
        .padding()
        .background(Color.deepMaroon)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.royalGold.opacity(0.3), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.1), radius: 4)
    }
    
    private var isProfileLocked: Bool {
        session.currentUser == nil
    }
    
    private var filteredMatches: [Profile] {
        let searched = session.profiles.filter {
            let genderMatch = $0.gender == session.searchGender
            let clanMatch = session.searchClan == "All Clans" || $0.clan.lowercased() == session.searchClan.lowercased()
            return genderMatch && clanMatch
        }
        
        if activeFilterTab == 1, let currentUser = session.currentUser {
            return searched.filter {
                $0.gotra.lowercased() != currentUser.gotra.lowercased()
            }
        }
        return searched
    }
    
    private func showRegistration() {
        showingRegister = true
    }
    
    private func openDetail(for profile: Profile) {
        if isProfileLocked {
            showRegistration()
        } else {
            selectedProfileForDetail = profile
        }
    }
    
    private func handleConnectTap(profileName: String) {
        if isProfileLocked {
            showRegistration()
        } else {
            successProfileName = profileName
            showingConnectionSuccess = true
        }
    }
    
    private var viewModeSwitcher: some View {
        Picker("View Mode", selection: $viewMode) {
            Text("Swipe Cards").tag(0)
            Text("List Feed").tag(1)
        }
        .pickerStyle(SegmentedPickerStyle())
        .padding(.horizontal)
        .padding(.top, 10)
        .background(Color.deepMaroon)
    }
}

struct SwipeDeckView: View {
    let profiles: [Profile]
    let isLocked: Bool
    let onUnlock: () -> Void
    let onConnect: (Profile) -> Void
    
    @State private var currentIndex: Int = 0
    @State private var offset: CGSize = .zero
    @State private var rotation: Double = 0
    
    var body: some View {
        ZStack {
            if currentIndex < profiles.count {
                let profile = profiles[currentIndex]
                
                VStack(spacing: 20) {
                    // Swipe Card Container
                    ZStack(alignment: .bottom) {
                        // Blurred representation if locked, monogram if open
                        if isLocked {
                            VStack(spacing: 16) {
                                Spacer()
                                Image(systemName: "lock.fill")
                                    .font(.system(size: 64))
                                    .foregroundColor(.royalGold)
                                Text("Lineage Portrait Locked")
                                    .font(BrandFonts.displayBold(size: 20))
                                    .foregroundColor(.lightGold)
                                Text("Complete Verification to unlock photos.")
                                    .font(BrandFonts.body(size: 13))
                                    .foregroundColor(.sandstoneIvory.opacity(0.7))
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal)
                                Spacer()
                            }
                            .frame(width: 320, height: 420)
                            .background(Color.royalGold.opacity(0.12))
                            .cornerRadius(24)
                            .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.royalGold.opacity(0.3), lineWidth: 1.5))
                        } else {
                            // Monogram circular or simple background with details
                            VStack(spacing: 20) {
                                Spacer()
                                Circle()
                                    .fill(Color.royalGold)
                                    .frame(width: 120, height: 120)
                                    .overlay(
                                        Text(String(profile.name.prefix(1)))
                                            .font(BrandFonts.displayBold(size: 48))
                                            .foregroundColor(.deepMaroon)
                                    )
                                Spacer()
                            }
                            .frame(width: 320, height: 420)
                            .background(Color.black.opacity(0.2))
                            .cornerRadius(24)
                            .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.royalGold.opacity(0.3), lineWidth: 1.5))
                        }
                        
                        // Dark Shadow overlay for text readability
                        LinearGradient(
                            colors: [.clear, .black.opacity(0.85)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 180)
                        .cornerRadius(24)
                        
                        // Profile details
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("\(profile.name), \(profile.age)")
                                    .font(BrandFonts.displayBold(size: 20))
                                    .foregroundColor(.white)
                                
                                if profile.isVerified {
                                    Image(systemName: "checkmark.seal.fill")
                                        .foregroundColor(.blue)
                                }
                            }
                            
                            Text("\(profile.clan) Clan • \(profile.gotra) Gotra")
                                .font(BrandFonts.body(size: 14, weight: .bold))
                                .foregroundColor(.lightGold)
                            
                            Text("\(profile.height) • \(profile.education) • \(profile.occupation)")
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(.white.opacity(0.9))
                            
                            Text("Thikana: \(profile.thikana)")
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(.lightGold.opacity(0.8))
                        }
                        .padding(20)
                        .frame(width: 320, alignment: .leading)
                    }
                    .frame(width: 320, height: 420)
                    .offset(offset)
                    .rotationEffect(.degrees(rotation))
                    .gesture(
                        DragGesture()
                            .onChanged { gesture in
                                offset = gesture.translation
                                rotation = Double(gesture.translation.width / 15)
                            }
                            .onEnded { gesture in
                                if gesture.translation.width > 120 {
                                    // Swiped Right -> Connect
                                    swipeRight(profile: profile)
                                } else if gesture.translation.width < -120 {
                                    // Swiped Left -> Skip
                                    swipeLeft()
                                } else {
                                    // Reset
                                    withAnimation(.spring()) {
                                        offset = .zero
                                        rotation = 0
                                    }
                                }
                            }
                    )
                    
                    // Swipe Action Buttons
                    HStack(spacing: 40) {
                        // Cross / Reject button
                        Button(action: {
                            swipeLeft()
                        }) {
                            Image(systemName: "xmark")
                                .font(.system(size: 22, weight: .bold))
                                .foregroundColor(.red)
                                .frame(width: 60, height: 60)
                                .background(Color.white)
                                .clipShape(Circle())
                                .shadow(radius: 4)
                        }
                        
                        // Tick / Connect button
                        Button(action: {
                            swipeRight(profile: profile)
                        }) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 22, weight: .bold))
                                .foregroundColor(.green)
                                .frame(width: 60, height: 60)
                                .background(Color.white)
                                .clipShape(Circle())
                                .shadow(radius: 4)
                        }
                    }
                }
                .transition(.asymmetric(insertion: .identity, removal: .move(edge: offset.width > 0 ? .trailing : .leading)))
            } else {
                // No more cards
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.royalGold)
                    
                    Text("Noble Deck Completed!")
                        .font(BrandFonts.displayBold(size: 18))
                        .foregroundColor(.lightGold)
                    
                    Text("You have viewed all compatible matches in your clan.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(.sandstoneIvory.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    Button("Start Over") {
                        currentIndex = 0
                    }
                    .font(BrandFonts.bodyBold(size: 14))
                    .foregroundColor(.deepMaroon)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                    .background(Color.royalGold)
                    .cornerRadius(20)
                }
                .padding(40)
            }
        }
    }
    
    private func swipeLeft() {
        withAnimation(.easeInOut(duration: 0.2)) {
            offset = CGSize(width: -500, height: 0)
            rotation = -30
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            currentIndex += 1
            offset = .zero
            rotation = 0
        }
    }
    
    private func swipeRight(profile: Profile) {
        withAnimation(.easeInOut(duration: 0.2)) {
            offset = CGSize(width: 500, height: 0)
            rotation = 30
        }
        onConnect(profile)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            currentIndex += 1
            offset = .zero
            rotation = 0
        }
    }
}

// Simple summary card mockup helper
struct ProfileSummaryCard: View {
    let profile: Profile
    let isLocked: Bool
    var onUnlockTap: () -> Void
    var onDetailTap: () -> Void
    
    var body: some View {
        Button(action: onDetailTap) {
            HStack(spacing: 16) {
                // Avatar / Photo
                ZStack {
                    if isLocked {
                        // Blurred representation
                        Circle()
                            .fill(Color.royalGold.opacity(0.15))
                            .frame(width: 80, height: 80)
                        
                        Image(systemName: "lock.fill")
                            .foregroundColor(.royalGold)
                            .font(.title2)
                    } else {
                        // Initials Monogram
                        Circle()
                            .fill(Color.royalGold)
                            .frame(width: 80, height: 80)
                        
                        Text(String(profile.name.prefix(1)))
                            .font(BrandFonts.displayBold(size: 32))
                            .foregroundColor(.deepMaroon)
                    }
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(isLocked ? "Photo Locked" : profile.name)
                            .font(BrandFonts.displayBold(size: 18))
                            .foregroundColor(.lightGold)
                        
                        if profile.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundColor(.blue)
                        }
                    }
                    
                    Text("\(profile.age) yrs • \(profile.height) • \(profile.clan)")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(.sandstoneIvory.opacity(0.8))
                    
                    Text("Gotra: \(profile.gotra) • Native: \(profile.thikana)")
                        .font(BrandFonts.body(size: 12))
                        .foregroundColor(.sandstoneIvory.opacity(0.6))
                }
                Spacer()
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}
