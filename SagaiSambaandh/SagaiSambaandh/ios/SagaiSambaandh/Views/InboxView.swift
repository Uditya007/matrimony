import SwiftUI

struct InboxView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @State private var selectedSubTab: Int = 0 // 0 = Received, 1 = Accepted, 2 = Sent
    @State private var connections: [ConnectionRecord] = []
    @State private var isLoading: Bool = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Custom Toolbar
            HStack {
                Spacer()
                Text("Inbox & Connections")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(.lightGold)
                Spacer()
            }
            .padding()
            .background(Color.deepMaroon)
            
            // Sub Tabs Selection
            Picker("SubTabs", selection: $selectedSubTab) {
                Text("Received").tag(0)
                Text("Accepted").tag(1)
                Text("Sent").tag(2)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)
            .padding(.vertical, 8)
            .background(Color.deepMaroon)
            
            if isLoading {
                Spacer()
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                Spacer()
            } else if filteredConnections.isEmpty {
                emptyState
            } else {
                ScrollView {
                    VStack(spacing: 16) {
                        ForEach(filteredConnections, id: \.self) { record in
                            if let profile = lookupProfile(for: record) {
                                connectionRow(for: record, profile: profile)
                            }
                        }
                    }
                    .padding()
                }
                .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
            }
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
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
        HStack(spacing: 16) {
            Group {
                if let imgName = profile.img, !imgName.isEmpty {
                    if imgName.hasPrefix("http") {
                        AsyncImage(url: URL(string: imgName)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                        }
                    } else {
                        let localUrl = "https://shreerajputsagaisambandh.com/images/\(imgName).png"
                        AsyncImage(url: URL(string: localUrl)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                        }
                    }
                } else {
                    Circle()
                        .fill(Color.royalGold)
                        .overlay(
                            Text(String(profile.name.prefix(1)))
                                .font(BrandFonts.displayBold(size: 22))
                                .foregroundColor(.deepMaroon)
                        )
                }
            }
            .frame(width: 54, height: 54)
            .clipShape(Circle())
            .overlay(Circle().stroke(Color.royalGold.opacity(0.4), lineWidth: 1))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(profile.name)
                    .font(BrandFonts.displayBold(size: 16))
                    .foregroundColor(.lightGold)
                Text("\(profile.clan) Clan • \(profile.gotra) Gotra")
                    .font(BrandFonts.body(size: 12))
                    .foregroundColor(.sandstoneIvory.opacity(0.8))
                Text("Native: \(profile.thikana)")
                    .font(BrandFonts.body(size: 11))
                    .foregroundColor(.sandstoneIvory.opacity(0.6))
            }
            
            Spacer()
            
            if selectedSubTab == 0 {
                HStack(spacing: 12) {
                    Button(action: { handleDecline(record: record) }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.red)
                    }
                    Button(action: { handleAccept(record: record) }) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.green)
                    }
                }
            } else if selectedSubTab == 1 {
                NavigationLink(destination: ChatDetailView(profile: profile, currentUser: session.currentUser)) {
                    HStack(spacing: 4) {
                        Image(systemName: "bubble.left.and.bubble.right.fill")
                        Text("Chat")
                            .font(BrandFonts.bodyBold(size: 12))
                    }
                    .foregroundColor(.deepMaroon)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.royalGold)
                    .cornerRadius(12)
                }
            } else {
                Text("Pending")
                    .font(BrandFonts.label(size: 11))
                    .foregroundColor(.royalGold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.royalGold.opacity(0.12))
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color.deepMaroon.opacity(0.6))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.royalGold.opacity(0.25), lineWidth: 1))
    }
    
    private var emptyState: some View {
        VStack {
            Spacer()
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(Color.deepMaroon)
                        .frame(width: 100, height: 100)
                    
                    Image(systemName: "envelope.open.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.lightGold)
                }
                
                Text(selectedSubTab == 0 ? "No Pending Requests" : (selectedSubTab == 1 ? "No Active Connections" : "No Sent Requests"))
                    .font(BrandFonts.displayBold(size: 18))
                    .foregroundColor(.lightGold)
                
                Text("Lineage compatibility checks are run in real-time. Invite other members to connect and establish family trust.")
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(.sandstoneIvory.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
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
            // Header Bar
            HStack(spacing: 12) {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.royalGold)
                        .padding(6)
                }
                
                Group {
                    if let imgName = profile.img, !imgName.isEmpty {
                        if imgName.hasPrefix("http") {
                            AsyncImage(url: URL(string: imgName)) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                            }
                        } else {
                            let localUrl = "https://shreerajputsagaisambandh.com/images/\(imgName).png"
                            AsyncImage(url: URL(string: localUrl)) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .royalGold))
                            }
                        }
                    } else {
                        Circle()
                            .fill(Color.royalGold)
                            .overlay(
                                Text(String(profile.name.prefix(1)))
                                    .font(BrandFonts.displayBold(size: 16))
                                    .foregroundColor(.deepMaroon)
                            )
                    }
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.royalGold.opacity(0.6), lineWidth: 1.5))
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(profile.name)
                        .font(BrandFonts.displayBold(size: 16))
                        .foregroundColor(.lightGold)
                        .lineLimit(1)
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 6, height: 6)
                        Text("\(profile.clan) Clan • Online")
                            .font(BrandFonts.body(size: 11))
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
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
                            .font(.system(size: 16))
                            .foregroundColor(.royalGold)
                            .padding(8)
                            .background(Color.royalGold.opacity(0.15))
                            .clipShape(Circle())
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.deepMaroon)
            .overlay(Divider().background(Color.royalGold.opacity(0.2)), alignment: .bottom)
            
            // Messages Scroll Area
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        // Trust & lineage banner
                        HStack {
                            Spacer()
                            VStack(spacing: 4) {
                                Image(systemName: "shield.lefthalf.filled")
                                    .foregroundColor(.royalGold)
                                    .font(.system(size: 18))
                                Text("End-to-End Rajput Verified Dialogue")
                                    .font(BrandFonts.label(size: 11))
                                    .foregroundColor(.royalGold)
                                Text("Conversations are private between families and synced with the Shree Rajput Sagai Sambandh website.")
                                    .font(BrandFonts.body(size: 11))
                                    .foregroundColor(.sandstoneIvory.opacity(0.7))
                                    .multilineTextAlignment(.center)
                            }
                            .padding(12)
                            .background(Color.royalGold.opacity(0.08))
                            .cornerRadius(12)
                            .padding(.horizontal)
                            .padding(.top, 8)
                            Spacer()
                        }
                        
                        if messages.isEmpty {
                            VStack(spacing: 8) {
                                Text("No messages yet")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                Text("Initiate noble conversation with \(profile.name.components(separatedBy: " ").first ?? profile.name).")
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(.sandstoneIvory.opacity(0.6))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 30)
                        }
                        
                        ForEach(messages, id: \.id) { msg in
                            let isMe = msg.senderId == currentUser?.id
                            HStack(alignment: .bottom, spacing: 6) {
                                if isMe { Spacer(minLength: 40) }
                                
                                VStack(alignment: isMe ? .trailing : .leading, spacing: 4) {
                                    Text(msg.text)
                                        .font(BrandFonts.body(size: 14))
                                        .foregroundColor(isMe ? .deepMaroon : .sandstoneIvory)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 9)
                                        .background(isMe ? Color.royalGold : Color.white.opacity(0.12))
                                        .cornerRadius(16)
                                    
                                    if msg.time > 0 {
                                        let date = Date(timeIntervalSince1970: msg.time / 1000)
                                        Text(formatMessageTime(date))
                                            .font(BrandFonts.label(size: 9))
                                            .foregroundColor(.sandstoneIvory.opacity(0.5))
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
            
            // Quick reply chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(quickChips, id: \.self) { chip in
                        Button(action: {
                            messageText = chip
                        }) {
                            Text(chip)
                                .font(BrandFonts.body(size: 11))
                                .foregroundColor(.sandstoneIvory)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.white.opacity(0.08))
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.royalGold.opacity(0.3), lineWidth: 0.8))
                        }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
            }
            .background(Color.deepMaroon.opacity(0.95))
            
            // Input Bar
            HStack(spacing: 10) {
                TextField("Write noble message...", text: $messageText)
                    .font(BrandFonts.body(size: 14))
                    .padding(10)
                    .background(Color.white)
                    .cornerRadius(20)
                    .foregroundColor(.inkBrown)
                    .disabled(isSending)
                
                Button(action: sendMessage) {
                    ZStack {
                        Circle()
                            .fill(Color.royalGold)
                            .frame(width: 40, height: 40)
                        
                        if isSending {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .deepMaroon))
                        } else {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 16))
                                .foregroundColor(.deepMaroon)
                        }
                    }
                }
                .disabled(messageText.trimmingCharacters(in: .whitespaces).isEmpty || isSending)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color.deepMaroon)
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
        .onAppear {
            if let user = currentUser {
                SupabaseClient.shared.notifyAdminChatOpened(fromUser: user, toProfile: profile)
                loadMessages()
                startPolling()
            }
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
    
    private func formatMessageTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }
    
    private func loadMessages() {
        guard let user = session.currentUser ?? currentUser else { return }
        let currentProfile = session.profiles.first(where: { $0.id == profile.id }) ?? profile
        let combinedDicts = SupabaseClient.shared.getCombinedConversation(
            aboutA: user.about,
            idA: user.id,
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
    
    private func startPolling() {
        timer = Timer.scheduledTimer(withTimeInterval: 3.5, repeats: true) { _ in
            // Poll both partner's profile and current user's profile for live message parity
            SupabaseClient.shared.fetchProfileAbout(profileId: profile.id) { updatedPartnerAbout in
                DispatchQueue.main.async {
                    if let updatedPartnerAbout = updatedPartnerAbout {
                        if let index = session.profiles.firstIndex(where: { $0.id == profile.id }) {
                            session.profiles[index].about = updatedPartnerAbout
                        }
                    }
                    if let myId = session.currentUser?.id {
                        SupabaseClient.shared.fetchProfileAbout(profileId: myId) { myUpdatedAbout in
                            DispatchQueue.main.async {
                                if let myUpdatedAbout = myUpdatedAbout {
                                    session.currentUser?.about = myUpdatedAbout
                                }
                                loadMessages()
                            }
                        }
                    } else {
                        loadMessages()
                    }
                }
            }
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
        SupabaseClient.shared.sendMessage(fromUser: user, toProfile: profile, text: textToSend) { success in
            DispatchQueue.main.async {
                self.isSending = false
                if success {
                    // Refresh current user's about from Supabase to stay 100% in sync
                    self.session.refreshCurrentUserAbout()
                } else {
                    print("Error syncing message to Supabase.")
                }
            }
        }
    }
}
