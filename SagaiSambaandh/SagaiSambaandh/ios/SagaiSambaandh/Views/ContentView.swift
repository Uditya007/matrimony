import SwiftUI
import Combine

class SagaiSessionManager: ObservableObject {
    @Published var currentUser: User? = nil
    @Published var profiles: [Profile] = MockData.profiles
    @Published var shortlistedIds: Set<String> = []
    @Published var unlockedIds: Set<String> = []
    
    @Published var searchGender: String = "Bride"
    @Published var searchClan: String = "All Clans"
    
    init() {
        if let data = UserDefaults.standard.data(forKey: "saved_user_session"),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            self.currentUser = user
            self.shortlistedIds = Set(user.shortlistedIds)
            self.unlockedIds = Set(user.unlockedIds)
        }
    }
    
    func login(user: User) {
        self.currentUser = user
        self.shortlistedIds = Set(user.shortlistedIds)
        self.unlockedIds = Set(user.unlockedIds)
        
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: "saved_user_session")
        }
    }
    
    func logout() {
        self.currentUser = nil
        self.shortlistedIds = []
        self.unlockedIds = []
        
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
                } else {
                    ZStack {
                        // Authenticated view with 5 Shaadi-style tabs
                        TabView(selection: $selectedTab) {
                            // Home View
                            NavigationView {
                                HomeView(selectedTab: $selectedTab, showingRegister: $showingRegister, isSideMenuOpen: $isSideMenuOpen)
                                    .environmentObject(session)
                            }
                            .tabItem {
                                Label("Home", systemImage: "house.fill")
                            }
                            .tag(0)
                            
                            // Matches View
                            NavigationView {
                                MatchesView(selectedTab: $selectedTab, showingRegister: $showingRegister, isSideMenuOpen: $isSideMenuOpen)
                                    .environmentObject(session)
                            }
                            .tabItem {
                                Label("Matches", systemImage: "heart.fill")
                            }
                            .tag(1)
                            
                            // Inbox View
                            NavigationView {
                                InboxView()
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
