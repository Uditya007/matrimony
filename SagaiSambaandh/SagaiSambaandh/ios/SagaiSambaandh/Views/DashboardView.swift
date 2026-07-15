import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @State private var selectedClanFilter: String = "All"
    @State private var selectedProfileForDetail: Profile? = nil
    @State private var showingLogoutAlert = false
    
    private let clanFilters = ["All", "Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat"]
    
    private var feedProfiles: [Profile] {
        guard let user = session.currentUser else { return [] }
        // Display opposite gender matches
        let oppositeGender = user.gender == "Groom" ? "Bride" : "Groom"
        
        return session.profiles.filter { profile in
            let matchGender = profile.gender == oppositeGender
            let matchClan = selectedClanFilter == "All" || profile.clan == selectedClanFilter
            return matchGender && matchClan
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Welcome Header
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Khammaghani,")
                            .font(BrandFonts.displayItalic(size: 16))
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                        
                        Text(session.currentUser?.name.components(separatedBy: " ").first ?? "Kunwar")
                            .font(BrandFonts.displayBold(size: 26))
                            .foregroundColor(.sandstoneIvory)
                    }
                    
                    Spacer()
                    
                    // User package badge
                    Text("\(session.currentUser?.tier ?? "Starter") Plan")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.royalMaroon)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color.lightGold)
                        .cornerRadius(10)
                        .fontWeight(.bold)
                    
                    Button(action: { showingLogoutAlert = true }) {
                        Image(systemName: "power")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Color.red.opacity(0.3))
                            .clipShape(Circle())
                    }
                }
                
                Text("Noble Rajput lineage dashboard matches suited for your gotra compatibility.")
                    .font(BrandFonts.body(size: 12))
                    .foregroundColor(.sandstoneIvory.opacity(0.8))
            }
            .padding(20)
            .background(
                LinearGradient(
                    colors: [.royalMaroon, .deepMaroon],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            
            // Filters scroll list
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(clanFilters, id: \.self) { filter in
                        Button(action: { selectedClanFilter = filter }) {
                            Text(filter)
                                .font(BrandFonts.label(size: 10))
                                .foregroundColor(selectedClanFilter == filter ? .white : .royalMaroon)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(selectedClanFilter == filter ? Color.royalMaroon : Color.royalGold.opacity(0.12))
                                .cornerRadius(15)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 15)
                                        .stroke(Color.royalGold.opacity(0.4), lineWidth: 0.8)
                                )
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
            }
            .background(Color.cardBackground)
            
            // Feed body list
            if feedProfiles.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "person.3.sequence.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.gray.opacity(0.5))
                    Text("No profiles match this clan filter currently.")
                        .font(BrandFonts.body(size: 14))
                        .foregroundColor(.gray)
                        .italic()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.sandstoneIvory.opacity(0.2))
            } else {
                ScrollView {
                    LazyVStack(spacing: 20) {
                        ForEach(feedProfiles) { profile in
                            ProfileCard(
                                profile: profile,
                                isLocked: false, // Logged-in matches feed is unlocked!
                                onUnlockTap: {},
                                onDetailTap: {
                                    selectedProfileForDetail = profile
                                }
                            )
                        }
                    }
                    .padding(20)
                }
                .background(Color.sandstoneIvory.opacity(0.15))
            }
        }
        .background(Color.sandstoneIvory.edgesIgnoringSafeArea(.all))
        .navigationBarHidden(true)
        .alert(isPresented: $showingLogoutAlert) {
            Alert(
                title: Text("Log Out"),
                message: Text("Are you sure you want to exit your sanctuary account?"),
                primaryButton: .destructive(Text("Log Out")) {
                    session.logout()
                },
                secondaryButton: .cancel()
            )
        }
        .sheet(item: $selectedProfileForDetail) { profile in
            ProfileDetailView(profile: profile)
                .environmentObject(session)
        }
    }
}
