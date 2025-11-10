# 🏗️ Ombu Project Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
│                     (Web Browser)                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ├── Login with Privy/WalletConnect
                       ├── Create Semaphore identity (anonymous)
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   FRONTEND      │         │  AI BACKEND     │
│  (React+Vite)   │◄────────┤  (Validation)   │
│  Port: 5173     │         │  Port: 3000     │
└────────┬────────┘         └─────────────────┘
         │                           
         │ relayerApi.js             
         │                           
         ▼                           
┌─────────────────┐                 
│    RELAYER      │                 
│   (Express)     │                 
│  Port: 3001     │                 
└────────┬────────┘                 
         │                           
         │ ethers.js                 
         │                           
         ▼                           
┌─────────────────┐                 
│   BLOCKCHAIN    │                 
│  Arbitrum       │                 
│   Sepolia       │                 
└─────────────────┘                 
```

## 🔄 Data Flow

### 1️⃣ User Publishes a Post

```
User → Frontend → AI Backend → Frontend → Relayer → Blockchain
  │          │            │            │          │          │
  │          │            │            │          │          │
  1. Write   2. Validate  3. Approve  4. Sign    5. Pay     6. Confirm
     post      content       post       ZK-proof   gas       transaction
```

**Details:**
1. User writes content
2. Frontend sends to AI Backend to validate it's not offensive
3. AI responds with approval or suggestions
4. User creates ZK proof with Semaphore (anonymous identity)
5. Frontend calls Relayer with the proof
6. Relayer signs and sends transaction to smart contract
7. Blockchain confirms and emits event
8. Frontend listens to event and updates UI

### 2️⃣ User Joins the Group

```
User → Frontend → Relayer → Blockchain
  │          │          │          │
  │          │          │          │
  1. Click   2. Send    3. Sign    4. Confirm
     "Join"     commit    tx          membership
```

## 📦 System Components

### Frontend (src/)
- **Framework:** React + Vite
- **Wallet:** Privy + WalletConnect
- **Anonymity:** Semaphore (Zero-Knowledge Proofs)
- **UI:** Mantine UI
- **State:** React hooks

**Key files:**
- `src/services/relayerApi.js` - Relayer client
- `src/services/apiBackendAI.js` - AI validation client
- `src/services/apiBlockchain.js` - Blockchain reads
- `src/hooks/useContract.js` - Contract interaction

### Relayer Backend (relayer/)
- **Framework:** Express.js
- **Blockchain:** ethers.js v6
- **Security:** CORS, dotenv
- **Purpose:** Pay gas for users

**Structure:**
```
relayer/
├── index.js              # Main server
├── routes/
│   ├── join.js          # POST /api/join
│   └── feedback.js      # POST /api/feedback
├── .env                 # ⚠️ Private key here
└── package.json
```

### Smart Contract (src/contracts/)
- **Language:** Solidity
- **Framework:** Foundry
- **Network:** Arbitrum Sepolia
- **Main functions:**
  - `joinGroup()` - Add member to Semaphore group
  - `sendFeedback()` - Publish anonymous feedback

## 🔑 Security & Privacy

### Layer 1: Anonymity (Semaphore)
```
User → Generate Identity → Commitment → Semaphore Group
                                              │
                                              ▼
                              Post with ZK-Proof (anonymous)
                                    nobody knows who it is
```

### Layer 2: Relayer (Gas)
```
User → DOES NOT pay gas → Relayer pays → Transaction on blockchain
                            (dedicated wallet)
```

### Layer 3: Validation (AI)
```
Post → AI validates content → Approve/Reject → Avoid offensive content
```

## 🌐 Environment Variables

### Frontend (.env)
```env
VITE_PUBLIC_RPC_URL          # Arbitrum Sepolia RPC
VITE_PUBLIC_CHAIN_ID         # 421614
VITE_PUBLIC_CONTRACT_ADDRESS # Contract address
VITE_AI_BACKEND_URL          # AI backend URL
VITE_RELAYER_URL             # Relayer URL (http://localhost:3001)
VITE_PRIVY_APP_ID            # Privy auth
VITE_WALLETCONNECT_PROJECT_ID # WalletConnect
```

### Relayer (relayer/.env)
```env
PORT                 # Server port (3001)
PRIVATE_KEY          # ⚠️ Wallet private key with funds
RPC_URL              # Arbitrum Sepolia RPC
CONTRACT_ADDRESS     # Contract address
FRONTEND_URL         # For CORS (http://localhost:5173)
```

## 🚀 Deployment Flow

### Local Development
```
Terminal 1: cd relayer && npm start
Terminal 2: npm run dev
Terminal 3: # AI Backend running on another repo
```

### Production
```
Frontend   → Vercel/Netlify
Relayer    → Railway/Render/Heroku
Contracts  → Arbitrum Mainnet
AI Backend → Render/Railway
```

## 📊 Database

**There is no traditional database!** Everything is stored on blockchain:

- **Posts** → `FeedbackSent` events on blockchain
- **Users** → Semaphore group in contract
- **Identities** → Local (user's private Identity)

The frontend reads historical events from the blockchain to display posts.

## 🔒 Security Flow

1. **Private Key:**
   - Only exists in `relayer/.env`
   - NEVER exposed to frontend
   - Dedicated wallet with limited balance

2. **User Identity:**
   - Generated locally
   - Saved in localStorage
   - Only public commitment goes to blockchain

3. **Zero-Knowledge Proofs:**
   - User proves they're in the group
   - Without revealing which member they are
   - Semaphore handles the cryptography

## 📈 Scalability

**Current limitations:**
- Relayer pays all gas → expensive on mainnet
- No rate limiting → can be abused
- No additional authentication

**Production improvements:**
- Rate limiting per IP
- User credit system
- Multiple relayers with load balancing
- Balance monitoring and alerts
- Pause relayer if balance < threshold

## 🎯 Key Points

✅ **User never pays gas** → Relayer does it
✅ **User is anonymous** → Semaphore ZK-proofs
✅ **Content validated** → AI reviews before publishing
✅ **Immutable** → Everything on blockchain
✅ **No central server** → Only relayer for gas

---

**This architecture combines the best of:**
- 🔐 Privacy (ZK-proofs)
- 🆓 UX (no gas payment)
- ✅ Moderation (AI)
- 🌐 Decentralization (blockchain)
