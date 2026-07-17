import SwiftUI

struct InboxView: View {
    @State private var selectedSubTab: Int = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Custom Toolbar
            HStack {
                Spacer()
                Text("Inbox")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(.lightGold)
                Spacer()
            }
            .padding()
            .background(Color.deepMaroon)
            
            // Sub Tabs Selection
            Picker("SubTabs", selection: $selectedSubTab) {
                Text("Received").tag(0)
                Text("Accepted").tag(1)
                Text("Sent").tag(2)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)
            .padding(.vertical, 8)
            .background(Color.deepMaroon)
            
            Spacer()
            
            // Empty State
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(Color.deepMaroon)
                        .frame(width: 100, height: 100)
                    
                    Image(systemName: "envelope.open.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.lightGold)
                }
                
                Text("No Pending Requests")
                    .font(BrandFonts.displayBold(size: 18))
                    .foregroundColor(.lightGold)
                
                Text("Want to increase your chances of finding a Match? Verify your Rajput lineage profile to build family trust.")
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(.sandstoneIvory.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                
                Button(action: {
                    // Start Verification Flow
                }) {
                    Text("Verify Profile Now")
                        .font(BrandFonts.bodyBold(size: 14))
                        .foregroundColor(.deepMaroon)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color.royalGold)
                        .cornerRadius(8)
                }
                .padding(.top, 10)
            }
            
            Spacer()
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
    }
}
