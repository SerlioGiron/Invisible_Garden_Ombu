# Member Retrieval Implementation Notes

## Problem

We need to retrieve all members of a Semaphore group to generate valid zero-knowledge proofs. The local group's Merkle root must match the on-chain root, which requires having the complete member list.

## Challenges Encountered

### 1. Event Scanning Timeout
- **Method**: Scanning blockchain events from block 0
- **Issue**: RPC providers (especially free tier) timeout when scanning large block ranges
- **Error**: `request timed out` (error code: -32002)

### 2. The Graph Subgraph
- **Method**: Using `@semaphore-protocol/data` → `SemaphoreSubgraph`
- **Issue**: Subgraph returns undefined (group not indexed yet or subgraph unavailable)
- **Error**: `Cannot destructure property 'groups' of '(intermediate value)' as it is undefined`
- **Reason**: Newly created groups take time to be indexed, or the subgraph might not be fully synced

### 3. Direct RPC Queries
- **Method**: Using `@semaphore-protocol/data` → `SemaphoreEthers.getGroupMembers()`
- **Issue**: Also uses event scanning under the hood, hits the same RPC timeout
- **Error**: Same as #1

## Current Solution: In-Memory Cache

We use an in-memory `Map` to cache group members:

```javascript
// Exported from relayer/routes/join.js
export const groupMembersCache = new Map();
```

### How It Works

1. When a user joins via `/api/join`:
   - Transaction is sent to add member to on-chain group
   - On success, member is added to cache
   - If member already exists, they're still added to cache

2. When members are requested via `/api/members/:groupId`:
   - Return members from cache immediately (no blockchain queries)
   - Group metadata (root, depth, size) is still fetched from RPC

### Advantages

- **Fast**: No event scanning, instant response
- **Reliable**: No RPC rate limit issues
- **Simple**: No external dependencies

### Limitations

1. **Not Persistent**: Cache is lost when relayer restarts
2. **Incomplete History**: Members who joined before cache was implemented won't appear
3. **Single Relayer**: Only tracks members added through THIS relayer instance

## Recommendations for Production

### Short-term
- Deploy a persistent database (SQLite, PostgreSQL, MongoDB)
- Store member commitments when they're added
- Query database instead of in-memory cache

### Long-term
- Use The Graph hosted service (paid tier with higher rate limits)
- Deploy your own subgraph specifically for your Ombu contract
- Or use event indexing services like Covalent, Moralis, or Alchemy

### Alternative: Hybrid Approach
1. Use cache for recently added members (fast)
2. Query subgraph for historical members (when available)
3. Merge both lists and deduplicate

## How to Populate Cache for Existing Members

If your group already has members but cache is empty:

1. Each existing user should visit the app and click "Join" again
2. The relayer will detect they're already a member (`isGroupMember` check)
3. Instead of sending a transaction, it will just add them to cache
4. After all existing users have done this, the cache will be complete

## Code References

- Cache definition: `relayer/routes/join.js` (line 14)
- Cache population on join: `relayer/routes/join.js` (lines 207-213, 170-175)
- Cache retrieval: `relayer/routes/members.js` (lines 26-27)
