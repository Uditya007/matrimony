import SwiftUI

struct MatchesView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var selectedTab: Int
    @Binding var showingRegister: Bool
    @State private var activeFilterTab: Int = 0 // 0 = All, 1 = Gotra Compatible
    @State private var selectedProfileForDetail: Profile? = nil
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Toolbar
            HStack {
                Spacer()
                Text("Matches")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(.lightGold)
                Spacer()
            }
            .padding()
            .background(Color.deepMaroon)
            
            // Filter Tabs
            Picker("Filter", selection: $activeFilterTab) {
                Text("All Matches").tag(0)
                Text("Gotra Compatible").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)
            .padding(.vertical, 8)
            .background(Color.deepMaroon)
            
            ScrollView {
                VStack(spacing: 20) {
                    ForEach(filteredMatches) { profile in
                        VStack(alignment: .leading, spacing: 12) {
                            // Profile card display area
                            ProfileSummaryCard(
                                profile: profile,
                                isLocked: session.currentUser == nil,
                                onUnlockTap: {
                                    showingRegister = true
                                },
                                onDetailTap: {
                                    if session.currentUser != nil {
                                        selectedProfileForDetail = profile
                                    } else {
                                        showingRegister = true
                                    }
                                }
                            )
                            
                            // Connect Button styled like Shaadi.com green button
                            Button(action: {
                                if session.currentUser == nil {
                                    showingRegister = true
                                } else {
                                    // Trigger connection request
                                }
                            }) {
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                    Text("Connect Now")
                                        .font(BrandFonts.bodyBold(size: 14))
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .height(44)
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
                }
                .padding()
            }
            .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
        }
        .sheet(item: $selectedProfileForDetail) { profile in
            ProfileDetailView(profile: profile)
                .environmentObject(session)
        }
    }
    
    private var filteredMatches: [Profile] {
        if activeFilterTab == 1, let currentUser = session.currentUser {
            return session.profiles.filter {
                $0.gotra.lowercased() != currentUser.gotra.lowercased()
            }
        }
        return session.profiles
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
