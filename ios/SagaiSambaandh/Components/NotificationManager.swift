import Foundation
import UserNotifications
import Combine

// MARK: - Centralized System & In-App Notification Manager
final class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationManager()
    
    @Published var lastNotificationText: String? = nil
    private var postedNotificationIds: Set<String> = []
    
    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    // Request permission from the user on app launch or login
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("✅ iOS Notification permission granted.")
            } else if let error = error {
                print("⚠️ iOS Notification permission error: \(error.localizedDescription)")
            }
        }
    }
    
    // Post immediate local system notification
    func postNotification(id: String, title: String, body: String, userInfo: [String: Any] = [:]) {
        // Prevent duplicate notification bursts for the same item within the session
        if postedNotificationIds.contains(id) {
            return
        }
        postedNotificationIds.insert(id)
        
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = userInfo
        
        let request = UNNotificationRequest(identifier: id, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to deliver notification: \(error.localizedDescription)")
            } else {
                print("🔔 Notification delivered: \(title) - \(body)")
            }
        }
    }
    
    // Trigger when a new marriage match request arrives
    func notifyConnectionRequest(senderName: String, senderId: String) {
        let notifId = "request_\(senderId)_\(Date().timeIntervalSince1970)"
        postNotification(
            id: notifId,
            title: "💍 Royal Match Request",
            body: "\(senderName) sent you a royal connection request. Tap to view and accept.",
            userInfo: ["type": "request", "senderId": senderId]
        )
    }
    
    // Trigger when someone accepts user's request
    func notifyConnectionAccepted(partnerName: String, partnerId: String) {
        let notifId = "accepted_\(partnerId)_\(Date().timeIntervalSince1970)"
        postNotification(
            id: notifId,
            title: "💖 Connection Accepted!",
            body: "\(partnerName) accepted your connection! You can now chat and view contact details.",
            userInfo: ["type": "accepted", "partnerId": partnerId]
        )
    }
    
    // Trigger when someone sends a new chat message
    func notifyNewMessage(senderName: String, senderId: String, messageText: String) {
        let notifId = "msg_\(senderId)_\(messageText.hashValue)"
        postNotification(
            id: notifId,
            title: "💬 \(senderName)",
            body: messageText,
            userInfo: ["type": "message", "senderId": senderId]
        )
    }
    
    // UNUserNotificationCenterDelegate: display banner & play sound EVEN WHEN APP IS OPEN
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }
    
    // Handle tap on notification
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        print("Tapped notification with payload: \(userInfo)")
        completionHandler()
    }
}
