import Foundation

struct ScoredProfile: Identifiable, Hashable {
    var id: String { profile.id }
    let profile: Profile
    let matchScore: Int // 55 to 99
    let reasons: [String]
    let hasSagotraConflict: Bool
}

struct AIMatchPreferences {
    var isGenericRequest: Bool = false
    var targetGender: String? = nil
    var targetClans: [String] = []
    var ageMin: Int? = nil
    var ageMax: Int? = nil
    var targetLocations: [String] = []
    var targetProfessions: [String] = []
    var rawQuery: String = ""
}

class AIMatchmaker {
    static let shared = AIMatchmaker()
    
    private let clans = [
        "rathore", "sisodia", "chauhan", "kachwaha", "kachawa", "bhati",
        "shekhawat", "tanwar", "panwar", "tomar", "solanki", "parmar",
        "parihar", "jadeja", "jhala", "hadda", "deora", "chundawat"
    ]
    
    private let locations = [
        "jaipur", "jodhpur", "udaipur", "bikaner", "ajmer", "sikar", "alwar",
        "jaisalmer", "barmer", "kota", "pali", "nagaur", "jhunjhunu", "rajasthan",
        "delhi", "ncr", "mumbai", "pune", "bangalore", "bengaluru", "hyderabad",
        "indore", "ahmedabad", "usa", "uk", "dubai", "canada"
    ]
    
    private let historicalAlliances: [String: [String]] = [
        "rathore": ["sisodia", "chauhan", "bhati", "kachwaha"],
        "sisodia": ["rathore", "bhati", "chauhan", "jhala"],
        "chauhan": ["rathore", "sisodia", "bhati", "kachwaha"],
        "kachwaha": ["rathore", "sisodia", "chauhan", "shekhawat"],
        "bhati": ["rathore", "sisodia", "chauhan"],
        "shekhawat": ["rathore", "sisodia", "kachwaha", "bhati"],
        "tanwar": ["rathore", "sisodia", "chauhan"],
        "panwar": ["rathore", "sisodia", "chauhan"]
    ]
    
    private let professionGroups: [(key: String, terms: [String])] = [
        ("doctor", ["doctor", "physician", "surgeon", "mbbs", "md", "ms", "dentist", "medical"]),
        ("engineer", ["engineer", "software", "tech", "developer", "iit", "b.tech", "m.tech", "ai", "data", "coding"]),
        ("business", ["business", "entrepreneur", "hotelier", "resorts", "founder", "startup", "real estate", "industrialist"]),
        ("civil_services", ["ias", "ips", "ras", "irs", "civil service", "government", "govt", "officer", "bureaucrat"]),
        ("defence", ["army", "navy", "air force", "defence", "military", "colonel", "captain", "major"]),
        ("management", ["mba", "iim", "finance", "consultant", "banker", "analyst", "manager"]),
        ("finance", ["ca", "chartered accountant", "audit", "tax", "cfa"]),
        ("heritage", ["architect", "restoration", "art", "historian", "curator", "heritage"]),
        ("academic", ["professor", "scholar", "lecturer", "researcher", "teacher"])
    ]
    
    func parseQueryPreferences(queryText: String?, currentUser: User?) -> AIMatchPreferences {
        let q = (queryText ?? "").lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        var prefs = AIMatchPreferences(rawQuery: queryText ?? "")
        
        let genericTriggers = [
            "my type", "his type", "her type", "my preference", "his preference",
            "my match", "perfect match", "ideal match", "compatible match",
            "mere type", "mere hisab", "show match", "find match", "recommend match",
            "according to preference", "based on preference", "suggest match"
        ]
        
        prefs.isGenericRequest = genericTriggers.contains { q.contains($0) } || q.isEmpty
        
        // Gender extraction
        let brideWords = ["bride", "brides", "ladi", "ladki", "girl", "girls", "female", "woman", "women", "kanya", "she", "her"]
        let groomWords = ["groom", "grooms", "banna", "ladka", "boy", "boys", "male", "man", "men", "var", "kunwar", "he", "his", "him"]
        
        if brideWords.contains(where: { containsWord(in: q, word: $0) }) {
            prefs.targetGender = "Bride"
        } else if groomWords.contains(where: { containsWord(in: q, word: $0) }) {
            prefs.targetGender = "Groom"
        } else if let user = currentUser {
            prefs.targetGender = user.gender.lowercased() == "groom" ? "Bride" : "Groom"
        }
        
        // Clan extraction
        for clan in clans {
            if containsWord(in: q, word: clan) {
                prefs.targetClans.append(clan.capitalized)
            }
        }
        
        if prefs.targetClans.isEmpty, let user = currentUser {
            let userPrefClan = UserDefaults.standard.string(forKey: "search_clan_pref_\(user.id)") ?? ""
            if !userPrefClan.isEmpty && userPrefClan != "All Clans" {
                prefs.targetClans.append(userPrefClan)
            }
        }
        
        // Age range extraction
        let (extractedMin, extractedMax) = extractAgeRange(from: q)
        if let minA = extractedMin, let maxA = extractedMax {
            prefs.ageMin = minA
            prefs.ageMax = maxA
        } else if let user = currentUser {
            let savedMin = UserDefaults.standard.double(forKey: "pref_min_age_\(user.id)")
            let savedMax = UserDefaults.standard.double(forKey: "pref_max_age_\(user.id)")
            prefs.ageMin = savedMin > 0 ? Int(savedMin) : 21
            prefs.ageMax = savedMax > 0 ? Int(savedMax) : 32
        } else {
            prefs.ageMin = 21
            prefs.ageMax = 32
        }
        
        // Location extraction
        for loc in locations {
            if containsWord(in: q, word: loc) {
                prefs.targetLocations.append(loc.capitalized)
            }
        }
        if prefs.targetLocations.isEmpty, let user = currentUser {
            if let savedLoc = UserDefaults.standard.string(forKey: "pref_loc_\(user.id)"), savedLoc != "Anywhere" && !savedLoc.isEmpty {
                prefs.targetLocations.append(savedLoc)
            } else if !user.location.isEmpty {
                prefs.targetLocations.append(user.location)
            }
        }
        
        // Profession extraction
        for group in professionGroups {
            if group.terms.contains(where: { containsWord(in: q, word: $0) }) {
                prefs.targetProfessions.append(group.key)
            }
        }
        
        return prefs
    }
    
