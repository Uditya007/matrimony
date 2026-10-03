import Foundation

class SupabaseClient {
    static let shared = SupabaseClient()
    let supabaseURL = "https://afbrznllcfgfcjuinnlf.supabase.co"
    let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
    
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
                        let rawPic = (dict["profilePic"] as? String)?.isEmpty == false ? (dict["profilePic"] as? String) : (dict["img"] as? String)
                        let email = dict["email"] as? String ?? ""
                        let about = dict["about"] as? String ?? ""
                        
                        let motherGotra = dict["motherGotra"] as? String ?? ""
                        let dobStr = dict["dob"] as? String ?? ""
                        let phone = dict["phone"] as? String ?? ""
                        let maritalStatus = dict["maritalStatus"] as? String ?? "Never Married"
                        let rashi = dict["rashi"] as? String ?? ""
                        let manglik = dict["manglik"] as? String ?? "Non-Manglik"
                        let expectations = dict["expectations"] as? String ?? ""
                        let instagram = dict["instagram"] as? String ?? ""
                        let facebook = dict["facebook"] as? String ?? ""
                        let biodataUrl = dict["biodataUrl"] as? String ?? ""
                        let locationVal = dict["location"] as? String ?? thikana
                        
                        var ageVal = 25
                        if !dobStr.isEmpty {
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
                            location: locationVal,
                            height: height,
                            occupation: occupation,
                            education: education,
                            income: income,
                            isVerified: true,
                            img: rawPic,
                            about: about,
                            motherGotra: motherGotra,
                            dob: dobStr,
                            phone: phone,
                            email: email,
                            maritalStatus: maritalStatus,
                            rashi: rashi,
                            manglik: manglik,
                            expectations: expectations,
                            instagram: instagram,
                            facebook: facebook,
                            biodataUrl: biodataUrl
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
                    
                    let location = first["location"] as? String ?? ""
                    let rashi = first["rashi"] as? String ?? ""
                    let manglik = first["manglik"] as? String ?? "Non-Manglik"
                    let expectations = first["expectations"] as? String ?? ""
                    let instagram = first["instagram"] as? String ?? ""
                    let facebook = first["facebook"] as? String ?? ""
                    let biodataUrl = first["biodataUrl"] as? String ?? ""
                    
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
                        about: about,
                        location: location,
                        rashi: rashi,
                        manglik: manglik,
                        expectations: expectations,
                        instagram: instagram,
                        facebook: facebook,
                        biodataUrl: biodataUrl
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
                        tier: "Starter",
                        shortlistedIds: [],
                        unlockedIds: []
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
            "profilePic": profile.profilePic ?? "",
            "location": profile.location,
            "rashi": profile.rashi,
            "manglik": profile.manglik,
            "expectations": profile.expectations,
            "instagram": profile.instagram,
            "facebook": profile.facebook,
            "biodataUrl": profile.biodataUrl
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
    
    // Update user profile row (Supabase PostgreSQL schema aligned)
    func updateProfile(user: User, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles?id=eq.\(user.id)") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Build safe about string with embedded socials and biodata URL matching website js/app.js
        var cleanAbout = user.about ?? ""
        if !user.instagram.isEmpty || !user.facebook.isEmpty {
            let socialsObj: [String: String] = ["instagram": user.instagram, "facebook": user.facebook]
            if let data = try? JSONSerialization.data(withJSONObject: socialsObj), let jsonStr = String(data: data, encoding: .utf8) {
                if let regex = try? NSRegularExpression(pattern: "\\[Social Links: [^\\]]*\\]", options: []) {
                    let nsRange = NSRange(cleanAbout.startIndex..<cleanAbout.endIndex, in: cleanAbout)
                    cleanAbout = regex.stringByReplacingMatches(in: cleanAbout, options: [], range: nsRange, withTemplate: "")
                }
                cleanAbout = "\(cleanAbout.trimmingCharacters(in: .whitespacesAndNewlines))\n[Social Links: \(jsonStr)]"
            }
        }
        if !user.biodataUrl.isEmpty {
            if let regex = try? NSRegularExpression(pattern: "\\[Biodata Link: [^\\]]*\\]", options: []) {
                let nsRange = NSRange(cleanAbout.startIndex..<cleanAbout.endIndex, in: cleanAbout)
                cleanAbout = regex.stringByReplacingMatches(in: cleanAbout, options: [], range: nsRange, withTemplate: "")
            }
            cleanAbout = "\(cleanAbout.trimmingCharacters(in: .whitespacesAndNewlines))\n[Biodata Link: \(user.biodataUrl)]"
        }
        cleanAbout = cleanAbout.trimmingCharacters(in: .whitespacesAndNewlines)
        
        var fields: [String: Any] = [
            "name": user.name,
            "clan": user.clan,
            "gotra": user.gotra,
            "motherGotra": user.motherGotra,
            "thikana": user.thikana,
            "phone": user.phone,
            "dob": user.dob,
            "education": user.education,
            "occupation": user.occupation,
            "income": user.income,
            "height": user.height,
            "maritalStatus": user.maritalStatus,
            "about": cleanAbout,
            "location": user.location,
            "rashi": user.rashi,
            "manglik": user.manglik,
            "expectations": user.expectations
        ]
        if let pic = user.profilePic, !pic.isEmpty {
            fields["profilePic"] = pic
        }
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: fields)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 204 || httpResponse.statusCode == 200 {
                completion(true)
            } else {
                completion(false)
            }
        }.resume()
    }
    
    // Update ONLY about column in Supabase (100% reliable for chats & metadata)
    func updateProfileAbout(userId: String, about: String, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles?id=eq.\(userId)") else {
            completion(false)
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["about": about]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let httpResponse = response as? HTTPURLResponse, (httpResponse.statusCode == 200 || httpResponse.statusCode == 204) {
                completion(true)
            } else {
                completion(false)
            }
        }.resume()
    }
    
    // MARK: - Decentralized Supabase Metadata, Interests & Chat System (100% Website Parity)
    
    // Robust JSON Block Extractor (Balanced Braces & Brackets - 100% Immune to Greedy Regex & Trailing Tags)
    func extractJsonBlock(tag: String, from text: String?) -> Any? {
        guard let text = text, !text.isEmpty else { return nil }
        guard let startRange = text.range(of: "[\(tag): ") else { return nil }
        let sub = text[startRange.upperBound...]
        guard let firstChar = sub.first, firstChar == "{" || firstChar == "[" else { return nil }
        let openChar = firstChar
        let closeChar: Character = openChar == "{" ? "}" : "]"
        
        var depth = 0
        var endIndex: String.Index? = nil
        var inString = false
        var escape = false
        
        for (i, char) in zip(sub.indices, sub) {
            if escape { escape = false; continue }
            if char == "\\" { escape = true; continue }
            if char == "\"" { inString = !inString; continue }
            if !inString {
                if char == openChar { depth += 1 }
                else if char == closeChar {
                    depth -= 1
                    if depth == 0 {
                        endIndex = i
                        break
                    }
                }
            }
        }
        
        guard let end = endIndex else { return nil }
        let jsonStr = String(sub[...end])
        guard let data = jsonStr.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) else {
            return nil
        }
        return obj
    }
    
    // Robust Tag Block Remover (Preserves other metadata tags and multiline text cleanly)
    func removeTagBlock(tag: String, from text: String?) -> String {
        guard var str = text, !str.isEmpty else { return "" }
        while let startRange = str.range(of: "[\(tag): ") {
            let sub = str[startRange.upperBound...]
            if let firstChar = sub.first, firstChar == "{" || firstChar == "[" {
                let openChar = firstChar
                let closeChar: Character = openChar == "{" ? "}" : "]"
                var depth = 0
                var endIndex: String.Index? = nil
                var inString = false
                var escape = false
                for (i, char) in zip(sub.indices, sub) {
                    if escape { escape = false; continue }
                    if char == "\\" { escape = true; continue }
                    if char == "\"" { inString = !inString; continue }
                    if !inString {
                        if char == openChar { depth += 1 }
                        else if char == closeChar {
                            depth -= 1
                            if depth == 0 {
                                let afterBrace = str.index(after: i)
                                if afterBrace < str.endIndex && str[afterBrace] == "]" {
                                    endIndex = afterBrace
                                } else {
                                    endIndex = i
                                }
                                break
                            }
                        }
                    }
                }
                if let end = endIndex {
                    str.removeSubrange(startRange.lowerBound...end)
                } else {
                    break
                }
            } else {
                if let closeBracket = sub.firstIndex(of: "]") {
                    str.removeSubrange(startRange.lowerBound...closeBracket)
                } else {
                    break
                }
            }
        }
        return str.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    // Clean user bio for display (strips internal system tags)
    func cleanBioText(from aboutText: String?) -> String {
        var str = aboutText ?? ""
        str = removeTagBlock(tag: "Chats", from: str)
        str = removeTagBlock(tag: "Interests", from: str)
        str = removeTagBlock(tag: "Social Links", from: str)
        str = removeTagBlock(tag: "Biodata Link", from: str)
        str = removeTagBlock(tag: "Last Seen", from: str)
        return str.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    func getInterests(from aboutText: String?) -> [String: String] {
        if let dict = extractJsonBlock(tag: "Interests", from: aboutText) as? [String: String] {
            return dict
        }
        return [:]
    }
    
    func setInterests(in aboutText: String?, interests: [String: String]) -> String {
        var cleanAbout = removeTagBlock(tag: "Interests", from: aboutText)
        if let data = try? JSONSerialization.data(withJSONObject: interests, options: []),
           let jsonStr = String(data: data, encoding: .utf8) {
            return cleanAbout.isEmpty ? "[Interests: \(jsonStr)]" : "\(cleanAbout)\n[Interests: \(jsonStr)]"
        }
        return cleanAbout
    }
    
    func getSocialLinks(from aboutText: String?) -> [String: String] {
        if let dict = extractJsonBlock(tag: "Social Links", from: aboutText) as? [String: String] {
            return dict
        }
        return [:]
    }
    
    func getBiodataLink(from aboutText: String?) -> String {
        guard let about = aboutText, !about.isEmpty else { return "" }
        guard let startRange = about.range(of: "[Biodata Link: ") else { return "" }
        let sub = about[startRange.upperBound...]
        guard let endBracket = sub.firstIndex(of: "]") else { return "" }
        return String(sub[..<endBracket]).trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    // Send match interest to a profile (syncs directly with Supabase profiles table)
    func sendConnection(senderId: String, receiverId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles?id=eq.\(senderId)&select=about") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { [weak self] data, _, error in
            guard let self = self else { return }
            if let error = error {
                completion(.failure(error))
                return
            }
            var currentAbout = ""
            if let data = data,
               let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
               let first = rows.first {
                currentAbout = first["about"] as? String ?? ""
            }
            
            var interests = self.getInterests(from: currentAbout)
            interests[receiverId] = "sent"
            let updatedAbout = self.setInterests(in: currentAbout, interests: interests)
            
            guard let patchUrl = URL(string: "\(self.supabaseURL)/rest/v1/profiles?id=eq.\(senderId)") else { return }
            var patchRequest = URLRequest(url: patchUrl)
            patchRequest.httpMethod = "PATCH"
            patchRequest.addValue(self.apiKey, forHTTPHeaderField: "apikey")
            patchRequest.addValue("Bearer \(self.apiKey)", forHTTPHeaderField: "Authorization")
            patchRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
            
            let body = ["about": updatedAbout]
            patchRequest.httpBody = try? JSONSerialization.data(withJSONObject: body)
            
            URLSession.shared.dataTask(with: patchRequest) { _, patchResp, patchErr in
                if let patchErr = patchErr {
                    completion(.failure(patchErr))
                } else {
                    completion(.success(()))
                }
            }.resume()
        }.resume()
    }
    
    // Fetch connection requests for a user from Supabase profiles metadata
    func fetchConnections(userId: String, completion: @escaping (Result<[ConnectionRecord], Error>) -> Void) {
        fetchProfiles { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .failure(let error):
                completion(.failure(error))
            case .success(let allProfiles):
                guard let myProfile = allProfiles.first(where: { $0.id == userId }) else {
                    completion(.success([]))
                    return
                }
                let myInterests = self.getInterests(from: myProfile.about)
                var records: [ConnectionRecord] = []
                
                for p in allProfiles where p.id != userId {
                    let otherInterests = self.getInterests(from: p.about)
                    
                    // Connected (either party accepted)
                    if myInterests[p.id] == "accepted" || otherInterests[userId] == "accepted" {
                        records.append(ConnectionRecord(
                            sender_id: p.id,
                            receiver_id: userId,
                            status: "accepted"
                        ))
                    }
                    // Incoming pending request
                    else if otherInterests[userId] == "sent" && myInterests[p.id] != "declined" {
                        records.append(ConnectionRecord(
                            sender_id: p.id,
                            receiver_id: userId,
                            status: "pending"
                        ))
                    }
                    // Sent pending request
                    else if myInterests[p.id] == "sent" && otherInterests[userId] != "declined" {
                        records.append(ConnectionRecord(
                            sender_id: userId,
                            receiver_id: p.id,
                            status: "pending"
                        ))
                    }
                }
                completion(.success(records))
            }
        }
    }
    
    // Update connection status (accept or decline)
    func updateConnection(senderId: String, receiverId: String, status: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/rest/v1/profiles?id=eq.\(receiverId)&select=about") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { [weak self] data, _, error in
            guard let self = self else { return }
            if let error = error {
                completion(.failure(error))
                return
            }
            var currentAbout = ""
            if let data = data,
               let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
               let first = rows.first {
                currentAbout = first["about"] as? String ?? ""
            }
            
            var interests = self.getInterests(from: currentAbout)
            interests[senderId] = status
            let updatedAbout = self.setInterests(in: currentAbout, interests: interests)
            
            guard let patchUrl = URL(string: "\(self.supabaseURL)/rest/v1/profiles?id=eq.\(receiverId)") else { return }
            var patchRequest = URLRequest(url: patchUrl)
            patchRequest.httpMethod = "PATCH"
            patchRequest.addValue(self.apiKey, forHTTPHeaderField: "apikey")
            patchRequest.addValue("Bearer \(self.apiKey)", forHTTPHeaderField: "Authorization")
            patchRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
            
            let body = ["about": updatedAbout]
            patchRequest.httpBody = try? JSONSerialization.data(withJSONObject: body)
            
            URLSession.shared.dataTask(with: patchRequest) { _, _, patchErr in
                if let patchErr = patchErr {
                    completion(.failure(patchErr))
                } else {
                    completion(.success(()))
                }
            }.resume()
        }.resume()
    }
    
    // Compatibility overload for connectionId parameter
    func updateConnection(connectionId: String, status: String, completion: @escaping (Result<Void, Error>) -> Void) {
        let parts = connectionId.components(separatedBy: "_")
        if parts.count >= 2 {
            let sId = parts[0]
            let rId = parts[1]
            updateConnection(senderId: sId, receiverId: rId, status: status, completion: completion)
        } else {
            completion(.success(()))
        }
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
    // Parse Chats from profile about string (100% resilient to [Last Seen: ...] and nested JSON)
    func getProfileChats(aboutText: String?) -> [String: [[String: Any]]] {
        if let dict = extractJsonBlock(tag: "Chats", from: aboutText) as? [String: [[String: Any]]] {
            return dict
        }
        return [:]
    }
    
    // Serialize and embed Chats into profile about string
    func setProfileChatsInAbout(aboutText: String?, chatsObj: [String: [[String: Any]]]) -> String {
        var cleanAbout = removeTagBlock(tag: "Chats", from: aboutText)
        if let data = try? JSONSerialization.data(withJSONObject: chatsObj, options: []),
           let jsonString = String(data: data, encoding: .utf8) {
            return (cleanAbout + "\n[Chats: \(jsonString)]").trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return cleanAbout
    }
    
    // Merge two conversations and sort chronologically
    func getCombinedConversation(aboutA: String?, idA: String, aboutB: String?, idB: String) -> [[String: Any]] {
        let chatsA = getProfileChats(aboutText: aboutA)
        let chatsB = getProfileChats(aboutText: aboutB)
        
        let listA = chatsA[idB] ?? []
        let listB = chatsB[idA] ?? []
        
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
    
    func getCombinedConversation(profileA: User, profileB: Profile) -> [[String: Any]] {
        return getCombinedConversation(aboutA: profileA.about, idA: profileA.id, aboutB: profileB.about, idB: profileB.id)
    }
    
    // Extract last message snippet for Chat list row
    func getLastMessage(userAbout: String?, userId: String, profileAbout: String?, profileId: String) -> (text: String, time: Double, isFromMe: Bool)? {
        let conv = getCombinedConversation(aboutA: userAbout, idA: userId, aboutB: profileAbout, idB: profileId)
        guard let last = conv.last else { return nil }
        let s = last["s"] as? String ?? ""
        let t = last["t"] as? String ?? ""
        let time = last["time"] as? Double ?? 0.0
        return (text: t, time: time, isFromMe: s == userId)
    }
    
    // Send a real-time decentralized message synced with website Supabase database
    func sendMessage(fromUser: User, toProfile: Profile, text: String, completion: @escaping (Bool, String?) -> Void) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            completion(false, nil)
            return
        }
        
        // 1. Fetch latest about for currentUser from Supabase
        fetchProfileAbout(profileId: fromUser.id) { [weak self] freshAbout in
            guard let self = self else { return }
            let baseAbout = freshAbout ?? fromUser.about ?? ""
            
            var chats = self.getProfileChats(aboutText: baseAbout)
            var conversationList = chats[toProfile.id] ?? []
            
            let timestamp = Date().timeIntervalSince1970 * 1000
            let newMsgDict: [String: Any] = [
                "s": fromUser.id,
                "t": trimmed,
                "time": timestamp
            ]
            conversationList.append(newMsgDict)
            chats[toProfile.id] = conversationList
            
            // Auto-mark interest as sent if not present
            var interests = self.getInterests(from: baseAbout)
            if interests[toProfile.id] == nil {
                interests[toProfile.id] = "sent"
            }
            var updatedAbout = self.setInterests(in: baseAbout, interests: interests)
            updatedAbout = self.setProfileChatsInAbout(aboutText: updatedAbout, chatsObj: chats)
            
            // 2. PATCH only 'about' column to Supabase profiles row
            self.updateProfileAbout(userId: fromUser.id, about: updatedAbout) { success in
                if success {
                    self.notifyAdminChatMessageSent(fromUser: fromUser, toProfile: toProfile, text: trimmed)
                }
                completion(success, success ? updatedAbout : nil)
            }
        }
    }
    
    // Convenience overload
    func sendMessage(fromUser: User, toProfile: Profile, text: String, completion: @escaping (Bool) -> Void) {
        sendMessage(fromUser: fromUser, toProfile: toProfile, text: text) { success, _ in
            completion(success)
        }
    }
    
    func notifyAdminChatMessageSent(fromUser: User, toProfile: Profile, text: String) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let dateString = formatter.string(from: Date())
        let notif = "💬 *Royal Chat Message Sent (iOS)* 💬\n\n" +
                    "• *From:* \(fromUser.name) _(\(fromUser.clan) Clan)_\n" +
                    "• *To:* \(toProfile.name) _(\(toProfile.clan) Clan)_\n" +
                    "• *Message:* \(text)\n\n" +
                    "📅 _Time: \(dateString)_"
        sendTelegramNotification(text: notif)
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
