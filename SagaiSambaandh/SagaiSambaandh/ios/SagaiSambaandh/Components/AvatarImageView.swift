import SwiftUI
import Combine
import UIKit

// MARK: - In-Memory Image Cache & Downloader
final class AvatarImageLoader: ObservableObject {
    static let sharedCache = NSCache<NSString, UIImage>()
    
    @Published var image: UIImage? = nil
    @Published var isLoading: Bool = false
    
    private var currentTask: URLSessionDataTask?
    private var lastLoadedSource: String? = nil
    
    init() {
        AvatarImageLoader.sharedCache.countLimit = 300
        AvatarImageLoader.sharedCache.totalCostLimit = 100 * 1024 * 1024 // 100 MB
    }
    
    func load(source: String?) {
        let trimmed = source?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if trimmed == lastLoadedSource && image != nil {
            return
        }
        lastLoadedSource = trimmed
        
        currentTask?.cancel()
        currentTask = nil
        
        guard !trimmed.isEmpty else {
            self.image = nil
            self.isLoading = false
            return
        }
        
        // Cache key
        let cacheKey = trimmed.count > 120 ? "\(trimmed.prefix(64))_\(trimmed.count)" : trimmed
        if let cached = AvatarImageLoader.sharedCache.object(forKey: cacheKey as NSString) {
            self.image = cached
            self.isLoading = false
            return
        }
        
        // 1. Check local asset catalog
        if let assetImg = UIImage(named: trimmed) {
            AvatarImageLoader.sharedCache.setObject(assetImg, forKey: cacheKey as NSString)
            self.image = assetImg
            self.isLoading = false
            return
        }
        
        // 2. Base64 Data URI or raw base64
        if trimmed.hasPrefix("data:image/") || (trimmed.count > 150 && (trimmed.hasPrefix("/9j/") || trimmed.hasPrefix("iVBORw0K") || trimmed.hasPrefix("R0lGOD") || trimmed.hasPrefix("UklGR"))) {
            self.isLoading = true
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                var clean = trimmed
                if let comma = clean.firstIndex(of: ",") {
                    clean = String(clean[clean.index(after: comma)...])
                }
                clean = clean.replacingOccurrences(of: "\n", with: "")
                             .replacingOccurrences(of: "\r", with: "")
                             .trimmingCharacters(in: .whitespacesAndNewlines)
                
                if let data = Data(base64Encoded: clean, options: .ignoreUnknownCharacters),
                   let uiImage = UIImage(data: data) {
                    AvatarImageLoader.sharedCache.setObject(uiImage, forKey: cacheKey as NSString)
                    DispatchQueue.main.async {
                        self?.image = uiImage
                        self?.isLoading = false
                    }
                } else {
                    DispatchQueue.main.async {
                        self?.image = nil
                        self?.isLoading = false
                    }
                }
            }
            return
        }
        
        // 3. Remote URL (Ensure www domain to prevent 308 redirects)
        var urlString = trimmed
        if urlString.hasPrefix("https://shreerajputsagaisambandh.com") {
            urlString = urlString.replacingOccurrences(of: "https://shreerajputsagaisambandh.com", with: "https://www.shreerajputsagaisambandh.com")
        } else if urlString.hasPrefix("http://shreerajputsagaisambandh.com") {
            urlString = urlString.replacingOccurrences(of: "http://shreerajputsagaisambandh.com", with: "https://www.shreerajputsagaisambandh.com")
        } else if !urlString.hasPrefix("http") {
            // Slug/file reference e.g. "groom_ranveer"
            let fileName = urlString.hasSuffix(".png") || urlString.hasSuffix(".jpg") ? urlString : "\(urlString).png"
            urlString = "https://www.shreerajputsagaisambandh.com/images/\(fileName)"
        }
        
        guard let url = URL(string: urlString) else {
            self.image = nil
            self.isLoading = false
            return
        }
        
        self.isLoading = true
        let task = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let data = data, let uiImage = UIImage(data: data) else {
                DispatchQueue.main.async {
                    self?.image = nil
                    self?.isLoading = false
                }
                return
            }
            AvatarImageLoader.sharedCache.setObject(uiImage, forKey: cacheKey as NSString)
            DispatchQueue.main.async {
                self?.image = uiImage
                self?.isLoading = false
            }
        }
        self.currentTask = task
        task.resume()
    }
}

// MARK: - Reusable Royal Avatar Image View
struct AvatarImageView: View {
    let imageSource: String?
    let name: String
    var clan: String = ""
    var contentMode: ContentMode = .fill
    var fallbackFontSize: CGFloat = 32
    
    @StateObject private var loader = AvatarImageLoader()
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                if let uiImage = loader.image {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: contentMode)
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipped()
                } else if loader.isLoading {
                    monogramFallbackView(size: geo.size)
                        .overlay(
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white.opacity(0.85)))
                        )
                } else {
                    monogramFallbackView(size: geo.size)
                }
            }
        }
        .onAppear {
            loader.load(source: imageSource)
        }
        .onChange(of: imageSource) { _, newSource in
            loader.load(source: newSource)
        }
    }
    
    // Initials logic: RS for Ranveer Singh, U for udit, etc.
    private var initials: String {
        let parts = name.trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: .whitespaces)
            .filter { !$0.isEmpty }
        if parts.count >= 2 {
            let first = parts[0].prefix(1).uppercased()
            let second = parts[1].prefix(1).uppercased()
            return "\(first)\(second)"
        } else if let first = parts.first, !first.isEmpty {
            return String(first.prefix(1)).uppercased()
        }
        return "R"
    }
    
    // Royal monogram fallback view: Never blank white!
    private func monogramFallbackView(size: CGSize) -> some View {
        let minDim = min(size.width, size.height)
        let calcFontSize = minDim > 0 ? min(fallbackFontSize, minDim * 0.45) : fallbackFontSize
        
        return ZStack {
            // Noble Rajput Heritage Gradient
            clanGradient
            
            // Subtle Crown Crest Watermark
            Image(systemName: "crown.fill")
                .resizable()
                .scaledToFit()
                .foregroundColor(.white.opacity(0.12))
                .padding(minDim * 0.22)
            
            // Regal Initials
            Text(initials)
                .font(BrandFonts.displayBold(size: calcFontSize))
                .foregroundColor(.white)
                .shadow(color: Color.black.opacity(0.3), radius: 2, x: 0, y: 1)
        }
        .frame(width: size.width, height: size.height)
    }
    
    private var clanGradient: LinearGradient {
        let c = clan.lowercased()
        if c.contains("rathore") {
            return LinearGradient(
                colors: [Color(hex: "#C72C41"), Color(hex: "#F27121")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else if c.contains("sisodia") {
            return LinearGradient(
                colors: [Color(hex: "#6B1220"), Color(hex: "#C9A227")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else if c.contains("chauhan") {
            return LinearGradient(
                colors: [Color(hex: "#8A2387"), Color(hex: "#E94057")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else if c.contains("shekhawat") {
            return LinearGradient(
                colors: [Color(hex: "#10B981"), Color(hex: "#1D2B53")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else {
            return LinearGradient(
                colors: [Color.appPrimary, Color.appSecondary],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}
