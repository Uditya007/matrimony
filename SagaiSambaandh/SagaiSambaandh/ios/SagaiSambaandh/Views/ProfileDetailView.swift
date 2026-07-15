import SwiftUI

struct ProfileDetailView: View {
    let profile: Profile
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    
    @State private var isUnlocked: Bool = false
    @State private var showingUnlockProgress: Bool = false
    @State private var unlockSuccess: Bool = false
    
    private var isGoldUser: Bool {
        session.currentUser?.tier == "Gold"
    }
    
    private var isSilverUser: Bool {
        session.currentUser?.tier == "Silver"
    }
    
    private var hasDirectAccess: Bool {
        isGoldUser || isSilverUser
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Bar
            HStack {
                Button(action: { presentationMode.wrappedValue.dismiss() }) {
                    Image(systemName: "chevron.down.circle.fill")
                        .font(.system(size: 26))
                        .foregroundColor(.gray)
                }
                Spacer()
                Text("Lineage Details")
                    .font(BrandFonts.label(size: 14))
                    .foregroundColor(.royalMaroon)
                    .fontWeight(.bold)
                Spacer()
                // Placeholder spacer to center text
                Color.clear.frame(width: 26, height: 26)
            }
            .padding(.horizontal, 20)
            .padding(.top, 15)
            .padding(.bottom, 10)
            .background(Color.cardBackground)
            
            ScrollView {
                VStack(spacing: 20) {
                    // Profile Photo Frame
                    ZStack {
                        if let imgName = profile.img {
                            Image(imgName)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } else {
                            LinearGradient(colors: [.royalMaroon, .deepMaroon], startPoint: .topLeading, endPoint: .bottomTrailing)
                                .overlay(
                                    Text(profile.name.components(separatedBy: " ").map { String($0.prefix(1)) }.joined())
                                        .font(.system(size: 48, weight: .bold, design: .serif))
                                        .foregroundColor(.white)
                                )
                        }
                    }
                    .frame(width: 180, height: 220)
                    .clipShape(JharokhaShape())
                    .overlay(JharokhaBorder(lineWidth: 3))
                    .padding(.top, 15)
                    
                    // Name & Basic Info
                    VStack(spacing: 6) {
                        HStack {
                            Text(profile.name)
                                .font(BrandFonts.displayBold(size: 24))
                                .foregroundColor(.royalMaroon)
                            
                            if profile.isVerified {
                                Image(systemName: "checkmark.seal.fill")
                                    .foregroundColor(.royalGold)
                                    .font(.system(size: 18))
                            }
                        }
                        
                        Text("\(profile.age) yrs • \(profile.height) • \(profile.location)")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.gray)
                    }
                    
                    // Rajput Lineage Parameters
                    VStack(alignment: .leading, spacing: 15) {
                        Text("HERITAGE & LINEAGE")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.gray)
                            .tracking(1.5)
                        
                        HStack(spacing: 20) {
                            LineageTag(label: "Rajput Clan", value: profile.clan)
                            LineageTag(label: "Gotra", value: profile.gotra)
                        }
                        
                        HStack(spacing: 20) {
                            LineageTag(label: "Kul / Vansha", value: profile.kul)
                            LineageTag(label: "Thikana (Estate)", value: profile.thikana)
                        }
                    }
                    .padding(20)
                    .background(Color.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.15), lineWidth: 1)
                    )
                    
                    // Professional & Educational details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("PROFESSION & EDUCATION")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.gray)
                            .tracking(1.5)
                            .padding(.bottom, 4)
                        
                        InfoRow(label: "Occupation", value: profile.occupation)
                        InfoRow(label: "Education", value: profile.education)
                        InfoRow(label: "Income Tier", value: profile.income)
                    }
                    .padding(20)
                    .background(Color.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.15), lineWidth: 1)
                    )
                    
                    // Contact details locked / unlocked state box
                    VStack(spacing: 15) {
                        HStack {
                            Image(systemName: "phone.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.royalGold)
                            Text("Direct Contact Details")
                                .font(BrandFonts.label(size: 12))
                                .foregroundColor(.royalMaroon)
                                .fontWeight(.bold)
                            Spacer()
                        }
                        
                        if session.isUnlocked(id: profile.id) || unlockSuccess {
                            // Unlocked Details display
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Image(systemName: "phone.fill")
                                        .foregroundColor(.royalMaroon)
                                    Text("+91 91168 \(Int.random(in: 10000...99999))")
                                        .font(BrandFonts.body(size: 14, weight: .bold))
                                }
                                HStack {
                                    Image(systemName: "envelope.fill")
                                        .foregroundColor(.royalMaroon)
                                    Text("\(profile.name.lowercased().replacingOccurrences(of: " ", with: "."))@sagaisambaandh-member.com")
                                        .font(BrandFonts.body(size: 14, weight: .bold))
                                }
                                HStack {
                                    Image(systemName: "mappin.and.ellipse")
                                        .foregroundColor(.royalMaroon)
                                    Text("\(profile.location), India")
                                        .font(BrandFonts.body(size: 14))
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(15)
                            .background(Color.green.opacity(0.06))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.green.opacity(0.2), lineWidth: 1)
                            )
                        } else {
                            // Locked State details box
                            VStack(spacing: 12) {
                                Text("Lineage contact details are secured. Upgrade to direct communication.")
                                    .font(BrandFonts.body(size: 12))
                                    .foregroundColor(.gray)
                                    .multilineTextAlignment(.center)
                                
                                if showingUnlockProgress {
                                    ProgressView("Securing Lineage...")
                                        .padding()
                                } else {
                                    Button(action: performUnlock) {
                                        Text(hasDirectAccess ? "Unlock Profile Card" : "Upgrade to Unlock Contact")
                                            .font(BrandFonts.body(size: 13, weight: .bold))
                                            .foregroundColor(hasDirectAccess ? .royalMaroon : .white)
                                            .padding(.horizontal, 20)
                                            .padding(.vertical, 10)
                                            .background(hasDirectAccess ? Color.lightGold : Color.royalMaroon)
                                            .cornerRadius(8)
                                    }
                                }
                            }
                            .padding(15)
                            .frame(maxWidth: .infinity)
                            .background(Color.royalGold.opacity(0.05))
                            .cornerRadius(8)
                        }
                    }
                    .padding(20)
                    .background(Color.cardBackground)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.royalGold.opacity(0.15), lineWidth: 1)
                    )
                }
                .padding(20)
            }
        }
        .background(Color.sandstoneIvory.edgesIgnoringSafeArea(.all))
    }
    
    private func performUnlock() {
        if !hasDirectAccess {
            // Trigger alert or direct to plans view
            presentationMode.wrappedValue.dismiss()
            // We could redirect user to tab 2 (Plans)
            return
        }
        
        showingUnlockProgress = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            showingUnlockProgress = false
            unlockSuccess = true
            session.unlockProfile(id: profile.id)
        }
    }
}

struct LineageTag: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(BrandFonts.label(size: 8))
                .foregroundColor(.gray)
            Text(value)
                .font(BrandFonts.body(size: 14, weight: .semibold))
                .foregroundColor(.inkBrown)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(BrandFonts.body(size: 11, weight: .bold))
                .foregroundColor(.gray)
            Text(value)
                .font(BrandFonts.body(size: 13))
                .foregroundColor(.inkBrown)
        }
        .padding(.vertical, 2)
    }
}
