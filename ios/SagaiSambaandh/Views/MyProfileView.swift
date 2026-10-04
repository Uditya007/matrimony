import SwiftUI

struct MyProfileView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    
    var selectedTab: Binding<Int>? = nil
    var isSideMenuOpen: Binding<Bool>? = nil
    
    @State private var name: String = ""
    @State private var clan: String = ""
    @State private var gotra: String = ""
    @State private var motherGotra: String = ""
    @State private var thikana: String = ""
    @State private var phone: String = ""
    @State private var dob: String = ""
    @State private var education: String = ""
    @State private var occupation: String = ""
    @State private var income: String = ""
    @State private var height: String = ""
    @State private var maritalStatus: String = "Never Married"
    
    @State private var location: String = ""
    @State private var rashi: String = ""
    @State private var manglik: String = "Non-Manglik"
    @State private var expectations: String = ""
    @State private var instagram: String = ""
    @State private var facebook: String = ""
    @State private var biodataUrl: String = ""
    @State private var about: String = ""
    @State private var gender: String = "Groom"
    @State private var lookingFor: String = "Bride"
    
    @State private var showingAvatarChooser: Bool = false
    @State private var showingPartnerPreferencesSheet: Bool = false
    @State private var showingBiodataSheet: Bool = false
    @State private var showingLogoutAlert: Bool = false
    @State private var isSaving: Bool = false
    @State private var showSavedToast: Bool = false
    @State private var savedToastMessage: String = ""
    
    private let clansOptions = [
        "Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat",
        "Panwar", "Tanwar", "Hada", "Sodha", "Parihar", "Tomar", "Jhala", "Solanki"
    ]
    private let manglikOptions = ["Non-Manglik", "Manglik", "Anshik Manglik"]
    private let maritalOptions = ["Never Married", "Separated", "Divorced", "Widowed"]
    private let genderOptions = ["Groom", "Bride"]
    private let rashiOptions = [
        "Select Rashi", "Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)",
        "Kark (Cancer)", "Singh (Leo)", "Kanya (Virgo)", "Tula (Libra)",
        "Vrishchik (Scorpio)", "Dhanu (Sagittarius)", "Makar (Capricorn)",
        "Kumbh (Aquarius)", "Meen (Pisces)"
    ]
    
    var body: some View {
        ZStack {
            Color.deepMaroon.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Custom Top Navigation Bar
                topHeaderBar
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 22) {
                        // 1. Hero Profile Header & Portrait Card
                        heroProfileCard
                        
                        // 2. Partner Preferences Showcase & Editor
                        partnerPreferencesCard
                        
                        // 3. Section 1: Lineage & Identity
                        lineageSection
                        
                        // 4. Section 2: Astrology & Specifications
                        astrologySection
                        
                        // 5. Section 3: Professional & Contact
                        professionalSection
                        
                        // 6. Section 4: Social Links & Ancestral Biodata
                        socialsSection
                        
                        // 7. Section 5: Biography & Partner Expectations
                        bioSection
                        
                        // 8. Primary Save Changes Button
                        saveChangesButton
                        
                        // 9. Quick Actions (Biodata, Premium, Logout)
                        quickActionsFooter
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 16)
                }
            }
            
            // Success Toast Overlay
            if showSavedToast {
                VStack {
                    Spacer()
                    HStack(spacing: 12) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.deepMaroon)
                        Text(savedToastMessage)
                            .font(BrandFonts.bodyBold(size: 14))
                            .foregroundColor(.deepMaroon)
                    }
                    .padding(.horizontal, 22)
                    .padding(.vertical, 14)
                    .background(
                        LinearGradient(
                            colors: [.royalGold, .lightGold, .royalGold],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(25)
                    .shadow(color: Color.black.opacity(0.4), radius: 10, y: 5)
                    .padding(.bottom, 24)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                .zIndex(20)
            }
        }
        .sheet(isPresented: $showingAvatarChooser) {
            AvatarSelectionView()
                .environmentObject(session)
        }
        .sheet(isPresented: $showingPartnerPreferencesSheet) {
            PartnerPreferencesView(selectedTab: selectedTab ?? .constant(1))
                .environmentObject(session)
        }
        .sheet(isPresented: $showingBiodataSheet) {
            BiodataCardView()
                .environmentObject(session)
        }
        .alert(isPresented: $showingLogoutAlert) {
            Alert(
                title: Text("Log Out"),
                message: Text("Are you sure you want to log out from Sagai Sambaandh?"),
                primaryButton: .destructive(Text("Log Out")) {
                    session.logout()
                },
                secondaryButton: .cancel()
            )
        }
        .onAppear(perform: loadUserData)
    }
    
    // MARK: - Top Header Bar
    private var topHeaderBar: some View {
        HStack {
            if let isSideMenuOpen = isSideMenuOpen {
                Button(action: {
                    withAnimation {
                        isSideMenuOpen.wrappedValue = true
                    }
                }) {
                    Image(systemName: "line.horizontal.3")
                        .foregroundColor(.sandstoneIvory)
                        .font(.title2)
                        .frame(width: 40, height: 40)
                        .background(Color.white.opacity(0.1))
                        .clipShape(Circle())
                }
            } else if selectedTab == nil {
                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Close")
                        .font(BrandFonts.bodyBold(size: 15))
                        .foregroundColor(.lightGold)
                }
            } else {
                Color.clear.frame(width: 40, height: 40)
            }
            
            Spacer()
            
            HStack(spacing: 6) {
                Image(systemName: "crown.fill")
                    .foregroundColor(.royalGold)
                    .font(.system(size: 14))
                Text("My Profile")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(.sandstoneIvory)
            }
            
            Spacer()
            
            Button(action: saveProfileCard) {
                if isSaving {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .lightGold))
                        .frame(width: 40, height: 40)
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                        Text("Save")
                            .font(BrandFonts.bodyBold(size: 14))
                    }
                    .foregroundColor(.deepMaroon)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        LinearGradient(
                            colors: [.royalGold, .lightGold],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(14)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .background(Color.deepMaroon)
    }
    
    // MARK: - Hero Profile Card
    private var heroProfileCard: some View {
        VStack(spacing: 14) {
            ZStack(alignment: .bottomTrailing) {
                AvatarImageView(
                    imageSource: session.currentUser?.profilePic,
                    name: session.currentUser?.name ?? "Member",
                    clan: session.currentUser?.clan ?? "",
                    contentMode: .fill,
                    fallbackFontSize: 32
                )
                .frame(width: 90, height: 90)
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.royalGold, lineWidth: 2.5))
                .shadow(color: Color.black.opacity(0.3), radius: 6, y: 3)
                
                Button(action: {
                    showingAvatarChooser = true
                }) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.deepMaroon)
                        .frame(width: 28, height: 28)
                        .background(Color.royalGold)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.deepMaroon, lineWidth: 2))
                }
            }
            
            VStack(spacing: 4) {
                Text(session.currentUser?.name.isEmpty == false ? (session.currentUser?.name ?? "Rajput Member") : "Rajput Member")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(.sandstoneIvory)
                
                HStack(spacing: 8) {
                    if let clan = session.currentUser?.clan, !clan.isEmpty {
                        Text(clan)
                            .font(BrandFonts.body(size: 13, weight: .bold))
                            .foregroundColor(.lightGold)
                    }
                    if let gotra = session.currentUser?.gotra, !gotra.isEmpty {
                        Text("•  \(gotra) Gotra")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                    }
                }
                
                HStack(spacing: 8) {
                    // Royal Verified Badge
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.royalGold)
                        Text("Verified Rajput")
                            .font(BrandFonts.label(size: 10, weight: .bold))
                            .foregroundColor(.royalGold)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.royalGold.opacity(0.15))
                    .cornerRadius(12)
                    
                    // Tier Badge
                    HStack(spacing: 4) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.sandstoneIvory)
                        Text(session.currentUser?.tier ?? "Starter")
                            .font(BrandFonts.label(size: 10, weight: .bold))
                            .foregroundColor(.sandstoneIvory)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.12))
                    .cornerRadius(12)
                }
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(Color.black.opacity(0.25))
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(Color.royalGold.opacity(0.3), lineWidth: 1)
                )
        )
    }
    
    // MARK: - Partner Preferences Showcase & Editor
    private var partnerPreferencesCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "heart.text.square.fill")
                        .foregroundColor(.royalGold)
                        .font(.system(size: 18))
                    Text("PARTNER PREFERENCES")
                        .font(BrandFonts.label(size: 11, weight: .bold))
                        .foregroundColor(.lightGold)
                        .tracking(1)
                }
                
                Spacer()
                
                Button(action: {
                    showingPartnerPreferencesSheet = true
                }) {
                    HStack(spacing: 4) {
                        Text("Edit Criteria")
                            .font(BrandFonts.bodyBold(size: 12))
                        Image(systemName: "pencil")
                            .font(.system(size: 11))
                    }
                    .foregroundColor(.deepMaroon)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.royalGold)
                    .cornerRadius(10)
                }
            }
            
            Text("Adjust criteria to filter compatible brides and grooms in Discover:")
                .font(BrandFonts.body(size: 12))
                .foregroundColor(.sandstoneIvory.opacity(0.75))
            
            // Quick Inline "Looking For" Toggle
            VStack(alignment: .leading, spacing: 6) {
                Text("LOOKING FOR IN DISCOVER")
                    .font(BrandFonts.label(size: 9, weight: .bold))
                    .foregroundColor(.sandstoneIvory.opacity(0.8))
                
                Picker("Looking For", selection: $lookingFor) {
                    Text("👰 Vadhu (Bride)").tag("Bride")
                    Text("🤵 Var (Groom)").tag("Groom")
                }
                .pickerStyle(SegmentedPickerStyle())
                .onChange(of: lookingFor) { newPref in
                    session.setLookingForGender(newPref)
                }
            }
            
            // Current Preferences Summary Badges
            HStack(spacing: 8) {
                prefBadge(title: "Seeking", value: lookingFor)
                prefBadge(title: "Clan", value: session.searchClan)
                prefBadge(title: "Status", value: "Verified Only")
            }
            
            Button(action: {
                showingPartnerPreferencesSheet = true
            }) {
                HStack {
                    Image(systemName: "slider.horizontal.3")
                    Text("Configure Detailed Preferences (Age, Clan, Manglik, City)")
                        .font(BrandFonts.bodyBold(size: 12.5))
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                }
                .foregroundColor(.sandstoneIvory)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.white.opacity(0.08))
                .cornerRadius(10)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.black.opacity(0.3))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.royalGold.opacity(0.4), lineWidth: 1.2)
                )
        )
    }
    
    private func prefBadge(title: String, value: String) -> some View {
        VStack(spacing: 2) {
            Text(title)
                .font(BrandFonts.label(size: 8))
                .foregroundColor(.sandstoneIvory.opacity(0.6))
            Text(value)
                .font(BrandFonts.bodyBold(size: 11))
                .foregroundColor(.lightGold)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .padding(.horizontal, 4)
        .background(Color.white.opacity(0.06))
        .cornerRadius(8)
    }
    
    // MARK: - Section 1: Lineage & Identity
    private var lineageSection: some View {
        sectionContainer(
            title: "राजपूत कुल एवं गोत्र (LINEAGE & GOTRA)",
            icon: "shield.lefthalf.filled"
        ) {
            profileTextField(label: "FULL NAME", text: $name, placeholder: "e.g. Kunwar Ranvijay Singh")
            
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("MY GENDER")
                        .font(BrandFonts.label(size: 9, weight: .bold))
                        .foregroundColor(.sandstoneIvory.opacity(0.85))
                    Picker("Gender", selection: $gender) {
                        ForEach(genderOptions, id: \.self) { opt in
                            Text(opt == "Groom" ? "🤵 Groom" : "👰 Bride").tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(8)
                    .onChange(of: gender) { newGender in
                        if newGender.lowercased() == "groom" {
                            lookingFor = "Bride"
                        } else {
                            lookingFor = "Groom"
                        }
                    }
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("RAJPUT CLAN")
                        .font(BrandFonts.label(size: 9, weight: .bold))
                        .foregroundColor(.sandstoneIvory.opacity(0.85))
                    Picker("Clan", selection: $clan) {
                        ForEach(clansOptions, id: \.self) { opt in
                            Text(opt).tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(8)
                }
            }
            
            HStack(spacing: 12) {
                profileTextField(label: "PATERNAL GOTRA (पिता का गोत्र)", text: $gotra, placeholder: "e.g. Kashyap")
                profileTextField(label: "MATERNAL GOTRA (माता का गोत्र)", text: $motherGotra, placeholder: "e.g. Shandilya")
            }
            
            profileTextField(label: "THIKANA / NATIVE HOUSE (ठिकाना)", text: $thikana, placeholder: "e.g. Rohet Garh, Pali")
            
            HStack(spacing: 12) {
                profileTextField(label: "DATE OF BIRTH (DD/MM/YYYY)", text: $dob, placeholder: "15/08/1996")
                profileTextField(label: "NATIVE PLACE / BIRTHPLACE", text: $location, placeholder: "e.g. Jodhpur, Rajasthan")
            }
        }
    }
    
    // MARK: - Section 2: Astrology & Specifications
    private var astrologySection: some View {
        sectionContainer(
            title: "कुंडली एवं नक्षत्र (ASTROLOGY & ATTRIBUTES)",
            icon: "sparkles"
        ) {
            HStack(spacing: 12) {
                profileTextField(label: "HEIGHT", text: $height, placeholder: "e.g. 5' 11\"")
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("ZODIAC / RASHI (राशि)")
                        .font(BrandFonts.label(size: 9, weight: .bold))
                        .foregroundColor(.sandstoneIvory.opacity(0.85))
                    Picker("Rashi", selection: $rashi) {
                        ForEach(rashiOptions, id: \.self) { opt in
                            Text(opt).tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(8)
                }
            }
            
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("MANGLIK STATUS")
                        .font(BrandFonts.label(size: 9, weight: .bold))
                        .foregroundColor(.sandstoneIvory.opacity(0.85))
                    Picker("Manglik", selection: $manglik) {
                        ForEach(manglikOptions, id: \.self) { opt in
                            Text(opt).tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(8)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("MARITAL STATUS")
                        .font(BrandFonts.label(size: 9, weight: .bold))
                        .foregroundColor(.sandstoneIvory.opacity(0.85))
                    Picker("Marital Status", selection: $maritalStatus) {
                        ForEach(maritalOptions, id: \.self) { opt in
                            Text(opt).tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(8)
                }
            }
        }
    }
    
    // MARK: - Section 3: Professional & Contact
    private var professionalSection: some View {
        sectionContainer(
            title: "शिक्षा एवं व्यवसाय (PROFESSION & CONTACT)",
            icon: "briefcase.fill"
        ) {
            profileTextField(label: "EDUCATIONAL QUALIFICATIONS", text: $education, placeholder: "e.g. B.Tech (IIT), MBA")
            profileTextField(label: "OCCUPATION / DESIGNATION", text: $occupation, placeholder: "e.g. VP Operations / Civil Services")
            
            HStack(spacing: 12) {
                profileTextField(label: "ANNUAL INCOME", text: $income, placeholder: "e.g. 24 LPA")
                profileTextField(label: "MOBILE NUMBER", text: $phone, placeholder: "+91 9876543210")
            }
        }
    }
    
    // MARK: - Section 4: Socials & Biodata
    private var socialsSection: some View {
        sectionContainer(
            title: "सामाजिक संपर्क एवं बायोडाटा (SOCIALS & BIODATA)",
            icon: "link"
        ) {
            profileTextField(label: "INSTAGRAM PROFILE / HANDLE", text: $instagram, placeholder: "@ranvijay_singh")
            profileTextField(label: "FACEBOOK PROFILE LINK", text: $facebook, placeholder: "https://facebook.com/...")
            profileTextField(label: "BIODATA DOCUMENT / DRIVE LINK", text: $biodataUrl, placeholder: "https://drive.google.com/...")
        }
    }
    
    // MARK: - Section 5: Bio & Expectations
    private var bioSection: some View {
        sectionContainer(
            title: "परिचय एवं अपेक्षाएं (BIO & EXPECTATIONS)",
            icon: "text.quote"
        ) {
            VStack(alignment: .leading, spacing: 6) {
                Text("ABOUT ME (संक्षिप्त परिचय)")
                    .font(BrandFonts.label(size: 9, weight: .bold))
                    .foregroundColor(.sandstoneIvory.opacity(0.85))
                
                TextEditor(text: $about)
                    .font(BrandFonts.body(size: 14))
                    .foregroundColor(.black)
                    .frame(height: 85)
                    .padding(8)
                    .background(Color.white)
                    .cornerRadius(8)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text("PARTNER EXPECTATIONS (जीवनसाथी से अपेक्षाएं)")
                    .font(BrandFonts.label(size: 9, weight: .bold))
                    .foregroundColor(.sandstoneIvory.opacity(0.85))
                
                TextEditor(text: $expectations)
                    .font(BrandFonts.body(size: 14))
                    .foregroundColor(.black)
                    .frame(height: 85)
                    .padding(8)
                    .background(Color.white)
                    .cornerRadius(8)
            }
        }
    }
    
    // MARK: - Save Changes Button
    private var saveChangesButton: some View {
        Button(action: saveProfileCard) {
            HStack(spacing: 8) {
                if isSaving {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .deepMaroon))
                    Text("Saving Profile Changes...")
                        .font(BrandFonts.bodyBold(size: 16))
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 18))
                    Text("Save All Profile Changes")
                        .font(BrandFonts.bodyBold(size: 16))
                }
            }
            .foregroundColor(.deepMaroon)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(
                LinearGradient(
                    colors: [.royalGold, .lightGold, .royalGold],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(14)
            .shadow(color: Color.royalGold.opacity(0.3), radius: 8, y: 4)
        }
        .padding(.top, 4)
    }
    
    // MARK: - Quick Actions Footer
    private var quickActionsFooter: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                // Download Biodata Card
                Button(action: {
                    showingBiodataSheet = true
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.down.doc.fill")
                            .font(.system(size: 13))
                        Text("View Biodata")
                            .font(BrandFonts.bodyBold(size: 13))
                    }
                    .foregroundColor(.lightGold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.royalGold.opacity(0.3), lineWidth: 1)
                    )
                }
                
                // Upgrade to Premium
                Button(action: {
                    if let selectedTab = selectedTab {
                        selectedTab.wrappedValue = 2 // Tab 2 is Premium in the middle
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 13))
                        Text("Royal Plans")
                            .font(BrandFonts.bodyBold(size: 13))
                    }
                    .foregroundColor(.royalGold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color.royalGold.opacity(0.12))
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.royalGold.opacity(0.5), lineWidth: 1)
                    )
                }
            }
            
            // Log Out Button
            Button(action: {
                showingLogoutAlert = true
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 13))
                    Text("Log Out")
                        .font(BrandFonts.body(size: 13, weight: .semibold))
                }
                .foregroundColor(Color.red.opacity(0.85))
                .padding(.vertical, 8)
            }
        }
        .padding(.top, 8)
        .padding(.bottom, 24)
    }
    
    // MARK: - Helper Views & Containers
    private func sectionContainer<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundColor(.royalGold)
                    .font(.system(size: 14))
                Text(title)
                    .font(BrandFonts.label(size: 10, weight: .bold))
                    .foregroundColor(.lightGold)
                    .tracking(0.8)
            }
            
            content()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.black.opacity(0.2))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.royalGold.opacity(0.22), lineWidth: 1)
                )
        )
    }
    
    private func profileTextField(label: String, text: Binding<String>, placeholder: String = "") -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(BrandFonts.label(size: 9, weight: .bold))
                .foregroundColor(.sandstoneIvory.opacity(0.85))
            
            TextField(placeholder, text: text)
                .font(BrandFonts.body(size: 14))
                .foregroundColor(.black)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(Color.white)
                .cornerRadius(8)
        }
    }
    
    // MARK: - State Logic
    private func loadUserData() {
        guard let user = session.currentUser else { return }
        name = user.name
        clan = user.clan.isEmpty ? "Rathore" : user.clan
        gotra = user.gotra
        motherGotra = user.motherGotra
        thikana = user.thikana
        phone = user.phone
        dob = user.dob
        education = user.education
        occupation = user.occupation
        income = user.income
        height = user.height
        maritalStatus = user.maritalStatus.isEmpty ? "Never Married" : user.maritalStatus
        
        location = user.location
        rashi = user.rashi.isEmpty ? "Select Rashi" : user.rashi
        manglik = user.manglik.isEmpty ? "Non-Manglik" : user.manglik
        expectations = user.expectations
        instagram = user.instagram
        facebook = user.facebook
        biodataUrl = user.biodataUrl
        about = user.about ?? ""
        gender = user.gender.isEmpty ? "Groom" : user.gender
        lookingFor = session.searchGender
    }
    
    private func saveProfileCard() {
        guard let user = session.currentUser else { return }
        isSaving = true
        session.setLookingForGender(lookingFor)
        
        let updated = User(
            id: user.id,
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            email: user.email,
            gender: gender,
            clan: clan,
            tier: user.tier,
            shortlistedIds: user.shortlistedIds,
            unlockedIds: user.unlockedIds,
            gotra: gotra.trimmingCharacters(in: .whitespacesAndNewlines),
            motherGotra: motherGotra.trimmingCharacters(in: .whitespacesAndNewlines),
            thikana: thikana.trimmingCharacters(in: .whitespacesAndNewlines),
            phone: phone.trimmingCharacters(in: .whitespacesAndNewlines),
            dob: dob.trimmingCharacters(in: .whitespacesAndNewlines),
            education: education.trimmingCharacters(in: .whitespacesAndNewlines),
            occupation: occupation.trimmingCharacters(in: .whitespacesAndNewlines),
            income: income.trimmingCharacters(in: .whitespacesAndNewlines),
            height: height.trimmingCharacters(in: .whitespacesAndNewlines),
            maritalStatus: maritalStatus,
            profilePic: user.profilePic,
            isNewUser: user.isNewUser,
            about: about,
            location: location.trimmingCharacters(in: .whitespacesAndNewlines),
            rashi: rashi == "Select Rashi" ? "" : rashi,
            manglik: manglik,
            expectations: expectations,
            instagram: instagram.trimmingCharacters(in: .whitespacesAndNewlines),
            facebook: facebook.trimmingCharacters(in: .whitespacesAndNewlines),
            biodataUrl: biodataUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        
        session.updateCurrentUser(updated: updated)
        
        SupabaseClient.shared.updateProfile(user: updated) { success in
            DispatchQueue.main.async {
                self.isSaving = false
                self.savedToastMessage = success ? "Profile & Preferences Saved Successfully!" : "Profile Saved Locally"
                withAnimation {
                    self.showSavedToast = true
                }
                
                #if canImport(UIKit)
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(success ? .success : .warning)
                #endif
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                    withAnimation {
                        self.showSavedToast = false
                    }
                }
            }
        }
    }
}
