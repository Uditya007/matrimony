import SwiftUI

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
                            
                            Text("Email: royal@sagaisambaandh.com")
                                .font(BrandFonts.body(size: 11, weight: .bold))
                                .foregroundColor(.inkBrown)
                            
                            Text("Password: rajputana")
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
        if emailInput == "royal@sagaisambaandh.com" && passwordInput == "rajputana" {
            // Log in demo user
            let demoUser = User(
                id: "U1",
                name: "Ranveer Singh",
                email: "royal@sagaisambaandh.com",
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
}
