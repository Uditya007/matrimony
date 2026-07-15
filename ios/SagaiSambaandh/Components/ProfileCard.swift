import SwiftUI

struct ProfileCard: View {
    let profile: Profile
    let isLocked: Bool
    var onUnlockTap: () -> Void
    var onDetailTap: () -> Void
    
    private var lockedName: String {
        let title = profile.gender == "Groom" ? "Kunwar" : "Bannisa"
        let nameComponents = profile.name.components(separatedBy: " ")
        let firstInitial = nameComponents.first?.first ?? "S"
        let clanInitial = profile.clan.first ?? "R"
        return "\(title) \(firstInitial). \(clanInitial)."
    }
    
    private var clanGradient: LinearGradient {
        switch profile.clan.lowercased() {
        case "rathore": // Rathore Saffron
            return LinearGradient(colors: [Color(hex: "#FF9933"), Color(hex: "#FF5500")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case "sisodia": // Sisodia Crimson
            return LinearGradient(colors: [Color(hex: "#990011"), Color(hex: "#5D000A")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case "chauhan": // Chauhan Gold
            return LinearGradient(colors: [Color(hex: "#C9A227"), Color(hex: "#8A6D0F")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case "kachwaha": // Kachwaha Indigo
            return LinearGradient(colors: [Color(hex: "#1D2B53"), Color(hex: "#0F1A36")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case "bhati": // Bhati Desert Gold
            return LinearGradient(colors: [Color(hex: "#E8C766"), Color(hex: "#A38023")], startPoint: .topLeading, endPoint: .bottomTrailing)
        default: // Shekhawat/Panwar Emerald
            return LinearGradient(colors: [Color(hex: "#124E3F"), Color(hex: "#0A3329")], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Image / Frame Section
            ZStack {
                if isLocked {
                    // Fallback Clan Gradient
                    clanGradient
                        .clipShape(JharokhaShape())
                        .overlay(JharokhaBorder())
                    
                    // Blur state with lock icon
                    VStack(spacing: 8) {
                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.white)
                            .shadow(radius: 4)
                        
                        Text("Photo Locked")
                            .font(BrandFonts.label(size: 11))
                            .foregroundColor(.white)
                            .tracking(2)
                            .shadow(radius: 4)
                        
                        Button(action: onUnlockTap) {
                            Text("Connect to Unlock")
                                .font(BrandFonts.body(size: 10, weight: .bold))
                                .foregroundColor(.royalMaroon)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.lightGold)
                                .cornerRadius(12)
                                .shadow(radius: 2)
                        }
                        .padding(.top, 4)
                    }
                } else {
                    // Unlocked Image state
                    Group {
                        if let imgName = profile.img, !imgName.isEmpty {
                            Image(imgName)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } else {
                            // Monogram avatar initials fallback
                            clanGradient
                                .overlay(
                                    Text(profile.name.components(separatedBy: " ").map { String($0.prefix(1)) }.joined())
                                        .font(BrandFonts.displayBold(size: 40))
                                        .foregroundColor(.sandstoneIvory)
                                )
                        }
                    }
                    .frame(height: 240)
                    .clipShape(JharokhaShape())
                    .overlay(JharokhaBorder())
                    
                    // Red Wax verification seal
                    if profile.isVerified {
                        VStack {
                            HStack {
                                Spacer()
                                WaxSealBadgeView()
                                    .padding(.trailing, 10)
                                    .padding(.top, 10)
                            }
                            Spacer()
                        }
                    }
                }
            }
            .frame(height: 240)
            .padding(12)
            
            // Text Details Section
            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .top) {
                    Text(isLocked ? lockedName : profile.name)
                        .font(BrandFonts.displayBold(size: 18))
                        .foregroundColor(.royalMaroon)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    Text("\(profile.age) yrs")
                        .font(BrandFonts.body(size: 13, weight: .bold))
                        .foregroundColor(.inkBrown)
                }
                
                // Clan badge label
                HStack {
                    Text(profile.clan)
                        .font(BrandFonts.label(size: 9))
                        .foregroundColor(.royalMaroon)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.royalGold.opacity(0.15))
                        .cornerRadius(6)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.royalGold.opacity(0.4), lineWidth: 0.8)
                        )
                    
                    Text(profile.thikana)
                        .font(BrandFonts.body(size: 11))
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
                
                Divider()
                    .background(Color.royalGold.opacity(0.2))
                    .padding(.vertical, 4)
                
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("GOTRA")
                            .font(BrandFonts.label(size: 8))
                            .foregroundColor(.gray)
                        Text(isLocked ? "Locked" : profile.gotra)
                            .font(BrandFonts.body(size: 12, weight: .semibold))
                            .foregroundColor(.inkBrown)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .leading, spacing: 3) {
                        Text("THIKANA")
                            .font(BrandFonts.label(size: 8))
                            .foregroundColor(.gray)
                        Text(profile.thikana.components(separatedBy: " ").first ?? profile.thikana)
                            .font(BrandFonts.body(size: 12, weight: .semibold))
                            .foregroundColor(.inkBrown)
                    }
                    
                    Spacer()
                    
                    Button(action: onDetailTap) {
                        Image(systemName: "chevron.right.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.royalGold)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .background(Color.cardBackground)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.royalGold.opacity(0.2), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.06), radius: 8, x: 0, y: 4)
    }
}

struct WaxSealBadgeView: View {
    var body: some View {
        ZStack {
            // Seal outer stamp
            Circle()
                .fill(Color(hex: "#6B1220"))
                .frame(width: 32, height: 32)
                .overlay(
                    Circle()
                        .stroke(Color(hex: "#E8C766").opacity(0.5), lineWidth: 1)
                )
                .shadow(color: Color(hex: "#6B1220").opacity(0.4), radius: 3, x: 0, y: 2)
            
            // Inner seal mark
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 15))
                .foregroundColor(Color(hex: "#E8C766"))
        }
    }
}
