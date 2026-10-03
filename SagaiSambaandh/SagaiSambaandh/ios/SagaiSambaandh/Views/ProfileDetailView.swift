import SwiftUI
import SafariServices

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: Context) -> SFSafariViewController {
        return SFSafariViewController(url: url)
    }
    
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

struct ProfileDetailView: View {
    let profile: Profile
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    
    @State private var isUnlocked: Bool = false
    @State private var showingUnlockProgress: Bool = false
    @State private var unlockSuccess: Bool = false
    @State private var showingPdfSafari: Bool = false
    @State private var selectedPdfUrl: URL? = nil
    
    @State private var showingChatSheet: Bool = false
    @State private var isSendingInterest: Bool = false
    @State private var showingInterestSentAlert: Bool = false
    
    private var isGoldUser: Bool {
        session.currentUser?.tier == "Gold"
    }
    
    private var isSilverUser: Bool {
        session.currentUser?.tier == "Silver"
    }
    
    private var hasDirectAccess: Bool {
        isGoldUser || isSilverUser
    }
    
    private var isMyOwnProfile: Bool {
        guard let currentUser = session.currentUser else { return false }
        return currentUser.id == profile.id
    }
    
    private var isConnected: Bool {
        session.areConnected(profileId: profile.id)
    }
    
    private var isInterestSentByMe: Bool {
        guard let currentUserId = session.currentUser?.id else { return false }
        let myInterests = SupabaseClient.shared.getInterests(from: session.currentUser?.about)
        return myInterests[profile.id] == "sent"
    }
    
    private var isInterestReceivedFromCandidate: Bool {
        guard let currentUserId = session.currentUser?.id else { return false }
        let candidateInterests = SupabaseClient.shared.getInterests(from: profile.about)
        return candidateInterests[currentUserId] == "sent"
    }
    
    private var cleanAboutText: String {
        return SupabaseClient.shared.cleanBioText(from: profile.about)
    }
    
    private var isUnlockedOrOwn: Bool {
        guard let currentUser = session.currentUser else { return false }
        return currentUser.id == profile.id || session.isUnlocked(id: profile.id) || session.areConnected(profileId: profile.id) || unlockSuccess
    }
    
