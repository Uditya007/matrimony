import SwiftUI
import CoreImage

struct PlansView: View {
    @EnvironmentObject var session: SagaiSessionManager
    var onNotificationsTap: (() -> Void)? = nil
    @State private var billingCycle: Int = 0 // 0 = Monthly, 1 = Annual (20% off)
    @State private var alertMessage: String? = nil
    @State private var showingPaymentSheet: Bool = false
    @State private var selectedPlanTier: String = ""
    @State private var selectedPlanPrice: Int = 0
    @State private var selectedCycleLabel: String = ""
    
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
        .sheet(isPresented: $showingPaymentSheet) {
            RoyalUPIPaymentSheet(
                tier: selectedPlanTier,
                price: selectedPlanPrice,
                cycleLabel: selectedCycleLabel,
                onUpgradeSuccess: { utr in
                    completeUpgrade(to: selectedPlanTier, utr: utr)
                }
            )
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
        guard let _ = session.currentUser else {
            alertMessage = "Please log in or register your profile to select a membership plan!"
            return
        }
        
        if tier == "Starter" {
            completeUpgrade(to: "Starter", utr: "FREE-TRIAL")
            return
        }
        
        selectedPlanTier = tier
        selectedPlanPrice = tier == "Silver" ? silverPrice : goldPrice
        selectedCycleLabel = billingCycle == 0 ? "1 Month Access" : "Annual Access (Save 20%)"
        showingPaymentSheet = true
    }
    
    private func completeUpgrade(to tier: String, utr: String) {
        guard let user = session.currentUser else { return }
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
        alertMessage = "Khammaghani! Payment confirmed via Royal UPI (UTR: \(utr)). You have successfully upgraded to the Rajputana \(tier) Membership plan."
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

// MARK: - Royal UPI Payment Sheet (YouPI Gateway)
struct RoyalUPIPaymentSheet: View {
    let tier: String
    let price: Int
    let cycleLabel: String
    let onUpgradeSuccess: (String) -> Void
    @Environment(\.presentationMode) var presentationMode
    
    @State private var utrInput: String = ""
    @State private var isVerifying: Bool = false
    @State private var verificationNotice: String? = nil
    @State private var isNoticeError: Bool = false
    @State private var copiedVPA: Bool = false
    
    private let vpa = "7665941949@kotak"
    private let payeeName = "Shree Rajput Sagai Sambandh"
    
    private var upiUri: String {
        let cleanName = payeeName.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "ShreeRajputSagaiSambandh"
        let note = "Sagai Sambandh \(tier) Plan".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "Membership"
        let ref = "SAGAI\(Int(Date().timeIntervalSince1970))"
        return "upi://pay?pa=\(vpa)&pn=\(cleanName)&am=\(price).00&cu=INR&tr=\(ref)&tn=\(note)"
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(hex: "#F9FAFB").ignoresSafeArea()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        // Order Summary Card
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Rajputana \(tier) Plan")
                                    .font(BrandFonts.displayBold(size: 16))
                                    .foregroundColor(Color.royalMaroon)
                                Text(cycleLabel)
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(Color.textMuted)
                            }
                            Spacer()
                            Text("₹\(price)")
                                .font(BrandFonts.displayBold(size: 22))
                                .foregroundColor(Color.royalGold)
                        }
                        .padding(14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Color.royalGold.opacity(0.3), lineWidth: 1)
                        )
                        
                        // 1-Tap UPI Apps Grid
                        VStack(alignment: .leading, spacing: 10) {
                            Text("1-TAP INSTANT PAYMENT APPS")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(Color.textMuted)
                                .tracking(0.5)
                            
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                                UPIAppButton(icon: "🟢", name: "GPay", urlString: upiUri)
                                UPIAppButton(icon: "🟣", name: "PhonePe", urlString: upiUri)
                                UPIAppButton(icon: "🔵", name: "Paytm", urlString: upiUri)
                            }
                            
