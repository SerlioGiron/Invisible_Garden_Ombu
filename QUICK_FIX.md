# Quick Fix for Member Cache Issue

## Problem
Your on-chain Semaphore group (ID: 4) has 2 members, but the cache only has 1 member. This causes proof generation to fail because the local Merkle tree doesn't match the on-chain tree.

## Current State
- **On-chain group ID**: 4 (stored at Ombu contract index 0)
- **On-chain members**: 2
- **Cached members**: 1 (your identity: `12172115...126`)
- **Missing**: 1 member

## Solutions

### Option 1: Find and Add the Missing Member (Recommended)

1. **Find who the second member is:**
   - Check if you created a test identity in another browser/profile
   - Check if someone else joined your group
   - Look in your browser's Developer Tools → Application → Local Storage → `ombuSemaphoreCommitment`

2. **Add them to cache:**
   ```bash
   curl -X POST http://localhost:3001/api/admin/add-member \
     -H "Content-Type: application/json" \
     -d '{"groupId": "4", "identityCommitment": "THEIR_COMMITMENT_HERE"}'
   ```

3. **Verify cache:**
   ```bash
   curl http://localhost:3001/api/members/4
   # Should show 2 members
   ```

### Option 2: Have the Missing Member Rejoin

1. Ask the second member to visit your app
2. They click "Join Group" (or the app automatically detects they should join)
3. The relayer will detect they're already a member and add them to cache

### Option 3: Start Fresh with a New Group

If you don't know who the second member is and can't find them:

1. **Deploy a new Ombu contract** or **create a new group**
2. Join with your current identity
3. Only this identity will be in the group (cache will match on-chain)

### Option 4: Quick Workaround - Remove Second Member On-Chain

If the second member is a mistake/test:

1. Transfer admin rights or use contract's `removeMember` function (if it exists)
2. Remove the unknown member from the on-chain group
3. Cache will then match (1 member in both)

## How to Check Current Cache

```bash
curl http://localhost:3001/api/admin/cache
```

## Next Steps After Fixing

Once you have all members in cache:
1. Refresh your app
2. Try creating a post again
3. The proof should generate successfully

## Why This Happened

Members who joined BEFORE the cache was implemented (or through other means like direct contract calls) are not automatically added to the cache. The cache only tracks members who join through THIS relayer instance.

## Production Solution

For production, replace the in-memory cache with:
- **Persistent database** (PostgreSQL, MongoDB, SQLite)
- **The Graph hosted service** (paid tier)
- **Your own subgraph deployment**
