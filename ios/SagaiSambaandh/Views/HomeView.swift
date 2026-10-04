import SwiftUI
import Combine

struct HomeView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var selectedTab: Int
    @Binding var showingRegister: Bool
    var isSideMenuOpen: Binding<Bool>? = nil
    
    @State private var lookingFor: String = "Bride"
    @State private var selectedClan: String = "All Clans"
    @State private var selectedProfileForDetail: Profile? = nil
    @State private var activeHeroSlide: Int = 0
    let timer = Timer.publish(every: 4, on: .main, in: .common).autoconnect()
    
    private let clansOptions = ["All Clans", "Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat"]
    
    private var filteredProfiles: [Profile] {
        session.profiles.filter { profile in
            let matchGender = profile.gender.lowercased() == (lookingFor == "Bride" ? "bride" : "groom")
            let matchClan = selectedClan == "All Clans" || profile.clan.lowercased() == selectedClan.lowercased()
            return matchGender && matchClan
        }
    }
    
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                // Hero Header Banner with Slide Show
                ZStack(alignment: .top) {
                    ZStack(alignment: .bottom) {
                        // Couples Slideshow Background Image
                        AsyncImage(url: URL(string: "https://www.shreerajputsagaisambandh.com/images/slide\(activeHeroSlide + 1).jpg")) { image in
                            image.resizable()
                                 .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color.appCardBackground
                        }
                        .frame(height: 280)
                        .clipped()
                        
                        // Romantic Gradient Overlay
                        LinearGradient(
                            colors: [Color.black.opacity(0.35), Color.black.opacity(0.85)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 280)
                        
                        VStack(spacing: 10) {
                            Text("A UNION OF RAJPUT LINEAGE & LEGACY")
                                .font(BrandFonts.label(size: 10, weight: .bold))
                                .foregroundColor(Color.royalGold)
                                .tracking(2.5)
                            
                            Text("Where Lineage\nMeets Sacred Legacy")
                                .font(BrandFonts.displayBold(size: 26))
                                .foregroundColor(.white)
                                .multilineTextAlignment(.center)
                                .lineSpacing(3)
                            
                            Text("The most authentic, verified matrimony network for Rajput families.")
                                .font(BrandFonts.body(size: 13))
                                .foregroundColor(.white.opacity(0.85))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 30)
                                .padding(.bottom, 16)
                        }
                        .padding(.top, 40)
                        .padding(.bottom, 36)
                    }
                    
                    // Prominent Top Navigation Row
                    HStack {
                        if let isSideMenuOpen = isSideMenuOpen {
                            Button(action: {
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                    isSideMenuOpen.wrappedValue = true
                                }
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "line.horizontal.3")
                                        .font(.system(size: 17, weight: .bold))
                                        .foregroundColor(.white)
                                }
                                .frame(width: 42, height: 42)
                                .background(Color.black.opacity(0.45))
                                .clipShape(Circle())
                                .overlay(Circle().stroke(Color.royalGold.opacity(0.6), lineWidth: 1.5))
                                .shadow(color: Color.black.opacity(0.3), radius: 6, x: 0, y: 2)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                }
                .onReceive(timer) { _ in
                    activeHeroSlide = (activeHeroSlide + 1) % 3
                }
                
                // Content Section
                VStack(spacing: 24) {
                    // Modern Search Widget Card
                    VStack(spacing: 16) {
                        HStack {
                            Image(systemName: "sparkles")
                                .foregroundColor(Color.appPrimary)
                            Text("FIND YOUR NOBLE MATCH")
                                .font(BrandFonts.label(size: 11, weight: .bold))
                                .foregroundColor(Color.appTextPrimary)
                                .tracking(1.2)
                            Spacer()
                        }
                        
                        HStack(spacing: 12) {
                            // Looking For Picker
                            VStack(alignment: .leading, spacing: 4) {
                                Text("LOOKING FOR")
                                    .font(BrandFonts.label(size: 9, weight: .bold))
                                    .foregroundColor(Color.appTextSecondary)
                                Picker("Looking For", selection: $lookingFor) {
                                    Text("Bride (Ladi)").tag("Bride")
                                    Text("Groom (Lada)").tag("Groom")
                                }
                                .pickerStyle(MenuPickerStyle())
                                .foregroundColor(Color.appTextPrimary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 6)
                                .background(Color.appCardBackground)
                                .cornerRadius(10)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            
                            // Rajput Clan Picker
                            VStack(alignment: .leading, spacing: 4) {
                                Text("RAJPUT CLAN")
                                    .font(BrandFonts.label(size: 9, weight: .bold))
                                    .foregroundColor(Color.appTextSecondary)
                                Picker("Clan", selection: $selectedClan) {
                                    ForEach(clansOptions, id: \.self) { option in
                                        Text(option).tag(option)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                                .foregroundColor(Color.appTextPrimary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 6)
                                .background(Color.appCardBackground)
                                .cornerRadius(10)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        
                        // Search CTA Button
                        Button(action: {
                            session.setSearchFilters(gender: lookingFor, clan: selectedClan)
                            selectedTab = 1 // Go to Matches tab
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "magnifyingglass")
                                    .font(.system(size: 14, weight: .bold))
                                Text(session.currentUser == nil ? "Log In to Search" : "Search Matches")
                                    .font(BrandFonts.bodyBold(size: 14))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color.appSecondary],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(24)
                            .shadow(color: Color.appPrimary.opacity(0.3), radius: 8, y: 4)
                        }
                    }
                    .padding(20)
                    .background(Color.white)
                    .cornerRadius(20)
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.appBorder, lineWidth: 1))
                    .shadow(color: Color.black.opacity(0.06), radius: 14, y: 6)
                    .padding(.horizontal, 20)
                    .offset(y: -24)
                    .padding(.bottom, -12)
                    
                    // Profile Completion Checklist Widget
                    if session.currentUser != nil {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Complete your Profile")
                                .font(BrandFonts.displayBold(size: 16))
                                .foregroundColor(Color.appTextPrimary)
                            
                            Text("Completed profiles get 2x more matches and responses.")
                                .font(BrandFonts.body(size: 12.5))
                                .foregroundColor(Color.appTextSecondary)
                                .padding(.bottom, 2)
                            
                            ProfileChecklistItem(title: "Verify your Rajput Lineage", checked: true)
                            ProfileChecklistItem(title: "Upload Authentic Portrait", checked: session.currentUser?.profilePic?.isEmpty == false)
                            ProfileChecklistItem(title: "Add Gotra & Astro details", checked: session.currentUser?.gotra.isEmpty == false)
                        }
                        .padding(18)
                        .background(Color.appCardBackground)
                        .cornerRadius(18)
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.appBorder, lineWidth: 1))
                        .padding(.horizontal, 20)
                    }
                    
                    // Featured Showcase
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Featured Rajput Lineages")
                                    .font(BrandFonts.displayBold(size: 18))
                                    .foregroundColor(Color.appTextPrimary)
                                Text("Verified brides and grooms recently active")
                                    .font(BrandFonts.body(size: 12.5))
                                    .foregroundColor(Color.appTextSecondary)
                            }
                            Spacer()
                        }
                        .padding(.horizontal, 20)
                        
                        if filteredProfiles.isEmpty {
                            Text("No profiles match your search criteria currently.")
                                .font(BrandFonts.body(size: 13))
                                .foregroundColor(Color.appTextMuted)
                                .italic()
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding(.vertical, 30)
                        } else {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 16) {
                                    ForEach(filteredProfiles) { profile in
                                        let lockedState = session.currentUser == nil
                                        
                                        ProfileCard(
                                            profile: profile,
                                            isLocked: lockedState,
                                            onUnlockTap: {
                                                showingRegister = true
                                                selectedTab = 3
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
                                        .frame(width: 270)
                                    }
                                }
                                .padding(.horizontal, 20)
                                .padding(.vertical, 4)
                            }
                        }
                    }
                    
                    // Royal Promise / Trust block
                    VStack(alignment: .leading, spacing: 14) {
                        Text("The Shree Rajput Sagai Sambandh Promise")
                            .font(BrandFonts.displayBold(size: 18))
                            .foregroundColor(Color.appTextPrimary)
                            .padding(.horizontal, 20)
                        
                        VStack(spacing: 12) {
                            PromiseRow(icon: "checkmark.seal.fill", title: "100% Rajput Lineage Audit", desc: "No general castes. Every profile undergoes gotra, kul, and thikana validation.")
                            PromiseRow(icon: "photo.fill.badge.plus", title: "Locked Photo Privacy", desc: "Your photograph is blurred to guests. Unlocks only upon mutual interest.")
                            PromiseRow(icon: "person.2.fill", title: "Direct Family Connection", desc: "Enable direct dialogues between noble families with zero mediator interference.")
                        }
                        .padding(18)
                        .background(Color.appCardBackground)
                        .cornerRadius(20)
                        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.appBorder, lineWidth: 1))
                        .padding(.horizontal, 20)
                    }
                    .padding(.bottom, 24)
                }
            }
            .refreshable {
                await session.refreshProfilesAsync()
            }
        }
        .background(Color.white.edgesIgnoringSafeArea(.all))
        .navigationBarHidden(true)
        .sheet(item: $selectedProfileForDetail) { profile in
            ProfileDetailView(profile: profile)
                .environmentObject(session)
        }
        .onAppear {
            lookingFor = session.searchGender
        }
        .onReceive(session.$searchGender) { newGender in
            lookingFor = newGender
        }
    }
}

struct PromiseRow: View {
    let icon: String
    let title: String
    let desc: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(Color.appPrimary)
                .frame(width: 26)
            
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(BrandFonts.body(size: 14, weight: .bold))
                    .foregroundColor(Color.appTextPrimary)
                Text(desc)
                    .font(BrandFonts.body(size: 12))
                    .foregroundColor(Color.appTextSecondary)
                    .lineSpacing(2)
            }
        }
        .padding(.vertical, 4)
    }
}

struct ProfileChecklistItem: View {
    let title: String
    let checked: Bool
    
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                .foregroundColor(checked ? Color.successGreen : Color.appTextMuted)
                .font(.system(size: 16))
            
            Text(title)
                .font(BrandFonts.body(size: 13))
                .foregroundColor(Color.appTextPrimary)
            
            Spacer()
        }
    }
}
