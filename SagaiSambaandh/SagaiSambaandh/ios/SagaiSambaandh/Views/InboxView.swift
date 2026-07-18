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
            Circle()
                .fill(Color.royalGold)
                .frame(width: 54, height: 54)
                .overlay(
                    Text(String(profile.name.prefix(1)))
                        .font(BrandFonts.displayBold(size: 22))
                        .foregroundColor(.deepMaroon)
                )
            
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
                NavigationLink(destination: ChatDetailView(profile: profile)) {
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
    
    @ViewBuilder
    private var emptyState: some View {
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

struct ChatDetailView: View {
    let profile: Profile
    @State private var messageText: String = ""
    @State private var messages: [String] = []
    
    var body: some View {
        VStack {
            HStack {
                Circle()
                    .fill(Color.royalGold)
                    .frame(width: 36, height: 36)
                    .overlay(
                        Text(String(profile.name.prefix(1)))
                            .font(BrandFonts.displayBold(size: 16))
                            .foregroundColor(.deepMaroon)
                    )
                
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
                    
                    ForEach(messages, id: \.self) { msg in
                        HStack {
                            Spacer()
                            Text(msg)
                                .font(BrandFonts.body(size: 14))
                                .foregroundColor(.deepMaroon)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.royalGold)
                                .cornerRadius(16)
                        }
                    }
                }
                .padding()
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
    }
    
    private func sendMessage() {
        guard !messageText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        messages.append(messageText)
        messageText = ""
    }
}
