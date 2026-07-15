import SwiftUI

struct PalaceDividerShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height
        
        path.move(to: CGPoint(x: 0, y: h))
        path.addLine(to: CGPoint(x: 0, y: h * 0.65))
        
        path.addLine(to: CGPoint(x: w * 0.08, y: h * 0.65))
        path.addLine(to: CGPoint(x: w * 0.08, y: h * 0.45))
        path.addLine(to: CGPoint(x: w * 0.11, y: h * 0.45))
        
        // Left small dome
        path.addQuadCurve(to: CGPoint(x: w * 0.15, y: h * 0.45), control: CGPoint(x: w * 0.13, y: h * 0.32))
        path.addLine(to: CGPoint(x: w * 0.18, y: h * 0.45))
        path.addLine(to: CGPoint(x: w * 0.18, y: h * 0.65))
        
        // Mid low wall
        path.addLine(to: CGPoint(x: w * 0.32, y: h * 0.65))
        path.addLine(to: CGPoint(x: w * 0.32, y: h * 0.38))
        path.addLine(to: CGPoint(x: w * 0.36, y: h * 0.38))
        
        // Middle chhatri dome
        path.addQuadCurve(to: CGPoint(x: w * 0.42, y: h * 0.38), control: CGPoint(x: w * 0.39, y: h * 0.22))
        path.addLine(to: CGPoint(x: w * 0.46, y: h * 0.38))
        path.addLine(to: CGPoint(x: w * 0.46, y: h * 0.60))
        
        // Main high fort tower
        path.addLine(to: CGPoint(x: w * 0.58, y: h * 0.60))
        path.addLine(to: CGPoint(x: w * 0.58, y: h * 0.25))
        path.addLine(to: CGPoint(x: w * 0.62, y: h * 0.25))
        
        // Main dome arch peak
        path.addQuadCurve(to: CGPoint(x: w * 0.70, y: h * 0.25), control: CGPoint(x: w * 0.66, y: h * 0.05))
        path.addLine(to: CGPoint(x: w * 0.74, y: h * 0.25))
        path.addLine(to: CGPoint(x: w * 0.74, y: h * 0.62))
        
        // Right low wall
        path.addLine(to: CGPoint(x: w * 0.84, y: h * 0.62))
        path.addLine(to: CGPoint(x: w * 0.84, y: h * 0.48))
        path.addLine(to: CGPoint(x: w * 0.88, y: h * 0.48))
        
        // Right small dome
        path.addQuadCurve(to: CGPoint(x: w * 0.92, y: h * 0.48), control: CGPoint(x: w * 0.90, y: h * 0.36))
        path.addLine(to: CGPoint(x: w * 0.95, y: h * 0.48))
        path.addLine(to: CGPoint(x: w * 0.95, y: h * 0.65))
        
        path.addLine(to: CGPoint(x: w, y: h * 0.65))
        path.addLine(to: CGPoint(x: w, y: h))
        path.closeSubpath()
        
        return path
    }
}

struct PalaceDivider: View {
    var fillColor: Color = .sandstoneIvory
    
    var body: some View {
        PalaceDividerShape()
            .fill(fillColor)
            .frame(height: 50)
    }
}
