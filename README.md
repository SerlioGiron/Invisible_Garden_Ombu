# OMBU

🔗 Demo: 

**Ombu** is a safe space for students to anonymously review their teachers and courses without fear of retaliation. Named after the Swedish Ombudsman—someone who investigates complaints against organizations or public authorities—Ombu empowers students to speak freely about their educational experiences.

Our AI agent moderates content by filtering offensive language and suggesting respectful alternatives, ensuring constructive dialogue. Once validated, comments are stored privately on blockchain with zero-knowledge proofs, providing immutability, security, and transparency. Other students can vote anonymously on reviews, fostering free expression in a decentralized, trustworthy environment built on privacy-preserving technologies like Semaphore and authenticated through Privy.

---

## Prerequisites

- Node.js (>= 18.x)
- npm (included with Node.js)

---

## Setup

1. Clone the repository:

```bash
git clone https://github.com/SerlioGiron/Invisible_Garden_Ombu.git
cd Invisible_Garden_Ombu
```

2. Install dependencies:

```bash
npm install
```

3. Copy and update the environment file:

Copy `.env_template` to `.env` and fill in the required values, including the URL for the AI agent (the agent runs in a separate repo).

Example variables:

```env
VITE_LOGO=src/assets/imagotipo.png
VITE_PUBLIC_RPC_URL="https://arbitrum-sepolia.drpc.org"
VITE_PUBLIC_CHAIN_ID="421614"
VITE_PUBLIC_CONTRACT_ADDRESS=""
VITE_AI_BACKEND_URL="http://localhost:3000"
VITE_PRIVY_APP_ID="your-privy-app-id"
VITE_PRIVY_CLIENT_ID="your-privy-client-id"
VITE_WALLETCONNECT_PROJECT_ID="your-walletconnect-project-id"
```

The AI agent is available in this repository: [ModeloHackathonAI](https://github.com/Diazgerard/ModeloHackathonAI). Make sure the agent is running locally so the DApp can validate comments.

---

## Run the project

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.
