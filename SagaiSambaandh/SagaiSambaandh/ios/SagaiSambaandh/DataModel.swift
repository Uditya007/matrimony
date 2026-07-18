import Foundation

struct Profile: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var age: Int
    var gender: String // "Bride" or "Groom"
    var clan: String
    var gotra: String
    var kul: String
    var thikana: String
    var location: String
    var height: String
    var occupation: String
    var education: String
    var income: String
    var isVerified: Bool
    var img: String? // Image file reference
}

struct Clan: Identifiable, Codable, Hashable {
    var id: String { name }
    var name: String
    var origin: String
    var dynasty: String
    var history: String
}

struct User: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var email: String
    var gender: String // "Groom" or "Bride"
    var clan: String
    var tier: String // "Starter", "Silver", or "Gold"
    var shortlistedIds: [String]
    var unlockedIds: [String]
    var gotra: String = ""
    var motherGotra: String = ""
    var thikana: String = ""
    var phone: String = ""
    var dob: String = ""
    var education: String = ""
    var occupation: String = ""
    var income: String = ""
    var height: String = ""
    var maritalStatus: String = "Never Married"
    var profilePic: String? = nil
    var isNewUser: Bool? = false
}
