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
    
    static let royalMaroon = Color(hex: "#6B1220")
    static let deepMaroon = Color(hex: "#4A0D18")
    static let royalGold = Color(hex: "#C9A227")
    static let lightGold = Color(hex: "#E8C766")
    static let sandstoneIvory = Color(hex: "#F5EDE0")
    static let jodhpurIndigo = Color(hex: "#1D2B53")
    static let inkBrown = Color(hex: "#2B1810")
    static let cardBackground = Color(hex: "#FCFBF7")
    
    // Fallbacks for standard gray colors
    static let textDark = Color(hex: "#2B1810")
    static let textMuted = Color.gray.opacity(0.8)
}

struct BrandFonts {
    static func display(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        #if canImport(UIKit)
        if UIFont(name: "CormorantGaramond-Regular", size: size) != nil {
            return Font.custom("CormorantGaramond-Regular", size: size)
        }
        #endif
        return Font.system(size: size, weight: weight, design: .serif)
    }
    
    static func displayItalic(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        #if canImport(UIKit)
        if UIFont(name: "CormorantGaramond-Italic", size: size) != nil {
            return Font.custom("CormorantGaramond-Italic", size: size)
        }
        #endif
        return Font.system(size: size, weight: weight, design: .serif).italic()
    }
    
    static func displayBold(size: CGFloat) -> Font {
        #if canImport(UIKit)
        if UIFont(name: "CormorantGaramond-Bold", size: size) != nil {
            return Font.custom("CormorantGaramond-Bold", size: size)
        }
        #endif
        return Font.system(size: size, weight: .bold, design: .serif)
    }
    
    static func label(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        #if canImport(UIKit)
        if UIFont(name: "Cinzel-Regular", size: size) != nil {
            return Font.custom("Cinzel-Regular", size: size)
        }
        #endif
        return Font.system(size: size, weight: weight == .regular ? .bold : weight, design: .default)
    }
    
    static func body(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        #if canImport(UIKit)
        if UIFont(name: "Poppins-Regular", size: size) != nil {
            return Font.custom("Poppins-Regular", size: size)
        }
        #endif
        return Font.system(size: size, weight: weight, design: .default)
    }
    
    static func bodyBold(size: CGFloat) -> Font {
        #if canImport(UIKit)
        if UIFont(name: "Poppins-Bold", size: size) != nil {
            return Font.custom("Poppins-Bold", size: size)
        }
        #endif
        return Font.system(size: size, weight: .bold, design: .default)
    }
}
