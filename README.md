# OMBU

🔗 **Demo:** [Watch the demo](https://www.loom.com/share/dac57a1281fa4c3ca97ced0c1528411d)

[Demo withouth comments](https://www.youtube.com/watch?v=m8EyBxnd1W4&feature=youtu.be)

**Ombu** is a safe space for students to anonymously review their teachers and courses without fear of retaliation. Named after the Swedish Ombudsman—someone who investigates complaints against organizations or public authorities—Ombu empowers students to speak freely about their educational experiences.

Our AI agent moderates content by filtering offensive language and suggesting respectful alternatives, ensuring constructive dialogue. Once validated, comments are stored privately on blockchain with zero-knowledge proofs, providing immutability, security, and transparency. Other students can vote anonymously on reviews, fostering free expression in a decentralized, trustworthy environment built on privacy-preserving technologies like Semaphore and authenticated through Privy.

---

## ✨ Features

- 🔐 **Anonymous Reviews**: Post reviews using zero-knowledge proofs via Semaphore protocol
- 🤖 **AI Moderation**: Automatic content filtering and respectful language suggestions
- 🗳️ **Anonymous Voting**: Upvote or downvote reviews without revealing your identity
- 🔗 **Gasless Transactions**: Relayer service handles blockchain interactions
- 🔒 **Privacy-Preserving**: Identity commitments stored securely with cryptographic proofs
- 📱 **Modern UI**: Built with React, Mantine, and responsive design

---

## 🏗️ Architecture

Ombu consists of three main components:

1. **Frontend (React + Vite)**: User interface for creating identities, posting reviews, and voting
2. **Relayer Server (Node.js + Express)**: Backend service that handles gasless transactions and manages identity commitments
3. **Smart Contracts (Solidity + Foundry)**: On-chain storage for posts, comments, and votes using Semaphore protocol
4. **AI Backend** (Separate Repository): Content moderation and language filtering service

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Mantine** - UI component library
- **Wagmi** - Ethereum React hooks
- **Privy** - Authentication and wallet management
- **Semaphore Protocol** - Zero-knowledge proofs for anonymous interactions
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Ethers.js** - Ethereum interaction library
- **MongoDB** - Identity commitment storage (optional)

### Smart Contracts
- **Solidity 0.8.28** - Smart contract language
- **Foundry** - Development framework
- **Semaphore Contracts** - Privacy-preserving group management

---

## 📋 Prerequisites

- **Node.js** (>= 18.x)
- **npm** (included with Node.js)
- **Foundry** (for smart contract development) - [Installation Guide](https://book.getfoundry.sh/getting-started/installation)
- **MongoDB** (optional, for identity commitment storage)
- **Git**

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/SerlioGiron/Invisible_Garden_Ombu.git
cd Invisible_Garden_Ombu
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Relayer Dependencies

```bash
cd relayer
npm install
cd ..
```

### 4. Set Up Environment Variables

Copy the environment template to create your `.env` file:

```bash
cp .env.template .env
```

Edit `.env` and fill in the required values. See the [Environment Variables](#-environment-variables) section below for details.

**Required variables:**
- `VITE_PRIVY_APP_ID` - Get from [Privy Dashboard](https://dashboard.privy.io)
- `VITE_WALLETCONNECT_PROJECT_ID` - Get from [WalletConnect Cloud](https://cloud.walletconnect.com)
- `PRIVATE_KEY` - Relayer wallet private key (with funds for gas)
- `RPC_URL` - Blockchain RPC endpoint

### 5. Set Up AI Backend

The AI moderation service runs in a separate repository:

```bash
# Clone the AI backend repository
git clone https://github.com/SerlioGiron/Invisible_garden_model.git
cd Invisible_garden_model
# Follow the setup instructions in that repository
```

Make sure the AI backend is running before starting the frontend. Update `VITE_AI_BACKEND_URL` in your `.env` file to match the AI service URL.

### 6. Compile Smart Contracts (Optional)

If you need to compile or deploy contracts:

```bash
forge build
```

---

## 🎮 Running the Application

### Development Mode

1. **Start the Relayer Server** (in a separate terminal):

```bash
cd relayer
npm run dev
```

The relayer will start on `http://localhost:3001` (or the port specified in your `.env`).

2. **Start the Frontend** (in another terminal):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

3. **Start the AI Backend** (in a third terminal):

Follow the instructions in the [Invisible_garden_model](https://github.com/SerlioGiron/Invisible_garden_model) repository.

### Production Build

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

---

## 🔧 Environment Variables

The `.env.template` file contains all available environment variables with detailed descriptions. Key variables include:

### Frontend Variables (VITE_*)
- `VITE_PUBLIC_RPC_URL` - Blockchain RPC endpoint
- `VITE_PUBLIC_CHAIN_ID` - Network chain ID (421614 for Arbitrum Sepolia)
- `VITE_RELAYER_URL` - Relayer service URL
- `VITE_AI_BACKEND_URL` - AI moderation service URL
- `VITE_PRIVY_APP_ID` - Privy application ID
- `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID

### Relayer Variables
- `PRIVATE_KEY` - ⚠️ **REQUIRED** - Wallet private key for gas payments
- `RPC_URL` - ⚠️ **REQUIRED** - Blockchain RPC endpoint
- `MONGODB_URI` - MongoDB connection string (optional)
- `PORT` - Relayer server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

### Contract Configuration
- `OMBU_CONTRACT_ADDRESS` - Deployed contract address
- `DEFAULT_GROUP_ID` - Default Semaphore group ID

⚠️ **Security Note**: Never commit your `.env` file. The `.env.template` file is safe to commit as it contains no sensitive data.

---

## 📁 Project Structure

```
Invisible_Garden_Ombu/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API and contract services
│   ├── hooks/             # Custom React hooks
│   ├── config/            # Configuration files
│   └── contracts/         # Smart contract source files
├── relayer/               # Backend relayer server
│   ├── routes/            # API route handlers
│   ├── utils/             # Utility functions
│   └── index.js           # Server entry point
├── lib/                   # Foundry dependencies
├── out/                   # Compiled contract artifacts
├── broadcast/             # Deployment artifacts
└── cache/                 # Foundry cache
```

---

## 🔐 Smart Contracts

The Ombu smart contract is deployed on **Arbitrum Sepolia** and integrates with the Semaphore protocol for anonymous group management.

### Contract Address
- **Ombu Contract**: `0x2942a45451293396c5bb6f9a4c76064a656820e3`
- **Semaphore Contract**: `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D`

### Key Features
- Group-based post management
- Anonymous voting system
- Sub-posts (comments) support
- Zero-knowledge proof verification

### Development

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy (see scripts in broadcast/)
forge script DeployOmbu.s.sol --rpc-url <RPC_URL> --broadcast
```

---

## 🔌 Relayer API

The relayer provides REST API endpoints for gasless transactions. See [relayer/README.md](./relayer/README.md) for complete API documentation.

### Key Endpoints
- `GET /health` - Health check
- `POST /api/join` - Join Semaphore group
- `POST /api/feedback` - Submit feedback/post
- `GET /api/check-member` - Check group membership
- `POST /api/vote` - Submit anonymous vote

---

## 🧪 Development

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

### Testing

```bash
# Test smart contracts
forge test

# Test frontend (if test suite exists)
npm test
```

---

## 🐛 Troubleshooting

### Frontend Issues

- **"VITE_PRIVY_APP_ID is not set"**: Make sure your `.env` file contains all required VITE_* variables
- **Connection errors**: Verify that the relayer server is running and `VITE_RELAYER_URL` is correct
- **Wallet connection fails**: Check that `VITE_WALLETCONNECT_PROJECT_ID` is set correctly

### Relayer Issues

- **"PRIVATE_KEY not set"**: Add your relayer wallet private key to `.env`
- **"Insufficient funds"**: Add test ETH to your relayer wallet address
- **"Contract ABI not loaded"**: Run `forge build` in the root directory
- **Port already in use**: Change the `PORT` value in `.env` or stop the process using that port

### Smart Contract Issues

- **Compilation errors**: Ensure Foundry is installed and dependencies are up to date (`forge update`)
- **Deployment fails**: Verify RPC URL and ensure wallet has sufficient funds

---

## 📚 Additional Resources

- [Semaphore Protocol Documentation](https://docs.semaphore.pse.dev/)
- [Privy Documentation](https://docs.privy.io/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Wagmi Documentation](https://wagmi.sh/)
- [AI Backend Repository](https://github.com/SerlioGiron/Invisible_garden_model)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Semaphore Protocol](https://github.com/semaphore-protocol) for zero-knowledge proof infrastructure
- [Privy](https://privy.io/) for authentication and wallet management
- [Foundry](https://getfoundry.sh/) for smart contract development tools
