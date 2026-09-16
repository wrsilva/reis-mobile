# Firebase SQL Connect (formerly Data Connect) — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

Firebase Data Connect is now called **Firebase SQL Connect**; the APIs did not change.

## Generated Swift SDK

- The Swift SDK is a separate package: `https://github.com/firebase/data-connect-ios-sdk`.
- In the connector's `connector.yaml`, add a `swiftSdk` entry under `generate` with the output directory, then run `firebase dataconnect:sdk:generate`. Add the generated package to the Xcode project as a local package.
- Regenerate the SDK whenever the schema or the operations change.

## Usage

```swift
let connector = DataConnect.moviesConnector       // name generated from your connector

func loadMovies() async throws -> [ListMoviesQuery.Data.Movie] {
    try await connector.listMoviesQuery.execute().data.movies
}
```

The names above come from a sample connector; use the ones generated for your project. Generated query refs also expose observable results for SwiftUI.

## Notes

- Operations are defined and authorized on the server (`@auth` directives); the app cannot run arbitrary SQL.
- Point the connector at the emulator (default port 9399) in debug builds, as the generated SDK documentation shows.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
