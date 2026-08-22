# VaultChain

VaultChain is a production-ready, decentralized, end-to-end encrypted mobile password manager app.

## Project Structure

```
vaultchain/
├── mobile/                 # React Native / Expo Mobile Client
│   ├── App.tsx             # App entrypoint and stack routing
│   ├── src/
│   │   ├── screens/        # Onboarding, Auth, Dashboard, Vault, Security Center, Blockchain, etc.
│   │   ├── redux/          # Redux Toolkit slices (auth, vault cache, theme)
│   │   ├── services/       # Ethers.js local contract, IPFS, Axios client
│   │   ├── utils/          # CryptoJS cryptographic routines (AES-256-CBC, PBKDF2)
│   │   └── theme/          # HSL theme declarations
│   └── package.json
├── backend/                # Node.js Express API Server + Socket.io gateway
│   ├── src/
│   │   ├── models/         # Mongoose Schemas (User, SecurityLog, Transaction)
│   │   ├── routes/         # REST API layers (auth zero-knowledge, audits, analytics)
│   │   └── server.js       # App entrypoint
│   └── package.json
├── blockchain/             # Hardhat smart contract development workspace
│   ├── contracts/          # VaultChain.sol (immutability registry contract)
│   ├── test/               # Solidity unit tests suite
│   ├── hardhat.config.js
│   └── package.json
└── admin-dashboard/        # Node.js Admin Console Web Panel
    ├── public/
    │   └── index.html      # Glassmorphic premium dashboard page
    ├── server.js           # Static static dashboard serving app
    └── package.json
```

## Security Design

1. **Zero Knowledge Encryption**: Master passwords are never sent to the backend. Instead:
   * Client-side generates a cryptographically random salt.
   * Client-side derives a 256-bit Master Key via PBKDF2 (10,000 iterations).
   * Client-side hashes the derived key using SHA-256 to create a `loginHash` (Login Token).
   * The server only receives and stores the `salt` and the `loginHash`.
2. **Local Payload Encryption**: Vault data (usernames, passwords, links, notes) are serialized to JSON and encrypted locally using **AES-256-CBC** with a unique Initialization Vector (IV).
3. **Decentralized Storage**: The encrypted JSON blocks are hosted on IPFS.
4. **On-chain Proof**: The IPFS hash pointer (CID) is uploaded to the `VaultChain` Solidity Smart Contract on Ethereum, mapped to the user's wallet address.
5. **No Administration Custody**: No administrator or server hack can compromise passwords because only the user's client possesses the Master Key.

## Setup Instructions

### 1. Compile & Test Smart Contracts
```bash
cd blockchain
npm install
npm run compile
npm run test
```

### 2. Start Core API Backend
Ensure a local MongoDB server is active at `mongodb://localhost:27017/vaultchain` (or provide `MONGO_URI` env variable).
```bash
cd backend
npm install
npm start
```

### 3. Start Admin Dashboard Panel
The dashboard panel runs at `http://localhost:5001`.
```bash
cd admin-dashboard
npm install
npm start
```

### 4. Boot React Native Client
```bash
cd mobile
npm install
npm start
```

---
*Created with ♥ by Advanced Agentic Coding.*
