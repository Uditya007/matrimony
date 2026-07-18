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
                            img: profilePic.isEmpty ? nil : profilePic
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
    
    // Insert a new profile record
    func insertProfile(profile: User, completion: @escaping (Result<User, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("return=representation", forHTTPHeaderField: "Prefer")
        
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
}

struct ConnectionRecord: Identifiable, Codable, Hashable {
    var id: String {
        return sender_id + "_" + receiver_id
    }
    var sender_id: String
    var receiver_id: String
    var status: String // "pending", "accepted", "rejected"
}
