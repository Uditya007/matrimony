import SwiftUI

struct SideMenuView: View {
    @Binding var isOpen: Bool
    @Binding var showingMyProfile: Bool
    @Binding var selectedTab: Int
    @EnvironmentObject var session: SagaiSessionManager
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Profile Header Section
            if let user = session.currentUser {
                HStack(spacing: 15) {
                    // Silhouette avatar with plus sign overlay
                    ZStack(alignment: .bottomTrailing) {
                        Image(systemName: "person.crop.circle.fill")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 60, height: 60)
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                        
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 20, height: 20)
                            .overlay(
                                Image(systemName: "plus")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white)
                            )
                    }
                    
                    VStack(alignment: .leading, spacing: 3) {
                        Text(user.name)
                            .font(BrandFonts.displayBold(size: 16))
                            .foregroundColor(.sandstoneIvory)
                            .lineLimit(1)
                        
                        HStack(spacing: 4) {
                            Text("SS-\(user.id.uppercased())")
                                .font(BrandFonts.body(size: 12, weight: .medium))
                                .foregroundColor(.lightGold)
                            
                            Image(systemName: "doc.on.doc")
                                .font(.system(size: 10))
                                .foregroundColor(.lightGold.opacity(0.7))
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 60)
                .padding(.bottom, 20)
                .background(Color.deepMaroon)
            }
            
            Divider()
                .background(Color.royalGold.opacity(0.2))
            
            // Menu Items List
            ScrollView {
                VStack(alignment: .leading, spacing: 5) {
                    SideMenuItem(icon: "exclamationmark.triangle.fill", title: "Complete Verification", iconColor: .red, hasWarning: true) {
                        withAnimation { isOpen = false }
                        showingMyProfile = true
                    }
                    
                    SideMenuItem(icon: "pencil.line", title: "View and Edit your Profile") {
                        withAnimation { isOpen = false }
                        showingMyProfile = true
                    }
                    
                    SideMenuItem(icon: "arrow.down.doc.fill", title: "Download and Share Profile") {
                        withAnimation { isOpen = false }
                        // Share
                    }
                    
                    SideMenuItem(icon: "star.fill", title: "Upgrade to Premium", iconColor: .royalGold) {
                        withAnimation { isOpen = false }
                        selectedTab = 4
                    }
                    
                    SideMenuItem(icon: "tag.fill", title: "VIPSHAADI") {
                        withAnimation { isOpen = false }
                        selectedTab = 4
                    }
                    
                    Text("Discover Your Matches")
                        .font(BrandFonts.label(size: 10))
                        .foregroundColor(.sandstoneIvory.opacity(0.5))
                        .fontWeight(.bold)
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                        .padding(.bottom, 5)
                    
                    SideMenuItem(icon: "heart.fill", title: "Matches") {
                        withAnimation { isOpen = false }
                        selectedTab = 1
                    }
                    
                    SideMenuItem(icon: "envelope.fill", title: "Inbox") {
                        withAnimation { isOpen = false }
                        selectedTab = 2
                    }
                    
                    SideMenuItem(icon: "bubble.left.and.bubble.right.fill", title: "Chat") {
                        withAnimation { isOpen = false }
                        selectedTab = 3
                    }
                    
                    Text("Options & Settings")
                        .font(BrandFonts.label(size: 10))
                        .foregroundColor(.sandstoneIvory.opacity(0.5))
                        .fontWeight(.bold)
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                        .padding(.bottom, 5)
                    
                    SideMenuItem(icon: "person.2.fill", title: "Partner Preferences") {
                        withAnimation { isOpen = false }
                    }
                    
                    SideMenuItem(icon: "slider.horizontal.3", title: "Contact Filters") {
                        withAnimation { isOpen = false }
                    }
                    
                    SideMenuItem(icon: "rectangle.portrait.and.arrow.right.fill", title: "Log Out", iconColor: .red) {
                        withAnimation { isOpen = false }
                        session.logout()
                    }
                }
                .padding(.vertical, 10)
            }
            .background(Color.deepMaroon)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
    }
}

struct SideMenuItem: View {
    var icon: String
    var title: String
    var iconColor: Color = .royalGold
    var hasWarning: Bool = false
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(iconColor)
                    .frame(width: 24, height: 24)
                
                Text(title)
                    .font(BrandFonts.body(size: 14, weight: .medium))
                    .foregroundColor(.sandstoneIvory)
                
                Spacer()
                
                if hasWarning {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.red)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundColor(.sandstoneIvory.opacity(0.3))
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
    }
}
