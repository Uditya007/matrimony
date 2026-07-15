import SwiftUI
import Combine

class SagaiSessionManager: ObservableObject {
    @Published var currentUser: User? = nil
    @Published var profiles: [Profile] = MockData.profiles
    @Published var shortlistedIds: Set<String> = []
    @Published var unlockedIds: Set<String> = []
    
    func login(user: User) {
        self.currentUser = user
        self.shortlistedIds = Set(user.shortlistedIds)
        self.unlockedIds = Set(user.unlockedIds)
    }
    
    func logout() {
        self.currentUser = nil
        self.shortlistedIds = []
        self.unlockedIds = []
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
}

struct ContentView: View {
    @StateObject private var session = SagaiSessionManager()
    @State private var selectedTab: Int = 0
    @State private var showingRegister: Bool = false
    @State private var isSplashActive: Bool = true
    @State private var isGuestBypassed: Bool = false
    
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
                if session.currentUser == nil && !isGuestBypassed {
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
                    TabView(selection: $selectedTab) {
                        // Home View
                        NavigationView {
                            HomeView(selectedTab: $selectedTab, showingRegister: $showingRegister)
                                .environmentObject(session)
                        }
                        .tabItem {
                            Label("Home", systemImage: "house.fill")
                        }
                        .tag(0)
                        
                        // Clans directory View
                        NavigationView {
                            ClansView()
                        }
                        .tabItem {
                            Label("Rajput Clans", systemImage: "shield.lefthalf.filled")
                        }
                        .tag(1)
                        
                        // Pricing plans view
                        NavigationView {
                            PlansView()
                                .environmentObject(session)
                        }
                        .tabItem {
                            Label("Regal Plans", systemImage: "crown.fill")
                        }
                        .tag(2)
                        
                        // Profile Account View
                        NavigationView {
                            Group {
                                if session.currentUser != nil {
                                    DashboardView()
                                        .environmentObject(session)
                                } else {
                                    if showingRegister {
                                        RegisterView(showingRegister: $showingRegister, isGuestBypassed: $isGuestBypassed)
                                            .environmentObject(session)
                                    } else {
                                        LoginView(showingRegister: $showingRegister, isGuestBypassed: $isGuestBypassed)
                                            .environmentObject(session)
                                    }
                                }
                            }
                        }
                        .tabItem {
                            Label("My Account", systemImage: "person.circle.fill")
                        }
                    .tag(3)
                }
                .accentColor(.royalGold)
                .onAppear {
                    // Set up a custom appearance for tabs if wanted
                    UITabBar.appearance().backgroundColor = UIColor(Color.cardBackground)
                    UITabBar.appearance().unselectedItemTintColor = UIColor(Color.inkBrown.opacity(0.5))
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
            // Jodhpur Indigo background
            LinearGradient(
                colors: [Color.jodhpurIndigo, Color(hex: "#101830")],
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
