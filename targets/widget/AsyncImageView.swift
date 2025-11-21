import SwiftUI

/// Custom async image view optimized for widgets with caching
struct CachedAsyncImage: View {
    let url: URL?
    let fallback: AnyView

    @State private var image: UIImage?
    @State private var isLoading = false

    var body: some View {
        Group {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            } else {
                fallback
            }
        }
        .onAppear {
            loadImage()
        }
    }

    private func loadImage() {
        guard let url = url, !isLoading else { return }

        isLoading = true

        // Check cache first
        if let cachedImage = ImageCache.shared.get(forKey: url.absoluteString) {
            self.image = cachedImage
            isLoading = false
            return
        }

        // Load from network
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            defer { isLoading = false }

            guard let data = data,
                  let loadedImage = UIImage(data: data) else {
                print("[Widget] Failed to load image from \(url.absoluteString): \(error?.localizedDescription ?? "unknown error")")
                return
            }

            // Cache the image
            ImageCache.shared.set(loadedImage, forKey: url.absoluteString)

            DispatchQueue.main.async {
                self.image = loadedImage
            }
        }
        task.resume()
    }
}

/// Simple in-memory image cache
class ImageCache {
    static let shared = ImageCache()

    private var cache: [String: UIImage] = [:]
    private let maxCacheSize = 50

    private init() {}

    func get(forKey key: String) -> UIImage? {
        return cache[key]
    }

    func set(_ image: UIImage, forKey key: String) {
        // Simple cache size management
        if cache.count >= maxCacheSize {
            // Remove oldest entry (simplified approach)
            cache.removeValue(forKey: cache.keys.first ?? "")
        }
        cache[key] = image
    }
}
