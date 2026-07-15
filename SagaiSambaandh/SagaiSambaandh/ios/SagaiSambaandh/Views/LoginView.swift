import SwiftUI

struct LoginView: View {
    @EnvironmentObject var session: SessionManager
    @Binding var showingRegister: Bool
    
    @State private var emailInput: String = ""
    @State private var passwordInput: String = ""
    @State private var errorMessage: String? = nil
    
    var body: some View {
        VStack(spacing: 0) {
            // Header Logo banner
            ZStack(alignment: .bottom) {
                LinearGradient(
                    colors: [.jodhpurIndigo, Color(hex: "#101830")],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 120)
                
                PalaceDivider(fillColor: .sandstoneIvory)
            }
            
            ScrollView {
                VStack(spacing: 24) {
                    // Title block
                    VStack(spacing: 6) {
                        Text("Noble Login")
                            .font(BrandFonts.displayBold(size: 28))
                            .foregroundColor(.royalMaroon)
                        Text("Access Rajasthan's Royal Matrimony")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.gray)
                    }
                    .padding(.top, 10)
                    
                    // Demo credentials panel
                    VStack(alignment: .leading, spacing: 8) {
                        Text("NOBLE ACCESS DEMO:")
                            .font(BrandFonts.label(size: 9))
                            .foregroundColor(.royalMaroon)
                            .fontWeight(.bold)
                        
                        Text("Email: royal@sagaisambaandh.com")
                            .font(BrandFonts.body(size: 11, weight: .bold))
                            .foregroundColor(.inkBrown)
                        
                        Text("Password: rajputana")
                            .font(BrandFonts.body(size: 11, weight: .bold))
                            .foregroundColor(.inkBrown)
                    }
                    .padding(15)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.royalGold.opacity(0.06))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.royalGold.opacity(0.3), lineWidth: 1)
                    )
                    
                    // Input forms
                    VStack(spacing: 16) {
                        // Email
                        VStack(alignment: .leading, spacing: 6) {
                            Text("ROYAL CREDENTIALS (EMAIL)")
                                .font(BrandFonts.label(size: 8))
                                .foregroundColor(.gray)
                            TextField("e.g. kunwar.rathore@gmail.com", text: $emailInput)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .padding(12)
                                .background(Color.cardBackground)
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                        }
                        
                        // Password
                        VStack(alignment: .leading, spacing: 6) {
                            Text("PASSWORD")
                                .font(BrandFonts.label(size: 8))
                                .foregroundColor(.gray)
                            SecureField("••••••••", text: $passwordInput)
                                .padding(12)
                                .background(Color.cardBackground)
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                        }
                    }
                    
                    if let error = errorMessage {
                        Text(error)
                            .font(BrandFonts.body(size: 12))
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
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
                            .shadow(radius: 2)
                    }
                    .padding(.top, 10)
                    
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
                    .padding(.top, 5)
                }
                .padding(24)
            }
            Spacer()
        }
        .background(Color.sandstoneIvory.edgesIgnoringSafeArea(.all))
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
            session.login(user: demoUser)
        } else {
            errorMessage = "Invalid credentials. Please use the demo credentials provided."
        }
    }
}
