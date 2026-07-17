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
    @State private var maritalStatus: String = ""
    @State private var showingAvatarChooser: Bool = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header description
                    Text("Keep your Gotra, Thikana, and Clan details audited and updated.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(.sandstoneIvory.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // Current Avatar Selection View
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
                        // Section 1: Personal Info
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader("PERSONAL INFORMATION")
                            profileTextField(label: "FULL NAME", text: $name)
                            profileTextField(label: "PHONE NUMBER", text: $phone)
                            
                            HStack(spacing: 15) {
                                profileTextField(label: "DATE OF BIRTH", text: $dob)
                                profileTextField(label: "HEIGHT", text: $height)
                            }
                        }
                        
                        Divider().background(Color.royalGold.opacity(0.2))
                        
                        // Section 2: Heritage & Clan
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader("HERITAGE & CLAN AUDIT")
                            
                            HStack(spacing: 15) {
                                profileTextField(label: "RAJPUT CLAN", text: $clan)
                                profileTextField(label: "THIKANA (SEAT)", text: $thikana)
                            }
                            
                            HStack(spacing: 15) {
                                profileTextField(label: "PATERNAL GOTRA", text: $gotra)
                                profileTextField(label: "MATERNAL GOTRA", text: $motherGotra)
                            }
                        }
                        
                        Divider().background(Color.royalGold.opacity(0.2))
                        
                        // Section 3: Education & Career
                        VStack(alignment: .leading, spacing: 12) {
                            sectionHeader("EDUCATION & CAREER")
                            profileTextField(label: "HIGHEST EDUCATION", text: $education)
                            profileTextField(label: "OCCUPATION / BUSINESS", text: $occupation)
                            profileTextField(label: "ANNUAL INCOME", text: $income)
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
        maritalStatus = user.maritalStatus
    }
    
    private func saveProfileCard() {
        guard let user = session.currentUser else { return }
        let updated = User(
            id: user.id,
            name: name,
            email: user.email,
            gender: user.gender,
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
            maritalStatus: maritalStatus
        )
        session.updateCurrentUser(updated: updated)
        presentationMode.wrappedValue.dismiss()
    }
}
