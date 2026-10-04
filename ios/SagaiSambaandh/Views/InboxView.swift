import SwiftUI

struct InboxView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @State private var selectedSubTab: Int = 0 // 0 = Received, 1 = Accepted, 2 = Sent
    @State private var connections: [ConnectionRecord] = []
    @State private var isLoading: Bool = false
    
    var body: some View {
        ZStack {
            Color.white.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // Top Custom Header
                HStack {
                    Text("Requests")
                        .font(BrandFonts.displayBold(size: 26))
                        .foregroundColor(Color.appTextPrimary)
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 14)
                .padding(.bottom, 10)
                
                // Sub Tabs Selection
                Picker("SubTabs", selection: $selectedSubTab) {
                    Text("Received").tag(0)
                    Text("Accepted").tag(1)
                    Text("Sent").tag(2)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                
                if isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Color.appPrimary))
                    Spacer()
                } else if filteredConnections.isEmpty {
                    emptyState
                } else {
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 12) {
                            ForEach(filteredConnections, id: \.self) { record in
                                if let profile = lookupProfile(for: record) {
                                    connectionRow(for: record, profile: profile)
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                    }
                }
            }
        }
        .navigationBarHidden(true)
        .onAppear(perform: loadConnections)
    }
    
    private var filteredConnections: [ConnectionRecord] {
        guard let currentUserId = session.currentUser?.id else { return [] }
        switch selectedSubTab {
        case 0:
            // Received: receiver is me, status is pending
            return connections.filter { $0.receiver_id == currentUserId && $0.status == "pending" }
        case 1:
            // Accepted: either is me, status is accepted
            return connections.filter { $0.status == "accepted" }
        case 2:
            // Sent: sender is me, status is pending
            return connections.filter { $0.sender_id == currentUserId && $0.status == "pending" }
        default:
            return []
        }
    }
    
    private func lookupProfile(for record: ConnectionRecord) -> Profile? {
        guard let currentUserId = session.currentUser?.id else { return nil }
        let targetId = record.sender_id == currentUserId ? record.receiver_id : record.sender_id
        return session.profiles.first { $0.id == targetId }
    }
    
    private func loadConnections() {
        guard let userId = session.currentUser?.id else { return }
        isLoading = true
        SupabaseClient.shared.fetchConnections(userId: userId) { result in
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success(let fetched):
                    self.connections = fetched
                case .failure(let error):
                    print("Error loading connections: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func handleAccept(record: ConnectionRecord) {
        guard let currentUserId = session.currentUser?.id else { return }
        let otherUserId = record.sender_id == currentUserId ? record.receiver_id : record.sender_id
        SupabaseClient.shared.updateConnection(senderId: otherUserId, receiverId: currentUserId, status: "accepted") { result in
            DispatchQueue.main.async {
                if case .success = result {
                    self.loadConnections()
                    self.session.refreshCurrentUserAbout()
                }
            }
        }
    }
    
    private func handleDecline(record: ConnectionRecord) {
        guard let currentUserId = session.currentUser?.id else { return }
        let otherUserId = record.sender_id == currentUserId ? record.receiver_id : record.sender_id
        SupabaseClient.shared.updateConnection(senderId: otherUserId, receiverId: currentUserId, status: "declined") { result in
            DispatchQueue.main.async {
                if case .success = result {
                    self.loadConnections()
                    self.session.refreshCurrentUserAbout()
                }
            }
        }
    }
    
    private func connectionRow(for record: ConnectionRecord, profile: Profile) -> some View {
        HStack(spacing: 14) {
            AvatarImageView(
                imageSource: profile.img,
                name: profile.name,
                clan: profile.clan,
                contentMode: .fill,
                fallbackFontSize: 20
            )
            .frame(width: 52, height: 52)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 4) {
                    Text(profile.name)
                        .font(BrandFonts.displayBold(size: 15))
                        .foregroundColor(Color.appTextPrimary)
                    if profile.isVerified {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 12))
                            .foregroundColor(Color.verifiedBlue)
                    }
                }
                
                Text("\(profile.clan) Clan • \(profile.gotra) Gotra")
                    .font(BrandFonts.body(size: 12, weight: .medium))
                    .foregroundColor(Color.appTextSecondary)
                
                Text("Native: \(profile.thikana)")
                    .font(BrandFonts.body(size: 11))
                    .foregroundColor(Color.appTextMuted)
            }
            
            Spacer()
            
            if selectedSubTab == 0 {
                HStack(spacing: 8) {
                    Button(action: { handleDecline(record: record) }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color.dislikeRed)
                            .frame(width: 36, height: 36)
                            .background(Color.dislikeRed.opacity(0.1))
                            .clipShape(Circle())
                    }
                    Button(action: { handleAccept(record: record) }) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color.successGreen)
                            .frame(width: 36, height: 36)
                            .background(Color.successGreen.opacity(0.12))
                            .clipShape(Circle())
                    }
                }
            } else if selectedSubTab == 1 {
                NavigationLink(destination: ChatDetailView(profile: profile, currentUser: session.currentUser)) {
                    HStack(spacing: 4) {
                        Image(systemName: "bubble.left.and.bubble.right.fill")
                            .font(.system(size: 11))
                        Text("Chat")
                            .font(BrandFonts.bodyBold(size: 12))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(
                        LinearGradient(
                            colors: [Color.appPrimary, Color.appSecondary],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(Capsule())
                    .shadow(color: Color.appPrimary.opacity(0.3), radius: 4, y: 2)
                }
            } else {
                Text("Pending")
                    .font(BrandFonts.body(size: 11, weight: .semibold))
                    .foregroundColor(Color.appTextSecondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.appCardBackground)
                    .clipShape(Capsule())
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.03), radius: 6, y: 2)
    }
    
    private var emptyState: some View {
        VStack {
            Spacer()
            VStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Color.appCardBackground)
                        .frame(width: 80, height: 80)
                    
                    Image(systemName: "envelope.open.fill")
                        .font(.system(size: 34))
                        .foregroundColor(Color.appTextMuted)
                }
                
                Text(selectedSubTab == 0 ? "No Pending Requests" : (selectedSubTab == 1 ? "No Active Connections" : "No Sent Requests"))
                    .font(BrandFonts.displayBold(size: 17))
                    .foregroundColor(Color.appTextPrimary)
                
                Text("Lineage compatibility checks are run in real-time. Invite other members to connect and establish family trust.")
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(Color.appTextSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 36)
            }
            Spacer()
        }
    }
}

