import SwiftUI
import GoogleSignIn

struct LoginView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var showingRegister: Bool
    @Binding var isGuestBypassed: Bool
    
    @State private var emailInput: String = ""
    @State private var passwordInput: String = ""
    @State private var errorMessage: String? = nil
    
    var body: some View {
        GeometryReader { geometry in
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    Spacer(minLength: 30)
                    
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
                            if let img = UIImage(named: "logo") {
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
                    
                    Spacer().frame(height: 20)
                    
                    // Main Headlines (Matching UI Kit)
                    VStack(spacing: 8) {
                        Text("Start Something Real")
                            .font(BrandFonts.displayBold(size: 28))
                            .foregroundColor(Color.appTextPrimary)
                            .tracking(-0.5)
                        
                        Text("Meet authentic Rajput members who share your values, gotra, and noble lineage.")
                            .font(BrandFonts.body(size: 14))
                            .foregroundColor(Color.appTextSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                            .lineSpacing(2)
                    }
                    
                    Spacer().frame(height: 24)
                    
                    // Demo Access Hint Pill
                    HStack(spacing: 6) {
                        Image(systemName: "key.fill")
                            .font(.system(size: 11))
                            .foregroundColor(Color.appPrimary)
                        Text("DEMO: Username 12345 • Password 12345")
                            .font(BrandFonts.body(size: 12, weight: .bold))
                            .foregroundColor(Color.appPrimary)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.appPrimary.opacity(0.08))
                    .clipShape(Capsule())
                    
                    Spacer().frame(height: 20)
                    
                    // Form Card
                    VStack(spacing: 16) {
                        // Email / Username Input
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
                        
                        // Password Input
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
                        
                        // Primary CTA
                        Button(action: handleLogin) {
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
                        
                        // Divider: or connect with
                        HStack {
                            Rectangle().fill(Color.appBorder).frame(height: 1)
                            Text("or connect with")
                                .font(BrandFonts.body(size: 12, weight: .medium))
                                .foregroundColor(Color.appTextMuted)
                                .padding(.horizontal, 10)
                            Rectangle().fill(Color.appBorder).frame(height: 1)
                        }
                        .padding(.vertical, 6)
                        
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
                        .padding(.top, 6)
                    }
                    .padding(24)
                    .background(Color.white)
                    .cornerRadius(24)
                    .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.appBorder, lineWidth: 1))
                    .shadow(color: Color.black.opacity(0.04), radius: 14, y: 6)
                    .padding(.horizontal, 20)
                    
                    Spacer(minLength: 30)
                }
                .frame(minHeight: geometry.size.height)
            }
        }
        .background(Color.white.edgesIgnoringSafeArea(.all))
        .navigationBarHidden(true)
    }
    
    private func handleLogin() {
        if emailInput == "12345" && passwordInput == "12345" {
            // Log in demo user
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
        } else {
            errorMessage = "Invalid credentials. Please use Username: 12345 & Password: 12345."
        }
    }
    
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
                  let idToken = user.idToken?.tokenString else {
                DispatchQueue.main.async {
                    errorMessage = "Google Sign-In returned invalid token."
                }
                return
            }
            
            let googleEmail = user.profile?.email ?? "noble@gmail.com"
            let googleName = user.profile?.name ?? "Ranveer Singh"
            let photoUrl = user.profile?.imageURL(withDimension: 200)?.absoluteString ?? ""
            
            // Perform live Supabase lookup
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
