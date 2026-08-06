import SwiftUI

struct NotificationsView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Royal Notifications")
                        .font(BrandFonts.displayBold(size: 20))
                        .foregroundColor(.lightGold)
                    Spacer()
                    Button(action: {
                        presentationMode.wrappedValue.dismiss()
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.lightGold)
                    }
                }
                .padding()
                .background(Color.deepMaroon)
                
                if session.notificationsList.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "bell.slash.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.royalGold.opacity(0.5))
                        Text("No notifications yet")
                            .font(BrandFonts.displayBold(size: 16))
                            .foregroundColor(.lightGold.opacity(0.8))
                        Text("You will receive updates about match interests and connection responses here.")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.sandstoneIvory.opacity(0.6))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(session.notificationsList, id: \.id) { notification in
                                HStack(alignment: .top, spacing: 12) {
                                    ZStack {
                                        Circle()
                                            .fill(Color.royalGold.opacity(0.15))
                                            .frame(width: 40, height: 40)
                                        Image(systemName: "bell.fill")
                                            .foregroundColor(.royalGold)
                                            .font(.system(size: 18))
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(notification.message)
                                            .font(BrandFonts.bodyBold(size: 14))
                                            .foregroundColor(.sandstoneIvory)
                                            .multilineTextAlignment(.leading)
                                            .lineLimit(nil)
                                        Text(notification.timestamp)
                                            .font(BrandFonts.body(size: 11))
                                            .foregroundColor(.sandstoneIvory.opacity(0.5))
                                    }
                                    Spacer()
                                }
                                .padding()
                                .background(Color.cardBackground.opacity(0.2))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.royalGold.opacity(0.2), lineWidth: 1)
                                )
                            }
                        }
                        .padding()
                    }
                    .background(Color.deepMaroon)
                }
            }
            .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
            .navigationBarHidden(true)
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
}