struct SupabaseMessage: Hashable {
    var id: String
    var senderId: String
    var text: String
    var time: Double
}

struct ChatDetailView: View {
    let profile: Profile
    let currentUser: User?
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    @State private var messageText: String = ""
    @State private var messages: [SupabaseMessage] = []
    @State private var timer: Timer? = nil
    @State private var isSending: Bool = false
    
    private let quickChips = [
        "Khammaghani Sa 🙏",
        "Seeking gotra & lineage compatibility",
        "Our family sends noble regards",
        "Could you please share your ancestral biodata?"
    ]
    
    var body: some View {
        VStack(spacing: 0) {
            // Modern Light Header Bar
            HStack(spacing: 12) {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color.appTextPrimary)
                        .frame(width: 36, height: 36)
                        .background(Color.appCardBackground)
                        .clipShape(Circle())
                }
                
                AvatarImageView(
                    imageSource: profile.img,
                    name: profile.name,
                    clan: profile.clan,
                    contentMode: .fill,
                    fallbackFontSize: 18
                )
                .frame(width: 42, height: 42)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text(profile.name)
                            .font(BrandFonts.body(size: 16, weight: .bold))
                            .foregroundColor(Color.appTextPrimary)
                            .lineLimit(1)
                        if profile.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 13))
                                .foregroundColor(Color.verifiedBlue)
                        }
                    }
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.successGreen)
                            .frame(width: 6, height: 6)
                        Text("\(profile.clan) Clan • Online")
                            .font(BrandFonts.body(size: 11.5))
                            .foregroundColor(Color.appTextSecondary)
                    }
                }
                
                Spacer()
                
                if let phone = profile.phone, !phone.isEmpty, session.areConnected(profileId: profile.id) || session.isUnlocked(id: profile.id) {
                    Button(action: {
                        let clean = phone.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                        if let url = URL(string: "tel://\(clean)") {
                            UIApplication.shared.open(url)
                        }
                    }) {
                        Image(systemName: "phone.fill")
                            .font(.system(size: 15))
                            .foregroundColor(Color.appPrimary)
                            .frame(width: 36, height: 36)
                            .background(Color.appPrimary.opacity(0.1))
                            .clipShape(Circle())
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color.white)
            .overlay(Divider().background(Color.appDivider), alignment: .bottom)
            
            // Messages Scroll Area
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        // Trust & Lineage Pill
                        HStack {
                            Spacer()
                            HStack(spacing: 6) {
                                Image(systemName: "lock.shield.fill")
                                    .foregroundColor(Color.appPrimary)
                                    .font(.system(size: 12))
                                Text("End-to-End Rajput Verified Dialogue • Synced")
                                    .font(BrandFonts.body(size: 11, weight: .semibold))
                                    .foregroundColor(Color.appTextSecondary)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .background(Color.appCardBackground)
                            .clipShape(Capsule())
                            .padding(.top, 12)
                            Spacer()
                        }
                        
                        if messages.isEmpty {
                            VStack(spacing: 6) {
                                Text("No messages yet")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(Color.appTextPrimary)
                                Text("Say hello to \(profile.name.components(separatedBy: " ").first ?? profile.name)!")
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(Color.appTextSecondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 36)
                        }
                        
                        ForEach(messages, id: \.id) { msg in
                            let isMe = msg.senderId == currentUser?.id
                            HStack(alignment: .bottom, spacing: 6) {
                                if isMe { Spacer(minLength: 40) }
                                
                                VStack(alignment: isMe ? .trailing : .leading, spacing: 3) {
                                    Text(msg.text)
                                        .font(BrandFonts.body(size: 14.5))
                                        .foregroundColor(isMe ? .white : Color.appTextPrimary)
                                        .padding(.horizontal, 15)
                                        .padding(.vertical, 10)
                                        .background(
                                            Group {
                                                if isMe {
                                                    LinearGradient(
                                                        colors: [Color.appPrimary, Color.appSecondary],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                } else {
                                                    LinearGradient(
                                                        colors: [Color.appCardBackground, Color.appCardBackground],
                                                        startPoint: .top,
                                                        endPoint: .bottom
                                                    )
                                                }
                                            }
                                        )
                                        .cornerRadius(18)
                                    
                                    if msg.time > 0 {
                                        let date = Date(timeIntervalSince1970: msg.time / 1000)
                                        Text(formatMessageTime(date))
                                            .font(BrandFonts.body(size: 10))
                                            .foregroundColor(Color.appTextMuted)
                                            .padding(.horizontal, 4)
                                    }
                                }
                                
                                if !isMe { Spacer(minLength: 40) }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }
            .background(Color.white)
            
            // Quick reply chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(quickChips, id: \.self) { chip in
                        Button(action: {
                            messageText = chip
                        }) {
                            Text(chip)
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(Color.appTextPrimary)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 7)
                                .background(Color.appCardBackground)
                                .cornerRadius(14)
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.appBorder, lineWidth: 1))
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
            }
            .background(Color.white)
            
            // Modern Input Bar
            HStack(spacing: 10) {
                TextField("Type a message...", text: $messageText)
                    .font(BrandFonts.body(size: 14))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .background(Color.appCardBackground)
                    .cornerRadius(22)
                    .foregroundColor(Color.appTextPrimary)
                    .disabled(isSending)
                
                Button(action: sendMessage) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color.appSecondary],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 42, height: 42)
                            .shadow(color: Color.appPrimary.opacity(0.35), radius: 6, y: 3)
                        
                        if isSending {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 16))
                                .foregroundColor(.white)
                        }
                    }
                }
                .disabled(messageText.trimmingCharacters(in: .whitespaces).isEmpty || isSending)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color.white)
            .overlay(Divider().background(Color.appDivider), alignment: .top)
        }
        .background(Color.white.edgesIgnoringSafeArea(.all))
        .onAppear {
            if let user = session.currentUser ?? currentUser {
                SupabaseClient.shared.notifyAdminChatOpened(fromUser: user, toProfile: profile)
                loadMessages()
                fetchFreshMessages()
                startPolling()
            }
        }
        .onDisappear {
            timer?.invalidate()
            timer = nil
        }
    }
    
    private func formatMessageTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }
    
    private func loadMessages() {
        guard let currentUserId = session.currentUser?.id ?? currentUser?.id else { return }
        let currentAbout = session.currentUser?.about ?? currentUser?.about
        let currentProfile = session.profiles.first(where: { $0.id == profile.id }) ?? profile
        let combinedDicts = SupabaseClient.shared.getCombinedConversation(
            aboutA: currentAbout,
            idA: currentUserId,
            aboutB: currentProfile.about,
            idB: currentProfile.id
        )
        self.messages = combinedDicts.map { dict -> SupabaseMessage in
            let s = dict["s"] as? String ?? ""
            let t = dict["t"] as? String ?? ""
            let time = dict["time"] as? Double ?? 0.0
            return SupabaseMessage(id: "\(s)_\(time)", senderId: s, text: t, time: time)
        }
    }
    
    private func fetchFreshMessages() {
        guard let myId = session.currentUser?.id ?? currentUser?.id else { return }
        SupabaseClient.shared.fetchProfileAbout(profileId: profile.id) { updatedPartnerAbout in
            DispatchQueue.main.async {
                if let updatedPartnerAbout = updatedPartnerAbout {
                    if let index = session.profiles.firstIndex(where: { $0.id == profile.id }) {
                        session.profiles[index].about = updatedPartnerAbout
                    }
                }
                SupabaseClient.shared.fetchProfileAbout(profileId: myId) { myUpdatedAbout in
                    DispatchQueue.main.async {
                        if let myUpdatedAbout = myUpdatedAbout {
                            session.updateCurrentUserAbout(myUpdatedAbout)
                        }
                        loadMessages()
                    }
                }
            }
        }
    }
    
    private func startPolling() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { _ in
            fetchFreshMessages()
        }
    }
    
    private func sendMessage() {
        guard let user = session.currentUser ?? currentUser, !messageText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        let textToSend = messageText
        messageText = ""
        isSending = true
        
        // Optimistic local update
        let timestamp = Date().timeIntervalSince1970 * 1000
        let newMsg = SupabaseMessage(id: "\(user.id)_\(timestamp)", senderId: user.id, text: textToSend, time: timestamp)
        self.messages.append(newMsg)
        
        // Send via SupabaseClient
        SupabaseClient.shared.sendMessage(fromUser: user, toProfile: profile, text: textToSend) { success, updatedAbout in
            DispatchQueue.main.async {
                self.isSending = false
                if success {
                    if let updatedAbout = updatedAbout {
                        self.session.updateCurrentUserAbout(updatedAbout)
                    }
                    self.loadMessages()
                } else {
                    print("Error syncing message to Supabase.")
                }
            }
        }
    }
}
