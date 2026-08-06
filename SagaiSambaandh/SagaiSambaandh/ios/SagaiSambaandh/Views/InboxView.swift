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
        guard let url = URL(string: "https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/connections?sender_id=eq.\(record.sender_id)&receiver_id=eq.\(record.receiver_id)") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0", forHTTPHeaderField: "apikey")
        request.addValue("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data,
                  let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
                  let first = rows.first,
                  let cid = first["id"] as? String else {
                return
            }
            
            SupabaseClient.shared.updateConnection(connectionId: cid, status: "accepted") { result in
                DispatchQueue.main.async {
                    if case .success = result {
                        self.loadConnections()
                    }
                }
            }
        }.resume()
    }
    
    private func handleDecline(record: ConnectionRecord) {
        guard let url = URL(string: "https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/connections?sender_id=eq.\(record.sender_id)&receiver_id=eq.\(record.receiver_id)") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0", forHTTPHeaderField: "apikey")
        request.addValue("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data,
                  let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
                  let first = rows.first,
                  let cid = first["id"] as? String else {
                return
            }
            
            SupabaseClient.shared.updateConnection(connectionId: cid, status: "rejected") { result in
                DispatchQueue.main.async {
                    if case .success = result {
                        self.loadConnections()
                    }
                }
            }
        }.resume()
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
    @State private var messageText: String = ""
    @State private var messages: [SupabaseMessage] = []
    @State private var timer: Timer? = nil
    
    var body: some View {
        VStack {
            HStack {
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
            .frame(width: 36, height: 36)
            .clipShape(Circle())
            .overlay(Circle().stroke(Color.royalGold.opacity(0.4), lineWidth: 1))
                
                VStack(alignment: .leading) {
                    Text(profile.name)
                        .font(BrandFonts.displayBold(size: 16))
                        .foregroundColor(.lightGold)
                    Text("Online")
                        .font(BrandFonts.body(size: 10))
                        .foregroundColor(.green)
                }
                Spacer()
            }
            .padding()
            .background(Color.deepMaroon)
            
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Lineage check verified! You are now connected with \(profile.name). Say hello!")
                                .font(BrandFonts.body(size: 12))
                                .foregroundColor(.royalGold)
                                .padding()
                                .background(Color.royalGold.opacity(0.08))
                                .cornerRadius(10)
                            Spacer()
                        }
                        
                        ForEach(messages, id: \.id) { msg in
                            HStack {
                                if msg.senderId == currentUser?.id {
                                    Spacer()
                                    Text(msg.text)
                                        .font(BrandFonts.body(size: 14))
                                        .foregroundColor(.deepMaroon)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(Color.royalGold)
                                        .cornerRadius(16)
                                } else {
                                    Text(msg.text)
                                        .font(BrandFonts.body(size: 14))
                                        .foregroundColor(.sandstoneIvory)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(Color.white.opacity(0.1))
                                        .cornerRadius(16)
                                    Spacer()
                                }
                            }
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            Spacer()
            
            HStack {
                TextField("Write noble message...", text: $messageText)
                    .font(BrandFonts.body(size: 14))
                    .padding(12)
                    .background(Color.cardBackground)
                    .cornerRadius(20)
                    .foregroundColor(.inkBrown)
                
                Button(action: sendMessage) {
                    Image(systemName: "paperplane.fill")
                        .font(.title2)
                        .foregroundColor(.royalGold)
                }
            }
            .padding()
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
    
    private func loadMessages() {
        guard let user = currentUser else { return }
        let combinedDicts = SupabaseClient.shared.getCombinedConversation(profileA: user, profileB: profile)
        self.messages = combinedDicts.map { dict -> SupabaseMessage in
            let s = dict["s"] as? String ?? ""
            let t = dict["t"] as? String ?? ""
            let time = dict["time"] as? Double ?? 0.0
            return SupabaseMessage(id: "\(s)_\(time)", senderId: s, text: t, time: time)
        }
    }
    
    private func startPolling() {
        timer = Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { _ in
            SupabaseClient.shared.fetchProfileAbout(profileId: profile.id) { updatedAbout in
                DispatchQueue.main.async {
                    guard let updatedAbout = updatedAbout else { return }
                    // Update this profile's about in local state profiles list
                    if let index = session.profiles.firstIndex(where: { $0.id == profile.id }) {
                        session.profiles[index].about = updatedAbout
                    }
                    loadMessages()
                }
            }
        }
    }
    
    private func sendMessage() {
        guard let user = currentUser, !messageText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        let textToSend = messageText
        messageText = ""
        
        let timestamp = Date().timeIntervalSince1970 * 1000
        let newMsgDict: [String: Any] = ["s": user.id, "t": textToSend, "time": timestamp]
        
        var chats = SupabaseClient.shared.getProfileChats(aboutText: user.about)
        var conversationList = chats[profile.id] ?? []
        conversationList.append(newMsgDict)
        chats[profile.id] = conversationList
        
        let newAbout = SupabaseClient.shared.setProfileChatsInAbout(aboutText: user.about, chatsObj: chats)
        
        var updatedUser = user
        updatedUser.about = newAbout
        session.updateCurrentUser(updated: updatedUser)
        
        SupabaseClient.shared.updateProfile(user: updatedUser) { success in
            if success {
                print("Message synced to Supabase successfully!")
            } else {
                print("Failed to sync message to Supabase.")
            }
        }
        
        loadMessages()
    }
}
