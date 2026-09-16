# iOS data and networking

## HTTP with URLSession

```swift
struct APIClient {
    let baseURL: URL
    let session: URLSession = .shared
    let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()

    func get<T: Decodable>(_ path: String, as type: T.Type = T.self) async throws -> T {
        let (data, response) = try await session.data(from: baseURL.appending(path: path))
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.badStatus((response as? HTTPURLResponse)?.statusCode ?? -1)
        }
        return try decoder.decode(T.self, from: data)
    }
}
```

The names are illustrative.

- `URLSession` does not throw for 4xx/5xx responses: check the status code.
- Async requests are cancelled when their `Task` is cancelled; SwiftUI's `.task` cancels when the view disappears.
- Configure timeouts on a custom `URLSessionConfiguration` instead of relying on defaults for slow endpoints.
- Decoding errors (`DecodingError`) should be logged with the key path; silently returning empty data hides API contract changes.
- Large downloads and uploads that must continue when the app is suspended use a background `URLSessionConfiguration`.
- Observe connectivity with `NWPathMonitor` to show offline state, but still handle request failures: reachability is only a hint.

## Persistence

| Data | Store |
|---|---|
| Secrets, tokens, credentials | Keychain |
| Small preferences | `UserDefaults` (or `@AppStorage` in SwiftUI) |
| Structured app data | SwiftData (iOS 17+) or Core Data |
| Documents, media, caches | Files in Application Support, Documents or Caches, with the right Data Protection class |
| HTTP response caching | `URLCache` with proper cache headers |

### SwiftData

```swift
@Model
final class Note {
    var title: String
    var createdAt: Date
    init(title: String, createdAt: Date = .now) { self.title = title; self.createdAt = createdAt }
}

// App: .modelContainer(for: Note.self)
// View: @Query(sort: \Note.createdAt, order: .reverse) private var notes: [Note]
// Writes: @Environment(\.modelContext) private var context; context.insert(Note(title: "..."))
```

- Plan migrations (`VersionedSchema` and `SchemaMigrationPlan`) before shipping schema changes.
- Model contexts are not shared across concurrency domains; use a `ModelActor` for background work.
- Core Data projects keep Core Data unless there is a reason to migrate; both can coexist during a transition.

## Offline-first

Read from local storage, refresh from the network into it, and show the cached data while refreshing. Queue writes made offline and retry them with backoff; show pending state to the user.

## Images

`AsyncImage` has no persistent cache and decodes at full size. For feeds, use an image library the project already has, or downsample with ImageIO and cache the result.
