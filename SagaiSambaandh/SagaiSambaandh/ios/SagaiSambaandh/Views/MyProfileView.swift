import SwiftUI

struct MyProfileView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    
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
    
    @State private var showingAvatarChooser: Bool = false
    
    private let clansOptions = ["Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat", "Panwar", "Tanwar", "Hada", "Sodha"]
    private let manglikOptions = ["Non-Manglik", "Manglik", "Anshik Manglik"]
    private let maritalOptions = ["Never Married", "Separated", "Divorced", "Widowed"]
    private let genderOptions = ["Bride", "Groom"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    Text("Keep your traditional Rajput lineage credentials and specifications updated.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(.sandstoneIvory.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // Portrait Selection
                    VStack(spacing: 8) {
                        if let pic = session.currentUser?.profilePic, !pic.isEmpty {
                            if pic.contains("http") {
                                AsyncImage(url: URL(string: pic)) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image.resizable()
                                             .aspectRatio(contentMode: .fill)
                                             .frame(width: 80, height: 80)
                                             .clipShape(Circle())
                                    default:
                                        Image(systemName: "person.crop.circle.fill")
                                            .resizable()
                                            .aspectRatio(contentMode: .fit)
                                            .frame(width: 80, height: 80)
                                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                                    }
                                }
                            } else {
                                Image(pic)
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 80, height: 80)
                                    .clipShape(Circle())
                            }
                        } else {
                            Image(systemName: "person.crop.circle.fill")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 80, height: 80)
                                .foregroundColor(.sandstoneIvory.opacity(0.8))
                        }
                        
                        Button("Change Portrait") {
                            showingAvatarChooser = true
                        }
                        .font(BrandFonts.bodyBold(size: 13))
                        .foregroundColor(.lightGold)
                    }
                    .sheet(isPresented: $showingAvatarChooser) {
                        AvatarSelectionView()
                            .environmentObject(session)
                    }
                    
                    VStack(alignment: .leading, spacing: 20) {
                        // SECTION 1: LINEAGE & PERSONAL
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader("TRADITIONAL RAJPUT LINEAGE")
                            profileTextField(label: "FULL NAME", text: $name)
                            
                            HStack(spacing: 15) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("GENDER")
                                        .font(BrandFonts.label(size: 8))
                                        .foregroundColor(.sandstoneIvory.opacity(0.8))
                                        .fontWeight(.bold)
                                    Picker("Gender", selection: $gender) {
                                        ForEach(genderOptions, id: \.self) { opt in
                                            Text(opt).tag(opt)
                                        }
                                    }
                                    .pickerStyle(MenuPickerStyle())
                                    .padding(.vertical, 4)
                                    .frame(maxWidth: .infinity)
                                    .background(Color.white)
                                    .cornerRadius(6)
                                }
                                
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("RAJPUT CLAN")
                                        .font(BrandFonts.label(size: 8))
                                        .foregroundColor(.sandstoneIvory.opacity(0.8))
                                        .fontWeight(.bold)
                                    Picker("Clan", selection: $clan) {
                                        ForEach(clansOptions, id: \.self) { opt in
                                            Text(opt).tag(opt)
                                        }
                                    }
                                    .pickerStyle(MenuPickerStyle())
                                    .padding(.vertical, 4)
                                    .frame(maxWidth: .infinity)
                                    .background(Color.white)
                                    .cornerRadius(6)
                                }
                            }
                            
                            HStack(spacing: 15) {
                                profileTextField(label: "PATERNAL GOTRA", text: $gotra)
                                profileTextField(label: "MATERNAL GOTRA", text: $motherGotra)
                            }
                            
                            profileTextField(label: "THIKANA (ANCESTRAL NATIVE HOUSE)", text: $thikana)
                        }
                        
                        Divider().background(Color.royalGold.opacity(0.2))
                        
                        // SECTION 2: SPECIFICATIONS & ASTRO
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader("PERSONAL SPECIFICATIONS & ASTROLOGICS")
                            
                            HStack(spacing: 15) {
                                profileTextField(label: "DATE OF BIRTH", text: $dob)
                                profileTextField(label: "HEIGHT", text: $height)
                            }
                            
                            HStack(spacing: 15) {
                                profileTextField(label: "ZODIAC / RASHI", text: $rashi)
                                
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("HOROSCOPE (MANGLIK)")
                                        .font(BrandFonts.label(size: 8))
                                        .foregroundColor(.sandstoneIvory.opacity(0.8))
                                        .fontWeight(.bold)
                                    Picker("Manglik", selection: $manglik) {
                                        ForEach(manglikOptions, id: \.self) { opt in
                                            Text(opt).tag(opt)
                                        }
                                    }
                                    .pickerStyle(MenuPickerStyle())
                                    .padding(.vertical, 4)
                                    .frame(maxWidth: .infinity)
                                    .background(Color.white)
                                    .cornerRadius(6)
                                }
                            }
                            
                            VStack(alignment: .leading, spacing: 6) {
                                Text("MARITAL STATUS")
                                    .font(BrandFonts.label(size: 8))
                                    .foregroundColor(.sandstoneIvory.opacity(0.8))
                                    .fontWeight(.bold)
                                Picker("Marital Status", selection: $maritalStatus) {
                                    ForEach(maritalOptions, id: \.self) { opt in
                                        Text(opt).tag(opt)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                                .padding(.vertical, 4)
                                .frame(maxWidth: .infinity)
                                .background(Color.white)
                                .cornerRadius(6)
                            }
                        }
                        
                        Divider().background(Color.royalGold.opacity(0.2))
                        
                        // SECTION 3: CAREER & CONTACT
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader("PROFESSIONAL & CONTACT")
                            profileTextField(label: "EDUCATIONAL QUALIFICATIONS", text: $education)
                            profileTextField(label: "OCCUPATION / DESIGNATION", text: $occupation)
                            
                            HStack(spacing: 15) {
                                profileTextField(label: "ANNUAL INCOME (LPA)", text: $income)
                                profileTextField(label: "MOBILE NUMBER", text: $phone)
                            }
                            
                            profileTextField(label: "CURRENT RESIDENT CITY & STATE", text: $location)
                        }
                        
                        Divider().background(Color.royalGold.opacity(0.2))
                        
                        // SECTION 4: SOCIALS & BIODATA
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader("SOCIAL LINKS & ANCESTRAL BIODATA")
                            profileTextField(label: "INSTAGRAM PROFILE / HANDLE", text: $instagram)
                            profileTextField(label: "FACEBOOK PROFILE LINK", text: $facebook)
                            profileTextField(label: "BIODATA PDF LINK", text: $biodataUrl)
                        }
                        
                        Divider().background(Color.royalGold.opacity(0.2))
                        
                        // SECTION 5: BIOGRAPHY & EXPECTATIONS
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader("BIOGRAPHY & ALIGNMENT EXPECTATIONS")
                            
                            Text("ABOUT ME (BIO)")
                                .font(BrandFonts.label(size: 8))
                                .foregroundColor(.sandstoneIvory.opacity(0.8))
                                .fontWeight(.bold)
                            TextEditor(text: $about)
                                .font(BrandFonts.body(size: 14))
                                .foregroundColor(.black)
                                .frame(height: 80)
                                .padding(6)
                                .background(Color.white)
                                .cornerRadius(6)
                            
                            Text("ALIGNMENT EXPECTATIONS")
                                .font(BrandFonts.label(size: 8))
                                .foregroundColor(.sandstoneIvory.opacity(0.8))
                                .fontWeight(.bold)
                            TextEditor(text: $expectations)
                                .font(BrandFonts.body(size: 14))
                                .foregroundColor(.black)
                                .frame(height: 80)
                                .padding(6)
                                .background(Color.white)
                                .cornerRadius(6)
                        }
                        
                        Spacer().frame(height: 20)
                        
                        // Save Button
                        Button(action: saveProfileCard) {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Save Profile Card")
                                    .font(BrandFonts.bodyBold(size: 15))
                            }
                            .foregroundColor(.deepMaroon)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(
                                LinearGradient(
                                    colors: [.royalGold, .lightGold, .royalGold],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(8)
                        }
                    }
                    .padding()
                    .background(Color.black.opacity(0.15))
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.royalGold.opacity(0.25), lineWidth: 1)
                    )
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
            .navigationBarTitle("My Rajput Lineage Card", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }.foregroundColor(.lightGold)
            )
            .onAppear(perform: loadUserData)
        }
    }
    
    private func sectionHeader(_ text: String) -> some View {
        Text(text)
            .font(BrandFonts.label(size: 10))
            .foregroundColor(.lightGold)
            .fontWeight(.bold)
            .tracking(1)
            .padding(.bottom, 4)
    }
    
    private func profileTextField(label: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(BrandFonts.label(size: 8))
                .foregroundColor(.sandstoneIvory.opacity(0.8))
                .fontWeight(.bold)
            
            TextField("", text: text)
                .font(BrandFonts.body(size: 14))
                .foregroundColor(.black)
                .padding(10)
                .background(Color.white)
                .cornerRadius(6)
        }
    }
    
    private func loadUserData() {
        guard let user = session.currentUser else { return }
        name = user.name
        clan = user.clan
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
        rashi = user.rashi
        manglik = user.manglik.isEmpty ? "Non-Manglik" : user.manglik
        expectations = user.expectations
        instagram = user.instagram
        facebook = user.facebook
        biodataUrl = user.biodataUrl
        about = user.about ?? ""
        gender = user.gender
    }
    
    private func saveProfileCard() {
        guard let user = session.currentUser else { return }
        let updated = User(
            id: user.id,
            name: name,
            email: user.email,
            gender: gender,
            clan: clan,
            tier: user.tier,
            shortlistedIds: user.shortlistedIds,
            unlockedIds: user.unlockedIds,
            gotra: gotra,
            motherGotra: motherGotra,
            thikana: thikana,
            phone: phone,
            dob: dob,
            education: education,
            occupation: occupation,
            income: income,
            height: height,
            maritalStatus: maritalStatus,
            profilePic: user.profilePic,
            isNewUser: user.isNewUser,
            about: about,
            location: location,
            rashi: rashi,
            manglik: manglik,
            expectations: expectations,
            instagram: instagram,
            facebook: facebook,
            biodataUrl: biodataUrl
        )
        session.updateCurrentUser(updated: updated)
        
        SupabaseClient.shared.updateProfile(user: updated) { success in
            if success {
                print("Profile updated successfully on Supabase!")
            } else {
                print("Failed to sync profile updates to Supabase.")
            }
        }
        
        presentationMode.wrappedValue.dismiss()
    }
}
