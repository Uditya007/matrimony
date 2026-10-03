import SwiftUI

struct ChatView: View {
    @State private var selectedSubTab: Int = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Top Toolbar
            HStack {
                Spacer()
                Text("Chat")
                    .font(BrandFonts.displayBold(size: 20))
                    .foregroundColor(.lightGold)
                Spacer()
            }
            .padding()
            .background(Color.deepMaroon)
            
            // Sub Tabs Selection
            Picker("SubTabs", selection: $selectedSubTab) {
                Text("All Chats").tag(0)
                Text("Unread").tag(1)
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
                    
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.lightGold)
                }
                
                Text("No Recent Chats")
                    .font(BrandFonts.displayBold(size: 18))
                    .foregroundColor(.lightGold)
                
                Text("Initiate contacts with compatible profiles or verify your profile to unlock custom matchmaking recommendations.")
                    .font(BrandFonts.body(size: 13))
                    .foregroundColor(.sandstoneIvory.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            Spacer()
        }
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
    }
}
