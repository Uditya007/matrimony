import Foundation

class SupabaseClient {
    static let shared = SupabaseClient()
    private let supabaseURL = "https://afbrznllcfgfcjuinnlf.supabase.co"
    private let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
    
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
    
    // Insert into profiles table
    private func insertProfile(profile: User, completion: @escaping (Result<User, Error>) -> Void) {
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
}
