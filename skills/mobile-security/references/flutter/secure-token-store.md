# Storing auth tokens securely in Flutter

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
