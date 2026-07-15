import SwiftUI

struct ClansView: View {
    @State private var selectedClan: Clan? = nil
    
    private let columns = [
        GridItem(.adaptive(minimum: 160), spacing: 15)
    ]
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header block
                VStack(alignment: .leading, spacing: 6) {
                    Text("Rajput Lineage Directory")
                        .font(BrandFonts.displayBold(size: 26))
                        .foregroundColor(.royalMaroon)
                    
                    Text("Explore the historic clans, ancestral gotras, and kingdoms of Rajasthan's royalty.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 20)
                .padding(.top, 15)
                
                // Grid of Clans
                LazyVGrid(columns: columns, spacing: 15) {
                    ForEach(MockData.clans) { clan in
                        ClanCard(clan: clan) {
                            selectedClan = clan
                        }
                    }
                }
                .padding(.horizontal, 20)
                
                // Heritage note block
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(.royalGold)
                        Text("About Rajput Clans")
                            .font(BrandFonts.label(size: 11))
                            .foregroundColor(.royalMaroon)
                            .fontWeight(.bold)
                    }
                    
                    Text("The Rajput community is historically divided into three major lineages (Vanshas): Suryavanshi (descended from the Solar dynasty), Chandravanshi (descended from the Lunar dynasty), and Agnivanshi (born of fire). Each clan holds native Thikanas (fortresses or estates) which shape compatibility standards.")
                        .font(BrandFonts.body(size: 12))
                        .foregroundColor(.gray)
                        .lineSpacing(4)
                }
                .padding(20)
                .background(Color.royalGold.opacity(0.05))
                .cornerRadius(12)
                .padding(.horizontal, 20)
                .padding(.top, 10)
            }
        }
        .background(Color.sandstoneIvory.edgesIgnoringSafeArea(.all))
        .navigationTitle("Rajput Clans")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $selectedClan) { clan in
            ClanDetailOverlay(clan: clan)
        }
    }
}

struct ClanCard: View {
    let clan: Clan
    var onTap: () -> Void
    
    private var clanBannerName: String {
        switch clan.name.lowercased() {
        case "rathore": return "caste_rajput" // Use local cached assets if possible
        case "sisodia": return "caste_maheshwari"
        case "chauhan": return "caste_brahmin"
        case "kachwaha": return "caste_oswal"
        default: return "caste_baniya"
        }
    }
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 0) {
                // Banner area (Simulated fort texture)
                ZStack {
                    LinearGradient(
                        colors: [.royalMaroon, Color(hex: "#2B1810")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    
                    Text(clan.name.prefix(1))
                        .font(BrandFonts.displayBold(size: 40))
                        .foregroundColor(.sandstoneIvory.opacity(0.2))
                }
                .frame(height: 100)
                .cornerRadius(10, corners: [.topLeft, .topRight])
                
                // Description block
                VStack(alignment: .leading, spacing: 6) {
                    Text(clan.name)
                        .font(BrandFonts.displayBold(size: 16))
                        .foregroundColor(.royalMaroon)
                    
                    Text(clan.dynasty)
                        .font(BrandFonts.label(size: 8))
                        .foregroundColor(.royalGold)
                        .fontWeight(.bold)
                    
                    Text(clan.origin)
                        .font(BrandFonts.body(size: 10))
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
                .padding(12)
            }
            .background(Color.cardBackground)
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.royalGold.opacity(0.2), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ClanDetailOverlay: View {
    let clan: Clan
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(spacing: 0) {
            // Header block
            ZStack(alignment: .topLeading) {
                LinearGradient(
                    colors: [.royalMaroon, .deepMaroon],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(height: 180)
                
                VStack(alignment: .leading, spacing: 8) {
                    Button(action: { presentationMode.wrappedValue.dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    Text(clan.name)
                        .font(BrandFonts.displayBold(size: 32))
                        .foregroundColor(.sandstoneIvory)
                    
                    HStack {
                        Text(clan.dynasty)
                            .font(BrandFonts.label(size: 9))
                            .foregroundColor(.lightGold)
                            .fontWeight(.bold)
                        
                        Text("•")
                            .foregroundColor(.white)
                        
                        Text(clan.origin)
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                    }
                }
                .padding(25)
            }
            
            // Detail body block
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("CLAN HISTORICAL PROFILE")
                        .font(BrandFonts.label(size: 11))
                        .foregroundColor(.gray)
                        .tracking(1.5)
                    
                    Text(clan.history)
                        .font(BrandFonts.body(size: 14))
                        .foregroundColor(.inkBrown)
                        .lineSpacing(6)
                    
                    Divider()
                        .background(Color.royalGold.opacity(0.3))
                    
                    // Royal Crest notice
                    HStack(spacing: 15) {
                        Image(systemName: "shield.fill")
                            .font(.system(size: 36))
                            .foregroundColor(.royalGold)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Lineage verified matches inside this clan")
                                .font(BrandFonts.body(size: 11, weight: .bold))
                                .foregroundColor(.inkBrown)
                            Text("All registered brides and grooms under this lineage have undergone verification seals.")
                                .font(BrandFonts.body(size: 10))
                                .foregroundColor(.gray)
                        }
                    }
                    .padding(15)
                    .background(Color.royalGold.opacity(0.06))
                    .cornerRadius(8)
                }
                .padding(25)
            }
            Spacer()
        }
        .background(Color.sandstoneIvory.edgesIgnoringSafeArea(.all))
    }
}

// Helper for corner radius extensions
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}
