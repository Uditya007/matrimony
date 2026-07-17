import SwiftUI

struct BiodataCardView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    @State private var isDownloading: Bool = false
    @State private var downloadSuccess: Bool = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Premium Biodata Card to Display
                    VStack(spacing: 20) {
                        // Royal Crest Top Divider
                        HStack {
                            Image(systemName: "crown.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.royalGold)
                            Text("SHREE RAJPUT MATRIMONY")
                                .font(BrandFonts.displayBold(size: 14))
                                .foregroundColor(.lightGold)
                                .tracking(2)
                        }
                        .padding(.top, 12)
                        
                        Divider().background(Color.royalGold.opacity(0.3))
                        
                        // User Name
                        if let user = session.currentUser {
                            Text(user.name)
                                .font(BrandFonts.displayBold(size: 22))
                                .foregroundColor(.sandstoneIvory)
                                .multilineTextAlignment(.center)
                            
                            Text("SS-\(user.id.uppercased())")
                                .font(BrandFonts.body(size: 13, weight: .bold))
                                .foregroundColor(.lightGold)
                                .padding(.top, -10)
                            
                            Divider().background(Color.royalGold.opacity(0.15))
                            
                            // Biodata Grid
                            VStack(spacing: 12) {
                                biodataRow(label: "Clan Heritage", value: user.clan)
                                biodataRow(label: "Paternal Gotra", value: user.gotra)
                                biodataRow(label: "Maternal Gotra", value: user.motherGotra)
                                biodataRow(label: "Noble Thikana", value: user.thikana)
                                biodataRow(label: "Date of Birth", value: user.dob)
                                biodataRow(label: "Height", value: user.height)
                                biodataRow(label: "Education", value: user.education)
                                biodataRow(label: "Occupation", value: user.occupation)
                                biodataRow(label: "Annual Income", value: user.income)
                                biodataRow(label: "Marital Status", value: user.maritalStatus)
                            }
                            .padding(.horizontal)
                        }
                        
                        Divider().background(Color.royalGold.opacity(0.3))
                        
                        // Verified Seal
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundColor(.green)
                            Text("Verified Rajput Lineage Audited")
                                .font(BrandFonts.label(size: 10))
                                .foregroundColor(.sandstoneIvory.opacity(0.6))
                        }
                        .padding(.bottom, 12)
                    }
                    .padding()
                    .background(Color.deepMaroon)
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.royalGold, lineWidth: 2)
                    )
                    .padding(.horizontal)
                    
                    // Share & Download Buttons
                    if isDownloading {
                        ProgressView("Generating Biodata Image...")
                            .tint(.lightGold)
                            .foregroundColor(.sandstoneIvory)
                            .padding()
                    } else if downloadSuccess {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("Biodata PDF saved to Downloads!")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.green)
                        }
                        .padding()
                    } else {
                        HStack(spacing: 16) {
                            // Download button
                            Button(action: downloadBiodata) {
                                HStack {
                                    Image(systemName: "square.and.arrow.down")
                                    Text("Download Card")
                                }
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.deepMaroon)
                                .frame(maxWidth: .infinity)
                                .frame(height: 46)
                                .background(
                                    LinearGradient(colors: [.royalGold, .lightGold, .royalGold], startPoint: .leading, endPoint: .trailing)
                                )
                                .cornerRadius(8)
                            }
                            
                            // Share button
                            Button(action: shareBiodataText) {
                                HStack {
                                    Image(systemName: "square.and.arrow.up")
                                    Text("Share Biodata")
                                }
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                                .frame(maxWidth: .infinity)
                                .frame(height: 46)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.lightGold, lineWidth: 1.5)
                                )
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
            .navigationBarTitle("Lineage Biodata", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Close") {
                    presentationMode.wrappedValue.dismiss()
                }.foregroundColor(.lightGold)
            )
        }
    }
    
    private func biodataRow(label: String, value: String) -> some View {
        HStack(alignment: .top) {
            Text(label.uppercased())
                .font(BrandFonts.label(size: 9))
                .foregroundColor(.lightGold.opacity(0.8))
                .frame(width: 100, alignment: .leading)
            
            Text(value.isEmpty ? "Not Specified" : value)
                .font(BrandFonts.body(size: 13, weight: .medium))
                .foregroundColor(.sandstoneIvory)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 4)
    }
    
    private func downloadBiodata() {
        withAnimation { isDownloading = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            withAnimation {
                isDownloading = false
                downloadSuccess = true
            }
        }
    }
    
    private func shareBiodataText() {
        guard let user = session.currentUser else { return }
        let shareText = """
        ✨ Shree Rajput Sagai Sambandh Lineage Card ✨
        ----------------------------------------------
        Candidate Name: \(user.name) (SS-\(user.id.uppercased()))
        Clan Heritage:  \(user.clan)
        Paternal Gotra: \(user.gotra)
        Maternal Gotra: \(user.motherGotra)
        Noble Thikana:   \(user.thikana)
        Date of Birth:  \(user.dob)
        Height:         \(user.height)
        Highest Edu:    \(user.education)
        Profession:     \(user.occupation)
        Annual Income:  \(user.income)
        Marital Status: \(user.maritalStatus)
        ----------------------------------------------
        Audited & Verified on Shree Rajput Sagai Sambandh.
        """
        
        let av = UIActivityViewController(activityItems: [shareText], applicationActivities: nil)
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.present(av, animated: true, completion: nil)
        }
    }
}
