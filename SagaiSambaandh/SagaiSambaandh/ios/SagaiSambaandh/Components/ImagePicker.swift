import SwiftUI
import UIKit

// MARK: - Native iOS Image Picker (Phone Gallery & Camera)
struct PhoneGalleryPicker: UIViewControllerRepresentable {
    var sourceType: UIImagePickerController.SourceType = .photoLibrary
    @Binding var isPresented: Bool
    var onImagePicked: (UIImage) -> Void
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(sourceType) ? sourceType : .photoLibrary
        picker.allowsEditing = true // Enables square crop box for clean profile portraits
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: PhoneGalleryPicker
        
        init(_ parent: PhoneGalleryPicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            let image = (info[.editedImage] as? UIImage) ?? (info[.originalImage] as? UIImage)
            if let pickedImage = image {
                let fixed = pickedImage.fixedOrientation()
                parent.onImagePicked(fixed)
            }
            parent.isPresented = false
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.isPresented = false
        }
    }
}

// MARK: - UIImage Helpers for Orientations, Resizing & Base64 Encoding
extension UIImage {
    /// Fixes iOS camera/gallery EXIF orientation so images don't display rotated
    func fixedOrientation() -> UIImage {
        if imageOrientation == .up { return self }
        UIGraphicsBeginImageContextWithOptions(size, false, scale)
        draw(in: CGRect(origin: .zero, size: size))
        let normalized = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return normalized ?? self
    }
    
    /// Resizes image proportionally so max dimension is capped
    func resized(maxDimension: CGFloat = 600) -> UIImage {
        let maxSide = max(size.width, size.height)
        if maxSide <= maxDimension { return self }
        let ratio = maxDimension / maxSide
        let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)
        UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
        draw(in: CGRect(origin: .zero, size: newSize))
        let resizedImg = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return resizedImg ?? self
    }
    
    /// Converts image to a clean Data URI Base64 JPEG string compatible with web & database
    func toBase64Jpeg(maxDimension: CGFloat = 600, compressionQuality: CGFloat = 0.75) -> String? {
        let prepared = self.fixedOrientation().resized(maxDimension: maxDimension)
        guard let data = prepared.jpegData(compressionQuality: compressionQuality) else { return nil }
        return "data:image/jpeg;base64," + data.base64EncodedString()
    }
}
