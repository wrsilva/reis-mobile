---
name: flutter-secure-token-store
description: "Stores JWT access tokens on Flutter with platform secure storage (Keychain on iOS, Keystore-backed storage on Android) via flutter_secure_storage. Use when persisting, reading or clearing auth tokens, or when replacing shared_preferences token storage."
intents: [security]
stacks: [flutter]
---

# flutter-secure-token-store

## Description
Store JWT tokens securely on Flutter using platform secure storage.

## Language
Dart

## Inputs
- `token: String`

## Returns
- `Future<void>`
- `Future<String?>`

## Example
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const _key = 'access_token';

  Future<void> save(String token) => _storage.write(key: _key, value: token);
  Future<String?> read() => _storage.read(key: _key);
  Future<void> clear() => _storage.delete(key: _key);
}
```
