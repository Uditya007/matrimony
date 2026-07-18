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
                    Spacer(minLength: geometry.size.height * 0.05)
                    
                    // Centered Medallion Logo
                    ZStack {
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [.royalGold, .lightGold, .royalGold],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 2.5
                            )
                            .frame(width: 104, height: 104)
                        
                        Group {
                            if let img = UIImage(named: "logo") {
                                Image(uiImage: img)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            } else {
                                Image(systemName: "shield.fill")
                                    .font(.system(size: 32))
                                    .foregroundColor(.lightGold)
                            }
                        }
                        .frame(width: 96, height: 96)
                        .clipShape(Circle())
                    }
                    .shadow(color: Color.black.opacity(0.08), radius: 5, x: 0, y: 3)
                    .padding(.top, 10)
                    
                    Spacer().frame(height: 16)
                    
                    // Title block
                    VStack(spacing: 6) {
                        Text("SHREE RAJPUT")
                            .font(BrandFonts.label(size: 11))
                            .foregroundColor(.royalGold)
                            .tracking(3)
                        
                        Text("Sagai Sambaandh")
                            .font(BrandFonts.displayBold(size: 28))
                            .foregroundColor(.lightGold)
                        
                        Text("Access Rajasthan's Royal Matrimony")
                            .font(BrandFonts.body(size: 12))
                            .foregroundColor(.sandstoneIvory.opacity(0.7))
                    }
                    .multilineTextAlignment(.center)
                    
                    Spacer().frame(height: 24)
                    
                    // Centered Login Card Window
                    VStack(spacing: 20) {
                        // Demo credentials panel
                        VStack(alignment: .leading, spacing: 6) {
                            Text("NOBLE ACCESS DEMO:")
                                .font(BrandFonts.label(size: 9))
                                .foregroundColor(.royalMaroon)
                                .fontWeight(.bold)
                                .tracking(1)
                            
                            Text("Username: 12345")
                                .font(BrandFonts.body(size: 11, weight: .bold))
                                .foregroundColor(.inkBrown)
                            
                            Text("Password: 12345")
                                .font(BrandFonts.body(size: 11, weight: .bold))
                                .foregroundColor(.inkBrown)
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.royalGold.opacity(0.06))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.royalGold.opacity(0.25), lineWidth: 1)
                        )
                        
                        // Input forms
                        VStack(spacing: 16) {
                            // Email
                            VStack(alignment: .leading, spacing: 6) {
                                Text("ROYAL CREDENTIALS (EMAIL)")
                                    .font(BrandFonts.label(size: 9))
                                    .foregroundColor(.royalMaroon) // Red label text for visibility
                                    .fontWeight(.bold)
                                    .tracking(0.5)
                                
                                TextField("e.g. royal@sagaisambaandh.com", text: $emailInput)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .font(BrandFonts.body(size: 14))
                                    .foregroundColor(.inkBrown) // Explicitly dark brown input text
                                    .padding(12)
                                    .background(Color.cardBackground)
                                    .cornerRadius(8)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color.royalGold.opacity(0.3), lineWidth: 1)
                                    )
                            }
                            
                            // Password
                            VStack(alignment: .leading, spacing: 6) {
                                Text("PASSWORD")
                                    .font(BrandFonts.label(size: 9))
                                    .foregroundColor(.royalMaroon) // Red label text for visibility
                                    .fontWeight(.bold)
                                    .tracking(0.5)
                                
                                SecureField("••••••••", text: $passwordInput)
                                    .font(BrandFonts.body(size: 14))
                                    .foregroundColor(.inkBrown) // Explicitly dark brown input text
                                    .padding(12)
                                    .background(Color.cardBackground)
                                    .cornerRadius(8)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color.royalGold.opacity(0.3), lineWidth: 1)
                                    )
                            }
                        }
                        
                        if let error = errorMessage {
                            Text(error)
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(.red)
                                .multilineTextAlignment(.center)
                                .padding(.top, 4)
                        }
                        
                        // Submit CTA
                        Button(action: handleLogin) {
                            Text("Enter Sanctuary")
                                .font(BrandFonts.body(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.royalMaroon)
                                .cornerRadius(8)
                                .shadow(color: Color.royalMaroon.opacity(0.3), radius: 4, x: 0, y: 3)
                        }
                        .padding(.top, 5)
                        
                        // Divider
                        HStack {
                            Rectangle().fill(Color.gray.opacity(0.3)).frame(height: 0.5)
                            Text("OR").font(BrandFonts.label(size: 10)).foregroundColor(.gray)
                            Rectangle().fill(Color.gray.opacity(0.3)).frame(height: 0.5)
                        }
                        .padding(.vertical, 4)
                        
                        // Google Login CTA
                        Button(action: handleGoogleLogin) {
                            HStack(spacing: 12) {
                                Image(systemName: "globe")
                                    .foregroundColor(.royalMaroon)
                                Text("Continue with Google")
                                    .font(BrandFonts.body(size: 14, weight: .bold))
                                    .foregroundColor(.royalMaroon)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.white)
                            .cornerRadius(8)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.royalGold.opacity(0.3), lineWidth: 1))
                        }
                        
                        // Registration redirect link
                        Button(action: { showingRegister = true }) {
                            HStack {
                                Text("Already have a lineage record?")
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(.gray)
                                Text("Sign Up here")
                                    .font(BrandFonts.body(size: 12, weight: .bold))
                                    .foregroundColor(.royalMaroon)
                            }
                        }
                        

                    }
                    .padding(24)
                    .background(Color.deepMaroon)
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.royalGold.opacity(0.2), lineWidth: 1.5)
                    )
                    .shadow(color: Color.black.opacity(0.04), radius: 10, x: 0, y: 4)
                    .padding(.horizontal, 20)
                    
                    Spacer(minLength: geometry.size.height * 0.05)
                }
                .frame(minHeight: geometry.size.height)
            }
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
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
            errorMessage = "Invalid credentials. Please use the demo credentials provided."
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
            guard let fetchUrl = URL(string: "https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/profiles?id=eq.\(googleEmail)&select=*") else { return }
            
            var fetchRequest = URLRequest(url: fetchUrl)
            fetchRequest.httpMethod = "GET"
            let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
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
                    let loggedUser = User(
                        id: googleEmail,
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
                        profilePic: matchedProfile?["profilePic"] as? String ?? (photoUrl.isEmpty ? "groom_ranveer" : photoUrl)
                    )
                    
                    withAnimation(.easeOut(duration: 0.4)) {
                        session.login(user: loggedUser)
                    }
                }
            }.resume()
        }
    }
}