    func searchDatabase(queryText: String?, currentUser: User?, allProfiles: [Profile]) -> [ScoredProfile] {
        let prefs = parseQueryPreferences(queryText: queryText, currentUser: currentUser)
        
        let userPaternalGotra = currentUser?.gotra.components(separatedBy: " ").first?.trimmingCharacters(in: .whitespaces).lowercased() ?? ""
        let userMaternalGotra = currentUser?.motherGotra.components(separatedBy: " ").first?.trimmingCharacters(in: .whitespaces).lowercased() ?? ""
        let userClan = currentUser?.clan.lowercased() ?? ""
        
        var scoredList: [ScoredProfile] = []
        
        for p in allProfiles {
            // Exclude self
            if let user = currentUser {
                if p.id == user.id || (!p.email.isNilOrEmpty && !user.email.isEmpty && p.email?.lowercased() == user.email.lowercased()) {
                    continue
                }
            }
            
            // Gender check
            if let targetGender = prefs.targetGender {
                if p.gender.lowercased() != targetGender.lowercased() {
                    continue
                }
            }
            
            var score = 50 // Baseline
            var reasons: [String] = []
            
            // Gotra & Sagotra check
            let candidateGotra = p.gotra.components(separatedBy: " ").first?.trimmingCharacters(in: .whitespaces).lowercased() ?? ""
            var hasSagotraConflict = false
            if !userPaternalGotra.isEmpty && !candidateGotra.isEmpty && candidateGotra == userPaternalGotra {
                hasSagotraConflict = true
            }
            if !userMaternalGotra.isEmpty && !candidateGotra.isEmpty && candidateGotra == userMaternalGotra {
                hasSagotraConflict = true
            }
            
            if hasSagotraConflict {
                score -= 40
                reasons.append("⚠️ Sagotra overlap detected")
            } else if !userPaternalGotra.isEmpty {
                score += 10
                reasons.append("🛡️ Sagotra-safe verified (Zero gotra conflict)")
            }
            
            // Clan compatibility
            let candidateClan = p.clan.lowercased()
            if !prefs.targetClans.isEmpty {
                let matchClan = prefs.targetClans.contains { $0.lowercased() == candidateClan }
                if matchClan {
                    score += 22
                    reasons.append("🏰 Exact \(p.clan) Clan Match")
                } else {
                    score -= 5
                }
            } else if !userClan.isEmpty {
                let alliances = historicalAlliances[userClan] ?? []
                if alliances.contains(candidateClan) {
                    score += 15
                    reasons.append("👑 Prestigious Alliance (\(currentUser?.clan ?? "Rajput") + \(p.clan))")
                } else {
                    score += 5
                }
            }
            
            // Age compatibility
            let candidateAge = p.age
            if let ageMin = prefs.ageMin, let ageMax = prefs.ageMax {
                if candidateAge >= ageMin && candidateAge <= ageMax {
                    score += 16
                    reasons.append("📅 Age \(candidateAge) aligns with \(ageMin)–\(ageMax) target")
                } else if abs(candidateAge - ageMin) <= 2 || abs(candidateAge - ageMax) <= 2 {
                    score += 8
                    reasons.append("📅 Age \(candidateAge) is close to target range")
                } else {
                    score -= 10
                }
            }
            
            // Location compatibility
            let pLocation = "\(p.location) \(p.thikana)".lowercased()
            if !prefs.targetLocations.isEmpty {
                if let matchedLoc = prefs.targetLocations.first(where: { pLocation.contains($0.lowercased()) }) {
                    score += 16
                    reasons.append("📍 Located in \(matchedLoc)")
                }
            } else if let user = currentUser, !user.location.isEmpty {
                let userCity = user.location.components(separatedBy: ",").first?.trimmingCharacters(in: .whitespaces).lowercased() ?? ""
                if !userCity.isEmpty && pLocation.contains(userCity) {
                    score += 10
                    reasons.append("📍 Same Region (\(userCity.capitalized))")
                }
            }
            
            // Profession compatibility
            let pCareer = "\(p.occupation) \(p.education)".lowercased()
            if !prefs.targetProfessions.isEmpty {
                var careerMatched = false
                for profKey in prefs.targetProfessions {
                    if let group = professionGroups.first(where: { $0.key == profKey }) {
                        if group.terms.contains(where: { pCareer.contains($0) }) {
                            score += 18
                            reasons.append("💼 Match in \(group.key.replacingOccurrences(of: "_", with: " ").capitalized)")
                            careerMatched = true
                            break
                        }
                    }
                }
                if !careerMatched { score -= 5 }
            } else {
                if pCareer.contains("doctor") || pCareer.contains("iit") || pCareer.contains("iim") || pCareer.contains("ias") || pCareer.contains("architect") || pCareer.contains("engineer") {
                    score += 8
                    let occFirst = p.occupation.components(separatedBy: ",").first ?? "Professional"
                    reasons.append("🎓 High Pedigree Career (\(occFirst))")
                }
            }
            
            // Verification bonus
            if p.isVerified {
                score += 6
                reasons.append("👑 Wax Seal Lineage Verified")
            }
            
            let finalScore = max(55, min(99, score))
            scoredList.append(ScoredProfile(
                profile: p,
                matchScore: finalScore,
                reasons: Array(reasons.prefix(4)),
                hasSagotraConflict: hasSagotraConflict
            ))
        }
        
        // Sort highest matchScore first, placing sagotra conflicts at the bottom
        scoredList.sort { a, b in
            if a.hasSagotraConflict != b.hasSagotraConflict {
                return !a.hasSagotraConflict && b.hasSagotraConflict
            }
            return a.matchScore > b.matchScore
        }
        
        return scoredList
    }
    
