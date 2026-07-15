import SwiftUI

struct PlansView: View {
    @EnvironmentObject var session: SessionManager
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
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header block
                VStack(alignment: .leading, spacing: 6) {
                    Text("Regal Memberships")
                        .font(BrandFonts.displayBold(size: 26))
                        .foregroundColor(.royalMaroon)
                    
                    Text("Select a Rajputana subscription tier to unlock premium features and direct family contact lines.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 20)
                .padding(.top, 15)
                
                // Billing Cycle Segment Switcher
                Picker("Billing Cycle", selection: $billingCycle) {
                    Text("Monthly").tag(0)
                    Text("Annual (Save 20%)").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal, 20)
                .padding(.vertical, 5)
                
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
        .background(Color.sandstoneIvory.edgesIgnoringSafeArea(.all))
        .navigationTitle("Regal Plans")
        .navigationBarTitleDisplayMode(.inline)
        .alert(item: Binding<AlertItem?>(
            get: { alertMessage != nil ? AlertItem(message: alertMessage!) : nil },
            set: { alertMessage = $0?.message }
        )) { alertItem in
            Alert(title: Text("Sagai Sambaandh"), message: Text(alertItem.message), dismissButton: .default(Text("Khammaghani")))
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
                        .font(BrandFonts.label(size: 9))
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color.royalGold)
                        .cornerRadius(10)
                        .offset(y: -22)
                        .padding(.bottom, -15)
                }
                
                Text(title)
                    .font(BrandFonts.displayBold(size: 22))
                    .foregroundColor(isFeatured ? .white : .royalMaroon)
                
                HStack(alignment: .bottom, spacing: 2) {
                    Text("₹\(price)")
                        .font(BrandFonts.displayBold(size: 32))
                        .foregroundColor(isFeatured ? .lightGold : .royalMaroon)
                    
                    Text("/\(cycle)")
                        .font(BrandFonts.body(size: 11))
                        .foregroundColor(isFeatured ? .white.opacity(0.8) : .gray)
                        .padding(.bottom, 6)
                }
            }
            .padding(.top, isFeatured ? 10 : 0)
            
            Divider()
                .background(isFeatured ? Color.white.opacity(0.3) : Color.royalGold.opacity(0.3))
            
            VStack(alignment: .leading, spacing: 12) {
                ForEach(features, id: \.self) { feature in
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(isFeatured ? .lightGold : .royalGold)
                            .font(.system(size: 14))
                            .padding(.top, 1)
                        
                        Text(feature)
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(isFeatured ? .white : .inkBrown)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10)
            
            Button(action: onSelect) {
                Text(buttonText)
                    .font(BrandFonts.body(size: 14, weight: .bold))
                    .foregroundColor(isFeatured ? .royalMaroon : .white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(isFeatured ? Color.lightGold : Color.royalMaroon)
                    .cornerRadius(8)
                    .shadow(radius: 2)
            }
        }
        .padding(24)
        .background(isFeatured ? Color.royalMaroon : Color.cardBackground)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isFeatured ? Color.royalGold : Color.royalGold.opacity(0.2), lineWidth: 2)
        )
        .shadow(color: Color.black.opacity(isFeatured ? 0.12 : 0.05), radius: 10, x: 0, y: 5)
    }
}
