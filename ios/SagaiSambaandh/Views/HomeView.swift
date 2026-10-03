import SwiftUI
import Combine

struct HomeView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var selectedTab: Int
    @Binding var showingRegister: Bool
    @Binding var isSideMenuOpen: Bool
    
    @State private var lookingFor: String = "Bride"
    @State private var selectedClan: String = "All Clans"
    @State private var selectedProfileForDetail: Profile? = nil
    @State private var activeHeroSlide: Int = 0
    let timer = Timer.publish(every: 4, on: .main, in: .common).autoconnect()
    
    private let clansOptions = ["All Clans", "Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat"]
    
    private var filteredProfiles: [Profile] {
        session.profiles.filter { profile in
            let matchGender = profile.gender == (lookingFor == "Bride" ? "Bride" : "Groom")
            let matchClan = selectedClan == "All Clans" || profile.clan == selectedClan
            return matchGender && matchClan
        }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero Header Banner with Slide Show
                ZStack(alignment: .bottom) {
                    // Couples Slideshow Background Image
                    AsyncImage(url: URL(string: "https://shreerajputsagaisambandh.com/images/slide\(activeHeroSlide + 1).jpg")) { image in
                        image.resizable()
                             .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Color.deepMaroon
                    }
                    .frame(height: 260)
                    .clipped()
                    
                    // Dark maroon gradient overlay to keep text readable
                    LinearGradient(
                        colors: [Color.deepMaroon.opacity(0.4), Color.royalMaroon.opacity(0.9)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 260)
                    
                    VStack(spacing: 12) {
                        Text("A UNION OF RAJPUT LINEAGE & LEGACY")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.lightGold)
                            .tracking(3)
                        
                        Text("Where Lineage\nMeets Sacred Legacy")
                            .font(BrandFonts.displayBold(size: 28))
                            .foregroundColor(.sandstoneIvory)
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                        
                        Text("Welcome to the most premium, secure, and dedicated matchmaking portal for the noble Rajput community.")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 30)
                            .padding(.bottom, 20)
                    }
                    .padding(.top, 40)
                    .padding(.bottom, 60)
                    
                    // Palace silhouette vector divider
                    PalaceDivider(fillColor: .deepMaroon)
                }
                .onReceive(timer) { _ in
                    activeHeroSlide = (activeHeroSlide + 1) % 3
                }
                
                // Content Section
                VStack(spacing: 24) {
                    // Search Widget
                    VStack(spacing: 15) {
                        Text("FIND YOUR NOBLE MATCH")
                            .font(BrandFonts.label(size: 12))
                            .foregroundColor(.royalMaroon)
                            .tracking(1.5)
                            .fontWeight(.bold)
                        
                        HStack(spacing: 15) {
                            // Looking For Picker
                            VStack(alignment: .leading, spacing: 5) {
                                Text("LOOKING FOR")
                                    .font(BrandFonts.label(size: 8))
                                    .foregroundColor(.gray)
                                Picker("Looking For", selection: $lookingFor) {
                                    Text("Bride (Ladi)").tag("Bride")
                                    Text("Groom (Lada)").tag("Groom")
                                }
                                .pickerStyle(MenuPickerStyle())
                                .foregroundColor(.inkBrown)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            
                            // Rajput Clan Picker
                            VStack(alignment: .leading, spacing: 5) {
                                Text("RAJPUT CLAN")
                                    .font(BrandFonts.label(size: 8))
                                    .foregroundColor(.gray)
                                Picker("Clan", selection: $selectedClan) {
                                    ForEach(clansOptions, id: \.self) { option in
                                        Text(option).tag(option)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                                .foregroundColor(.inkBrown)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.vertical, 8)
                        
                        // Search CTA Button
                        Button(action: {
                            session.setSearchFilters(gender: lookingFor, clan: selectedClan)
                            selectedTab = 1 // Go to Matches tab
                        }) {
                            Text(session.currentUser == nil ? "Log In to Search" : "Search Matches")
                                .font(BrandFonts.body(size: 14, weight: .bold))
                                .foregroundColor(.royalMaroon)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    LinearGradient(
                                        colors: [.royalGold, .lightGold, .royalGold],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .cornerRadius(8)
                                .shadow(radius: 2)
                        }
                    }
                    .padding(20)
                    .background(Color.deepMaroon)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.3), lineWidth: 1.2)
                    )
                    .padding(.horizontal, 20)
                    .offset(y: -40)
                    .padding(.bottom, -30)
                    
                    // Profile Completion Checklist Widget
                    if session.currentUser != nil {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Complete your Profile")
                                .font(BrandFonts.displayBold(size: 16))
                                .foregroundColor(.lightGold)
                            
                            Text("Completed profiles get 2x more matches and responses.")
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(.sandstoneIvory.opacity(0.7))
                                .padding(.bottom, 6)
                            
                            ProfileChecklistItem(title: "Verify your Rajput Lineage", checked: true)
                            ProfileChecklistItem(title: "Upload Heritage Photos", checked: false)
                            ProfileChecklistItem(title: "Add Astro & Kundli details", checked: false)
                        }
                        .padding()
                        .background(Color.deepMaroon)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.royalGold.opacity(0.3), lineWidth: 1)
                        )
                        .padding(.horizontal, 20)
                        .padding(.bottom, 20)
                    }
                    
                    // Featured Showcase
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Featured Rajput Lineages")
                                    .font(BrandFonts.displayBold(size: 20))
                                    .foregroundColor(.lightGold)
                                Text("Verified brides and grooms recently active")
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(.sandstoneIvory.opacity(0.7))
                            }
                            Spacer()
                        }
                        .padding(.horizontal, 20)
                        
                        if filteredProfiles.isEmpty {
                            Text("No noble profiles match your search criteria currently.")
                                .font(BrandFonts.body(size: 13))
                                .foregroundColor(.gray)
                                .italic()
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding(.vertical, 30)
                        } else {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 20) {
                                    ForEach(filteredProfiles) { profile in
                                        let lockedState = session.currentUser == nil
                                        
                                        ProfileCard(
                                            profile: profile,
                                            isLocked: lockedState,
                                            onUnlockTap: {
                                                showingRegister = true
                                                selectedTab = 3 // Direct to registration
                                            },
                                            onDetailTap: {
                                                if lockedState {
                                                    showingRegister = true
                                                    selectedTab = 3
                                                } else {
                                                    selectedProfileForDetail = profile
                                                }
                                            }
                                        )
                                        .frame(width: 280)
                                    }
                                }
                                .padding(.horizontal, 20)
                                .padding(.vertical, 8)
                            }
                        }
                    }
                    
                    // Royal Promise / Trust block
                    VStack(alignment: .leading, spacing: 15) {
                        Text("The Shree Rajput Sagai Sambandh Promise")
                            .font(BrandFonts.displayBold(size: 20))
                            .foregroundColor(.lightGold)
                            .padding(.horizontal, 20)
                        
                        VStack(spacing: 12) {
                            PromiseRow(icon: "checkmark.seal.fill", title: "100% Rajput Lineage Audit", desc: "No general castes. Every profile undergoes gotra, kul, and thikana validation.")
                            PromiseRow(icon: "photo.fill.badge.plus", title: "Locked Photo Privacy", desc: "Your photograph is blurred to guests. Unlocks only to mutual interest.")
                            PromiseRow(icon: "person.2.fill", title: "Direct Family Connection", desc: "Enable direct dialogues between noble families with zero mediator interference.")
                        }
                        .padding(.horizontal, 20)
                    }
                    .padding(.vertical, 20)
                    .background(Color.deepMaroon)
                }
                .background(Color.deepMaroon)
            }
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
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
                Text("Sagai Sambandh")
                    .font(BrandFonts.displayBold(size: 18))
                    .foregroundColor(.lightGold)
            }
        }
        .sheet(item: $selectedProfileForDetail) { profile in
            ProfileDetailView(profile: profile)
                .environmentObject(session)
        }
    }
}

struct PromiseRow: View {
    let icon: String
    let title: String
    let desc: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 15) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.royalGold)
                .frame(width: 25)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(BrandFonts.body(size: 14, weight: .bold))
                    .foregroundColor(.sandstoneIvory)
                Text(desc)
                    .font(BrandFonts.body(size: 12))
                    .foregroundColor(.sandstoneIvory.opacity(0.7))
                    .lineSpacing(2)
            }
        }
        .padding(.vertical, 5)
    }
}

struct ProfileChecklistItem: View {
    let title: String
    let checked: Bool
    
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                .foregroundColor(checked ? .green : .sandstoneIvory.opacity(0.3))
                .font(.system(size: 16))
            
            Text(title)
                .font(BrandFonts.body(size: 13))
                .foregroundColor(.sandstoneIvory)
            
            Spacer()
        }
    }
}
