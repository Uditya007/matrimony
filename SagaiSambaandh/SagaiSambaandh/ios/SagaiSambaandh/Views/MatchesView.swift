import SwiftUI

struct MatchesView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var selectedTab: Int
    @Binding var showingRegister: Bool
    @Binding var isSideMenuOpen: Bool
    
    @State private var activeFilterTab: Int = 0 // 0 = All Matches, 1 = Gotra Compatible
    @State private var selectedProfileForDetail: Profile? = nil
    @State private var viewMode: Int = 0 // 0 = Swipe Deck, 1 = Grid Feed
    @State private var showingConnectionSuccess: Bool = false
    @State private var successProfileName: String = ""
    
    private var isProfileLocked: Bool {
        session.currentUser == nil
    }
    
    private var filteredMatches: [Profile] {
        let searched = session.profiles.filter {
            let genderMatch = $0.gender.lowercased() == session.searchGender.lowercased()
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
    
    private var allGenderMatchesCount: Int {
        session.profiles.filter {
            let genderMatch = $0.gender.lowercased() == session.searchGender.lowercased()
            let clanMatch = session.searchClan == "All Clans" || $0.clan.lowercased() == session.searchClan.lowercased()
            return genderMatch && clanMatch
        }.count
    }
    
    private var gotraMatchesCount: Int {
        let base = session.profiles.filter {
            let genderMatch = $0.gender.lowercased() == session.searchGender.lowercased()
            let clanMatch = session.searchClan == "All Clans" || $0.clan.lowercased() == session.searchClan.lowercased()
            return genderMatch && clanMatch
        }
        if let currentUser = session.currentUser {
            return base.filter { $0.gotra.lowercased() != currentUser.gotra.lowercased() }.count
        }
        return base.count
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
    
    private func handleConnectTap(profile: Profile) {
        if isProfileLocked {
            showRegistration()
        } else {
            successProfileName = profile.name
            withAnimation(.spring()) {
                showingConnectionSuccess = true
            }
            if let currentUser = session.currentUser {
                SupabaseClient.shared.sendConnection(senderId: currentUser.id, receiverId: profile.id) { _ in
                    DispatchQueue.main.async {
                        session.refreshCurrentUserAbout()
                        session.fetchConnectionsAndGenerateNotifications()
                    }
                }
                SupabaseClient.shared.notifyAdminInterestSent(fromUser: currentUser, toProfile: profile)
            }
        }
    }
    
    var body: some View {
        ZStack {
            Color.white.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Top Header with Location & Controls
                topHeaderBar
                
                // Filter Capsule Pills
                filterCapsulesBar
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                
                if viewMode == 0 {
                    // 3D Neumorphic Swipe Card Deck
                    SwipeDeckView(
                        profiles: filteredMatches,
                        isLocked: isProfileLocked,
                        onUnlock: showRegistration,
                        onOpenDetail: { profile in
                            openDetail(for: profile)
                        },
                        onConnect: { profile in
                            handleConnectTap(profile: profile)
                        }
                    )
                    .id("\(session.searchGender)_\(activeFilterTab)")
                    .frame(maxHeight: .infinity)
                } else {
                    // Modern 2-Column Matches Grid
                    matchesGridView
                }
            }
            
            // Connection Sent Toast Popover
            if showingConnectionSuccess {
                VStack {
                    Spacer()
                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(Color.white)
                                .frame(width: 44, height: 44)
                            Image(systemName: "heart.fill")
                                .font(.system(size: 22))
                                .foregroundColor(Color.appPrimary)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Rishta Expressed!")
                                .font(BrandFonts.displayBold(size: 15))
                                .foregroundColor(.white)
                            Text("Notified \(successProfileName) of your interest.")
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(.white.opacity(0.9))
                        }
                        Spacer()
                    }
                    .padding(16)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.appSecondary],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(20)
                    .shadow(color: Color.appPrimary.opacity(0.35), radius: 16, y: 8)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                .zIndex(10)
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.8) {
                        withAnimation {
                            showingConnectionSuccess = false
                        }
                    }
                }
            }
        }
        .sheet(item: $selectedProfileForDetail) { profile in
            ProfileDetailView(profile: profile)
                .environmentObject(session)
        }
        .navigationBarHidden(true)
    }
    
    // MARK: - Header Bar
    private var topHeaderBar: some View {
        HStack {
            // Side Drawer Trigger
            Button(action: {
                withAnimation {
                    isSideMenuOpen = true
                }
            }) {
                Image(systemName: "line.horizontal.3")
                    .foregroundColor(Color.appTextPrimary)
                    .font(.title2)
                    .frame(width: 40, height: 40)
                    .background(Color.appCardBackground)
                    .clipShape(Circle())
            }
            
            Spacer()
            
            // Center Title & Location Pin
            VStack(spacing: 2) {
                Text("Discover")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(Color.appTextPrimary)
                
                HStack(spacing: 4) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(Color.appPrimary)
                    Text("Rajasthan • Showing \(session.searchGender)s")
                        .font(BrandFonts.body(size: 12, weight: .semibold))
                        .foregroundColor(Color.appTextSecondary)
                }
            }
            
            Spacer()
            
            // View Mode Toggle (Deck vs Grid)
            Button(action: {
                withAnimation(.easeInOut(duration: 0.2)) {
                    viewMode = (viewMode == 0) ? 1 : 0
                }
            }) {
                Image(systemName: viewMode == 0 ? "square.grid.2x2.fill" : "rectangle.stack.fill")
                    .foregroundColor(Color.appTextPrimary)
                    .font(.system(size: 16, weight: .semibold))
                    .frame(width: 40, height: 40)
                    .background(Color.appCardBackground)
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }
    
    // MARK: - Filter Capsules
    private var filterCapsulesBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // Quick Looking-For Gender Switcher
                Button(action: {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                        let nextGender = (session.searchGender.lowercased() == "bride") ? "Groom" : "Bride"
                        session.setLookingForGender(nextGender)
                    }
                }) {
                    HStack(spacing: 6) {
                        Text(session.searchGender.lowercased() == "bride" ? "👰 Brides" : "🤵 Grooms")
                            .font(BrandFonts.body(size: 13, weight: .bold))
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundColor(Color.appPrimary)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 8)
                    .background(Color.appPrimary.opacity(0.12))
                    .clipShape(Capsule())
                    .overlay(
                        Capsule()
                            .stroke(Color.appPrimary.opacity(0.35), lineWidth: 1)
                    )
                }
                
                filterPill(title: "All \(session.searchGender)s", count: allGenderMatchesCount, tag: 0)
                filterPill(title: "Gotra Compatible", count: gotraMatchesCount, tag: 1)
            }
        }
    }
    
    private func filterPill(title: String, count: Int, tag: Int) -> some View {
        let isSelected = activeFilterTab == tag
        return Button(action: {
            withAnimation(.spring(response: 0.3)) {
                activeFilterTab = tag
            }
        }) {
            HStack(spacing: 6) {
                Text(title)
                    .font(BrandFonts.body(size: 13, weight: isSelected ? .bold : .medium))
                
                Text("\(count)")
                    .font(BrandFonts.body(size: 11, weight: .bold))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(isSelected ? Color.white.opacity(0.25) : Color.black.opacity(0.06))
                    .clipShape(Capsule())
            }
            .foregroundColor(isSelected ? .white : Color.appTextSecondary)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Group {
                    if isSelected {
                        LinearGradient(
                            colors: [Color.appPrimary, Color.appSecondary],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    } else {
                        Color.appCardBackground
                    }
                }
            )
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(isSelected ? Color.clear : Color.appBorder, lineWidth: 1)
            )
        }
    }
    
    // MARK: - Grid View (2 Columns)
    private var matchesGridView: some View {
        ScrollView {
            if filteredMatches.isEmpty {
                VStack(spacing: 16) {
                    Spacer().frame(height: 50)
                    ZStack {
                        Circle()
                            .fill(Color.appPrimary.opacity(0.1))
                            .frame(width: 80, height: 80)
                        Image(systemName: "person.2.slash.fill")
                            .font(.system(size: 34))
                            .foregroundColor(Color.appPrimary)
                    }
                    Text("No \(session.searchGender)s Found")
                        .font(BrandFonts.displayBold(size: 18))
                        .foregroundColor(Color.appTextPrimary)
                    Text("Try switching your Rajput clan or Gotra filter to view other profiles.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(Color.appTextSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
                .frame(maxWidth: .infinity)
            } else {
                LazyVGrid(
                    columns: [
                        GridItem(.flexible(), spacing: 14),
                        GridItem(.flexible(), spacing: 14)
                    ],
                    spacing: 16
                ) {
                    ForEach(filteredMatches) { profile in
                        ModernGridCardItem(
                            profile: profile,
                            isLocked: isProfileLocked,
                            onTap: { openDetail(for: profile) },
                            onConnect: { handleConnectTap(profile: profile) }
                        )
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
            }
        }
        .refreshable {
            await session.refreshProfilesAsync()
        }
    }
}

// MARK: - 3D Neumorphic Swipe Card Deck
struct SwipeDeckView: View {
    @EnvironmentObject var session: SagaiSessionManager
    let profiles: [Profile]
    let isLocked: Bool
    let onUnlock: () -> Void
    let onOpenDetail: (Profile) -> Void
    let onConnect: (Profile) -> Void
    
    @State private var currentIndex: Int = 0
    @State private var offset: CGSize = .zero
    @State private var rotation: Double = 0
    
    var body: some View {
        GeometryReader { geometry in
            let cardWidth = min(geometry.size.width - 32, 380)
            let cardHeight = min(geometry.size.height - 130, cardWidth * 1.38)
            
            VStack(spacing: 16) {
                ZStack {
                    if currentIndex < profiles.count {
                        // Background placeholder card for deck depth
                        if currentIndex + 1 < profiles.count {
                            let nextProfile = profiles[currentIndex + 1]
                            cardContent(for: nextProfile, width: cardWidth, height: cardHeight)
                                .scaleEffect(0.94)
                                .offset(y: 14)
                                .opacity(0.65)
                        }
                        
                        // Active foreground card
                        let activeProfile = profiles[currentIndex]
                        cardContent(for: activeProfile, width: cardWidth, height: cardHeight)
                            .offset(offset)
                            .rotationEffect(.degrees(rotation))
                            .gesture(
                                DragGesture()
                                    .onChanged { gesture in
                                        offset = gesture.translation
                                        rotation = Double(gesture.translation.width / 18)
                                    }
                                    .onEnded { gesture in
                                        if gesture.translation.width > 110 {
                                            swipeRight(profile: activeProfile)
                                        } else if gesture.translation.width < -110 {
                                            swipeLeft()
                                        } else if gesture.translation.height < -120 {
                                            swipeUp(profile: activeProfile)
                                        } else {
                                            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                                                offset = .zero
                                                rotation = 0
                                            }
                                        }
                                    }
                            )
                    } else {
                        // Deck Completed State
                        deckCompletedView
                            .frame(width: cardWidth, height: cardHeight)
                    }
                }
                .frame(width: cardWidth, height: cardHeight)
                
                // 3D Neumorphic Floating Action Buttons Row
                if currentIndex < profiles.count {
                    let activeProfile = profiles[currentIndex]
                    neumorphicActionButtonsRow(for: activeProfile)
                        .padding(.top, 4)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
    
    // MARK: - Card Container
    private func cardContent(for profile: Profile, width: CGFloat, height: CGFloat) -> some View {
        let likeOpacity = min(1.0, max(0.0, Double(offset.width / 90.0)))
        let passOpacity = min(1.0, max(0.0, Double(-offset.width / 90.0)))
        let starOpacity = min(1.0, max(0.0, Double(-offset.height / 90.0)))
        
        return ZStack(alignment: .bottom) {
            // 1. Candidate Photo / Locked Backdrop
            ZStack {
                if isLocked {
                    lockedCardBackdrop
                } else {
                    candidatePhotoView(for: profile)
                }
            }
            .frame(width: width, height: height)
            .clipped()
            
            // 2. Multi-stop Deep Gradient Overlay
            AppGradients.overlay
                .frame(width: width, height: height)
                .allowsHitTesting(false)
            
            // 3. Dynamic Real-time Drag Stamps
            // (a) SEND RISHTA (Swiping Right)
            if likeOpacity > 0.05 {
                VStack {
                    HStack {
                        HStack(spacing: 8) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 22))
                            Text("SEND RISHTA")
                                .font(BrandFonts.displayBold(size: 19))
                                .tracking(1.5)
                        }
                        .foregroundColor(Color.successGreen)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.black.opacity(0.45))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.successGreen, lineWidth: 3)
                        )
                        .rotationEffect(.degrees(-15))
                        .opacity(likeOpacity)
                        .padding(.leading, 24)
                        .padding(.top, 24)
                        
                        Spacer()
                    }
                    Spacer()
                }
                .allowsHitTesting(false)
            }
            
            // (b) PASS (Swiping Left)
            if passOpacity > 0.05 {
                VStack {
                    HStack {
                        Spacer()
                        HStack(spacing: 8) {
                            Image(systemName: "xmark")
                                .font(.system(size: 20, weight: .bold))
                            Text("PASS")
                                .font(BrandFonts.displayBold(size: 20))
                                .tracking(2)
                        }
                        .foregroundColor(Color.dislikeRed)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.black.opacity(0.45))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.dislikeRed, lineWidth: 3)
                        )
                        .rotationEffect(.degrees(15))
                        .opacity(passOpacity)
                        .padding(.trailing, 24)
                        .padding(.top, 24)
                    }
                    Spacer()
                }
                .allowsHitTesting(false)
            }
            
            // (c) SHORTLIST (Swiping Up)
            if starOpacity > 0.05 && abs(offset.width) < 60 {
                VStack {
                    HStack(spacing: 8) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 20))
                        Text("SHORTLIST")
                            .font(BrandFonts.displayBold(size: 18))
                            .tracking(1.5)
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(
                        LinearGradient(
                            colors: [Color.starPurple, Color.starGold],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white, lineWidth: 2)
                    )
                    .shadow(color: Color.starPurple.opacity(0.5), radius: 12, y: 4)
                    .opacity(starOpacity)
                    .padding(.top, 30)
                    
                    Spacer()
                }
                .allowsHitTesting(false)
            }
            
            // 4. Rich Candidate Information Bottom Card
            VStack(alignment: .leading, spacing: 8) {
                // Name, Age, Verified & Info Arrow Button
                HStack(alignment: .center) {
                    HStack(spacing: 6) {
                        Text(isLocked ? "Lineage Member" : "\(profile.name), \(profile.age)")
                            .font(BrandFonts.displayBold(size: 24))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        
                        if profile.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundColor(Color.verifiedBlue)
                                .font(.system(size: 16))
                        }
                    }
                    
                    Spacer()
                    
                    // Info Button to open profile details
                    Button(action: {
                        onOpenDetail(profile)
                    }) {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 38, height: 38)
                            .background(Color.white.opacity(0.22))
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white.opacity(0.45), lineWidth: 1.5))
                    }
                }
                
                // Clan & Gotra Pill Tags
                HStack(spacing: 8) {
                    badgePill(text: "\(profile.clan) Clan", color: Color.royalGold)
                    badgePill(text: "\(profile.gotra) Gotra", color: Color.white.opacity(0.85))
                }
                
                // Profession
                HStack(spacing: 6) {
                    Image(systemName: "briefcase.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.8))
                    Text("\(profile.occupation) • \(profile.education)")
                        .font(BrandFonts.body(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.92))
                        .lineLimit(1)
                }
                
                // Native Thikana
                HStack(spacing: 6) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(Color.appSecondary)
                    Text("Thikana: \(profile.thikana)")
                        .font(BrandFonts.body(size: 12))
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .padding(20)
            .frame(width: width, alignment: .leading)
        }
        .frame(width: width, height: height)
        .cornerRadius(28)
        .shadow(color: Color.black.opacity(0.12), radius: 24, x: 0, y: 12)
        .shadow(color: Color.appPrimary.opacity(0.06), radius: 30, x: 0, y: 4)
    }
    
    private func badgePill(text: String, color: Color) -> some View {
        Text(text)
            .font(BrandFonts.label(size: 11, weight: .bold))
            .foregroundColor(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Color.white.opacity(0.16))
            .clipShape(Capsule())
    }
    
    // Photo View
    private func candidatePhotoView(for profile: Profile) -> some View {
        AvatarImageView(
            imageSource: profile.img,
            name: profile.name,
            clan: profile.clan,
            contentMode: .fill,
            fallbackFontSize: 80
        )
    }
    
    // Locked Card Backdrop
    private var lockedCardBackdrop: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#2B1810"), Color(hex: "#1B1B1E")],
                startPoint: .top,
                endPoint: .bottom
            )
            
            VStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 80, height: 80)
                    Image(systemName: "lock.shield.fill")
                        .font(.system(size: 40))
                        .foregroundColor(Color.royalGold)
                }
                
                Text("Lineage Portrait Secured")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(.white)
                
                Text("Log in or create a profile to view authentic portraits.")
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(.white.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 30)
                
                Button(action: onUnlock) {
                    Text("Unlock Lineage")
                        .font(BrandFonts.bodyBold(size: 14))
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 10)
                        .background(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.appSecondary],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(Capsule())
                }
                .padding(.top, 4)
            }
        }
    }
    
    // MARK: - 3D Neumorphic Action Buttons
    private func neumorphicActionButtonsRow(for profile: Profile) -> some View {
        HStack(alignment: .bottom, spacing: 36) {
            // PASS Button (3D Neumorphic)
            neumorphicButton(
                icon: "xmark",
                iconColor: Color.dislikeRed,
                label: "PASS",
                size: 58,
                action: { swipeLeft() }
            )
            
            // Elevated RISHTA Hero Button
            heroConnectButton(
                action: { swipeRight(profile: profile) }
            )
            
            // SHORTLIST Button (3D Neumorphic)
            neumorphicButton(
                icon: "star.fill",
                iconColor: Color.starPurple,
                label: "SHORTLIST",
                size: 58,
                action: { swipeUp(profile: profile) }
            )
        }
    }
    
    private func neumorphicButton(icon: String, iconColor: Color, label: String, size: CGFloat, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.white, Color(hex: "#F6F7FB"), Color(hex: "#E9EBF1")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: size, height: size)
                        .overlay(Circle().stroke(Color.white, lineWidth: 2))
                        .shadow(color: Color.white, radius: 8, x: -4, y: -4)
                        .shadow(color: Color(hex: "#B8BCC8").opacity(0.45), radius: 10, x: 4, y: 5)
                    
                    Image(systemName: icon)
                        .font(.system(size: size * 0.38, weight: .bold))
                        .foregroundColor(iconColor)
                }
                
                Text(label)
                    .font(BrandFonts.label(size: 11, weight: .bold))
                    .foregroundColor(Color.appTextSecondary)
                    .tracking(0.6)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func heroConnectButton(action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.appSecondary],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 76, height: 76)
                        .overlay(Circle().stroke(Color.white.opacity(0.3), lineWidth: 2.5))
                        .shadow(color: Color.appPrimary.opacity(0.4), radius: 16, x: 0, y: 8)
                        .shadow(color: Color.white.opacity(0.6), radius: 6, x: -3, y: -3)
                    
                    Image(systemName: "heart.fill")
                        .font(.system(size: 34))
                        .foregroundColor(.white)
                }
                
                Text("RISHTA")
                    .font(BrandFonts.label(size: 12, weight: .heavy))
                    .foregroundColor(Color.appPrimary)
                    .tracking(0.8)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    // MARK: - Gestures & Actions
    private func swipeLeft() {
        withAnimation(.easeInOut(duration: 0.22)) {
            offset = CGSize(width: -600, height: 0)
            rotation = -25
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
            currentIndex += 1
            offset = .zero
            rotation = 0
        }
    }
    
    private func swipeRight(profile: Profile) {
        withAnimation(.easeInOut(duration: 0.22)) {
            offset = CGSize(width: 600, height: 0)
            rotation = 25
        }
        onConnect(profile)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
            currentIndex += 1
            offset = .zero
            rotation = 0
        }
    }
    
    private func swipeUp(profile: Profile) {
        withAnimation(.easeInOut(duration: 0.22)) {
            offset = CGSize(width: 0, height: -600)
            rotation = 0
        }
        onConnect(profile)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
            currentIndex += 1
            offset = .zero
            rotation = 0
        }
    }
    
    // MARK: - Deck Completed State
    private var deckCompletedView: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color.appPrimary.opacity(0.1))
                    .frame(width: 90, height: 90)
                Image(systemName: "sparkles")
                    .font(.system(size: 42))
                    .foregroundColor(Color.appPrimary)
            }
            
            Text(profiles.isEmpty ? "No \(session.searchGender)s Found" : "Deck Completed!")
                .font(BrandFonts.displayBold(size: 22))
                .foregroundColor(Color.appTextPrimary)
            
            Text(profiles.isEmpty ? "Try changing your Rajput clan filter or check back later for newly joined members." : "You've viewed all matching profiles. Check back soon for newly registered Rajput members.")
                .font(BrandFonts.body(size: 13.5))
                .foregroundColor(Color.appTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            
            Button(action: {
                withAnimation {
                    currentIndex = 0
                }
            }) {
                Text("Start Over")
                    .font(BrandFonts.bodyBold(size: 14))
                    .foregroundColor(.white)
                    .padding(.horizontal, 28)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.appSecondary],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(Capsule())
                    .shadow(color: Color.appPrimary.opacity(0.3), radius: 8, y: 4)
            }
            .padding(.top, 8)
        }
        .padding(32)
        .background(Color.white)
        .cornerRadius(28)
        .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.appBorder, lineWidth: 1.5))
        .shadow(color: Color.black.opacity(0.06), radius: 16, y: 6)
    }
}