    private func containsWord(in text: String, word: String) -> Bool {
        let pattern = "\\b\(NSRegularExpression.escapedPattern(for: word))\\b"
        return text.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil
    }
    
    private func extractAgeRange(from text: String) -> (Int?, Int?) {
        // e.g. "between 23 and 27", "23 to 27", "23-27"
        let rangeRegex = try? NSRegularExpression(pattern: "(\\d{2})\\s*(?:to|-|and)\\s*(\\d{2})", options: .caseInsensitive)
        if let match = rangeRegex?.firstMatch(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count)) {
            if let r1 = Range(match.range(at: 1), in: text), let r2 = Range(match.range(at: 2), in: text) {
                let minA = Int(text[r1])
                let maxA = Int(text[r2])
                return (minA, maxA)
            }
        }
        
        // e.g. "under 28" / "below 28"
        let underRegex = try? NSRegularExpression(pattern: "(?:under|below|less than)\\s+(\\d{2})", options: .caseInsensitive)
        if let match = underRegex?.firstMatch(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count)) {
            if let r1 = Range(match.range(at: 1), in: text), let maxA = Int(text[r1]) {
                return (18, maxA)
            }
        }
        
        // e.g. "above 24"
        let aboveRegex = try? NSRegularExpression(pattern: "(?:above|older than|more than)\\s+(\\d{2})", options: .caseInsensitive)
        if let match = aboveRegex?.firstMatch(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count)) {
            if let r1 = Range(match.range(at: 1), in: text), let minA = Int(text[r1]) {
                return (minA, 45)
            }
        }
        
        // Single age: e.g. "age 25"
        let singleRegex = try? NSRegularExpression(pattern: "(?:age\\s+|around\\s+)?(\\d{2})\\s*(?:years|yrs)?", options: .caseInsensitive)
        if let match = singleRegex?.firstMatch(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count)) {
            if let r1 = Range(match.range(at: 1), in: text), let age = Int(text[r1]), age >= 18 && age <= 60 {
                return (max(18, age - 2), age + 2)
            }
        }
        
        return (nil, nil)
    }
}

private extension Optional where Wrapped == String {
    var isNilOrEmpty: Bool {
        return self == nil || self?.isEmpty == true
    }
}
