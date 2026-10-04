import SwiftUI
import UIKit

struct AvatarSelectionView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    
    @State private var showingImagePicker: Bool = false
    @State private var pickerSourceType: UIImagePickerController.SourceType = .photoLibrary
    @State private var pickedUIImage: UIImage? = nil
    @State private var isUploading: Bool = false
    @State private var uploadSuccessMessage: String? = nil
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.appSurfaceElevated.edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 24) {
                    Text("Select a photo from your phone's photo gallery to update your profile portrait.")
                        .font(BrandFonts.body(size: 13.5))
                        .foregroundColor(Color.appTextSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                        .padding(.top, 12)
                    
                    // Current / Picked Portrait Preview
                    VStack(spacing: 12) {
                        ZStack {
                            if let newImage = pickedUIImage {
                                Image(uiImage: newImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 140, height: 140)
                                    .clipShape(Circle())
                                    .overlay(Circle().stroke(Color.royalGold, lineWidth: 3))
                                    .shadow(color: Color.black.opacity(0.12), radius: 10, y: 5)
                            } else {
                                AvatarImageView(
                                    imageSource: session.currentUser?.profilePic,
                                    name: session.currentUser?.name ?? "Member",
                                    clan: session.currentUser?.clan ?? "",
                                    contentMode: .fill,
                                    fallbackFontSize: 44
                                )
                                .frame(width: 140, height: 140)
                                .clipShape(Circle())
                                .overlay(Circle().stroke(Color.royalGold, lineWidth: 3))
                                .shadow(color: Color.black.opacity(0.12), radius: 10, y: 5)
                            }
                        }
                        
                        Text(pickedUIImage != nil ? "New Photo Selected" : "Current Profile Picture")
                            .font(BrandFonts.label(size: 11, weight: .bold))
                            .foregroundColor(pickedUIImage != nil ? Color.appPrimary : Color.appTextSecondary)
                    }
                    .padding(.vertical, 10)
                    
                    // Gallery Action Buttons
                    VStack(spacing: 14) {
                        // 1. Choose from Photo Gallery
                        Button(action: {
                            pickerSourceType = .photoLibrary
                            showingImagePicker = true
                        }) {
                            HStack(spacing: 10) {
                                Image(systemName: "photo.on.rectangle.angled")
                                    .font(.system(size: 18))
                                Text("Choose from Phone Gallery")
                                    .font(BrandFonts.bodyBold(size: 15))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(
                                LinearGradient(
                                    colors: [Color.appPrimary, Color.appSecondary],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(14)
                            .shadow(color: Color.appPrimary.opacity(0.28), radius: 8, y: 4)
                        }
                        
                        // 2. Take Photo with Camera (if available)
                        if UIImagePickerController.isSourceTypeAvailable(.camera) {
                            Button(action: {
                                pickerSourceType = .camera
                                showingImagePicker = true
                            }) {
                                HStack(spacing: 10) {
                                    Image(systemName: "camera.fill")
                                        .font(.system(size: 16))
                                    Text("Take Photo with Camera")
                                        .font(BrandFonts.bodyBold(size: 15))
                                }
                                .foregroundColor(Color.appTextPrimary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    
                    // Save Button if a new photo is selected
                    if let pickedImage = pickedUIImage {
                        Button(action: {
                            savePickedPhoto(pickedImage)
                        }) {
                            HStack(spacing: 8) {
                                if isUploading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    Text("Saving Picture...")
                                        .font(BrandFonts.bodyBold(size: 15))
                                } else {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 16))
                                    Text("Set as Profile Picture")
                                        .font(BrandFonts.bodyBold(size: 15))
                                }
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.successGreen)
                            .cornerRadius(14)
                            .shadow(color: Color.successGreen.opacity(0.3), radius: 8, y: 4)
                        }
                        .padding(.horizontal, 24)
                        .padding(.top, 4)
                        .disabled(isUploading)
                    }
                    
                    Spacer()
                }
            }
            .navigationBarTitle("Profile Picture", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
                .foregroundColor(Color.appTextPrimary)
            )
            .sheet(isPresented: $showingImagePicker) {
                PhoneGalleryPicker(sourceType: pickerSourceType, isPresented: $showingImagePicker) { image in
                    self.pickedUIImage = image
                    // Auto save immediately for quick one-tap update
                    self.savePickedPhoto(image)
                }
            }
        }
    }
    
    private func savePickedPhoto(_ image: UIImage) {
        guard var user = session.currentUser else { return }
        guard let base64Data = image.toBase64Jpeg(maxDimension: 600, compressionQuality: 0.75) else { return }
        
        isUploading = true
        user.profilePic = base64Data
        session.updateCurrentUser(updated: user)
        
        SupabaseClient.shared.updateProfile(user: user) { success in
            DispatchQueue.main.async {
                self.isUploading = false
                #if canImport(UIKit)
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(success ? .success : .warning)
                #endif
                self.presentationMode.wrappedValue.dismiss()
            }
        }
    }
}
