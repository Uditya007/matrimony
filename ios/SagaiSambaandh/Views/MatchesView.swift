import SwiftUI

struct MatchesView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var selectedTab: Int
    @Binding var showingRegister: Bool
    @State private var activeFilterTab: Int = 0 // 0 = All, 1 = Gotra Compatible
    @State private var selectedProfileForDetail: Profile? = nil
    
    var body: some View {
        VStack(spacing: 0) {
            toolbar
            filterTabs
            matchesList
        }
        .sheet(item: $selectedProfileForDetail) { profile in
            ProfileDetailView(profile: profile)
                .environmentObject(session)
        }
    }
    
    private var toolbar: some View {
        HStack {
            Spacer()
            Text("Matches")
                .font(BrandFonts.displayBold(size: 20))
                .foregroundColor(.lightGold)
            Spacer()
        }
        .padding()
        .background(Color.deepMaroon)
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
            
            connectButton
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
    
    private var connectButton: some View {
        Button(action: handleConnectTap) {
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
    
    private func handleConnectTap() {
        if isProfileLocked {
            showRegistration()
        } else {
            // Trigger connection request
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