    var body: some View {
        ZStack(alignment: .bottom) {
            Color.white.edgesIgnoringSafeArea(.all)
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // 1. Hero Photo Header with Floating Controls
                    heroHeaderSection
                    
                    // 2. Profile Details Sheet Content
                    VStack(alignment: .leading, spacing: 20) {
                        // Candidate Name, Age & Verified
                        nameAndVerificationHeader
                        
                        // Lineage Fact Chips
                        factChipsGrid
                        
                        // Hinge-Style Prompt: About Me
                        if !cleanAboutText.isEmpty {
                            promptCard(
                                title: "ABOUT ME",
                                content: cleanAboutText,
                                icon: "quote.opening"
                            )
                        }
                        
                        // Hinge-Style Prompt: Partner Expectations
                        if let expectations = profile.expectations, !expectations.isEmpty {
                            promptCard(
                                title: "PARTNER EXPECTATIONS",
                                content: expectations,
                                icon: "heart.text.square"
                            )
                        }
                        
                        // Rajput Lineage & Heritage Card
                        lineageHeritageCard
                        
                        // Horoscope & Astrological Specifications
                        astroSpecificationsCard
                        
                        // Professional & Educational Summary
                        professionEducationCard
                        
                        // Unlocked Contact & Biodata section (if unlocked)
                        if isUnlockedOrOwn {
                            unlockedContactCard
                        }
                        
                        // Bottom spacing for sticky floating action bar
                        Spacer().frame(height: 100)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .background(Color.white)
                    .cornerRadius(32, corners: [.topLeft, .topRight])
                    .offset(y: -24)
                }
            }
            .edgesIgnoringSafeArea(.top)
            
            // 3. Floating Bottom Action Bar (UI Kit CandidateActionBar)
            floatingBottomActionBar
        }
        .sheet(isPresented: $showingPdfSafari) {
            if let url = selectedPdfUrl {
                SafariView(url: url)
            }
        }
        .sheet(isPresented: $showingChatSheet) {
            ChatDetailView(profile: profile, currentUser: session.currentUser)
                .environmentObject(session)
        }
    }
    
    // MARK: - 1. Hero Header
    private var heroHeaderSection: some View {
        ZStack(alignment: .top) {
            // Photo or Fallback
            Group {
                if let imgName = profile.img, !imgName.isEmpty {
                    if imgName.hasPrefix("http") {
                        AsyncImage(url: URL(string: imgName)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color.appCardBackground
                        }
                    } else {
                        let localUrl = "https://shreerajputsagaisambandh.com/images/\(imgName).png"
                        AsyncImage(url: URL(string: localUrl)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color.appCardBackground
                        }
                    }
                } else {
                    LinearGradient(
                        colors: [Color.appPrimary, Color.appSecondary],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .overlay(
                        Text(String(profile.name.prefix(1)))
                            .font(BrandFonts.displayBold(size: 80))
                            .foregroundColor(.white)
                    )
                }
            }
            .frame(height: 380)
            .clipped()
            
            // Top Controls Bar (Dismiss & Share)
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color.appTextPrimary)
                        .frame(width: 42, height: 42)
                        .background(Color.white.opacity(0.92))
                        .clipShape(Circle())
                        .shadow(color: Color.black.opacity(0.1), radius: 8, y: 2)
                }
                
                Spacer()
                
                if isConnected {
                    Button(action: { showingChatSheet = true }) {
                        Image(systemName: "bubble.left.and.bubble.right.fill")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Color.appPrimary)
                            .frame(width: 42, height: 42)
                            .background(Color.white.opacity(0.92))
                            .clipShape(Circle())
                            .shadow(color: Color.black.opacity(0.1), radius: 8, y: 2)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 52)
        }
    }
    
    // MARK: - 2. Name & Verification
    private var nameAndVerificationHeader: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text("\(profile.name), \(profile.age)")
                        .font(BrandFonts.displayBold(size: 26))
                        .foregroundColor(Color.appTextPrimary)
                    
                    if profile.isVerified {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(Color.verifiedBlue)
                            .font(.system(size: 18))
                    }
                }
                
                Text("\(profile.occupation) • \(profile.location)")
                    .font(BrandFonts.body(size: 14))
                    .foregroundColor(Color.appTextSecondary)
            }
            Spacer()
        }
    }
    
    // MARK: - 3. Fact Chips Grid (UI Kit Interest / Fact Chips)
    private var factChipsGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                factChip(icon: "crown.fill", text: "\(profile.clan) Clan")
                factChip(icon: "shield.fill", text: "\(profile.gotra) Gotra")
                factChip(icon: "mappin.circle.fill", text: profile.thikana)
            }
            HStack(spacing: 8) {
                factChip(icon: "arrow.up.and.down", text: profile.height)
                if let rashi = profile.rashi, !rashi.isEmpty {
                    factChip(icon: "sparkles", text: rashi)
                }
                factChip(icon: "briefcase.fill", text: profile.education)
            }
        }
    }
    
    private func factChip(icon: String, text: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(Color.appPrimary)
            Text(text)
                .font(BrandFonts.body(size: 12.5, weight: .semibold))
                .foregroundColor(Color.appTextPrimary)
                .lineLimit(1)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.appCardBackground)
        .cornerRadius(14)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.appBorder, lineWidth: 1))
    }
    
    // MARK: - 4. Prompt Card (Hinge style)
    private func promptCard(title: String, content: String, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                    .foregroundColor(Color.appPrimary)
                Text(title)
                    .font(BrandFonts.label(size: 11, weight: .bold))
                    .foregroundColor(Color.appTextSecondary)
                    .tracking(1.0)
            }
            
            Text(content)
                .font(BrandFonts.body(size: 14.5))
                .foregroundColor(Color.appTextPrimary)
                .lineSpacing(4)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appCardBackground)
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.appBorder, lineWidth: 1))
    }
    
    // MARK: - 5. Lineage & Heritage Card
    private var lineageHeritageCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Image(systemName: "shield.lefthalf.filled")
                    .foregroundColor(Color.royalGold)
                Text("RAJPUT HERITAGE & LINEAGE")
                    .font(BrandFonts.label(size: 11, weight: .bold))
                    .foregroundColor(Color.appTextSecondary)
                    .tracking(1.0)
            }
            
            HStack(spacing: 16) {
                lineageItem(title: "Rajput Clan", value: profile.clan)
                lineageItem(title: "Paternal Gotra", value: profile.gotra)
            }
            
            HStack(spacing: 16) {
                lineageItem(title: "Thikana (Estate)", value: profile.thikana)
                lineageItem(title: "Maternal Gotra", value: profile.motherGotra ?? "Not Specified")
            }
        }
        .padding(18)
        .background(Color.white)
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.appBorder, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.03), radius: 8, y: 3)
    }
    
    private func lineageItem(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(BrandFonts.body(size: 11))
                .foregroundColor(Color.appTextMuted)
            Text(value)
                .font(BrandFonts.bodyBold(size: 13.5))
                .foregroundColor(Color.appTextPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    // MARK: - 6. Astro Specifications Card
    private var astroSpecificationsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .foregroundColor(Color.starPurple)
                Text("ASTROLOGY & SPECIFICATIONS")
                    .font(BrandFonts.label(size: 11, weight: .bold))
                    .foregroundColor(Color.appTextSecondary)
                    .tracking(1.0)
            }
            
            HStack(spacing: 16) {
                lineageItem(title: "Date of Birth", value: profile.dob ?? "Not Specified")
                lineageItem(title: "Zodiac / Rashi", value: profile.rashi ?? "Not Specified")
            }
            
            HStack(spacing: 16) {
                lineageItem(title: "Manglik Status", value: profile.manglik ?? "Non-Manglik")
                lineageItem(title: "Marital Status", value: profile.maritalStatus ?? "Never Married")
            }
        }
        .padding(18)
        .background(Color.white)
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.appBorder, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.03), radius: 8, y: 3)
    }
    
    // MARK: - 7. Profession & Education
    private var professionEducationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "graduationcap.fill")
                    .foregroundColor(Color.appPrimary)
                Text("CAREER & EDUCATION")
                    .font(BrandFonts.label(size: 11, weight: .bold))
                    .foregroundColor(Color.appTextSecondary)
                    .tracking(1.0)
            }
            
            HStack(spacing: 16) {
                lineageItem(title: "Occupation", value: profile.occupation)
                lineageItem(title: "Education", value: profile.education)
            }
            
            if !profile.income.isEmpty {
                lineageItem(title: "Annual Income", value: profile.income)
            }
        }
        .padding(18)
        .background(Color.white)
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.appBorder, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.03), radius: 8, y: 3)
    }
    
    // MARK: - 8. Unlocked Contact Card
    private var unlockedContactCard: some View {
        let socials = SupabaseClient.shared.getSocialLinks(from: profile.about)
        let ig = socials["instagram"] ?? ""
        let fb = socials["facebook"] ?? ""
        let pdf = SupabaseClient.shared.getBiodataLink(from: profile.about)
        
        return VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image(systemName: "lock.open.fill")
                    .foregroundColor(Color.successGreen)
                Text("VERIFIED CONTACT & BIODATA")
                    .font(BrandFonts.label(size: 11, weight: .bold))
                    .foregroundColor(Color.successGreen)
                    .tracking(1.0)
            }
            
            if let phone = profile.phone, !phone.isEmpty {
                HStack {
                    Image(systemName: "phone.fill")
                        .foregroundColor(Color.appTextSecondary)
                    Text(phone)
                        .font(BrandFonts.bodyBold(size: 15))
                        .foregroundColor(Color.appTextPrimary)
                }
            }
            
            // Social buttons
            if !ig.isEmpty || !fb.isEmpty {
                HStack(spacing: 12) {
                    if !ig.isEmpty {
                        Button(action: {
                            var urlStr = ig
                            if !urlStr.hasPrefix("http") {
                                urlStr = "https://instagram.com/\(urlStr.trimmingCharacters(in: .whitespaces))"
                            }
                            if let url = URL(string: urlStr) {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "camera.fill")
                                Text("Instagram")
                            }
                            .font(BrandFonts.bodyBold(size: 12))
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color.starPurple)
                            .cornerRadius(10)
                        }
                    }
                    
                    if !fb.isEmpty {
                        Button(action: {
                            var urlStr = fb
                            if !urlStr.hasPrefix("http") {
                                urlStr = "https://facebook.com/\(urlStr.trimmingCharacters(in: .whitespaces))"
                            }
                            if let url = URL(string: urlStr) {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "link")
                                Text("Facebook")
                            }
                            .font(BrandFonts.bodyBold(size: 12))
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .cornerRadius(10)
                        }
                    }
                }
            }
            
            if !pdf.isEmpty {
                Button(action: {
                    if let url = URL(string: pdf) {
                        selectedPdfUrl = url
                        showingPdfSafari = true
                    }
                }) {
                    HStack {
                        Image(systemName: "doc.plaintext.fill")
                        Text("View Ancestral Biodata (PDF)")
                    }
                    .font(BrandFonts.bodyBold(size: 13))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.appTextPrimary)
                    .cornerRadius(12)
                }
            }
        }
        .padding(18)
        .background(Color.successGreen.opacity(0.06))
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.successGreen.opacity(0.25), lineWidth: 1))
    }
    
    // MARK: - 9. Floating Bottom Action Bar
    private var floatingBottomActionBar: some View {
        VStack(spacing: 0) {
            Divider()
                .background(Color.appDivider)
            
            HStack(spacing: 12) {
                if isUnlockedOrOwn && !isMyOwnProfile {
                    // Chat CTA
                    Button(action: { showingChatSheet = true }) {
                        HStack(spacing: 6) {
                            Image(systemName: "bubble.left.and.bubble.right.fill")
                            Text("Start Chat")
                        }
                        .font(BrandFonts.bodyBold(size: 14))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.appSecondary],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(25)
                        .shadow(color: Color.appPrimary.opacity(0.35), radius: 8, y: 4)
                    }
                    
                    if let phone = profile.phone, !phone.isEmpty {
                        // Call
                        Button(action: {
                            let clean = phone.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                            if let url = URL(string: "tel://\(clean)") {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            Image(systemName: "phone.fill")
                                .font(.system(size: 18))
                                .foregroundColor(.white)
                                .frame(width: 50, height: 50)
                                .background(Color.successGreen)
                                .clipShape(Circle())
                                .shadow(color: Color.successGreen.opacity(0.35), radius: 8, y: 4)
                        }
                        
                        // WhatsApp
                        Button(action: {
                            var clean = phone.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                            if clean.count == 10 { clean = "91" + clean }
                            if let url = URL(string: "https://wa.me/\(clean)") {
                                UIApplication.shared.open(url)
                            }
                        }) {
                            Image(systemName: "message.fill")
                                .font(.system(size: 18))
                                .foregroundColor(.white)
                                .frame(width: 50, height: 50)
                                .background(Color(hex: "#25D366"))
                                .clipShape(Circle())
                                .shadow(color: Color(hex: "#25D366").opacity(0.35), radius: 8, y: 4)
                        }
                    }
                } else if !isMyOwnProfile {
                    // Pass Button
                    Button(action: {
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(Color.dislikeRed)
                            .frame(width: 50, height: 50)
                            .background(Color.white)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.dislikeRed.opacity(0.3), lineWidth: 1.5))
                            .shadow(color: Color.black.opacity(0.06), radius: 8, y: 4)
                    }
                    
                    // Main Interest CTA
                    if isInterestReceivedFromCandidate {
                        Button(action: acceptIncomingInterest) {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Accept Rishta & Connect")
                            }
                            .font(BrandFonts.bodyBold(size: 14))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(
                                LinearGradient(
                                    colors: [Color.successGreen, Color(hex: "#059669")],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(25)
                            .shadow(color: Color.successGreen.opacity(0.35), radius: 8, y: 4)
                        }
                    } else if isInterestSentByMe {
                        HStack(spacing: 6) {
                            Image(systemName: "clock.arrow.circlepath")
                            Text("Rishta Sent (Pending)")
                        }
                        .font(BrandFonts.bodyBold(size: 14))
                        .foregroundColor(Color.appPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.appPrimary.opacity(0.12))
                        .cornerRadius(25)
                    } else {
                        Button(action: sendMatchInterest) {
                            HStack(spacing: 6) {
                                if isSendingInterest {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Image(systemName: "heart.fill")
                                    Text("Express Rishta")
                                }
                            }
                            .font(BrandFonts.bodyBold(size: 14))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color.appSecondary],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(25)
                            .shadow(color: Color.appPrimary.opacity(0.35), radius: 8, y: 4)
                        }
                        .disabled(isSendingInterest)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 10)
            .padding(.bottom, 24)
            .background(Color.white)
        }
    }
    
    // MARK: - Actions
    private func sendMatchInterest() {
        guard let currentUser = session.currentUser else { return }
        isSendingInterest = true
        SupabaseClient.shared.sendConnection(senderId: currentUser.id, receiverId: profile.id) { _ in
            DispatchQueue.main.async {
                isSendingInterest = false
                session.refreshCurrentUserAbout()
                session.fetchConnectionsAndGenerateNotifications()
            }
        }
        SupabaseClient.shared.notifyAdminInterestSent(fromUser: currentUser, toProfile: profile)
    }
    
    private func acceptIncomingInterest() {
        guard let currentUser = session.currentUser else { return }
        SupabaseClient.shared.updateConnection(senderId: profile.id, receiverId: currentUser.id, status: "accepted") { _ in
            DispatchQueue.main.async {
                session.refreshCurrentUserAbout()
                session.fetchConnectionsAndGenerateNotifications()
            }
        }
    }
    
    private func performUnlock() {
        if !hasDirectAccess {
            presentationMode.wrappedValue.dismiss()
            return
        }
        
        showingUnlockProgress = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            showingUnlockProgress = false
            unlockSuccess = true
            session.unlockProfile(id: profile.id)
        }
    }
}
