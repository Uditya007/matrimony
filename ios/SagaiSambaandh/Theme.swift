import SwiftUI

#if canImport(UIKit)
import UIKit
#endif

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
    
    // MARK: - Marriage App UI Kit Palette
    static let appPrimary = Color(hex: "#E94057")
    static let appPrimaryDark = Color(hex: "#C72C41")
    static let appPrimaryLight = Color(hex: "#FFF0F2")
    static let appSecondary = Color(hex: "#F27121")
    static let appAccent = Color(hex: "#8A2387")
    
    // Backgrounds & Surfaces
    static let appBackground = Color(hex: "#FFFFFF")
    static let appSurface = Color(hex: "#FFFFFF")
    static let appSurfaceElevated = Color(hex: "#FAFAFA")
    static let appCardBackground = Color(hex: "#F4F4F6")
    
    // Typography
    static let appTextPrimary = Color(hex: "#1B1B1E")
    static let appTextSecondary = Color(hex: "#6B7280")
    static let appTextMuted = Color(hex: "#9CA3AF")
    
    // Borders & Dividers
    static let appBorder = Color(hex: "#E5E7EB")
    static let appDivider = Color(hex: "#F3F4F6")
    
    // Status & Badges
    static let verifiedBlue = Color(hex: "#3B82F6")
    static let successGreen = Color(hex: "#10B981")
    static let dislikeRed = Color(hex: "#EF4444")
    static let starPurple = Color(hex: "#8A2387")
    static let starGold = Color(hex: "#F59E0B")
    
    // Royal Rajput Heritage Palette (Maintained for lineage branding)
    static let royalMaroon = Color(hex: "#6B1220")
    static let deepMaroon = Color(hex: "#4A0D18")
    static let royalGold = Color(hex: "#C9A227")
    static let lightGold = Color(hex: "#E8C766")
    static let sandstoneIvory = Color(hex: "#F5EDE0")
    static let jodhpurIndigo = Color(hex: "#1D2B53")
    static let inkBrown = Color(hex: "#2B1810")
    static let cardBackground = Color(hex: "#F4F4F6")
    
    static let textDark = Color(hex: "#1B1B1E")
    static let textMuted = Color(hex: "#6B7280")
}

struct AppGradients {
    static let primary = LinearGradient(
        colors: [Color(hex: "#E94057"), Color(hex: "#F27121")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let romantic = LinearGradient(
        colors: [Color(hex: "#E94057"), Color(hex: "#8A2387")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let royalGold = LinearGradient(
        colors: [Color(hex: "#C9A227"), Color(hex: "#E8C766")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let overlay = LinearGradient(
        colors: [
            Color.clear,
            Color.clear,
            Color.black.opacity(0.35),
            Color.black.opacity(0.78),
            Color.black.opacity(0.96)
        ],
        startPoint: .top,
        endPoint: .bottom
    )
}

struct BrandFonts {
    static func display(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return Font.system(size: size, weight: weight, design: .default)
    }
    
    static func displayItalic(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return Font.system(size: size, weight: weight, design: .default).italic()
    }
    
    static func displayBold(size: CGFloat) -> Font {
        return Font.system(size: size, weight: .bold, design: .default)
    }
    
    static func label(size: CGFloat, weight: Font.Weight = .bold) -> Font {
        return Font.system(size: size, weight: weight, design: .default)
    }
    
    static func body(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return Font.system(size: size, weight: weight, design: .default)
    }
    
    static func bodyBold(size: CGFloat) -> Font {
        return Font.system(size: size, weight: .bold, design: .default)
    }
}

// MARK: - Global Keyboard Dismissal & OK Button Modifier
#if canImport(UIKit)
extension UIApplication {
    func endEditing() {
        sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}
#endif

struct KeyboardOkBarModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button(action: {
                        #if canImport(UIKit)
                        UIApplication.shared.endEditing()
                        #endif
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 13, weight: .bold))
                            Text("OK")
                                .font(BrandFonts.bodyBold(size: 15))
                        }
                        .foregroundColor(Color.appPrimary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 5)
                        .background(Color.appPrimary.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
            }
    }
}

extension View {
    func addKeyboardOkButton() -> some View {
        self.modifier(KeyboardOkBarModifier())
    }
    
    func hideKeyboardOnTap() -> some View {
        self.onTapGesture {
            #if canImport(UIKit)
            UIApplication.shared.endEditing()
            #endif
        }
    }
}

