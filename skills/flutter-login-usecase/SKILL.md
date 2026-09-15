---
name: flutter-login-usecase
description: "Implements a Flutter login use case that authenticates through an injected repository and persists the access token through an injected storage abstraction. Use when building or reviewing the login flow of a Flutter app with layered architecture."
routing: manual
stacks: [flutter]
---

# flutter-login-usecase

## Description
Execute mobile login and persist the access token through injected abstractions.

## Language
Dart

## Inputs
- `email: String`
- `password: String`
- `repo: AuthRepository`
- `storage: TokenStorage`

## Returns
- `Future<void>`

## Example
```dart
class LoginUseCase {
  LoginUseCase(this._repo, this._storage);

  final AuthRepository _repo;
  final TokenStorage _storage;

  Future<void> call(String email, String password) async {
    final token = await _repo.login(email, password);
    await _storage.save(token);
  }
}
```
