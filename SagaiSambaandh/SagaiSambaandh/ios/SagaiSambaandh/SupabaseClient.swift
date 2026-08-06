import Foundation

class SupabaseClient {
    static let shared = SupabaseClient()
    private let supabaseURL = "https://afbrznllcfgfcjuinnlf.supabase.co"
    private let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
    
    // Fetch profiles from database dynamically
    func fetchProfiles(completion: @escaping (Result<[Profile], Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles?select=*") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "Supabase", code: -1)))
                return
            }
            do {
                if let rows = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                    let parsedProfiles = rows.map { dict -> Profile in
                        let id = dict["id"] as? String ?? ""
                        let name = dict["name"] as? String ?? "Member"
                        let gender = dict["gender"] as? String ?? "Groom"
                        let clan = dict["clan"] as? String ?? "Rathore"
                        let gotra = dict["gotra"] as? String ?? ""
                        let thikana = dict["thikana"] as? String ?? ""
                        let height = dict["height"] as? String ?? "5 ft 8 in"
                        let education = dict["education"] as? String ?? ""
                        let occupation = dict["occupation"] as? String ?? ""
                        let income = dict["income"] as? String ?? ""
                        let profilePic = dict["profilePic"] as? String ?? ""
                        let about = dict["about"] as? String ?? ""
                        
                        var ageVal = 25
                        if let dobStr = dict["dob"] as? String, !dobStr.isEmpty {
                            let parts = dobStr.components(separatedBy: "-")
                            if parts.count >= 3, let year = Int(parts[2]) {
                                ageVal = 2026 - year
                            }
                        }
                        
                        return Profile(
                            id: id,
                            name: name,
                            age: ageVal,
                            gender: gender,
                            clan: clan,
                            gotra: gotra,
                            kul: clan,
                            thikana: thikana,
                            location: thikana,
                            height: height,
                            occupation: occupation,
                            education: education,
                            income: income,
                            isVerified: true,
                            img: profilePic.isEmpty ? nil : profilePic,
                            about: about
                        )
                    }
                    completion(.success(parsedProfiles))
                } else {
                    completion(.failure(NSError(domain: "Supabase", code: -2)))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // Auth SignUp + profile creation
    func signUp(email: String, password: String, profile: User, completion: @escaping (Result<User, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/auth/v1/signup") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "email": email,
            "password": password
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "SupabaseClient", code: -1, userInfo: [NSLocalizedDescriptionKey: "No auth data returned"])))
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let userObj = json["user"] as? [String: Any],
                   let uid = userObj["id"] as? String {
                    
                    // Auth SignUp succeeded! Now insert into profiles table.
                    var profileWithUid = profile
                    profileWithUid.id = uid
                    self.insertProfile(profile: profileWithUid, completion: completion)
                } else {
                    let errMsg = String(data: data, encoding: .utf8) ?? "Auth sign up failed"
                    completion(.failure(NSError(domain: "SupabaseClient", code: -2, userInfo: [NSLocalizedDescriptionKey: errMsg])))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    
    // Auth SignIn / Login
    func signIn(email: String, password: String, completion: @escaping (Result<User, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/auth/v1/token?grant_type=password") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "email": email,
            "password": password
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "SupabaseClient", code: -1, userInfo: [NSLocalizedDescriptionKey: "No login data returned"])))
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let userObj = json["user"] as? [String: Any],
                   let uid = userObj["id"] as? String {
                    
                    // Login succeeded! Now fetch their profile data from the profiles table.
                    self.fetchUserProfile(uid: uid, email: email, completion: completion)
                } else {
                    let errMsg = String(data: data, encoding: .utf8) ?? "Auth sign in failed"
                    completion(.failure(NSError(domain: "SupabaseClient", code: -2, userInfo: [NSLocalizedDescriptionKey: errMsg])))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // Fetch individual profile matching UID
    func fetchUserProfile(uid: String, email: String, completion: @escaping (Result<User, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles?id=eq.\(uid)&select=*") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "SupabaseClient", code: -3)))
                return
            }
            do {
                if let rows = try JSONSerialization.jsonObject(with: data) as? [[String: Any]],
                   let first = rows.first {
                    
                    let name = first["name"] as? String ?? "Noble User"
                    let gender = first["gender"] as? String ?? "Groom"
                    let clan = first["clan"] as? String ?? "Rathore"
                    let tier = first["tier"] as? String ?? "Starter"
                    let gotra = first["gotra"] as? String ?? ""
                    let motherGotra = first["motherGotra"] as? String ?? ""
                    let thikana = first["thikana"] as? String ?? ""
                    let phone = first["phone"] as? String ?? ""
                    let dob = first["dob"] as? String ?? ""
                    let education = first["education"] as? String ?? ""
                    let occupation = first["occupation"] as? String ?? ""
                    let income = first["income"] as? String ?? ""
                    let height = first["height"] as? String ?? ""
                    let maritalStatus = first["maritalStatus"] as? String ?? "Never Married"
                    let profilePic = first["profilePic"] as? String
                    let about = first["about"] as? String ?? ""
                    
                    let loggedUser = User(
                        id: uid,
                        name: name,
                        email: email,
                        gender: gender,
                        clan: clan,
                        tier: tier,
                        shortlistedIds: [],
                        unlockedIds: [],
                        gotra: gotra,
                        motherGotra: motherGotra,
                        thikana: thikana,
                        phone: phone,
                        dob: dob,
                        education: education,
                        occupation: occupation,
                        income: income,
                        height: height,
                        maritalStatus: maritalStatus,
                        profilePic: profilePic,
                        about: about
                    )
                    completion(.success(loggedUser))
                } else {
                    // Profile row doesn't exist, create a baseline mock profile
                    let mockUser = User(
                        id: uid,
                        name: "Noble Member",
                        email: email,
                        gender: "Groom",
                        clan: "Rathore",
                        tier: "Starter"
                    )
                    completion(.success(mockUser))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    // Insert a new profile record
    func insertProfile(profile: User, completion: @escaping (Result<User, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("return=representation,resolution=merge-duplicates", forHTTPHeaderField: "Prefer")
        
        // Match Supabase table column names
        let fields: [String: Any] = [
            "id": profile.id,
            "name": profile.name,
            "email": profile.email,
            "gender": profile.gender,
            "clan": profile.clan,
            "tier": profile.tier,
            "gotra": profile.gotra,
            "motherGotra": profile.motherGotra,
            "thikana": profile.thikana,
            "phone": profile.phone,
            "dob": profile.dob,
            "education": profile.education,
            "occupation": profile.occupation,
            "income": profile.income,
            "height": profile.height,
            "maritalStatus": profile.maritalStatus,
            "profilePic": profile.profilePic ?? ""
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: fields)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 201 {
                let msg = "👑 *New Profile Registered (iOS)* 👑\n\n" +
                          "• *Name:* \(profile.name)\n" +
                          "• *Gender:* \(profile.gender)\n" +
                          "• *Clan:* \(profile.clan)\n" +
                          "• *Gotra:* \(profile.gotra)\n" +
                          "• *Location:* \(profile.thikana)\n" +
                          "• *Phone:* \(profile.phone)\n" +
                          "• *Email:* \(profile.email)"
                self.sendTelegramNotification(text: msg)
                completion(.success(profile))
            } else {
                let bodyString = String(data: data ?? Data(), encoding: .utf8) ?? "Insert failed"
                completion(.failure(NSError(domain: "SupabaseClient", code: -3, userInfo: [NSLocalizedDescriptionKey: bodyString])))
            }
        }.resume()
    }
    
    // Update user profile row
    func updateProfile(user: User, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles?id=eq.\(user.id)") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let fields: [String: Any] = [
            "name": user.name,
            "clan": user.clan,
            "gotra": user.gotra,
            "motherGotra": user.motherGotra,
            "thikana": user.thikana,
            "phone": user.phone,
            "dob": user.dob,
            "profilePic": user.profilePic ?? ""
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: fields)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 204 || httpResponse.statusCode == 200 {
                completion(true)
            } else {
                completion(false)
            }
        }.resume()
    }
    
    // Send a Like / Connection request to the connections database table
    func sendConnection(senderId: String, receiverId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/connections") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let fields: [String: Any] = [
            "sender_id": senderId,
            "receiver_id": receiverId,
            "status": "pending"
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: fields)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 201 || httpResponse.statusCode == 200 {
                completion(.success(()))
            } else {
                completion(.failure(NSError(domain: "SupabaseClient", code: -4, userInfo: [NSLocalizedDescriptionKey: "Failed to send like"])))
            }
        }.resume()
    }
    
    // Fetch connection requests for a user
    func fetchConnections(userId: String, completion: @escaping (Result<[ConnectionRecord], Error>) -> Void) {
        // Query rows where user is either sender or receiver
        guard let url = URL(string: "\(supabaseURL)/rest/v1/connections?or=(sender_id.eq.\(userId),receiver_id.eq.\(userId))") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.success([]))
                return
            }
            do {
                let records = try JSONDecoder().decode([ConnectionRecord].self, from: data)
                completion(.success(records))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // Update connection status (e.g. accept or reject a request)
    func updateConnection(connectionId: String, status: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/connections?id=eq.\(connectionId)") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let fields = ["status": status]
        request.httpBody = try? JSONSerialization.data(withJSONObject: fields)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 204 || httpResponse.statusCode == 200 {
                completion(.success(()))
            } else {
                completion(.failure(NSError(domain: "SupabaseClient", code: -5, userInfo: [NSLocalizedDescriptionKey: "Failed to update like status"])))
            }
        }.resume()
    }
    
