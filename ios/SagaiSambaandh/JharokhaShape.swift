import SwiftUI

struct JharokhaShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.addRoundedRect(in: rect, cornerSize: CGSize(width: 8, height: 8))
        return path
    }
}

struct JharokhaBorder: View {
    var lineWidth: CGFloat = 2.5
    
    var body: some View {
        RoundedRectangle(cornerRadius: 8)
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
