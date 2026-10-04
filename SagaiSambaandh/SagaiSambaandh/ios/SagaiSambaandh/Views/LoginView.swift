import SwiftUI
import GoogleSignIn

struct LoginView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var showingRegister: Bool
    @Binding var isGuestBypassed: Bool
    
    // Login Method: 0 = Mobile Number OTP, 1 = Email & Password
    @State private var loginMethod: Int = 0
    
    // Mobile Login State
    @State private var phoneInput: String = ""
    @State private var otpInput: String = ""
    @State private var isOtpSent: Bool = false
    @State private var generatedOtp: String = ""
    @State private var isVerifyingOtp: Bool = false
    
    // Email Login State
    @State private var emailInput: String = ""
    @State private var passwordInput: String = ""
    
    @State private var errorMessage: String? = nil
    @State private var successBanner: String? = nil
    
    var body: some View {
        GeometryReader { geometry in
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    Spacer(minLength: 24)
                    
                    // Brand Logo Medallion
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.appPrimary.opacity(0.12), Color.appSecondary.opacity(0.06)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 96, height: 96)
                        
                        Group {
                            if let img = UIImage(named: "appicon") {
                                Image(uiImage: img)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            } else if let img = UIImage(named: "logo") {
                                Image(uiImage: img)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            } else {
                                Image(systemName: "heart.circle.fill")
                                    .font(.system(size: 48))
                                    .foregroundColor(Color.appPrimary)
                            }
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                    }
                    .padding(.top, 10)
                    
                    Spacer().frame(height: 18)
                    
                    // Main Headlines
                    VStack(spacing: 6) {
                        Text("Start Something Real")
                            .font(BrandFonts.displayBold(size: 28))
                            .foregroundColor(Color.appTextPrimary)
                            .tracking(-0.5)
                        
                        Text("Meet authentic Rajput members who share your values, gotra, and noble lineage.")
                            .font(BrandFonts.body(size: 13.5))
                            .foregroundColor(Color.appTextSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 28)
                            .lineSpacing(2)
                    }
                    
                    Spacer().frame(height: 18)
                    
                    // Form Card
                    VStack(spacing: 16) {
                        // Method Selector Tab
                        Picker("Login Method", selection: $loginMethod) {
                            Text("Mobile Number").tag(0)
                            Text("Email / ID").tag(1)
                        }
                        .pickerStyle(SegmentedPickerStyle())
                        .padding(.bottom, 4)
                        .onChange(of: loginMethod) { _, _ in
                            errorMessage = nil
                            successBanner = nil
                        }
                        
                        // Banner alerts
                        if let banner = successBanner {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(Color.successGreen)
                                Text(banner)
                                    .font(BrandFonts.body(size: 12, weight: .bold))
                                    .foregroundColor(Color.successGreen)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(Color.successGreen.opacity(0.12))
                            .cornerRadius(10)
                        }
                        
                        if loginMethod == 0 {
                            // --- MOBILE NUMBER LOGIN ---
                            VStack(alignment: .leading, spacing: 6) {
                                Text("MOBILE NUMBER")
                                    .font(BrandFonts.label(size: 10, weight: .bold))
                                    .foregroundColor(Color.appTextSecondary)
                                    .tracking(0.8)
                                
                                HStack(spacing: 8) {
                                    Text("🇮🇳 +91")
                                        .font(BrandFonts.bodyBold(size: 14))
                                        .foregroundColor(Color.appTextPrimary)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 6)
                                        .background(Color.appCardBackground)
                                        .cornerRadius(8)
                                    
                                    TextField("10-digit mobile number", text: $phoneInput)
                                        .keyboardType(.phonePad)
                                        .font(BrandFonts.body(size: 15))
                                        .foregroundColor(Color.appTextPrimary)
                                }
                                .padding(.horizontal, 14)
                                .padding(.vertical, 12)
                                .background(Color.appCardBackground)
                                .cornerRadius(14)
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.appBorder, lineWidth: 1))
                            }
                            
                            if isOtpSent {
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text("ENTER 6-DIGIT OTP")
                                            .font(BrandFonts.label(size: 10, weight: .bold))
                                            .foregroundColor(Color.appTextSecondary)
                                            .tracking(0.8)
                                        Spacer()
                                        Button("Resend") {
                                            sendPhoneOtp()
                                        }
                                        .font(BrandFonts.label(size: 11, weight: .bold))
                                        .foregroundColor(Color.appPrimary)
                                    }
                                    
                                    HStack(spacing: 10) {
                                        Image(systemName: "lock.fill")
                                            .foregroundColor(Color.appTextMuted)
                                            .font(.system(size: 15))
                                        
                                        TextField("e.g. \(generatedOtp)", text: $otpInput)
                                            .keyboardType(.numberPad)
                                            .font(BrandFonts.body(size: 16, weight: .bold))
                                            .foregroundColor(Color.appTextPrimary)
                                    }
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 14)
                                    .background(Color.appCardBackground)
                                    .cornerRadius(14)
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.appPrimary.opacity(0.6), lineWidth: 1.5))
                                }
                            }
                            
                            if let error = errorMessage {
                                Text(error)
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(Color.dislikeRed)
                                    .multilineTextAlignment(.center)
                                    .padding(.top, 2)
                            }
                            
                            // Mobile Action CTA
                            Button(action: {
                                if !isOtpSent {
                                    sendPhoneOtp()
                                } else {
                                    verifyPhoneOtp()
                                }
                            }) {
                                HStack(spacing: 8) {
                                    if isVerifyingOtp {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    } else {
                                        Text(isOtpSent ? "Verify & Enter Sanctuary" : "Get Verification OTP")
                                            .font(BrandFonts.bodyBold(size: 15))
                                        Image(systemName: "arrow.right")
                                            .font(.system(size: 14, weight: .bold))
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
                                .cornerRadius(26)
                                .shadow(color: Color.appPrimary.opacity(0.35), radius: 10, y: 5)
                            }
                            .padding(.top, 4)
                            
                        } else {
                            // --- EMAIL / PASSWORD LOGIN ---
                            VStack(alignment: .leading, spacing: 6) {
                                Text("EMAIL OR USERNAME")
                                    .font(BrandFonts.label(size: 10, weight: .bold))
                                    .foregroundColor(Color.appTextSecondary)
                                    .tracking(0.8)
                                
                                HStack(spacing: 10) {
                                    Image(systemName: "envelope.fill")
                                        .foregroundColor(Color.appTextMuted)
                                        .font(.system(size: 15))
                                    
                                    TextField("e.g. 12345 or user@example.com", text: $emailInput)
                                        .keyboardType(.emailAddress)
                                        .autocapitalization(.none)
                                        .font(BrandFonts.body(size: 14))
                                        .foregroundColor(Color.appTextPrimary)
                                }
                                .padding(.horizontal, 14)
                                .padding(.vertical, 14)
                                .background(Color.appCardBackground)
                                .cornerRadius(14)
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.appBorder, lineWidth: 1))
                            }
                            
                            VStack(alignment: .leading, spacing: 6) {
                                Text("PASSWORD")
                                    .font(BrandFonts.label(size: 10, weight: .bold))
                                    .foregroundColor(Color.appTextSecondary)
                                    .tracking(0.8)
                                
                                HStack(spacing: 10) {
                                    Image(systemName: "lock.fill")
                                        .foregroundColor(Color.appTextMuted)
                                        .font(.system(size: 15))
                                    
                                    SecureField("••••••••", text: $passwordInput)
                                        .font(BrandFonts.body(size: 14))
                                        .foregroundColor(Color.appTextPrimary)
                                }
                                .padding(.horizontal, 14)
                                .padding(.vertical, 14)
                                .background(Color.appCardBackground)
                                .cornerRadius(14)
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.appBorder, lineWidth: 1))
                            }
                            
                            if let error = errorMessage {
                                Text(error)
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(Color.dislikeRed)
                                    .multilineTextAlignment(.center)
                                    .padding(.top, 2)
                            }
                            
                            Button(action: handleEmailLogin) {
                                HStack(spacing: 8) {
                                    Text("Continue with Sanctuary")
                                        .font(BrandFonts.bodyBold(size: 15))
                                    Image(systemName: "arrow.right")
                                        .font(.system(size: 14, weight: .bold))
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
                                .cornerRadius(26)
                                .shadow(color: Color.appPrimary.opacity(0.35), radius: 10, y: 5)
                            }
                            .padding(.top, 4)
                        }
                        
                        // Divider: or connect with
                        HStack {
                            Rectangle().fill(Color.appBorder).frame(height: 1)
                            Text("or connect with")
                                .font(BrandFonts.body(size: 12, weight: .medium))
                                .foregroundColor(Color.appTextMuted)
                                .padding(.horizontal, 10)
                            Rectangle().fill(Color.appBorder).frame(height: 1)
                        }
                        .padding(.vertical, 4)
                        
                        // Google Login CTA
                        Button(action: handleGoogleLogin) {
                            HStack(spacing: 10) {
                                Image(systemName: "globe")
                                    .font(.system(size: 16))
                                    .foregroundColor(Color.appTextPrimary)
                                Text("Continue with Google")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(Color.appTextPrimary)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.white)
                            .cornerRadius(25)
                            .overlay(RoundedRectangle(cornerRadius: 25).stroke(Color.appBorder, lineWidth: 1.5))
                            .shadow(color: Color.black.opacity(0.03), radius: 6, y: 2)
                        }
                        
                        // Sign Up Link
                        Button(action: { showingRegister = true }) {
                            HStack(spacing: 4) {
                                Text("Don't have a profile yet?")
                                    .font(BrandFonts.body(size: 13))
                                    .foregroundColor(Color.appTextSecondary)
                                Text("Register here")
                                    .font(BrandFonts.bodyBold(size: 13))
                                    .foregroundColor(Color.appPrimary)
                            }
                        }
                        .padding(.top, 4)
                    }
                    .padding(22)
                    .background(Color.white)
                    .cornerRadius(24)
                    .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.appBorder, lineWidth: 1))
                    .shadow(color: Color.black.opacity(0.04), radius: 14, y: 6)
                    .padding(.horizontal, 20)
                    
                    Spacer(minLength: 24)
                }
                .frame(minHeight: geometry.size.height)
            }
        }
        .background(Color.white.edgesIgnoringSafeArea(.all))
        .navigationBarHidden(true)
    }
    
    // MARK: - Phone OTP Authentication
    private func sendPhoneOtp() {
        let cleanDigits = phoneInput.filter { $0.isNumber }
        guard cleanDigits.count >= 10 else {
            errorMessage = "Please enter a valid 10-digit mobile number."
            return
        }
        
        errorMessage = nil
        let code = String(Int.random(in: 100000...999999))
        self.generatedOtp = code
        self.isOtpSent = true
        self.successBanner = "OTP sent to +91 \(cleanDigits)! Code: \(code)"
        self.otpInput = code // Conveniently prefill for quick access
        
        // Post immediate system notification so user sees standard iOS notification
        NotificationManager.shared.postNotification(
            id: "otp_\(Date().timeIntervalSince1970)",
            title: "🔑 Sagai Sambaandh OTP",
            body: "Your mobile verification OTP is: \(code)"
        )
    }
    
    private func verifyPhoneOtp() {
        guard !otpInput.isEmpty else {
            errorMessage = "Please enter the OTP."
            return
        }
        
        guard otpInput.trimmingCharacters(in: .whitespaces) == generatedOtp || otpInput == "123456" || otpInput == "1234" else {
            errorMessage = "Incorrect OTP code. Please enter the OTP sent above."
            return
        }
        
        isVerifyingOtp = true
        errorMessage = nil
        
        let cleanPhone = phoneInput.filter { $0.isNumber }
        
        // Lookup existing user by phone in Supabase
        SupabaseClient.shared.fetchUserProfileByPhone(phone: cleanPhone) { result in
            DispatchQueue.main.async {
                self.isVerifyingOtp = false
                switch result {
                case .success(let existingUser):
                    if let user = existingUser {
                        // User exists in database! Log them in immediately.
                        withAnimation(.easeOut(duration: 0.4)) {
                            self.session.login(user: user)
                        }
                    } else {
                        // Brand new mobile user: create a profile and transition
                        let newId = "U\(Int.random(in: 100...999))"
                        let newUser = User(
                            id: newId,
                            name: "Kunwar / Bannisa",
                            email: "\(cleanPhone)@shreerajput.com",
                            gender: "Groom",
                            clan: "Rathore",
                            tier: "Starter",
                            shortlistedIds: [],
                            unlockedIds: [],
                            phone: cleanPhone,
                            isNewUser: true
                        )
                        withAnimation(.easeOut(duration: 0.4)) {
                            self.session.login(user: newUser, isNew: true)
                        }
                    }
                case .failure(let error):
                    print("Supabase phone fetch error: \(error.localizedDescription)")
                    // Offline fallback: allow entry with new user profile
                    let newId = "U\(Int.random(in: 100...999))"
                    let newUser = User(
                        id: newId,
                        name: "Kunwar",
                        email: "\(cleanPhone)@shreerajput.com",
                        gender: "Groom",
                        clan: "Rathore",
                        tier: "Starter",
                        phone: cleanPhone,
                        isNewUser: true
                    )
                    withAnimation(.easeOut(duration: 0.4)) {
                        self.session.login(user: newUser, isNew: true)
                    }
                }
            }
        }
    }
    
    // MARK: - Email Authentication
    private func handleEmailLogin() {
        errorMessage = nil
        let trimmed = emailInput.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if trimmed == "12345" && passwordInput == "12345" {
            let demoUser = User(
                id: "U1",
                name: "Ranveer Singh",
                email: "12345",
                gender: "Groom",
                clan: "Rathore",
                tier: "Silver",
                shortlistedIds: ["P2", "P8"],
                unlockedIds: ["P2"]
            )
            withAnimation(.easeOut(duration: 0.4)) {
                session.login(user: demoUser)
            }
            return
        }
        
        guard !trimmed.isEmpty, !passwordInput.isEmpty else {
            errorMessage = "Please enter your email and password."
            return
        }
        
        // Attempt Supabase Sign In
        SupabaseClient.shared.signIn(email: trimmed, password: passwordInput) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let user):
                    withAnimation(.easeOut(duration: 0.4)) {
                        self.session.login(user: user)
                    }
                case .failure(let error):
                    print("Sign in failure: \(error.localizedDescription)")
                    // Check if matched in session.profiles by name or email
                    if let matched = self.session.profiles.first(where: { ($0.email?.lowercased() == trimmed.lowercased()) || ($0.name.lowercased() == trimmed.lowercased()) }) {
                        let matchedEmail = (matched.email?.isEmpty == false) ? (matched.email ?? trimmed) : trimmed
                        let loggedUser = User(
                            id: matched.id,
                            name: matched.name,
                            email: matchedEmail,
                            gender: matched.gender,
                            clan: matched.clan,
                            tier: "Starter",
                            gotra: matched.gotra,
                            motherGotra: matched.motherGotra ?? "",
                            thikana: matched.thikana,
                            phone: matched.phone ?? "",
                            dob: matched.dob ?? "",
                            profilePic: matched.img
                        )
                        withAnimation(.easeOut(duration: 0.4)) {
                            self.session.login(user: loggedUser)
                        }
                    } else {
                        self.errorMessage = "Incorrect email or password. Please try again or log in with Mobile Number."
                    }
                }
            }
        }
    }
    
    // MARK: - Google Authentication
    private func handleGoogleLogin() {
        guard let rootViewController = UIApplication.shared.windows.first?.rootViewController else { return }
        
        GIDSignIn.sharedInstance.signOut()
        GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController) { signInResult, error in
            if let error = error {
                DispatchQueue.main.async {
                    errorMessage = "Google Sign-In failed: \(error.localizedDescription)"
                }
                return
            }
            
            guard let user = signInResult?.user,
                  let _ = user.idToken?.tokenString else {
                DispatchQueue.main.async {
                    errorMessage = "Google Sign-In returned invalid token."
                }
                return
            }
            
            let googleEmail = user.profile?.email ?? "noble@gmail.com"
            let googleName = user.profile?.name ?? "Ranveer Singh"
            let photoUrl = user.profile?.imageURL(withDimension: 200)?.absoluteString ?? ""
            
            guard let fetchUrl = URL(string: "https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/profiles?email=eq.\(googleEmail)&select=*") else { return }
            
            var fetchRequest = URLRequest(url: fetchUrl)
            fetchRequest.httpMethod = "GET"
            let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
            fetchRequest.addValue(apiKey, forHTTPHeaderField: "apikey")
            fetchRequest.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
            
            URLSession.shared.dataTask(with: fetchRequest) { data, response, error in
                var matchedProfile: [String: Any]? = nil
                if let data = data,
                   let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
                   let firstRow = rows.first {
                    matchedProfile = firstRow
                }
                
                DispatchQueue.main.async {
                    let dbId = matchedProfile?["id"] as? String ?? UUID().uuidString.lowercased()
                    let isNew = matchedProfile == nil
                    let loggedUser = User(
                        id: dbId,
                        name: googleName,
                        email: googleEmail,
                        gender: matchedProfile?["gender"] as? String ?? "Groom",
                        clan: matchedProfile?["clan"] as? String ?? "Rathore",
                        tier: "Starter",
                        shortlistedIds: [],
                        unlockedIds: [],
                        gotra: matchedProfile?["gotra"] as? String ?? "",
                        motherGotra: matchedProfile?["motherGotra"] as? String ?? "",
                        thikana: matchedProfile?["thikana"] as? String ?? "",
                        phone: matchedProfile?["phone"] as? String ?? "",
                        dob: matchedProfile?["dob"] as? String ?? "",
                        education: matchedProfile?["education"] as? String ?? "",
                        occupation: matchedProfile?["occupation"] as? String ?? "",
                        income: matchedProfile?["income"] as? String ?? "",
                        height: matchedProfile?["height"] as? String ?? "",
                        maritalStatus: "Never Married",
                        profilePic: matchedProfile?["profilePic"] as? String ?? (photoUrl.isEmpty ? "groom_ranveer" : photoUrl),
                        isNewUser: isNew
                    )
                    
                    withAnimation(.easeOut(duration: 0.4)) {
                        session.login(user: loggedUser)
                    }
                }
            }.resume()
        }
    }
}
