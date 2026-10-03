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
        guard var bio = profile.about else { return "" }
        // Strip [Social Links: ...], [Biodata Link: ...], [Interests: ...], [Chats: ...]
        let patterns = [
            "\\[Social Links: [^\\]]*\\]",
            "\\[Biodata Link: [^\\]]*\\]",
            "\\[Interests: [^\\]]*\\]",
            "\\[Chats: [^\n\r]*\\]"
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
                let nsRange = NSRange(bio.startIndex..<bio.endIndex, in: bio)
                bio = regex.stringByReplacingMatches(in: bio, options: [], range: nsRange, withTemplate: "")
            }
        }
        return bio.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private var isUnlockedOrOwn: Bool {
        guard let currentUser = session.currentUser else { return false }
        return currentUser.id == profile.id || session.isUnlocked(id: profile.id) || session.areConnected(profileId: profile.id) || unlockSuccess
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Bar
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.down.circle.fill")
                        .font(.system(size: 26))
                        .foregroundColor(.gray)
                }
                Spacer()
                Text("Lineage Details")
                    .font(BrandFonts.label(size: 14))
                    .foregroundColor(.royalMaroon)
                    .fontWeight(.bold)
                Spacer()
                Color.clear.frame(width: 26, height: 26)
            }
            .padding(.horizontal, 20)
            .padding(.top, 15)
            .padding(.bottom, 10)
            .background(Color.cardBackground)
            
            ScrollView {
                VStack(spacing: 20) {
                    // Profile Photo Frame
                    ZStack {
                        if let imgName = profile.img, !imgName.isEmpty {
                            if imgName.hasPrefix("http") {
                                AsyncImage(url: URL(string: imgName)) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    ZStack {
                                        Color.deepMaroon
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                                    }
                                }
                            } else {
                                let localUrl = "https://shreerajputsagaisambandh.com/images/\(imgName).png"
                                AsyncImage(url: URL(string: localUrl)) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    ZStack {
                                        Color.deepMaroon
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                                    }
                                }
                            }
                        } else {
                            LinearGradient(colors: [.royalMaroon, .deepMaroon], startPoint: .topLeading, endPoint: .bottomTrailing)
                                .overlay(
                                    Text(profile.name.components(separatedBy: " ").map { String($0.prefix(1)) }.joined())
                                        .font(.system(size: 48, weight: .bold, design: .serif))
                                        .foregroundColor(.white)
                                )
                        }
                    }
                    .frame(width: 180, height: 220)
                    .clipShape(JharokhaShape())
                    .overlay(JharokhaBorder(lineWidth: 3))
                    .padding(.top, 15)
                    
                    // Name & Basic Info
                    VStack(spacing: 6) {
                        HStack {
                            Text(profile.name)
                                .font(BrandFonts.displayBold(size: 24))
                                .foregroundColor(.royalMaroon)
                            
                            if profile.isVerified {
                                Image(systemName: "checkmark.seal.fill")
                                    .foregroundColor(Color(hex: "#2ecc71"))
                                    .font(.system(size: 18))
                            }
                        }
                        
                        Text("\(profile.age) Yrs • \(profile.height) • \(profile.location)")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.gray)
                    }
                    
                    // Rajput Lineage Parameters
                    VStack(alignment: .leading, spacing: 15) {
                        Text("HERITAGE & LINEAGE")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.gray)
                            .tracking(1.5)
                        
                        HStack(spacing: 20) {
                            LineageTag(label: "Rajput Clan", value: profile.clan)
                            LineageTag(label: "Paternal Gotra", value: profile.gotra)
                        }
                        
                        HStack(spacing: 20) {
                            LineageTag(label: "Thikana (Estate)", value: profile.thikana)
                            LineageTag(label: "Maternal Gotra", value: profile.motherGotra ?? "Not Specified")
                        }
                    }
                    .padding(20)
                    .background(Color.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.15), lineWidth: 1)
                    )
                    
                    // Astro & Specifications
                    VStack(alignment: .leading, spacing: 15) {
                        Text("SPECIFICATIONS & ASTROLOGICS")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.gray)
                            .tracking(1.5)
                        
                        HStack(spacing: 20) {
                            LineageTag(label: "Date of Birth", value: profile.dob ?? "Not Specified")
                            LineageTag(label: "Zodiac / Rashi", value: profile.rashi ?? "Not Specified")
                        }
                        
                        HStack(spacing: 20) {
                            LineageTag(label: "Manglik Status", value: profile.manglik ?? "Non-Manglik")
                            LineageTag(label: "Marital Status", value: profile.maritalStatus ?? "Never Married")
                        }
                    }
                    .padding(20)
                    .background(Color.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.15), lineWidth: 1)
                    )
                    
                    // Professional & Educational details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("PROFESSION & EDUCATION")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.gray)
                            .tracking(1.5)
                            .padding(.bottom, 4)
                        
                        InfoRow(label: "Occupation", value: profile.occupation)
                        InfoRow(label: "Education", value: profile.education)
                        InfoRow(label: "Annual Income", value: profile.income)
                    }
                    .padding(20)
                    .background(Color.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.15), lineWidth: 1)
                    )
                    
                    // Biography & Partner Expectations
                    VStack(alignment: .leading, spacing: 12) {
                        Text("BIOGRAPHY & ALIGNMENT EXPECTATIONS")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.gray)
                            .tracking(1.5)
                            .padding(.bottom, 4)
                        
                        if !cleanAboutText.isEmpty {
                            Text("About Me")
                                .font(BrandFonts.bodyBold(size: 12))
                                .foregroundColor(.royalMaroon)
                            Text(cleanAboutText)
                                .font(BrandFonts.body(size: 13))
                                .foregroundColor(.inkBrown)
                                .padding(.bottom, 8)
                        }
                        
                        if let expectations = profile.expectations, !expectations.isEmpty {
                            Text("Partner Expectations")
                                .font(BrandFonts.bodyBold(size: 12))
                                .foregroundColor(.royalMaroon)
                            Text(expectations)
                                .font(BrandFonts.body(size: 13))
                                .foregroundColor(.inkBrown)
                        }
                    }
                    .padding(20)
                    .background(Color.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.15), lineWidth: 1)
                    )
                    
                    // Contact details locked / unlocked state box
                    VStack(spacing: 15) {
                        HStack {
                            Image(systemName: "phone.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.royalGold)
                            Text("Direct Contact Details")
                                .font(BrandFonts.label(size: 12))
                                .foregroundColor(.royalMaroon)
                                .fontWeight(.bold)
                            Spacer()
                        }
                        
                        if isUnlockedOrOwn {
                            // Unlocked Details display
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Image(systemName: "phone.fill")
                                        .foregroundColor(.royalMaroon)
                                    Text(profile.phone ?? "Not Specified")
                                        .font(BrandFonts.body(size: 14, weight: .bold))
                                }
                                HStack {
                                    Image(systemName: "envelope.fill")
                                        .foregroundColor(.royalMaroon)
                                    Text((profile.email?.isEmpty == false ? profile.email : nil) ?? (profile.id.contains("-") ? "\(profile.name.lowercased().replacingOccurrences(of: " ", with: "."))@shreerajputsagaisambandh-member.com" : "Not Specified"))
                                        .font(BrandFonts.body(size: 14, weight: .bold))
                                }
                                HStack {
                                    Image(systemName: "mappin.and.ellipse")
                                        .foregroundColor(.royalMaroon)
                                    Text(profile.location)
                                        .font(BrandFonts.body(size: 14))
                                }
                                
                                // Social links if present
                                let ig = profile.instagram ?? ""
                                let fb = profile.facebook ?? ""
                                let pdf = profile.biodataUrl ?? ""
                                
                                if !ig.isEmpty || !fb.isEmpty || !pdf.isEmpty {
                                    Divider().padding(.vertical, 8)
                                    
                                    Text("SOCIALS & DOCUMENTS")
                                        .font(BrandFonts.label(size: 9))
                                        .foregroundColor(.gray)
                                        .tracking(1)
                                        .padding(.bottom, 4)
                                    
                                    HStack(spacing: 10) {
                                        if !ig.isEmpty {
                                            Button(action: {
                                                var urlStr = ig
                                                if !urlStr.hasPrefix("http") {
                                                    urlStr = "https://instagram.com/\(urlStr.replacingOccurrences(of: "@", with: "").trimmingCharacters(in: .whitespaces))"
                                                }
                                                if let url = URL(string: urlStr) {
                                                    UIApplication.shared.open(url)
                                                }
                                            }) {
                                                HStack(spacing: 4) {
                                                    Image(systemName: "camera.fill")
                                                    Text("Instagram")
                                                }
                                                .font(BrandFonts.bodyBold(size: 11))
                                                .foregroundColor(.white)
                                                .padding(.horizontal, 12)
                                                .padding(.vertical, 6)
                                                .background(Color.pink.opacity(0.8))
                                                .cornerRadius(6)
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
                                                .font(BrandFonts.bodyBold(size: 11))
                                                .foregroundColor(.white)
                                                .padding(.horizontal, 12)
                                                .padding(.vertical, 6)
                                                .background(Color.blue.opacity(0.8))
                                                .cornerRadius(6)
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
                                            .font(BrandFonts.bodyBold(size: 12))
                                            .foregroundColor(.deepMaroon)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 8)
                                            .background(Color.royalGold)
                                            .cornerRadius(6)
                                            .padding(.top, 4)
                                        }
                                    }
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(15)
                            .background(Color.green.opacity(0.06))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.green.opacity(0.2), lineWidth: 1)
                            )
                            
                            // Unlocked Actions: Chat, Call, WhatsApp
                            if !isMyOwnProfile {
                                VStack(spacing: 10) {
                                    Button(action: { showingChatSheet = true }) {
                                        HStack {
                                            Image(systemName: "bubble.left.and.bubble.right.fill")
                                            Text("💬 Start Royal Chat")
                                                .font(BrandFonts.bodyBold(size: 14))
                                        }
                                        .foregroundColor(.deepMaroon)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 44)
                                        .background(Color.royalGold)
                                        .cornerRadius(8)
                                        .shadow(color: Color.black.opacity(0.15), radius: 2)
                                    }
                                    
                                    if let phone = profile.phone, !phone.isEmpty {
                                        HStack(spacing: 10) {
                                            Button(action: {
                                                let clean = phone.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                                                if let url = URL(string: "tel://\(clean)") {
                                                    UIApplication.shared.open(url)
                                                }
                                            }) {
                                                HStack(spacing: 6) {
                                                    Image(systemName: "phone.fill")
                                                    Text("Call")
                                                        .font(BrandFonts.bodyBold(size: 13))
                                                }
                                                .foregroundColor(.white)
                                                .frame(maxWidth: .infinity)
                                                .frame(height: 40)
                                                .background(Color.green)
                                                .cornerRadius(8)
                                            }
                                            
                                            Button(action: {
                                                var clean = phone.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                                                if clean.count == 10 { clean = "91" + clean }
                                                if let url = URL(string: "https://wa.me/\(clean)") {
                                                    UIApplication.shared.open(url)
                                                }
                                            }) {
                                                HStack(spacing: 6) {
                                                    Image(systemName: "message.fill")
                                                    Text("WhatsApp")
                                                        .font(BrandFonts.bodyBold(size: 13))
                                                }
                                                .foregroundColor(.white)
                                                .frame(maxWidth: .infinity)
                                                .frame(height: 40)
                                                .background(Color(hex: "#25D366"))
                                                .cornerRadius(8)
                                            }
                                        }
                                    }
                                }
                                .padding(.top, 4)
                            }
                        } else {
                            // Locked State details box
                            VStack(spacing: 14) {
                                Text("Lineage contact details are secured. Connect or upgrade to unlock direct communication.")
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(.gray)
                                    .multilineTextAlignment(.center)
                                
                                if !isMyOwnProfile {
                                    if isInterestReceivedFromCandidate {
                                        VStack(spacing: 8) {
                                            Text("💌 \(profile.name) sent you a Match Interest!")
                                                .font(BrandFonts.bodyBold(size: 13))
                                                .foregroundColor(.royalMaroon)
                                            Button(action: acceptIncomingInterest) {
                                                HStack {
                                                    Image(systemName: "checkmark.circle.fill")
                                                    Text("Accept Interest & Connect")
                                                        .font(BrandFonts.bodyBold(size: 13))
                                                }
                                                .foregroundColor(.deepMaroon)
                                                .frame(maxWidth: .infinity)
                                                .frame(height: 42)
                                                .background(Color.royalGold)
                                                .cornerRadius(8)
                                            }
                                        }
                                    } else if isInterestSentByMe {
                                        HStack(spacing: 8) {
                                            Image(systemName: "clock.arrow.circlepath")
                                            Text("Match Interest Sent (Pending Acceptance)")
                                                .font(BrandFonts.bodyBold(size: 12))
                                        }
                                        .foregroundColor(.royalGold)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(Color.royalGold.opacity(0.12))
                                        .cornerRadius(8)
                                    } else {
                                        Button(action: sendMatchInterest) {
                                            HStack {
                                                if isSendingInterest {
                                                    ProgressView()
                                                        .progressViewStyle(CircularProgressViewStyle(tint: .deepMaroon))
                                                } else {
                                                    Image(systemName: "heart.fill")
                                                    Text("💌 Express Royal Match Interest")
                                                        .font(BrandFonts.bodyBold(size: 13))
                                                }
                                            }
                                            .foregroundColor(.deepMaroon)
                                            .frame(maxWidth: .infinity)
                                            .frame(height: 42)
                                            .background(Color.royalGold)
                                            .cornerRadius(8)
                                        }
                                        .disabled(isSendingInterest)
                                    }
                                }
                                
                                if showingUnlockProgress {
                                    ProgressView("Securing Lineage...")
                                        .padding()
                                } else {
                                    Button(action: performUnlock) {
                                        Text(hasDirectAccess ? "Unlock Profile Card Directly" : "Upgrade Membership to Unlock Contact")
                                            .font(BrandFonts.body(size: 12, weight: .bold))
                                            .foregroundColor(hasDirectAccess ? .royalMaroon : .white)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 8)
                                            .background(hasDirectAccess ? Color.lightGold : Color.royalMaroon)
                                            .cornerRadius(8)
                                    }
                                }
                            }
                            .padding(15)
                            .frame(maxWidth: .infinity)
                            .background(Color.royalGold.opacity(0.05))
                            .cornerRadius(8)
                        }
                    }
                    .padding(20)
                    .background(Color.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.15), lineWidth: 1)
                    )
                }
                .padding(20)
            }
        }
        .background(Color.sandstoneIvory.edgesIgnoringSafeArea(.all))
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

struct LineageTag: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(BrandFonts.label(size: 8))
                .foregroundColor(.gray)
            Text(value)
                .font(BrandFonts.body(size: 14, weight: .semibold))
                .foregroundColor(.inkBrown)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(BrandFonts.body(size: 11, weight: .bold))
                .foregroundColor(.gray)
            Text(value)
                .font(BrandFonts.body(size: 13))
                .foregroundColor(.inkBrown)
        }
        .padding(.vertical, 2)
    }
}
