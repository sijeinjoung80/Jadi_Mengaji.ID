# Security Specification: MengajiID Firebase Setup

## 1. Data Invariants

- **Users**: Users must registration unique usernames consisting strictly of alphanumeric characters and hyphens. A user cannot change their username or privilege tier (`role`) once created.
- **Messages**: Messages are immutable consult documents that cannot be updated or deleted once committed to the public ledger. The `senderUid` must verify against the active session auth state if authenticated.
- **Progress**: Only the owner of the user profile path (`userId`) can read or write their private bookmark details.

## 2. The "Dirty Dozen" Malicious Payloads blocked by the Fortress Rules

1. **User Role Promotion**: Registering an account with `role: "Admin"`.
2. **Username Modification**: Attempting an update to swap username.
3. **Null Payload Fields**: Registering with missing schema keys.
4. **Massive ID Injection**: Inundating document ID parameters with junk strings (>128 chars).
5. **Private Data Breach**: Querying or reading progress of other `userId`.
6. **Message Update/Tampering**: Updating existing message texts.
7. **Message Spoofing**: Sending as another registered UID.
8. **Resource Exhaustion Text**: Posting exceptionally large texts.
9. **Rogue Progression State**: Invaliding progress object with unallowed fields.
10. **Malicious Delete API**: Deleting messages history.
11. **Rogue Schema Keys**: Creating document structures with ghost parameters.
12. **Out of bounds range fields**: Writing numbers or strings which exceed static limit boundaries.
