import SwiftUI

struct LoginView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var showingRegister: Bool
    @Binding var isGuestBypassed: Bool
    
    @State private var emailInput: String = ""
    @State private var passwordInput: String = ""
    @State private var errorMessage: String? = nil
    
    var body: some View {
        VStack(spacing: 0) {
            // Elegant Indigo Header with Logo Medallion
            ZStack(alignment: .bottom) {
                LinearGradient(
                    colors: [.jodhpurIndigo, Color(hex: "#101830")],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 200)
                
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
                            .frame(width: 84, height: 84)
                        
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
                                    .font(.system(size: 28))
                                    .foregroundColor(.lightGold)
                            }
                        }
                        .frame(width: 76, height: 76)
                        .clipShape(Circle())
                    }
                    .shadow(radius: 4)
                    .padding(.top, 20)
                    
                    Spacer()
                }
                
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
                    .padding(.top, 5)
                    
                    // Demo credentials panel
                    VStack(alignment: .leading, spacing: 8) {
                        Text("NOBLE ACCESS DEMO:")
                            .font(BrandFonts.label(size: 9))
                            .foregroundColor(.royalMaroon)
                            .fontWeight(.bold)
                            .tracking(1)
                        
                        HStack {
                            Text("Email:")
                                .font(BrandFonts.body(size: 11, weight: .bold))
                                .foregroundColor(.gray)
                            Text("royal@sagaisambaandh.com")
                                .font(BrandFonts.body(size: 11, weight: .bold))
                                .foregroundColor(.inkBrown)
                        }
                        
                        HStack {
                            Text("Password:")
                                .font(BrandFonts.body(size: 11, weight: .bold))
                                .foregroundColor(.gray)
                            Text("rajputana")
                                .font(BrandFonts.body(size: 11, weight: .bold))
                                .foregroundColor(.inkBrown)
                        }
                    }
                    .padding(15)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.royalGold.opacity(0.06))
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.royalGold.opacity(0.25), lineWidth: 1)
                    )
                    
                    // Input forms
                    VStack(spacing: 18) {
                        // Email
                        VStack(alignment: .leading, spacing: 6) {
                            Text("ROYAL CREDENTIALS (EMAIL)")
                                .font(BrandFonts.label(size: 8))
                                .foregroundColor(.gray)
                                .tracking(1)
                            TextField("e.g. kunwar.rathore@gmail.com", text: $emailInput)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .font(BrandFonts.body(size: 14))
                                .padding(12)
                                .background(Color.cardBackground)
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.royalGold.opacity(0.2), lineWidth: 1)
                                )
                        }
                        
                        // Password
                        VStack(alignment: .leading, spacing: 6) {
                            Text("PASSWORD")
                                .font(BrandFonts.label(size: 8))
                                .foregroundColor(.gray)
                                .tracking(1)
                            SecureField("••••••••", text: $passwordInput)
                                .font(BrandFonts.body(size: 14))
                                .padding(12)
                                .background(Color.cardBackground)
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.royalGold.opacity(0.2), lineWidth: 1)
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
                    
                    Divider()
                        .background(Color.royalGold.opacity(0.2))
                        .padding(.vertical, 5)
                    
                    // Guest Bypass Option
                    Button(action: {
                        withAnimation(.easeOut(duration: 0.4)) {
                            isGuestBypassed = true
                        }
                    }) {
                        Text("Browse as Guest")
                            .font(BrandFonts.body(size: 13, weight: .bold))
                            .foregroundColor(.gray)
                            .underline()
                    }
                    .padding(.bottom, 20)
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
            withAnimation(.easeOut(duration: 0.4)) {
                session.login(user: demoUser)
            }
        } else {
            errorMessage = "Invalid credentials. Please use the demo credentials provided."
        }
    }
}
