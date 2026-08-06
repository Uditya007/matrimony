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
    private var connectionTimer: Timer? = nil
    
    init() {
        if let data = UserDefaults.standard.data(forKey: "saved_user_session"),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            self.currentUser = user
            self.shortlistedIds = Set(user.shortlistedIds)
            self.unlockedIds = Set(user.unlockedIds)
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
    
    func login(user: User, isNew: Bool = false) {
        self.isNewlyRegistered = isNew
        self.currentUser = user
        self.shortlistedIds = Set(user.shortlistedIds)
        self.unlockedIds = Set(user.unlockedIds)
        
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
        self.searchGender = gender
        self.searchClan = clan
    }
    
    func updateCurrentUser(updated: User) {
        self.currentUser = updated
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
    
    func fetchConnectionsAndGenerateNotifications() {
        guard let currentUserId = currentUser?.id else { return }
        
        let urlString = "\(SupabaseClient.shared.supabaseURL)/rest/v1/connections?or=(sender_id.eq.\(currentUserId),receiver_id.eq.\(currentUserId))"
        guard let url = URL(string: urlString) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(SupabaseClient.shared.apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(SupabaseClient.shared.apiKey)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data,
                  let records = try? JSONDecoder().decode([ConnectionRecord].self, from: data) else {
                return
            }
            
            // Build notifications list
            var list: [RoyalNotification] = []
            for record in records {
                if record.receiver_id == currentUserId {
                    let senderProfile = self.profiles.first(where: { $0.id == record.sender_id })
                    let senderName = senderProfile?.name ?? "Noble Member"
                    list.append(RoyalNotification(
                        id: record.sender_id + "_" + record.status,
                        notifKey: "interest_from_\(record.sender_id)",
                        message: "\(senderName) sent you a Match Interest! Chat is now unlocked.",
                        profileId: record.sender_id,
                        timestamp: "Just now",
                        read: false
                    ))
                } else if record.sender_id == currentUserId && record.status == "accepted" {
                    let receiverProfile = self.profiles.first(where: { $0.id == record.receiver_id })
                    let receiverName = receiverProfile?.name ?? "Noble Member"
                    list.append(RoyalNotification(
                        id: record.receiver_id + "_accepted",
                        notifKey: "accepted_from_\(record.receiver_id)",
                        message: "\(receiverName) accepted your Royal Interest! Click to chat.",
                        profileId: record.receiver_id,
                        timestamp: "Just now",
                        read: false
                    ))
                }
            }
            
            DispatchQueue.main.async {
                self.notificationsList = list
            }
        }.resume()
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
                        // Authenticated view with 5 Shaadi-style tabs
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
                                                    .foregroundColor(.lightGold)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Sagai Sambaandh")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.lightGold)
                                        }
                                        ToolbarItem(placement: .navigationBarTrailing) {
                                            Button(action: {
                                                showingNotificationsSheet = true
                                            }) {
                                                ZStack {
                                                    Image(systemName: "bell.fill")
                                                        .foregroundColor(.lightGold)
                                                        .font(.title2)
                                                    if !session.notificationsList.isEmpty {
                                                        Circle()
                                                            .fill(Color.red)
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
                                                    .foregroundColor(.lightGold)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Matches")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.lightGold)
                                        }
                                        ToolbarItem(placement: .navigationBarTrailing) {
                                            Button(action: {
                                                showingNotificationsSheet = true
                                            }) {
                                                ZStack {
                                                    Image(systemName: "bell.fill")
                                                        .foregroundColor(.lightGold)
                                                        .font(.title2)
                                                    if !session.notificationsList.isEmpty {
                                                        Circle()
                                                            .fill(Color.red)
                                                            .frame(width: 8, height: 8)
                                                            .offset(x: 8, y: -8)
                                                    }
                                                }
                                            }
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Matches", systemImage: "heart.fill")
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
                                                    .foregroundColor(.lightGold)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Inbox")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.lightGold)
                                        }
                                        ToolbarItem(placement: .navigationBarTrailing) {
                                            Button(action: {
                                                showingNotificationsSheet = true
                                            }) {
                                                ZStack {
                                                    Image(systemName: "bell.fill")
                                                        .foregroundColor(.lightGold)
                                                        .font(.title2)
                                                    if !session.notificationsList.isEmpty {
                                                        Circle()
                                                            .fill(Color.red)
                                                            .frame(width: 8, height: 8)
                                                            .offset(x: 8, y: -8)
                                                    }
                                                }
                                            }
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Inbox", systemImage: "envelope.fill")
                            }
                            .tag(2)
                            
                            // Chat View
                            NavigationView {
                                ChatView()
                                    .navigationBarTitleDisplayMode(.inline)
                                    .toolbar {
                                        ToolbarItem(placement: .navigationBarLeading) {
                                            Button(action: {
                                                withAnimation {
                                                    isSideMenuOpen = true
                                                }
                                            }) {
                                                Image(systemName: "line.horizontal.3")
                                                    .foregroundColor(.lightGold)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Chat")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.lightGold)
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Chat", systemImage: "bubble.left.and.bubble.right.fill")
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
                                                    .foregroundColor(.lightGold)
                                                    .font(.title2)
                                            }
                                        }
                                        ToolbarItem(placement: .principal) {
                                            Text("Premium")
                                                .font(BrandFonts.displayBold(size: 18))
                                                .foregroundColor(.lightGold)
                                        }
                                    }
                            }
                            .tabItem {
                                Label("Premium", systemImage: "crown.fill")
                            }
                            .tag(4)
                        }
                        .accentColor(.royalGold)
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

