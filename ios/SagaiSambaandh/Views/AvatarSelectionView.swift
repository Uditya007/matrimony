import SwiftUI

struct AvatarSelectionView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    
    @State private var selectedAvatar: String = ""
    @State private var customUrl: String = ""
    
    private let groomAvatars = [
        "groom_ranveer", "groom_aditya", "groom_devendra", "groom_siddharth", "groom_vikramaditya"
    ]
    
    private let brideAvatars = [
        "bride_aishwarya", "bride_priyanka", "bride_riya", "bride_divya"
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    Text("Select a verified heritage portrait to represent your lineage profile.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(.sandstoneIvory.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("KUNWAR (GROOM) AVATARS")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.lightGold)
                            .fontWeight(.bold)
                            .tracking(1)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(groomAvatars, id: \.self) { avatar in
                                    avatarItem(name: avatar)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("BANNISA (BRIDE) AVATARS")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.lightGold)
                            .fontWeight(.bold)
                            .tracking(1)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(brideAvatars, id: \.self) { avatar in
                                    avatarItem(name: avatar)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("OR USE CUSTOM IMAGE URL")
                            .font(BrandFonts.label(size: 10))
                            .foregroundColor(.lightGold)
                            .fontWeight(.bold)
                            .tracking(1)
                        
                        TextField("https://example.com/avatar.jpg", text: $customUrl)
                            .font(BrandFonts.body(size: 14))
                            .foregroundColor(.black)
                            .padding(12)
                            .background(Color.white)
                            .cornerRadius(6)
                            .onChange(of: customUrl) { newValue in
                                if !newValue.isEmpty {
                                    selectedAvatar = newValue
                                }
                            }
                    }
                    .padding()
                    
                    Spacer().frame(height: 20)
                    
                    Button(action: saveAvatar) {
                        Text("Set Profile Picture")
                            .font(BrandFonts.bodyBold(size: 15))
                            .foregroundColor(.deepMaroon)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(
                                LinearGradient(
                                    colors: [.royalGold, .lightGold, .royalGold],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(8)
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
            .navigationBarTitle("Select Avatar", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }.foregroundColor(.lightGold)
            )
            .onAppear {
                if let current = session.currentUser?.profilePic {
                    if current.contains("http") {
                        customUrl = current
                    }
                    selectedAvatar = current
                }
            }
        }
    }
    
    private func avatarItem(name: String) -> some View {
        Button(action: {
            selectedAvatar = name
            customUrl = "" // clear custom url if preset selected
        }) {
            Image(name)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 80, height: 80)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(selectedAvatar == name ? Color.lightGold : Color.clear, lineWidth: 3)
                )
                .shadow(radius: 4)
        }
    }
    
    private func saveAvatar() {
        guard var user = session.currentUser else { return }
        user.profilePic = selectedAvatar
        session.updateCurrentUser(updated: user)
        presentationMode.wrappedValue.dismiss()
    }
}
