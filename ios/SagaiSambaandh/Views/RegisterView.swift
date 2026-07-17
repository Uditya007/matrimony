import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var showingRegister: Bool
    @Binding var isGuestBypassed: Bool
    
    @State private var step: Int = 1
    
    // Step 1: Personal Info
    @State private var nameInput: String = ""
    @State private var emailInput: String = ""
    @State private var passwordInput: String = ""
    @State private var phoneInput: String = ""
    @State private var dobInput: String = ""
    @State private var ageInput: String = "24"
    @State private var genderInput: String = "Bride"
    
    // Step 2: Lineage Details
    @State private var selectedClan: String = "Rathore"
    @State private var gotraInput: String = ""
    @State private var motherGotraInput: String = ""
    @State private var kulInput: String = ""
    @State private var thikanaInput: String = ""
    
    // Step 3: Professional Info
    @State private var educationInput: String = ""
    @State private var occupationInput: String = ""
    @State private var incomeInput: String = ""
    @State private var heightInput: String = ""
    @State private var maritalStatusInput: String = "Never Married"
    
    private let clansOptions = ["Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat", "Panwar", "Tanwar", "Hada", "Sodha"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Elegant Indigo Header with Logo Medallion
            ZStack(alignment: .bottom) {
                LinearGradient(
                    colors: [.deepMaroon, .royalMaroon],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 180)
                
                VStack(spacing: 12) {
                    // Centered Medallion Logo
                    ZStack {
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [.royalGold, .lightGold, .royalGold],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 2
                            )
                            .frame(width: 72, height: 72)
                        
                        Group {
                            if let img = UIImage(named: "logo") {
                                Image(uiImage: img)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            } else if let appIcon = UIImage(named: "appicon") {
                                Image(uiImage: appIcon)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            } else {
                                Image(systemName: "shield.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(.lightGold)
                            }
                        }
                        .frame(width: 64, height: 64)
                        .clipShape(Circle())
                    }
                    .shadow(radius: 3)
                    .padding(.top, 10)
                    
                    Spacer()
                }
                
                PalaceDivider(fillColor: .deepMaroon)
            }
            
            ScrollView {
                VStack(spacing: 24) {
                    // Step indicators
                    HStack(spacing: 8) {
                        StepIndicator(step: 1, currentStep: step)
                        StepIndicator(step: 2, currentStep: step)
                        StepIndicator(step: 3, currentStep: step)
                    }
                    .padding(.top, 10)
                    
                    if step == 1 {
                        stepOneView
                    } else if step == 2 {
                        stepTwoView
                    } else {
                        stepThreeView
                    }
                }
                .padding(24)
            }
            Spacer()
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
        .navigationBarHidden(true)
    }
    
    // STEP 1 Layout: Personal Info
    private var stepOneView: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Noble Registration")
                    .font(BrandFonts.displayBold(size: 26))
                    .foregroundColor(.lightGold)
                Text("Create your premium matrimonial lineage record")
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(.sandstoneIvory.opacity(0.7))
            }
            
            VStack(spacing: 16) {
                // Name
                VStack(alignment: .leading, spacing: 6) {
                    Text("FULL NAME (KUNWAR/BANNISA)")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. Vikramaditya Singh", text: $nameInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Email
                VStack(alignment: .leading, spacing: 6) {
                    Text("ROYAL CONTACT EMAIL")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. contact@clan.com", text: $emailInput)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Password
                VStack(alignment: .leading, spacing: 6) {
                    Text("PASSWORD")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    SecureField("Enter secure password", text: $passwordInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Phone Number
                VStack(alignment: .leading, spacing: 6) {
                    Text("MOBILE PHONE NUMBER")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. +91 9928592159", text: $phoneInput)
                        .keyboardType(.phonePad)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Date of Birth
                VStack(alignment: .leading, spacing: 6) {
                    Text("DATE OF BIRTH")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. DD-MM-YYYY", text: $dobInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Gender Picker
                VStack(alignment: .leading, spacing: 6) {
                    Text("GENDER")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    Picker("Gender", selection: $genderInput) {
                        Text("Noble Bride (Ladi)").tag("Bride")
                        Text("Noble Groom (Lada)").tag("Groom")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            
            Button(action: { step = 2 }) {
                Text("Continue to Lineage")
                    .font(BrandFonts.body(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.royalMaroon)
                    .cornerRadius(8)
            }
            .padding(.top, 10)
            
            Button(action: { showingRegister = false }) {
                HStack {
                    Text("Already have a lineage record?")
                        .font(BrandFonts.body(size: 12))
                        .foregroundColor(.gray)
                    Text("Log In here")
                        .font(BrandFonts.body(size: 12, weight: .bold))
                        .foregroundColor(.royalMaroon)
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.top, 5)
        }
    }
    
    // STEP 2 Layout: Lineage Details
    private var stepTwoView: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Noble Lineage & Gotra")
                    .font(BrandFonts.displayBold(size: 26))
                    .foregroundColor(.royalMaroon)
                Text("Enter ancestral thikana details for verification")
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(.gray)
            }
            
            VStack(spacing: 16) {
                // Clan Selection Picker
                VStack(alignment: .leading, spacing: 6) {
                    Text("RAJPUT CLAN")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    Picker("Select Clan", selection: $selectedClan) {
                        ForEach(clansOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(8)
                    .background(Color.cardBackground)
                    .cornerRadius(8)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Gotra
                // Gotra
                VStack(alignment: .leading, spacing: 6) {
                    Text("GOTRA (ANCESTRAL RISHI)")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. Gautam / Atri / Vatsa", text: $gotraInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }

                // Mother's Gotra
                VStack(alignment: .leading, spacing: 6) {
                    Text("MOTHER'S GOTRA")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. Kashyap / Vyas / Gautam", text: $motherGotraInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Thikana
                VStack(alignment: .leading, spacing: 6) {
                    Text("THIKANA (NOBLE ESTATE / NATIVE VILLAGE)")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. Rohet (Jodhpur)", text: $thikanaInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
            }
            
            HStack(spacing: 15) {
                Button(action: { step = 1 }) {
                    Text("Back")
                        .font(BrandFonts.body(size: 14, weight: .bold))
                        .foregroundColor(.royalMaroon)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.royalMaroon, lineWidth: 1))
                }
                
                Button(action: { step = 3 }) {
                    Text("Continue")
                        .font(BrandFonts.body(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.royalMaroon)
                        .cornerRadius(8)
                }
            }
            .padding(.top, 10)
        }
    }
    
    // STEP 3 Layout: Professional Info
    private var stepThreeView: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Professional Details")
                    .font(BrandFonts.displayBold(size: 26))
                    .foregroundColor(.royalMaroon)
                Text("Complete noble credentials to record profile")
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(.gray)
            }
            
            VStack(spacing: 16) {
                // Education
                VStack(alignment: .leading, spacing: 6) {
                    Text("HIGHEST DEGREE / EDUCATION")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. MBA - IIM Ahmedabad", text: $educationInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Occupation
                VStack(alignment: .leading, spacing: 6) {
                    Text("OCCUPATION / PROFESSION")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. Co-Founder, resorts venture", text: $occupationInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Annual Income
                VStack(alignment: .leading, spacing: 6) {
                    Text("ANNUAL INCOME")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. 15-20 Lakhs per annum", text: $incomeInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Height
                VStack(alignment: .leading, spacing: 6) {
                    Text("HEIGHT")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. 5 ft 8 in / 173 cm", text: $heightInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
                
                // Marital Status
                VStack(alignment: .leading, spacing: 6) {
                    Text("MARITAL STATUS")
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.gray)
                    TextField("e.g. Never Married / Divorced", text: $maritalStatusInput)
                        .padding(12)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                }
            }
            
            HStack(spacing: 15) {
                Button(action: { step = 2 }) {
                    Text("Back")
                        .font(BrandFonts.body(size: 14, weight: .bold))
                        .foregroundColor(.royalMaroon)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cardBackground)
                        .cornerRadius(8)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.royalMaroon, lineWidth: 1))
                }
                
                Button(action: handleRegister) {
                    Text("Complete Seal")
                        .font(BrandFonts.body(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.royalMaroon)
                        .cornerRadius(8)
                }
            }
            .padding(.top, 10)
        }
    }
    
    private func handleRegister() {
        let tempId = "U\(Int.random(in: 100...999))"
        let newUser = User(
            id: tempId,
            name: nameInput.isEmpty ? "Kunwar" : nameInput,
            email: emailInput.isEmpty ? "noble@clan.com" : emailInput,
            gender: genderInput == "Bride" ? "Bride" : "Groom",
            clan: selectedClan,
            tier: "Starter",
            shortlistedIds: [],
            unlockedIds: [],
            gotra: gotraInput,
            motherGotra: motherGotraInput,
            thikana: thikanaInput,
            phone: phoneInput,
            dob: dobInput,
            education: educationInput,
            occupation: occupationInput,
            income: incomeInput,
            height: heightInput,
            maritalStatus: maritalStatusInput
        )
        
        let pwd = passwordInput.isEmpty ? "12345" : passwordInput
        
        SupabaseClient.shared.signUp(email: newUser.email, password: pwd, profile: newUser) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let registeredUser):
                    withAnimation(.easeOut(duration: 0.4)) {
                        session.login(user: registeredUser)
                        isGuestBypassed = true
                    }
                case .failure(let error):
                    print("Supabase register error: \(error.localizedDescription)")
                    // fallback to keep app running during offline testing
                    withAnimation(.easeOut(duration: 0.4)) {
                        session.login(user: newUser)
                        isGuestBypassed = true
                    }
                }
            }
        }
    }
}

struct StepIndicator: View {
    let step: Int
    let currentStep: Int
    
    var body: some View {
        Circle()
            .fill(currentStep >= step ? Color.royalMaroon : Color.gray.opacity(0.2))
            .frame(width: 24, height: 24)
            .overlay(
                Text("\(step)")
                    .font(BrandFonts.body(size: 10, weight: .bold))
                    .foregroundColor(currentStep >= step ? .white : .gray)
            )
        
        if step < 3 {
            RoundedRectangle(cornerRadius: 2)
                .fill(currentStep > step ? Color.royalMaroon : Color.gray.opacity(0.2))
                .frame(width: 30, height: 3)
        }
    }
}