    // Telegram Bot Notifications helper
    func sendTelegramNotification(text: String) {
        let tgToken = "8830114400:AAHA6xhuANxZjYu0iie-sAF67A2jRxy_i7U"
        let tgChatId = "5124029961"
        guard let url = URL(string: "https://api.telegram.org/bot\(tgToken)/sendMessage") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "chat_id": tgChatId,
            "text": text,
            "parse_mode": "Markdown"
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request).resume()
    }
    
    func notifyAdminInterestSent(fromUser: User, toProfile: Profile) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let dateString = formatter.string(from: Date())
        let text = "💌 *Interest Request Sent (iOS)* 💌\n\n" +
                   "• *From:* \(fromUser.name) _(\(fromUser.clan) Clan)_\n" +
                   "• *To:* \(toProfile.name) _(\(toProfile.clan) Clan)_\n\n" +
                   "📅 _Time: \(dateString)_"
        sendTelegramNotification(text: text)
    }

    func notifyAdminChatOpened(fromUser: User, toProfile: Profile?) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let dateString = formatter.string(from: Date())
        let toName = toProfile?.name ?? "Matchmaker Bot"
        let toClan = toProfile != nil ? " _(\(toProfile!.clan) Clan)_" : ""
        let text = "💬 *Chat Opened (iOS)* 💬\n\n" +
                   "• *From:* \(fromUser.name) _(\(fromUser.clan) Clan)_\n" +
                   "• *To:* \(toName)\(toClan)\n\n" +
                   "📅 _Time: \(dateString)_"
        sendTelegramNotification(text: text)
    }

    // Parse Chats from profile about string
    func getProfileChats(aboutText: String?) -> [String: [[String: Any]]] {
        guard let about = aboutText, !about.isEmpty else { return [:] }
        
        let pattern = "\\[Chats: ([^\n\r]*)\\]"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else { return [:] }
        
        let nsRange = NSRange(about.startIndex..<about.endIndex, in: about)
        if let match = regex.firstMatch(in: about, options: [], range: nsRange),
           let range = Range(match.range(at: 1), in: about) {
            let jsonString = String(about[range]).trimmingCharacters(in: .whitespacesAndNewlines)
            if let data = jsonString.data(using: .utf8),
               let dict = try? JSONSerialization.jsonObject(with: data) as? [String: [[String: Any]]] {
                return dict
            }
        }
        return [:]
    }
    
    // Serialize and embed Chats into profile about string
    func setProfileChatsInAbout(aboutText: String?, chatsObj: [String: [[String: Any]]]) -> String {
        var cleanAbout = aboutText ?? ""
        
        // Remove existing [Chats: ...] blocks
        let pattern = "\\[Chats: [^\n\r]*\\]"
        if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
            let nsRange = NSRange(cleanAbout.startIndex..<cleanAbout.endIndex, in: cleanAbout)
            cleanAbout = regex.stringByReplacingMatches(in: cleanAbout, options: [], range: nsRange, withTemplate: "")
        }
        cleanAbout = cleanAbout.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if let data = try? JSONSerialization.data(withJSONObject: chatsObj, options: []),
           let jsonString = String(data: data, encoding: .utf8) {
            return (cleanAbout + "\n[Chats: \(jsonString)]").trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return cleanAbout
    }
    
    // Merge two conversations and sort chronologically
    func getCombinedConversation(profileA: User, profileB: Profile) -> [[String: Any]] {
        let chatsA = getProfileChats(aboutText: profileA.about)
        let chatsB = getProfileChats(aboutText: profileB.about)
        
        let listA = chatsA[profileB.id] ?? []
        let listB = chatsB[profileA.id] ?? []
        
        let combined = listA + listB
        
        var unique: [[String: Any]] = []
        var seen = Set<String>()
        
        for msg in combined {
            let s = msg["s"] as? String ?? ""
            let t = msg["t"] as? String ?? ""
            let time = msg["time"] as? Double ?? 0.0
            let key = "\(s)_\(t)_\(time)"
            
            if !seen.contains(key) {
                seen.insert(key)
                unique.append(msg)
            }
        }
        
        return unique.sorted { ($0["time"] as? Double ?? 0.0) < ($1["time"] as? Double ?? 0.0) }
    }
    
    // Fetch individual profile's about field to read their sent messages
    func fetchProfileAbout(profileId: String, completion: @escaping (String?) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles?id=eq.\(profileId)&select=about") else {
            completion(nil)
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data,
                  let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
                  let first = rows.first else {
                completion(nil)
                return
            }
            let about = first["about"] as? String
            completion(about)
        }.resume()
    }
}

struct ConnectionRecord: Identifiable, Codable, Hashable {
    var id: String {
        return sender_id + "_" + receiver_id
    }
    var sender_id: String
    var receiver_id: String
    var status: String // "pending", "accepted", "rejected"
}
