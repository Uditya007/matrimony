import SwiftUI

class SessionManager: ObservableObject {
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
    @StateObject private var session = SessionManager()
    @State private var selectedTab: Int = 0
    @State private var showingRegister: Bool = false
    
    var body: some View {
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
                            RegisterView(showingRegister: $showingRegister)
                                .environmentObject(session)
                        } else {
                            LoginView(showingRegister: $showingRegister)
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
