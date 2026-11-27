# Firestore rules needed for cloud backups + error reports

Until these are added, backups are kept on each player's device only, and error reports
are kept on the device (`aut-errors` in localStorage). Nothing breaks without them.

**How to add:** Firebase console → project `animetcg-533c0` → Firestore Database → **Rules** tab.
Paste the two blocks below **inside** `match /databases/{database}/documents {`, above the final
`match /{document=**}` line. Then click **Publish**.

```
    // daily save backups (owner only)
    match /users/{uid}/backups/{day} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // crash reports: players can only add their own; nobody can read them from the game
    match /errors/{id} {
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.msg is string
        && request.resource.data.msg.size() <= 500
        && request.resource.data.stack.size() <= 1500;
      allow read, update, delete: if false;
    }
```

**Reading crash reports:** Firebase console → Firestore Database → Data → `errors` collection.
Each report has the message, stack, game version (`ver`), page, phone/browser (`ua`), time (`at`) and player name.