// MARK: - Modern 2-Column Grid Card Item
struct ModernGridCardItem: View {
    let profile: Profile
    let isLocked: Bool
    let onTap: () -> Void
    let onConnect: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 0) {
                ZStack(alignment: .bottomLeading) {
                    // Photo
                    Group {
                        if !isLocked {
                            AvatarImageView(
                                imageSource: profile.img,
                                name: profile.name,
                                clan: profile.clan,
                                contentMode: .fill,
                                fallbackFontSize: 38
                            )
                        } else {
                            LinearGradient(
                                colors: [Color.appPrimary.opacity(0.8), Color.appSecondary.opacity(0.8)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                            .overlay(
                                Text(String(profile.name.prefix(1)))
                                    .font(BrandFonts.displayBold(size: 36))
                                    .foregroundColor(.white)
                            )
                        }
                    }
                    .frame(height: 190)
                    .clipped()
                    
                    // Dark Bottom Gradient
                    LinearGradient(
                        colors: [Color.clear, Color.black.opacity(0.75)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 70)
                    
                    // Information on Card
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text("\(profile.name), \(profile.age)")
                                .font(BrandFonts.displayBold(size: 14))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            
                            if profile.isVerified {
                                Image(systemName: "checkmark.seal.fill")
                                    .foregroundColor(Color.verifiedBlue)
                                    .font(.system(size: 11))
                            }
                        }
                        
                        Text("\(profile.clan) • \(profile.gotra)")
                            .font(BrandFonts.body(size: 11, weight: .medium))
                            .foregroundColor(.white.opacity(0.85))
                            .lineLimit(1)
                    }
                    .padding(10)
                }
                
                // Bottom Action Strip
                HStack {
                    Text(profile.occupation)
                        .font(BrandFonts.body(size: 11))
                        .foregroundColor(Color.appTextSecondary)
                        .lineLimit(1)
                    Spacer()
                    Button(action: onConnect) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 14))
                            .foregroundColor(Color.appPrimary)
                            .frame(width: 30, height: 30)
                            .background(Color.appPrimary.opacity(0.12))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(Color.white)
            }
            .background(Color.white)
            .cornerRadius(18)
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(Color.appBorder, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 3)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
