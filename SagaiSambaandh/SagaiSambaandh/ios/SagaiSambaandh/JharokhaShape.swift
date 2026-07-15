import SwiftUI

struct JharokhaShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height
        
        // Start at bottom-left corner
        path.move(to: CGPoint(x: 0, y: h))
        
        // Line to the start of the arch (left side)
        path.addLine(to: CGPoint(x: 0, y: h * 0.38))
        
        // Draw the left outer scallop
        path.addQuadCurve(
            to: CGPoint(x: w * 0.15, y: h * 0.20),
            control: CGPoint(x: w * 0.02, y: h * 0.27)
        )
        
        // Draw the middle-left scallop
        path.addQuadCurve(
            to: CGPoint(x: w * 0.35, y: h * 0.10),
            control: CGPoint(x: w * 0.22, y: h * 0.13)
        )
        
        // Draw the top pointed peak (arch tip)
        path.addQuadCurve(
            to: CGPoint(x: w * 0.5, y: 0),
            control: CGPoint(x: w * 0.43, y: h * 0.04)
        )
        
        // Draw descending right side (top peak descending)
        path.addQuadCurve(
            to: CGPoint(x: w * 0.65, y: h * 0.10),
            control: CGPoint(x: w * 0.57, y: h * 0.04)
        )
        
        // Draw the middle-right scallop
        path.addQuadCurve(
            to: CGPoint(x: w * 0.85, y: h * 0.20),
            control: CGPoint(x: w * 0.78, y: h * 0.13)
        )
        
        // Draw the right outer scallop
        path.addQuadCurve(
            to: CGPoint(x: w, y: h * 0.38),
            control: CGPoint(x: w * 0.98, y: h * 0.27)
        )
        
        // Line down to bottom-right corner
        path.addLine(to: CGPoint(x: w, y: h))
        
        // Close path
        path.closeSubpath()
        
        return path
    }
}

struct JharokhaBorder: View {
    var lineWidth: CGFloat = 2.5
    
    var body: some View {
        JharokhaShape()
            .stroke(
                LinearGradient(
                    colors: [.royalGold, .lightGold, .royalGold],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                lineWidth: lineWidth
            )
    }
}