                            Button(action: {
                                openUPI(uri: upiUri)
                            }) {
                                HStack(spacing: 8) {
                                    Image(systemName: "bolt.fill")
                                        .foregroundColor(Color.royalGold)
                                    Text("Open Any UPI App on Device")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundColor(.white)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    LinearGradient(
                                        colors: [Color.royalMaroon, Color.deepMaroon],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                        .padding(14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        
                        // Dynamic QR Code & Kotak VPA
                        VStack(spacing: 12) {
                            Text("Scan QR with any UPI App")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Color.textMuted)
                            
                            Image(uiImage: generateQRCode(from: upiUri))
                                .interpolation(.none)
                                .resizable()
                                .scaledToFit()
                                .frame(width: 170, height: 170)
                                .padding(8)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .shadow(color: Color.black.opacity(0.06), radius: 8, x: 0, y: 4)
                            
                            HStack(spacing: 8) {
                                Text(vpa)
                                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                    .foregroundColor(Color.appTextPrimary)
                                
                                Button(action: {
                                    UIPasteboard.general.string = vpa
                                    copiedVPA = true
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                        copiedVPA = false
                                    }
                                }) {
                                    Text(copiedVPA ? "Copied!" : "Copy")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 3)
                                        .background(Color.royalMaroon)
                                        .clipShape(Capsule())
                                }
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(hex: "#F3F4F6"))
                            .clipShape(Capsule())
                        }
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        
                        // UTR Verification Box
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Enter 12-Digit Bank UTR / Reference No.")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Color.appTextPrimary)
                            
                            HStack(spacing: 8) {
                                TextField("e.g. 428901234567", text: $utrInput)
                                    .font(.system(size: 14))
                                    .padding(10)
                                    .background(Color(hex: "#F9FAFB"))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color(hex: "#E5E7EB"), lineWidth: 1)
                                    )
                                
                                Button(action: submitUTR) {
                                    if isVerifying {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            .frame(width: 80, height: 38)
                                            .background(Color.royalGold)
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                    } else {
                                        Text("Verify")
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(.white)
                                            .frame(width: 80, height: 38)
                                            .background(
                                                LinearGradient(
                                                    colors: [Color.royalGold, Color(hex: "#B8860B")],
                                                    startPoint: .leading,
                                                    endPoint: .trailing
                                                )
                                            )
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                    }
                                }
                                .disabled(isVerifying)
                            }
                            
                            if let notice = verificationNotice {
                                Text(notice)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(isNoticeError ? Color.dislikeRed : Color.successGreen)
                            } else {
                                Text("🛡️ Direct Kotak Bank Settlement • Auto-reconciliation active")
                                    .font(.system(size: 11))
                                    .foregroundColor(Color.successGreen)
                            }
                        }
                        .padding(14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(16)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 6) {
                        Image(systemName: "crown.fill")
                            .foregroundColor(Color.royalGold)
                            .font(.system(size: 14))
                        Text("Royal UPI Gateway")
                            .font(BrandFonts.displayBold(size: 16))
                            .foregroundColor(Color.royalMaroon)
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { presentationMode.wrappedValue.dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(Color.gray.opacity(0.7))
                            .font(.system(size: 20))
                    }
                }
            }
        }
    }
    
    private func openUPI(uri: String) {
        guard let url = URL(string: uri) else { return }
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
    }
    
    private func submitUTR() {
        let clean = utrInput.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean.count < 8 {
            verificationNotice = "Please enter a valid 12-digit UTR bank reference number."
            isNoticeError = true
            return
        }
        
        isVerifying = true
        isNoticeError = false
        verificationNotice = "Verifying with royal bank desk..."
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            isVerifying = false
            presentationMode.wrappedValue.dismiss()
            onUpgradeSuccess(clean)
        }
    }
    
    private func generateQRCode(from string: String) -> UIImage {
        let filter = CIFilter(name: "CIQRCodeGenerator")
        filter?.setValue(Data(string.utf8), forKey: "inputMessage")
        filter?.setValue("M", forKey: "inputCorrectionLevel")
        if let outputImage = filter?.outputImage {
            let transform = CGAffineTransform(scaleX: 8, y: 8)
            let scaledImage = outputImage.transformed(by: transform)
            let context = CIContext()
            if let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) {
                return UIImage(cgImage: cgImage)
            }
        }
        return UIImage()
    }
}

struct UPIAppButton: View {
    let icon: String
    let name: String
    let urlString: String
    
    var body: some View {
        Button(action: {
            if let url = URL(string: urlString) {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
        }) {
            VStack(spacing: 4) {
                Text(icon)
                    .font(.system(size: 20))
                Text(name)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color.appTextPrimary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Color(hex: "#F9FAFB"))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color(hex: "#E5E7EB"), lineWidth: 1)
            )
        }
    }
}
