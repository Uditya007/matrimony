import SwiftUI
import Combine

class SagaiSessionManager: ObservableObject {
    @Published var currentUser: User? = nil
    @Published var profiles: [Profile] = MockData.profiles
    @Published var shortlistedIds: Set<String> = []
    @Published var unlockedIds: Set<String> = []
    @Published var isNewlyRegistered: Bool = false
    
    @Published var searchGender: String = "Bride"
    @Published var searchClan: String = "All Clans"
    
    @Published var notificationsList: [RoyalNotification] = []
    @Published var connections: [ConnectionRecord] = []
    private var connectionTimer: Timer? = nil
    
    init() {
        if let data = UserDefaults.standard.data(forKey: "saved_user_session"),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            self.currentUser = user
            self.shortlistedIds = Set(user.shortlistedIds)
            self.unlockedIds = Set(user.unlockedIds)
            self.updateSearchGenderForUser(user)
        } else if let guestPref = UserDefaults.standard.string(forKey: "search_gender_pref_guest"), !guestPref.isEmpty {
            self.searchGender = guestPref
        }
        
        SupabaseClient.shared.fetchProfiles { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let liveProfiles):
                    if !liveProfiles.isEmpty {
                        self.profiles = liveProfiles + MockData.profiles.filter { mock in
                            !liveProfiles.contains { $0.id == mock.id }
                        }
                    }
                    if self.currentUser != nil {
                        self.startConnectionPolling()
                    }
                case .failure(let error):
                    print("Supabase profile loading failed: \(error.localizedDescription)")
                    if self.currentUser != nil {
                        self.startConnectionPolling()
                    }
                }
            }
        }
    }
    
    func getConnection(with profileId: String) -> ConnectionRecord? {
        guard let currentUserId = currentUser?.id else { return nil }
        return connections.first(where: {
            ($0.sender_id == currentUserId && $0.receiver_id == profileId) ||
            ($0.sender_id == profileId && $0.receiver_id == currentUserId)
        })
    }
    
    func areConnected(profileId: String) -> Bool {
        guard let currentUserId = currentUser?.id else { return false }
        if let conn = getConnection(with: profileId), conn.status == "accepted" {
            return true
        }
        let myInterests = SupabaseClient.shared.getInterests(from: currentUser?.about)
        if myInterests[profileId] == "accepted" { return true }
        if let otherProfile = profiles.first(where: { $0.id == profileId }) {
            let otherInterests = SupabaseClient.shared.getInterests(from: otherProfile.about)
            if otherInterests[currentUserId] == "accepted" { return true }
        }
        return false
    }
    
    func updateSearchGenderForUser(_ user: User) {
        // If a customized looking-for preference was saved by user, use it; otherwise default to opposite gender
        if let savedPref = UserDefaults.standard.string(forKey: "search_gender_pref_\(user.id)"), !savedPref.isEmpty {
            self.searchGender = savedPref
        } else {
            if user.gender.lowercased() == "groom" {
                self.searchGender = "Bride"
            } else if user.gender.lowercased() == "bride" {
                self.searchGender = "Groom"
            }
        }
    }
    
    func setLookingForGender(_ gender: String) {
        self.searchGender = gender
        if let userId = currentUser?.id {
            UserDefaults.standard.set(gender, forKey: "search_gender_pref_\(userId)")
        } else {
            UserDefaults.standard.set(gender, forKey: "search_gender_pref_guest")
        }
    }
    
    func login(user: User, isNew: Bool = false) {
        self.isNewlyRegistered = isNew
        self.currentUser = user
        self.shortlistedIds = Set(user.shortlistedIds)
        self.unlockedIds = Set(user.unlockedIds)
        self.updateSearchGenderForUser(user)
        
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: "saved_user_session")
        }
        startConnectionPolling()
    }
    
    func logout() {
        self.currentUser = nil
        self.shortlistedIds = []
        self.unlockedIds = []
        self.notificationsList = []
        self.connections = []
        stopConnectionPolling()
        UserDefaults.standard.removeObject(forKey: "saved_user_session")
    }
    
    func toggleShortlist(id: String) {
        if shortlistedIds.contains(id) {
            shortlistedIds.remove(id)
        } else {
            shortlistedIds.insert(id)
        }
    }
    
    func isShortlisted(id: String) -> Bool {
        shortlistedIds.contains(id)
    }
    
    func unlockProfile(id: String) {
        unlockedIds.insert(id)
    }
    
    func isUnlocked(id: String) -> Bool {
        unlockedIds.contains(id)
    }
    
    func setSearchFilters(gender: String, clan: String) {
        setLookingForGender(gender)
        self.searchClan = clan
    }
    
    func updateCurrentUser(updated: User) {
        self.currentUser = updated
        self.updateSearchGenderForUser(updated)
        if let data = try? JSONEncoder().encode(updated) {
            UserDefaults.standard.set(data, forKey: "saved_user_session")
        }
    }
    
    func startConnectionPolling() {
        connectionTimer?.invalidate()
        connectionTimer = Timer.scheduledTimer(withTimeInterval: 6.0, repeats: true) { [weak self] _ in
            self?.fetchConnectionsAndGenerateNotifications()
        }
        // Initial fetch
        fetchConnectionsAndGenerateNotifications()
    }
    
    func stopConnectionPolling() {
        connectionTimer?.invalidate()
        connectionTimer = nil
    }
    
    func refreshProfiles(completion: (() -> Void)? = nil) {
        SupabaseClient.shared.fetchProfiles { [weak self] result in
            DispatchQueue.main.async {
                guard let self = self else { return }
                switch result {
                case .success(let liveProfiles):
                    if !liveProfiles.isEmpty {
                        let merged = liveProfiles + MockData.profiles.filter { mock in
                            !liveProfiles.contains { $0.id == mock.id }
                        }
                        self.profiles = merged
                    }
                case .failure(let error):
                    print("Supabase profile refresh error: \(error.localizedDescription)")
                }
                completion?()
            }
        }
    }
    
    @MainActor
    func refreshProfilesAsync() async {
        await withCheckedContinuation { continuation in
            refreshProfiles {
                continuation.resume()
            }
        }
    }
    
    func fetchConnectionsAndGenerateNotifications() {
        guard let currentUserId = currentUser?.id else { return }
        
        // 1. Live profile sync: Any new user registered on website or app automatically appears!
        refreshProfiles()
        
        // 2. Fetch connection requests & interests
        SupabaseClient.shared.fetchConnections(userId: currentUserId) { [weak self] result in
            guard let self = self else { return }
            guard case .success(let records) = result else { return }
            
            // Build notifications list
            var list: [RoyalNotification] = []
            for record in records {
                if record.receiver_id == currentUserId && record.status == "pending" {
                    let senderProfile = self.profiles.first(where: { $0.id == record.sender_id })
                    let senderName = senderProfile?.name ?? "Noble Member"
                    list.append(RoyalNotification(
                        id: record.sender_id + "_pending",
                        notifKey: "interest_from_\(record.sender_id)",
                        message: "\(senderName) sent you a Royal Match Interest! Accept to reveal mobile number.",
                        profileId: record.sender_id,
                        timestamp: "Just now",
                        read: false
                    ))
                } else if record.status == "accepted" {
                    let otherId = record.sender_id == currentUserId ? record.receiver_id : record.sender_id
                    let otherProfile = self.profiles.first(where: { $0.id == otherId })
                    let otherName = otherProfile?.name ?? "Noble Member"
                    list.append(RoyalNotification(
                        id: otherId + "_accepted",
                        notifKey: "accepted_from_\(otherId)",
                        message: "\(otherName) connected with you! Contact details & chat are unlocked.",
                        profileId: otherId,
                        timestamp: "Just now",
                        read: false
                    ))
                }
            }
            
            DispatchQueue.main.async {
                self.connections = records
                self.notificationsList = list
            }
        }
    }
    
    func refreshCurrentUserAbout() {
        guard let currentUserId = currentUser?.id else { return }
        SupabaseClient.shared.fetchProfileAbout(profileId: currentUserId) { [weak self] about in
            DispatchQueue.main.async {
                guard let about = about else { return }
                self?.currentUser?.about = about
                if let user = self?.currentUser, let data = try? JSONEncoder().encode(user) {
                    UserDefaults.standard.set(data, forKey: "saved_user_session")
                }
            }
        }
    }
}

