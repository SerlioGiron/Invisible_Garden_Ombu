# OMBU

🔗 Demo: [View the demo](https://hackathon-eth-jaguar.onrender.com)

This project aims to create a safe, open space where students can share their experiences and advice about university life. Each comment is evaluated by an AI agent to filter offensive language and, when necessary, suggest respectful reformulations that promote constructive discussion. Once approved, comments are stored on the Ethereum blockchain, ensuring immutability, security, and transparency. Students can express agreement or disagreement via votes while preserving anonymity, reinforcing freedom of expression in a decentralized, trustworthy environment.

---

## Prerequisites

- Node.js (>= 18.x)
- npm (included with Node.js)

---

## Setup

1. Clone the repository:

```bash
git clone https://github.com/pamelagiselle8/Hackathon_ETH_Jaguar
cd Hackathon_ETH_Jaguar
```

2. Install dependencies:

```bash
npm install
```

3. Copy and update the environment file:

Copy `.env_template` to `.env` and fill in the required values, including the URL for the AI agent (the agent runs in a separate repo).

Example variables:

```env
VITE_LOGO=src/assets/logo.svg
VITE_PUBLIC_RPC_URL="https://arbitrum-sepolia.drpc.org"
VITE_PUBLIC_CHAIN_ID="421614"
VITE_PUBLIC_CONTRACT_ADDRESS="0xA3d4213c9f492EC63d61d734e0c7a9C6eFcc79c0"
VITE_AI_BACKEND_URL="http://localhost:3000"
```

The AI agent is available in this repository: [ModeloHackathonAI](https://github.com/Diazgerard/ModeloHackathonAI). Make sure the agent is running locally so the DApp can validate comments.

---

## Run the project

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

⚡ Students can now log in, post AI-validated comments, and participate with immutable opinions recorded on the blockchain.
