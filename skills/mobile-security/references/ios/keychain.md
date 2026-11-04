# Store tokens in the iOS Keychain

Use Keychain Services for small secrets such as access and refresh tokens. Choose access and sharing rules from the app's actual lifecycle and threat model; a token in the Keychain is still a bearer credential and must be handled carefully after reading it.

## Review checklist

1. **Remove plaintext token copies.** Do not store tokens in `UserDefaults`, property lists, logs, analytics, crash reports or URLs. Find and delete the old copy after a successful migration.
2. **Choose the accessibility class.** Use `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` for foreground-only secrets that should not migrate to a different device. If background work needs the token after the first unlock, consider `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`. Select a class based on when the app needs access; avoid the deprecated `kSecAttrAccessibleAlways*` classes. Verify current behavior in Apple's documentation.
3. **Decide backup and device migration behavior.** A `ThisDeviceOnly` class prevents migration when restoring a backup to another device; it can still be restored to the device that created the backup. Non-`ThisDeviceOnly` classes may migrate with encrypted backups. Do not assume this is equivalent to deleting an item during backup or restore.
4. **Gate access with biometrics only when required.** A biometric prompt that returns a Boolean does not protect the stored token. When the product requires biometric gating, attach a `SecAccessControl` created with an appropriate flag such as `.biometryCurrentSet` to the item. Handle authentication cancellation and enrollment changes by requiring reauthentication. Do not add a prompt to every token read unless that is the intended user experience.
5. **Share only with intended targets.** Use a Keychain access group only when an app extension or companion target must read the item. Configure the entitlement for each target and use the same explicit access-group identifier in the query. Keep unrelated targets out of the group.
6. **Handle reinstall and logout deliberately.** Keychain credentials can remain available after an app is removed and reinstalled, so do not treat reinstall as logout. On logout, revoke the server-side session as appropriate and delete the item's Keychain entry. On launch, validate any recovered session with the server and provide an explicit sign-out path.

## Basic token store

This example stores one generic-password item per service and account. It updates an existing item, returns `nil` when no token exists, treats deleting a missing item as success, and surfaces other `OSStatus` failures to the caller.

```swift
import Foundation
import Security

enum TokenStoreError: Error {
    case keychain(OSStatus)
    case invalidData
}

struct TokenStore {
    private let service = "com.example.app.auth"
    private let account = "refresh-token"

    private var identity: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
    }

    func save(_ token: String) throws {
        guard let data = token.data(using: .utf8) else {
            throw TokenStoreError.invalidData
        }

        let query = identity
        let update: [String: Any] = [kSecValueData as String: data]
        let updateStatus = SecItemUpdate(query as CFDictionary, update as CFDictionary)

        if updateStatus == errSecItemNotFound {
            var item = query
            item[kSecValueData as String] = data
            item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            let addStatus = SecItemAdd(item as CFDictionary, nil)
            guard addStatus == errSecSuccess else {
                throw TokenStoreError.keychain(addStatus)
            }
        } else if updateStatus != errSecSuccess {
            throw TokenStoreError.keychain(updateStatus)
        }
    }

    func read() throws -> String? {
        var query = identity
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound {
            return nil
        }
        guard status == errSecSuccess else {
            throw TokenStoreError.keychain(status)
        }
        guard let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            throw TokenStoreError.invalidData
        }
        return token
    }

    func delete() throws {
        let status = SecItemDelete(identity as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw TokenStoreError.keychain(status)
        }
    }
}
```

When biometrics are required, create a `SecAccessControl` with the chosen accessibility and flags, then provide it as `kSecAttrAccessControl` when adding the item. Do not combine it with `kSecAttrAccessible`; the access-control object carries the protection class.

## Migrate from `UserDefaults`

1. Read the legacy value only if present.
2. Save it to the Keychain and confirm the Keychain operation succeeded.
3. Remove the legacy value and persist that removal.
4. Keep the migration idempotent: if the Keychain already has a token, prefer it and remove any stale legacy copy. If migration fails, do not silently discard the only credential; prompt for sign-in if recovery is not safe.

## Apple documentation

- [Restricting Keychain item accessibility](https://developer.apple.com/documentation/security/restricting-keychain-item-accessibility)
- [Sharing Keychain items among a collection of apps](https://developer.apple.com/documentation/security/sharing-access-to-keychain-items-among-a-collection-of-apps)
- [SecAccessControlCreateWithFlags](https://developer.apple.com/documentation/security/secaccesscontrolcreatewithflags(_:_:_:_:))
- [Updating and deleting Keychain items](https://developer.apple.com/documentation/security/updating-and-deleting-keychain-items)
- [Using the Keychain to manage user secrets](https://developer.apple.com/documentation/security/using-the-keychain-to-manage-user-secrets)