struct ContentView: View {
    @StateObject private var session = SagaiSessionManager()
    @State private var selectedTab: Int = 0
    @State private var showingRegister: Bool = false
    @State private var isSplashActive: Bool = true
    @State private var isGuestBypassed: Bool = false
    @State private var isSideMenuOpen: Bool = false
    @State private var showingMyProfileSheet: Bool = false
    @State private var showingBiodataSheet: Bool = false
    @State private var showingNotificationsSheet: Bool = false
    
    private var isOnboardingRequired: Bool {
        guard let user = session.currentUser else { return false }
        guard session.isNewlyRegistered else { return false }
        return user.gotra.isEmpty || user.motherGotra.isEmpty || user.thikana.isEmpty || user.phone.isEmpty
    }
    
    init() {
        #if canImport(UIKit)
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor.white
        tabAppearance.shadowColor = UIColor(red: 0.90, green: 0.91, blue: 0.93, alpha: 1.0)
        
        let normalAttrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: UIColor(red: 0.61, green: 0.64, blue: 0.69, alpha: 1.0),
            .font: UIFont.systemFont(ofSize: 11, weight: .medium)
        ]
        let selectedAttrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: UIColor(red: 0.91, green: 0.25, blue: 0.34, alpha: 1.0), // AppColors.primary #E94057
            .font: UIFont.systemFont(ofSize: 11, weight: .bold)
        ]
        
        tabAppearance.stackedLayoutAppearance.normal.titleTextAttributes = normalAttrs
        tabAppearance.stackedLayoutAppearance.normal.iconColor = UIColor(red: 0.61, green: 0.64, blue: 0.69, alpha: 1.0)
        tabAppearance.stackedLayoutAppearance.selected.titleTextAttributes = selectedAttrs
        tabAppearance.stackedLayoutAppearance.selected.iconColor = UIColor(red: 0.91, green: 0.25, blue: 0.34, alpha: 1.0)
        
        UITabBar.appearance().standardAppearance = tabAppearance
        if #available(iOS 15.0, *) {
            UITabBar.appearance().scrollEdgeAppearance = tabAppearance
        }
        
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor.white
        navAppearance.shadowColor = UIColor(red: 0.90, green: 0.91, blue: 0.93, alpha: 1.0)
        navAppearance.titleTextAttributes = [
            .foregroundColor: UIColor(red: 0.11, green: 0.11, blue: 0.12, alpha: 1.0),
            .font: UIFont.systemFont(ofSize: 18, weight: .bold)
        ]
        navAppearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor(red: 0.11, green: 0.11, blue: 0.12, alpha: 1.0),
            .font: UIFont.systemFont(ofSize: 28, weight: .bold)
        ]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance
        if #available(iOS 15.0, *) {
            UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        }
        UINavigationBar.appearance().tintColor = UIColor(red: 0.91, green: 0.25, blue: 0.34, alpha: 1.0)
        #endif
    }
    
    var body: some View {
        ZStack {
            if isSplashActive {
                SplashView()
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                            withAnimation(.easeOut(duration: 0.5)) {
                                isSplashActive = false
                            }
                        }
                    }
            } else {
                if session.currentUser == nil {
                    // App started: lock behind Login / Register onboarding gate
                    if showingRegister {
                        RegisterView(showingRegister: $showingRegister, isGuestBypassed: $isGuestBypassed)
                            .environmentObject(session)
                            .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                    } else {
                        LoginView(showingRegister: $showingRegister, isGuestBypassed: $isGuestBypassed)
                            .environmentObject(session)
                            .transition(.asymmetric(insertion: .move(edge: .leading), removal: .move(edge: .trailing)))
                    }
                } else if isOnboardingRequired {
                    OnboardingView(isGuestBypassed: $isGuestBypassed)
                        .environmentObject(session)
                } else {
                    ZStack {
                        // Authenticated view with 5 modern Marriage App tabs
                        TabView(selection: $selectedTab) {
                            // Home View
                            NavigationView {
                                HomeView(selectedTab: $selectedTab, showingRegister: $showingRegister, isSideMenuOpen: $isSideMenuOpen)
                                    .environmentObject(session)
                                    .navigationBarTitleDisplayMode(.inline)
                                    .toolbar {
                                        ToolbarItem(placement: .navigationBarLeading) {
                                            Button(action: {
                                                withAnimation {
                                                    isSideMenuOpen = true
                                                }
                                            }) {
                                                Image(systemName: "line.horizontal.3")
                                                    .foregroundColor(.appTextPrimary)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Sagai Sambaandh")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.appTextPrimary)
                                        }
                                        ToolbarItem(placement: .navigationBarTrailing) {
                                            Button(action: {
                                                showingNotificationsSheet = true
                                            }) {
                                                ZStack {
                                                    Image(systemName: "bell.fill")
                                                        .foregroundColor(.appTextPrimary)
                                                        .font(.title2)
                                                    if !session.notificationsList.isEmpty {
                                                        Circle()
                                                            .fill(Color.appPrimary)
                                                            .frame(width: 8, height: 8)
                                                            .offset(x: 8, y: -8)
                                                    }
                                                }
                                            }
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Home", systemImage: "house.fill")
                            }
                            .tag(0)
                            
                            // Matches View
                            NavigationView {
                                MatchesView(selectedTab: $selectedTab, showingRegister: $showingRegister, isSideMenuOpen: $isSideMenuOpen)
                                    .environmentObject(session)
                                    .navigationBarTitleDisplayMode(.inline)
                                    .toolbar {
                                        ToolbarItem(placement: .navigationBarLeading) {
                                            Button(action: {
                                                withAnimation {
                                                    isSideMenuOpen = true
                                                }
                                            }) {
                                                Image(systemName: "line.horizontal.3")
                                                    .foregroundColor(.appTextPrimary)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Discover")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.appTextPrimary)
                                        }
                                        ToolbarItem(placement: .navigationBarTrailing) {
                                            Button(action: {
                                                showingNotificationsSheet = true
                                            }) {
                                                ZStack {
                                                    Image(systemName: "bell.fill")
                                                        .foregroundColor(.appTextPrimary)
                                                        .font(.title2)
                                                    if !session.notificationsList.isEmpty {
                                                        Circle()
                                                            .fill(Color.appPrimary)
                                                            .frame(width: 8, height: 8)
                                                            .offset(x: 8, y: -8)
                                                    }
                                                }
                                            }
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Discover", systemImage: "rectangle.stack.fill")
                            }
                            .tag(1)
                            
                            // Inbox View
                            NavigationView {
                                InboxView()
                                    .environmentObject(session)
                                    .navigationBarTitleDisplayMode(.inline)
                                    .toolbar {
                                        ToolbarItem(placement: .navigationBarLeading) {
                                            Button(action: {
                                                withAnimation {
                                                    isSideMenuOpen = true
                                                }
                                            }) {
                                                Image(systemName: "line.horizontal.3")
                                                    .foregroundColor(.appTextPrimary)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Requests")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.appTextPrimary)
                                        }
                                        ToolbarItem(placement: .navigationBarTrailing) {
                                            Button(action: {
                                                showingNotificationsSheet = true
                                            }) {
                                                ZStack {
                                                    Image(systemName: "bell.fill")
                                                        .foregroundColor(.appTextPrimary)
                                                        .font(.title2)
                                                    if !session.notificationsList.isEmpty {
                                                        Circle()
                                                            .fill(Color.appPrimary)
                                                            .frame(width: 8, height: 8)
                                                            .offset(x: 8, y: -8)
                                                    }
                                                }
                                            }
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Requests", systemImage: "envelope.fill")
                            }
                            .tag(2)
                            
                            // Chat View
                            NavigationView {
                                ChatView(selectedTab: $selectedTab)
                                    .environmentObject(session)
                                    .navigationBarTitleDisplayMode(.inline)
                                    .toolbar {
                                        ToolbarItem(placement: .navigationBarLeading) {
                                            Button(action: {
                                                withAnimation {
                                                    isSideMenuOpen = true
                                                }
                                            }) {
                                                Image(systemName: "line.horizontal.3")
                                                    .foregroundColor(.appTextPrimary)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Messages")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.appTextPrimary)
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Messages", systemImage: "bubble.left.and.bubble.right.fill")
                            }
                            .tag(3)
                            
                            // Premium plans view
                            NavigationView {
                                PlansView()
                                    .environmentObject(session)
                                    .navigationBarTitleDisplayMode(.inline)
                                    .toolbar {
                                        ToolbarItem(placement: .navigationBarLeading) {
                                            Button(action: {
                                                withAnimation {
                                                    isSideMenuOpen = true
                                                }
                                            }) {
                                                Image(systemName: "line.horizontal.3")
                                                    .foregroundColor(.appTextPrimary)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Premium")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.appTextPrimary)
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Premium", systemImage: "crown.fill")
                            }
                            .tag(4)
                        }
                        .accentColor(.appPrimary)
                        .disabled(isSideMenuOpen)
                        
                        // Dimmed overlay when side menu drawer is open
                        if isSideMenuOpen {
                            Color.black.opacity(0.5)
                                .edgesIgnoringSafeArea(.all)
                                .onTapGesture {
                                    withAnimation {
                                        isSideMenuOpen = false
                                    }
                                }
                        }
                        
                        // Sliding Side Menu
                        HStack {
                            SideMenuView(
                                isOpen: $isSideMenuOpen,
                                showingMyProfile: $showingMyProfileSheet,
                                selectedTab: $selectedTab,
                                showingBiodata: $showingBiodataSheet
                            )
                            .environmentObject(session)
                            .frame(width: 280)
                            .offset(x: isSideMenuOpen ? 0 : -280)
                            .transition(.move(edge: .leading))
                            
                            Spacer()
                        }
                        .edgesIgnoringSafeArea(.vertical)
                    }
                    .sheet(isPresented: $showingMyProfileSheet) {
                        MyProfileView()
                            .environmentObject(session)
                    }
                    .sheet(isPresented: $showingBiodataSheet) {
                        BiodataCardView()
                            .environmentObject(session)
                    }
                    .sheet(isPresented: $showingNotificationsSheet) {
                        NotificationsView()
                            .environmentObject(session)
                    }
                    .onAppear {
                        // Set up a custom appearance for tabs to match the maroon theme!
                        let appearance = UITabBarAppearance()
                        appearance.configureWithOpaqueBackground()
                        appearance.backgroundColor = UIColor(Color.deepMaroon)
                        
                        // Unselected item coloring
                        appearance.stackedLayoutAppearance.normal.iconColor = UIColor(Color.sandstoneIvory.opacity(0.4))
                        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor(Color.sandstoneIvory.opacity(0.4))]
                        
                        // Selected item coloring
                        appearance.stackedLayoutAppearance.selected.iconColor = UIColor(Color.lightGold)
                        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: UIColor(Color.lightGold)]
                        
                        UITabBar.appearance().standardAppearance = appearance
                        if #available(iOS 15.0, *) {
                            UITabBar.appearance().scrollEdgeAppearance = appearance
                        }
                    }
                }
            }
        }
    }
    
    struct SplashView: View {
        @State private var scale: CGFloat = 0.85
        @State private var opacity: Double = 0.0
        
        var body: some View {
            ZStack {
                // Maroon background
                LinearGradient(
                    colors: [Color.deepMaroon, Color.royalMaroon],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 24) {
                    // Centered Medallion Logo
                    ZStack {
                        // Outer Gold Border Rings
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [.royalGold, .lightGold, .royalGold],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 3
                            )
                            .frame(width: 200, height: 200)
                        
                        Circle()
                            .stroke(Color.royalGold.opacity(0.4), lineWidth: 1)
                            .frame(width: 210, height: 210)
                        
                        // Medallion Image / Crest Fallback
                        Group {
                            if let img = UIImage(named: "logo") {
                                Image(uiImage: img)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            } else if let appIcon = UIImage(named: "appicon") {
                                Image(uiImage: appIcon)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            } else {
                                // Royal Crest Vector Fallback
                                VStack(spacing: 8) {
                                    Image(systemName: "shield.fill")
                                        .font(.system(size: 48))
                                        .foregroundColor(.lightGold)
                                    Text("SS")
                                        .font(BrandFonts.displayBold(size: 28))
                                        .foregroundColor(.lightGold)
                                }
                            }
                        }
                        .frame(width: 180, height: 180)
                        .clipShape(Circle())
                    }
                    .scaleEffect(scale)
                    .opacity(opacity)
                    
                    // Titles
                    VStack(spacing: 8) {
                        Text("SHREE RAJPUT")
                            .font(BrandFonts.label(size: 11))
                            .foregroundColor(.lightGold)
                            .tracking(4)
                        
                        Text("Sagai Sambaandh")
                            .font(BrandFonts.displayBold(size: 30))
                            .foregroundColor(.sandstoneIvory)
                        
                        Text("Rajasthan's Royal Matrimony")
                            .font(BrandFonts.displayItalic(size: 13))
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                    }
                    .opacity(opacity)
                }
            }
            .onAppear {
                withAnimation(.easeOut(duration: 1.0)) {
                    self.scale = 1.0
                    self.opacity = 1.0
                }
            }
        }
    }
}

struct RoyalNotification: Identifiable, Codable, Hashable {
    let id: String
    let notifKey: String
    let message: String
    let profileId: String
    let timestamp: String
    var read: Bool
}

