import SwiftUI
import UIKit

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
    
    // Gallery & Camera Photo Pickers
    @State private var showingPhotoActionSheet: Bool = false
    @State private var showingImagePicker: Bool = false
    @State private var pickerSourceType: UIImagePickerController.SourceType = .photoLibrary
    
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
            // Dismiss keyboard when tapping on background
            Color.appSurfaceElevated
                .edgesIgnoringSafeArea(.all)
                .onTapGesture {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                }
            
            VStack(spacing: 0) {
                // Top Custom Header Bar
                topHeaderBar
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 18) {
                        // 1. Hero Profile Header Card with Direct Phone Gallery Photo Picker
                        heroProfileCard
                        
                        // 2. Partner Preferences Showcase & Quick Editor
                        partnerPreferencesCard
                        
                        // 3. Lineage & Identity Section
                        lineageSection
                        
                        // 4. Astrological & Physical Attributes Section
                        astrologySection
                        
                        // 5. Professional & Contact Details Section
                        professionalSection
                        
                        // 6. Socials & Biodata Link Section
                        socialsSection
                        
                        // 7. Bio & Alignment Expectations Section
                        bioSection
                        
                        // 8. Save Changes Button
                        saveChangesButton
                        
                        // 9. Quick Actions (Biodata, Plans, Logout)
                        quickActionsFooter
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 16)
                }
                .scrollDismissesKeyboard(.immediately)
            }
            
            // Floating Success Notification Toast
            if showSavedToast {
                VStack {
                    Spacer()
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 18))
                            .foregroundColor(.white)
                        Text(savedToastMessage)
                            .font(BrandFonts.bodyBold(size: 14))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 22)
                    .padding(.vertical, 14)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.appSecondary],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(25)
                    .shadow(color: Color.appPrimary.opacity(0.35), radius: 10, y: 5)
                    .padding(.bottom, 24)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                .zIndex(20)
            }
        }
        .actionSheet(isPresented: $showingPhotoActionSheet) {
            var buttons: [ActionSheet.Button] = [
                .default(Text("Choose from Phone Gallery")) {
                    pickerSourceType = .photoLibrary
                    showingImagePicker = true
                }
            ]
            if UIImagePickerController.isSourceTypeAvailable(.camera) {
                buttons.append(.default(Text("Take Photo with Camera")) {
                    pickerSourceType = .camera
                    showingImagePicker = true
                })
            }
            buttons.append(.cancel())
            return ActionSheet(
                title: Text("Change Profile Picture"),
                message: Text("Select an authentic photo from your phone gallery to update your Rajput profile."),
                buttons: buttons
            )
        }
        .sheet(isPresented: $showingImagePicker) {
            PhoneGalleryPicker(sourceType: pickerSourceType, isPresented: $showingImagePicker) { image in
                self.handleGalleryPhotoPicked(image)
            }
        }
        .sheet(isPresented: $showingPartnerPreferencesSheet) {
            PartnerPreferencesView(selectedTab: selectedTab ?? .constant(0))
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
        .onAppear {
            #if canImport(UIKit)
            UITextView.appearance().backgroundColor = .clear
            #endif
            loadUserData()
        }
        .addKeyboardOkButton()
    }
    
    // MARK: - Photo Gallery Picker Handler
    private func handleGalleryPhotoPicked(_ image: UIImage) {
        guard var user = session.currentUser else { return }
        guard let base64Data = image.toBase64Jpeg(maxDimension: 600, compressionQuality: 0.75) else { return }
        
        user.profilePic = base64Data
        session.updateCurrentUser(updated: user)
        
        SupabaseClient.shared.updateProfile(user: user) { success in
            DispatchQueue.main.async {
                self.savedToastMessage = success ? "Profile picture updated from Gallery!" : "Photo updated locally"
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
    
    // MARK: - Top Header Bar
    private var topHeaderBar: some View {
        HStack {
            if let isSideMenuOpen = isSideMenuOpen {
                Button(action: {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                    withAnimation {
                        isSideMenuOpen.wrappedValue = true
                    }
                }) {
                    Image(systemName: "line.horizontal.3")
                        .foregroundColor(Color.appTextPrimary)
                        .font(.title2)
                        .frame(width: 40, height: 40)
                        .background(Color.appCardBackground)
                        .clipShape(Circle())
                }
            } else if selectedTab == nil {
                Button(action: {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Close")
                        .font(BrandFonts.bodyBold(size: 15))
                        .foregroundColor(Color.appPrimary)
                }
            } else {
                Color.clear.frame(width: 40, height: 40)
            }
            
            Spacer()
            
            HStack(spacing: 6) {
                Image(systemName: "person.crop.circle.fill")
                    .foregroundColor(Color.appPrimary)
                    .font(.system(size: 16))
                Text("My Profile")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(Color.appTextPrimary)
            }
            
            Spacer()
            
            Button(action: saveProfileCard) {
                if isSaving {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Color.appPrimary))
                        .frame(width: 40, height: 40)
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                        Text("Save")
                            .font(BrandFonts.bodyBold(size: 14))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.appSecondary],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(16)
                    .shadow(color: Color.appPrimary.opacity(0.25), radius: 4, y: 2)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .background(Color.white)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color.appBorder),
            alignment: .bottom
        )
    }
    
    // MARK: - Hero Profile Card (Tap Avatar to Open Phone Gallery)
    private var heroProfileCard: some View {
        VStack(spacing: 14) {
            ZStack(alignment: .bottomTrailing) {
                Button(action: {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                    showingPhotoActionSheet = true
                }) {
                    AvatarImageView(
                        imageSource: session.currentUser?.profilePic,
                        name: session.currentUser?.name ?? "Member",
                        clan: session.currentUser?.clan ?? "",
                        contentMode: .fill,
                        fallbackFontSize: 32
                    )
                    .frame(width: 96, height: 96)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.royalGold, lineWidth: 2.5))
                    .shadow(color: Color.black.opacity(0.08), radius: 8, y: 4)
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                    showingPhotoActionSheet = true
                }) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 30, height: 30)
                        .background(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.appSecondary],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.white, lineWidth: 2.2))
                        .shadow(color: Color.black.opacity(0.15), radius: 3, y: 1)
                }
            }
            
            VStack(spacing: 5) {
                Text(session.currentUser?.name.isEmpty == false ? (session.currentUser?.name ?? "Rajput Member") : "Rajput Member")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(Color.appTextPrimary)
                
                HStack(spacing: 8) {
                    if let clan = session.currentUser?.clan, !clan.isEmpty {
                        Text(clan)
                            .font(BrandFonts.body(size: 13, weight: .bold))
                            .foregroundColor(Color.appPrimary)
                    }
                    if let gotra = session.currentUser?.gotra, !gotra.isEmpty {
                        Text("•  \(gotra) Gotra")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(Color.appTextSecondary)
                    }
                }
                
                Button(action: {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                    showingPhotoActionSheet = true
                }) {
                    HStack(spacing: 5) {
                        Image(systemName: "photo.badge.plus")
                            .font(.system(size: 11))
                        Text("Change Photo from Phone Gallery")
                            .font(BrandFonts.bodyBold(size: 12))
                    }
                    .foregroundColor(Color.appPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 5)
                    .background(Color.appPrimary.opacity(0.08))
                    .cornerRadius(12)
                }
                .padding(.top, 4)
                
                HStack(spacing: 8) {
                    // Verified Badge
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 11))
                            .foregroundColor(Color.verifiedBlue)
                        Text("Verified Profile")
                            .font(BrandFonts.label(size: 10, weight: .bold))
                            .foregroundColor(Color.verifiedBlue)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.verifiedBlue.opacity(0.1))
                    .cornerRadius(12)
                    
                    // Tier Badge
                    HStack(spacing: 4) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color.starGold)
                        Text(session.currentUser?.tier ?? "Starter")
                            .font(BrandFonts.label(size: 10, weight: .bold))
                            .foregroundColor(Color.starGold)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.starGold.opacity(0.12))
                    .cornerRadius(12)
                }
                .padding(.top, 2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.03), radius: 6, y: 2)
    }
    
    // MARK: - Partner Preferences Card
    private var partnerPreferencesCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "heart.text.square.fill")
                        .foregroundColor(Color.appPrimary)
                        .font(.system(size: 18))
                    Text("PARTNER PREFERENCES")
                        .font(BrandFonts.label(size: 11, weight: .bold))
                        .foregroundColor(Color.appTextPrimary)
                        .tracking(0.8)
                }
                
                Spacer()
                
                Button(action: {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                    showingPartnerPreferencesSheet = true
                }) {
                    HStack(spacing: 4) {
                        Text("Edit Criteria")
                            .font(BrandFonts.bodyBold(size: 12))
                        Image(systemName: "pencil")
                            .font(.system(size: 11))
                    }
                    .foregroundColor(Color.appPrimary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.appPrimary.opacity(0.1))
                    .cornerRadius(10)
                }
            }
            
            Text("Criteria used to recommend brides and grooms in Discover:")
                .font(BrandFonts.body(size: 12))
                .foregroundColor(Color.appTextSecondary)
            
            // Quick Segment Switcher
            VStack(alignment: .leading, spacing: 6) {
                Text("LOOKING FOR IN DISCOVER")
                    .font(BrandFonts.label(size: 9, weight: .bold))
                    .foregroundColor(Color.appTextSecondary)
                
                Picker("Looking For", selection: $lookingFor) {
                    Text("👰 Vadhu (Bride)").tag("Bride")
                    Text("🤵 Var (Groom)").tag("Groom")
                }
                .pickerStyle(SegmentedPickerStyle())
                .onChange(of: lookingFor) { newPref in
                    session.setLookingForGender(newPref)
                }
            }
            
            // Current Preferences Badges
            HStack(spacing: 8) {
                prefBadge(title: "Seeking", value: lookingFor)
                prefBadge(title: "Clan", value: session.searchClan)
                prefBadge(title: "Status", value: "Verified Only")
            }
            
            Button(action: {
                #if canImport(UIKit)
                UIApplication.shared.endEditing()
                #endif
                showingPartnerPreferencesSheet = true
            }) {
                HStack {
                    Image(systemName: "slider.horizontal.3")
                        .foregroundColor(Color.appPrimary)
                    Text("Configure Age, Clan, Manglik & City")
                        .font(BrandFonts.bodyBold(size: 12.5))
                        .foregroundColor(Color.appTextPrimary)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundColor(Color.appTextMuted)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(Color.appCardBackground)
                .cornerRadius(10)
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.03), radius: 6, y: 2)
    }
    
    private func prefBadge(title: String, value: String) -> some View {
        VStack(spacing: 2) {
            Text(title)
                .font(BrandFonts.label(size: 8))
                .foregroundColor(Color.appTextMuted)
            Text(value)
                .font(BrandFonts.bodyBold(size: 11))
                .foregroundColor(Color.appTextPrimary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 7)
        .padding(.horizontal, 4)
        .background(Color.appCardBackground)
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
                        .foregroundColor(Color.appTextSecondary)
                    Picker("Gender", selection: $gender) {
                        ForEach(genderOptions, id: \.self) { opt in
                            Text(opt == "Groom" ? "🤵 Groom" : "👰 Bride").tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.appCardBackground)
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
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
                        .foregroundColor(Color.appTextSecondary)
                    Picker("Clan", selection: $clan) {
                        ForEach(clansOptions, id: \.self) { opt in
                            Text(opt).tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.appCardBackground)
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
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
                        .foregroundColor(Color.appTextSecondary)
                    Picker("Rashi", selection: $rashi) {
                        ForEach(rashiOptions, id: \.self) { opt in
                            Text(opt).tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.appCardBackground)
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
                }
            }
            
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("MANGLIK STATUS")
                        .font(BrandFonts.label(size: 9, weight: .bold))
                        .foregroundColor(Color.appTextSecondary)
                    Picker("Manglik", selection: $manglik) {
                        ForEach(manglikOptions, id: \.self) { opt in
                            Text(opt).tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.appCardBackground)
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("MARITAL STATUS")
                        .font(BrandFonts.label(size: 9, weight: .bold))
                        .foregroundColor(Color.appTextSecondary)
                    Picker("Marital Status", selection: $maritalStatus) {
                        ForEach(maritalOptions, id: \.self) { opt in
                            Text(opt).tag(opt)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.appCardBackground)
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
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
                    .foregroundColor(Color.appTextSecondary)
                
                TextEditor(text: $about)
                    .font(BrandFonts.body(size: 14))
                    .foregroundColor(Color.appTextPrimary)
                    .frame(height: 80)
                    .padding(8)
                    .background(Color.appCardBackground)
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text("PARTNER EXPECTATIONS (जीवनसाथी से अपेक्षाएं)")
                    .font(BrandFonts.label(size: 9, weight: .bold))
                    .foregroundColor(Color.appTextSecondary)
                
                TextEditor(text: $expectations)
                    .font(BrandFonts.body(size: 14))
                    .foregroundColor(Color.appTextPrimary)
                    .frame(height: 80)
                    .padding(8)
                    .background(Color.appCardBackground)
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
            }
        }
    }
    
    // MARK: - Save Changes Button
    private var saveChangesButton: some View {
        Button(action: saveProfileCard) {
            HStack(spacing: 8) {
                if isSaving {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    Text("Saving Profile Changes...")
                        .font(BrandFonts.bodyBold(size: 16))
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 18))
                    Text("Save All Profile Changes")
                        .font(BrandFonts.bodyBold(size: 16))
                }
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(
                LinearGradient(
                    colors: [Color.appPrimary, Color.appSecondary],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(14)
            .shadow(color: Color.appPrimary.opacity(0.3), radius: 8, y: 4)
        }
        .padding(.top, 4)
    }
    
    // MARK: - Quick Actions Footer
    private var quickActionsFooter: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                // View Biodata Card
                Button(action: {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                    showingBiodataSheet = true
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.down.doc.fill")
                            .font(.system(size: 13))
                        Text("View Biodata")
                            .font(BrandFonts.bodyBold(size: 13))
                    }
                    .foregroundColor(Color.appTextPrimary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color.white)
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
                }
                
                // Upgrade to Premium
                Button(action: {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
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
                    .foregroundColor(Color.starGold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color.starGold.opacity(0.12))
                    .cornerRadius(10)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.starGold.opacity(0.3), lineWidth: 1))
                }
            }
            
            // Log Out Button
            Button(action: {
                #if canImport(UIKit)
                UIApplication.shared.endEditing()
                #endif
                showingLogoutAlert = true
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 13))
                    Text("Log Out")
                        .font(BrandFonts.body(size: 13, weight: .semibold))
                }
                .foregroundColor(Color.dislikeRed)
                .padding(.vertical, 8)
            }
        }
        .padding(.top, 6)
        .padding(.bottom, 24)
    }
    
    // MARK: - Helper Views & Containers
    private func sectionContainer<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundColor(Color.appPrimary)
                    .font(.system(size: 14))
                Text(title)
                    .font(BrandFonts.label(size: 10, weight: .bold))
                    .foregroundColor(Color.appTextPrimary)
                    .tracking(0.6)
            }
            
            content()
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.03), radius: 6, y: 2)
    }
    
    private func profileTextField(label: String, text: Binding<String>, placeholder: String = "") -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(BrandFonts.label(size: 9, weight: .bold))
                .foregroundColor(Color.appTextSecondary)
            
            TextField(placeholder, text: text)
                .font(BrandFonts.body(size: 14))
                .foregroundColor(Color.appTextPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.appCardBackground)
                .cornerRadius(10)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
                .submitLabel(.done)
                .onSubmit {
                    #if canImport(UIKit)
                    UIApplication.shared.endEditing()
                    #endif
                }
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
        #if canImport(UIKit)
        UIApplication.shared.endEditing()
        #endif
        
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
