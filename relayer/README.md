# Ombu Relayer Server

This is the backend relayer server that handles blockchain transactions for the Ombu project. It manages the private key and submits transactions to the smart contract on behalf of users.

## Setup

1. Install dependencies:
```bash
cd relayer
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - `PRIVATE_KEY`: Your wallet's private key (with funds for gas)
   - `RPC_URL`: The RPC endpoint (default: Arbitrum Sepolia)
   - `CONTRACT_ADDRESS`: The deployed Ombu contract address
   - `PORT`: Server port (default: 3001)
   - `FRONTEND_URL`: Your frontend URL for CORS (default: http://localhost:5173)

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and configuration info.

### Join Group
```
POST /api/join
Content-Type: application/json

{
  "identityCommitment": "0x..."
}
```
Adds a user to the Semaphore group.

### Send Feedback
```
POST /api/feedback
Content-Type: application/json

{
  "feedback": "feedback string",
  "merkleTreeDepth": 20,
  "merkleTreeRoot": "0x...",
  "nullifier": "0x...",
  "points": 100
}
```
Submits feedback to the contract with zero-knowledge proof verification.

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit your `.env` file
- Keep your private key secure
- The wallet associated with the private key needs to have funds for gas
- Use a dedicated wallet for the relayer (not your main wallet)
- Consider implementing rate limiting in production
- Add authentication if needed

## Troubleshooting

- **"Contract ABI not loaded"**: Run `forge build` in the root directory to compile contracts
- **"Insufficient funds"**: Add test ETH to your relayer wallet
- **Port already in use**: Change the PORT in `.env`
