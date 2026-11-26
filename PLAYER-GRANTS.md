# Player Grants

The Players screen can show a **Player Grants** tab for the account registered as Aspext. Rewards go to the named account and are applied on the recipient’s next load. The queue entry and save update are committed together.

The feature is disabled by default. Before enabling it, a Firebase project administrator must merge the following match block into the existing Firestore rules, inside `match /databases/{database}/documents`. Replace `ASPEXT_FIREBASE_AUTH_UID` with the existing Auth UID verified against `usernames/aspext`. Keep the existing rules for all other collections. Verify that no broader matching rule permits unauthorized reads or writes to `playerGrants` because Firestore grants access if any matching allow rule passes.

```text
match /playerGrants/{grantId} {
  function isGrantAdmin() {
    return request.auth != null
      && request.auth.uid == 'ASPEXT_FIREBASE_AUTH_UID'
      && get(/databases/$(database)/documents/usernames/aspext).data.uid == request.auth.uid;
  }

  function validReward(g) {
    return g.amount is int && g.amount > 0
      && g.key is string && g.key.size() <= 200
      && ((g.type == 'coins' && g.amount <= 100000000 && g.key == '')
       || (g.type == 'shards' && g.amount <= 1000000 && g.key == '')
       || (g.type == 'item' && g.amount <= 1000 && g.key.size() > 0)
       || (g.type == 'card' && g.amount <= 100 && g.key.size() > 0));
  }

  allow create: if isGrantAdmin()
    && request.resource.data.keys().hasAll(['to', 'from', 'type', 'key', 'amount', 'pending', 'createdAt'])
    && request.resource.data.keys().hasOnly(['to', 'from', 'type', 'key', 'amount', 'pending', 'createdAt'])
    && request.resource.data.from == request.auth.uid
    && request.resource.data.to is string
    && exists(/databases/$(database)/documents/profiles/$(request.resource.data.to))
    && request.resource.data.pending == true
    && request.resource.data.createdAt == request.time
    && validReward(request.resource.data);

  allow read: if request.auth != null && resource.data.to == request.auth.uid;

  allow update: if request.auth != null
    && resource.data.to == request.auth.uid
    && resource.data.pending == true && request.resource.data.pending == false
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['pending'])
    && getAfter(/databases/$(database)/documents/users/$(request.auth.uid)).data.playerGrantRevision
       == (exists(/databases/$(database)/documents/users/$(request.auth.uid))
         ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('playerGrantRevision', 0) + 1
         : 1);
}
```

For existing save writes, extend the existing owner-write rule to reject a missing or decreased `playerGrantRevision` after a grant. Test owner and non-owner creation, recipient and unrelated reads, and atomic redemption against the merged rules before setting `playerGrantsEnabled: true` in `config.js`.

## Grant history

Inside the existing `match /playerGrants/{grantId}` block, add this sender-only list rule alongside the recipient read rule. The form can then query Aspext's sent grants and show whether the recipient has redeemed them.

```text
allow list: if isGrantAdmin() && resource.data.from == request.auth.uid;
```
