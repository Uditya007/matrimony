import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var isGuestBypassed: Bool
    
    // Form fields state
    @State private var gotraInput: String = ""
    @State private var motherGotraInput: String = ""
    @State private var thikanaInput: String = ""
    @State private var phoneInput: String = ""
    @State private var dobInput: String = "19-10-1996"
    @State private var educationInput: String = ""
    @State private var occupationInput: String = ""
    @State private var incomeInput: String = ""
    @State private var heightInput: String = "5 ft 8 in"
    @State private var selectedGender: String = "Groom"
    @State private var selectedClan: String = "Rathore"
    
    @State private var isSaving: Bool = false
    @State private var errorMessage: String? = nil
    
    let clans = ["Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat"]
    let heights = ["5 ft 0 in", "5 ft 2 in", "5 ft 4 in", "5 ft 6 in", "5 ft 8 in", "5 ft 10 in", "6 ft 0 in", "6 ft 2 in"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header Card
                    VStack(spacing: 8) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.royalGold)
                        
                        Text("Complete Your Noble Profile")
                            .font(BrandFonts.displayBold(size: 24))
                            .foregroundColor(.lightGold)
                            .multilineTextAlignment(.center)
                        
                        Text("Please provide your lineage and credentials to access matchmaking.")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .padding(.vertical, 20)
                    
                    if let err = errorMessage {
                        Text(err)
                            .font(BrandFonts.bodyBold(size: 13))
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                    }
                    
                    // Form Card
                    VStack(alignment: .leading, spacing: 20) {
                        // Gender Selection
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Gender")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            
                            Picker("Gender", selection: $selectedGender) {
                                Text("Groom (Kunwar)").tag("Groom")
                                Text("Bride (Bannisa)").tag("Bride")
                            }
                            .pickerStyle(SegmentedPickerStyle())
                        }
                        
                        // Clan Selection
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Clan / Kul")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            
                            Picker("Clan", selection: $selectedClan) {
                                ForEach(clans, id: \.self) { clan in
                                    Text(clan).tag(clan)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                            .background(Color.cardBackground.opacity(0.1))
                            .cornerRadius(8)
                        }
                        
                        // Gotras
                        HStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Father Gotra")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                TextField("e.g. Kashyap", text: $gotraInput)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .foregroundColor(.black)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Mother Gotra")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                TextField("e.g. Chauhan", text: $motherGotraInput)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .foregroundColor(.black)
                            }
                        }
                        
                        // Thikana & Phone
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Native Thikana (Ancestral Place)")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            TextField("e.g. Rohet, Jodhpur", text: $thikanaInput)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .foregroundColor(.black)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Phone Number")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            TextField("e.g. +91 98765 43210", text: $phoneInput)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.phonePad)
                                .foregroundColor(.black)
                        }
                        
                        // Qualifications
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Education / Qualification")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            TextField("e.g. MBA, B.Tech IIT", text: $educationInput)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .foregroundColor(.black)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Occupation / Profession")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            TextField("e.g. Software Engineer, Business", text: $occupationInput)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .foregroundColor(.black)
                        }
                        
                        HStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Annual Income")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                TextField("e.g. ₹15 Lakhs/Yr", text: $incomeInput)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .foregroundColor(.black)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Height")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                Picker("Height", selection: $heightInput) {
                                    ForEach(heights, id: \.self) { h in
                                        Text(h).tag(h)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(8)
                                .background(Color.cardBackground.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                    }
                    .padding(20)
                    .background(Color.deepMaroon)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.royalGold.opacity(0.2), lineWidth: 1.5))
                    .padding(.horizontal, 16)
                    
                    // Submit Button
                    Button(action: saveProfile) {
                        HStack {
                            if isSaving {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .deepMaroon))
                            } else {
                                Text("Establish Lineage")
                                    .font(BrandFonts.displayBold(size: 16))
                            }
                        }
                        .foregroundColor(.deepMaroon)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.royalGold)
                        .cornerRadius(12)
                        .shadow(color: Color.royalGold.opacity(0.3), radius: 6, x: 0, y: 3)
                    }
                    .disabled(isSaving)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 40)
                }
            }
            .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
            .navigationBarHidden(true)
        }
        .onAppear {
            // Load existing fields if user has prefilled values
            if let user = session.currentUser {
                selectedGender = user.gender
                selectedClan = user.clan
                gotraInput = user.gotra
                motherGotraInput = user.motherGotra
                thikanaInput = user.thikana
                phoneInput = user.phone
                educationInput = user.education
                occupationInput = user.occupation
                incomeInput = user.income
                heightInput = user.height.isEmpty ? "5 ft 8 in" : user.height
            }
        }
    }
    
    private func saveProfile() {
        guard !gotraInput.isEmpty, !motherGotraInput.isEmpty, !thikanaInput.isEmpty, !phoneInput.isEmpty else {
            errorMessage = "Please fill in all lineage and contact details."
            return
        }
        
        guard let currentUser = session.currentUser else { return }
        isSaving = true
        errorMessage = nil
        
        let updatedUser = User(
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            gender: selectedGender,
            clan: selectedClan,
            tier: currentUser.tier,
            shortlistedIds: currentUser.shortlistedIds,
            unlockedIds: currentUser.unlockedIds,
            gotra: gotraInput,
            motherGotra: motherGotraInput,
            thikana: thikanaInput,
            phone: phoneInput,
            dob: dobInput,
            education: educationInput,
            occupation: occupationInput,
            income: incomeInput,
            height: heightInput,
            maritalStatus: "Never Married",
            profilePic: currentUser.profilePic ?? (selectedGender == "Groom" ? "groom_ranveer" : "bride_aishwarya")
        )
        
        // Save to Supabase
        SupabaseClient.shared.insertProfile(profile: updatedUser) { result in
            DispatchQueue.main.async {
                self.isSaving = false
                switch result {
                case .success:
                    // Successfully inserted or updated. Save locally and bypass onboarding!
                    self.session.updateCurrentUser(updated: updatedUser)
                    self.isGuestBypassed = true
                case .failure(let err):
                    // Even if database call fails, allow local update during offline testing
                    print("Supabase profile save error: \(err.localizedDescription)")
                    self.session.updateCurrentUser(updated: updatedUser)
                    self.isGuestBypassed = true
                }
            }
        }
    }
}
