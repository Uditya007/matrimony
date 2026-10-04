import SwiftUI

struct PlansView: View {
    @EnvironmentObject var session: SagaiSessionManager
    var onNotificationsTap: (() -> Void)? = nil
    @State private var billingCycle: Int = 0 // 0 = Monthly, 1 = Annual (20% off)
    @State private var alertMessage: String? = nil
    
    private var starterPrice: Int {
        billingCycle == 0 ? 4999 : 3999
    }
    
    private var silverPrice: Int {
        billingCycle == 0 ? 11999 : 9599
    }
    
    private var goldPrice: Int {
        billingCycle == 0 ? 24999 : 19999
    }
    
    var body: some View {
        ZStack {
            RoyalBackgroundView()
            
            VStack(spacing: 0) {
                // Top Custom Header (Matches Discover & Messages)
                topHeaderBar
                
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 20) {
                        // Header block
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Regal Memberships")
                                .font(BrandFonts.displayBold(size: 26))
                                .foregroundColor(.white)
                            
                            Text("Select a Rajputana subscription tier to unlock premium features and direct family contact lines.")
                                .font(BrandFonts.body(size: 13))
                                .foregroundColor(.white.opacity(0.85))
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 12)
                        
                        // Custom Royal Billing Cycle Segment Switcher
                        billingCycleSwitcher
                            .padding(.horizontal, 20)
                            .padding(.vertical, 4)
                        
                        // Plans List
                        VStack(spacing: 25) {
                            // Plan 1: Starter
                            PlanCard(
                                title: "Starter",
                                price: starterPrice,
                                cycle: billingCycle == 0 ? "month" : "month (billed annually)",
                                features: [
                                    "View complete Rajput profiles",
                                    "Send 10 express interests / month",
                                    "Astrology & Kundli matches overview"
                                ],
                                buttonText: "Select Starter",
                                isFeatured: false
                            ) {
                                subscribe(to: "Starter")
                            }
                            
                            // Plan 2: Rajputana Silver (Featured)
                            PlanCard(
                                title: "Rajputana Silver",
                                price: silverPrice,
                                cycle: billingCycle == 0 ? "month" : "month (billed annually)",
                                features: [
                                    "Unlock 15 contact phone numbers",
                                    "Astrology compatibility matching reports",
                                    "Express interests: Unlimited",
                                    "Highlight profile in search lists"
                                ],
                                buttonText: "Choose Silver",
                                isFeatured: true
                            ) {
                                subscribe(to: "Silver")
                            }
                            
                            // Plan 3: Rajputana Gold (Elite)
                            PlanCard(
                                title: "Rajputana Gold",
                                price: goldPrice,
                                cycle: billingCycle == 0 ? "month" : "month (billed annually)",
                                features: [
                                    "Direct WhatsApp access to family cards",
                                    "Dedicated Rajput matchmaking manager",
                                    "Gotra & Kul verification reviews",
                                    "Top placement in featured sections"
                                ],
                                buttonText: "Go Gold Elite",
                                isFeatured: false
                            ) {
                                subscribe(to: "Gold")
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 30)
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .alert(item: Binding<AlertItem?>(
            get: { alertMessage != nil ? AlertItem(message: alertMessage!) : nil },
            set: { alertMessage = $0?.message }
        )) { alertItem in
            Alert(title: Text("Shree Rajput Sagai Sambandh"), message: Text(alertItem.message), dismissButton: .default(Text("Khammaghani")))
        }
    }
    
    // MARK: - Top Header Bar
    private var topHeaderBar: some View {
        HStack {
            Image(systemName: "crown.fill")
                .foregroundColor(Color.royalGold)
                .font(.system(size: 18))
                .frame(width: 40, height: 40)
                .background(Color.white.opacity(0.15))
                .clipShape(Circle())
            
            Spacer()
            
            Text("Premium")
                .font(BrandFonts.displayBold(size: 20))
                .foregroundColor(.white)
            
            Spacer()
            
            Button(action: {
                onNotificationsTap?()
            }) {
                ZStack {
                    Image(systemName: "bell.fill")
                        .foregroundColor(.white)
                        .font(.system(size: 16, weight: .semibold))
                        .frame(width: 40, height: 40)
                        .background(Color.white.opacity(0.18))
                        .clipShape(Circle())
                    
                    if !session.notificationsList.isEmpty {
                        Circle()
                            .fill(Color.lightGold)
                            .frame(width: 8, height: 8)
                            .offset(x: 10, y: -10)
                    }
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }
    
    // MARK: - Billing Cycle Switcher
    private var billingCycleSwitcher: some View {
        HStack(spacing: 8) {
            Button(action: { withAnimation(.easeInOut(duration: 0.2)) { billingCycle = 0 } }) {
                Text("Monthly")
                    .font(BrandFonts.body(size: 13, weight: billingCycle == 0 ? .bold : .medium))
                    .foregroundColor(billingCycle == 0 ? Color.royalMaroon : .white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 9)
                    .background(billingCycle == 0 ? Color.lightGold : Color.white.opacity(0.18))
                    .clipShape(Capsule())
                    .overlay(
                        Capsule()
                            .stroke(billingCycle == 0 ? Color.clear : Color.white.opacity(0.25), lineWidth: 1)
                    )
            }
            
            Button(action: { withAnimation(.easeInOut(duration: 0.2)) { billingCycle = 1 } }) {
                Text("Annual (Save 20%)")
                    .font(BrandFonts.body(size: 13, weight: billingCycle == 1 ? .bold : .medium))
                    .foregroundColor(billingCycle == 1 ? Color.royalMaroon : .white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 9)
                    .background(billingCycle == 1 ? Color.lightGold : Color.white.opacity(0.18))
                    .clipShape(Capsule())
                    .overlay(
                        Capsule()
                            .stroke(billingCycle == 1 ? Color.clear : Color.white.opacity(0.25), lineWidth: 1)
                    )
            }
        }
    }
    
    private func subscribe(to tier: String) {
        guard let user = session.currentUser else {
            alertMessage = "Please log in or register your profile to select a membership plan!"
            return
        }
        
        let updatedUser = User(
            id: user.id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            clan: user.clan,
            tier: tier,
            shortlistedIds: user.shortlistedIds,
            unlockedIds: user.unlockedIds
        )
        session.login(user: updatedUser)
        alertMessage = "Congratulations! You have successfully upgraded to the Rajputana \(tier) Membership plan."
    }
}

struct AlertItem: Identifiable {
    var id: String { message }
    let message: String
}

struct PlanCard: View {
    let title: String
    let price: Int
    let cycle: String
    let features: [String]
    let buttonText: String
    let isFeatured: Bool
    var onSelect: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                if isFeatured {
                    Text("MOST POPULAR")
                        .font(BrandFonts.label(size: 9, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(
                            LinearGradient(
                                colors: [Color.royalGold, Color.lightGold],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(10)
                        .offset(y: -22)
                        .padding(.bottom, -15)
                }
                
                Text(title)
                    .font(BrandFonts.displayBold(size: 22))
                    .foregroundColor(isFeatured ? .white : Color.lightGold)
                
                HStack(alignment: .bottom, spacing: 2) {
                    Text("₹\(price)")
                        .font(BrandFonts.displayBold(size: 32))
                        .foregroundColor(isFeatured ? Color.lightGold : .white)
                    
                    Text("/\(cycle)")
                        .font(BrandFonts.body(size: 11))
                        .foregroundColor(.white.opacity(0.8))
                        .padding(.bottom, 6)
                }
            }
            .padding(.top, isFeatured ? 10 : 0)
            
            Divider()
                .background(isFeatured ? Color.royalGold.opacity(0.5) : Color.white.opacity(0.25))
            
            VStack(alignment: .leading, spacing: 12) {
                ForEach(features, id: \.self) { feature in
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(Color.lightGold)
                            .font(.system(size: 14))
                            .padding(.top, 1)
                        
                        Text(feature)
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.white)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10)
            
            Button(action: onSelect) {
                Text(buttonText)
                    .font(BrandFonts.body(size: 14, weight: .bold))
                    .foregroundColor(Color.royalMaroon)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        isFeatured ?
                        LinearGradient(colors: [Color.lightGold, Color.royalGold], startPoint: .leading, endPoint: .trailing) :
                        LinearGradient(colors: [Color.white, Color(hex: "#F5EFE6")], startPoint: .leading, endPoint: .trailing)
                    )
                    .cornerRadius(8)
                    .shadow(radius: 2)
            }
        }
        .padding(24)
        .background(
            isFeatured ?
            Color.royalMaroon.opacity(0.85) :
            Color.white.opacity(0.18)
        )
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    isFeatured ?
                    LinearGradient(colors: [Color.royalGold, Color.lightGold], startPoint: .topLeading, endPoint: .bottomTrailing) :
                    LinearGradient(colors: [Color.white.opacity(0.35), Color.white.opacity(0.15)], startPoint: .topLeading, endPoint: .bottomTrailing),
                    lineWidth: 2
                )
        )
        .shadow(color: Color.black.opacity(isFeatured ? 0.25 : 0.12), radius: 10, x: 0, y: 5)
    }
}
