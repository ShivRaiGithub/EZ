# EZ - Make Easy Payments 💸

A comprehensive cross-chain crypto payments platform built on Arc and ENS. Send USDC across chains, set up recurring payments, request payments, and manage contacts — all with human-readable ENS names.

![EZ Payments](https://img.shields.io/badge/HackMoney-2026-purple)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Arc](https://img.shields.io/badge/Arc-Testnet-green)

## ✨ Features

### 🔄 Cross-Chain Payments
- **USDC Transfers** - Send USDC seamlessly across multiple chains
- **Circle CCTP Integration** - Secure cross-chain transfers via Circle's Cross-Chain Transfer Protocol
- **Multi-Chain Support** - Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Polygon Amoy

### ⚡ Auto Payments
- **Recurring Payments** - Set up automatic payments (minute, hourly, daily, weekly, monthly)
- **Smart Contract Wallet** - Non-custodial wallet for managing automated payments
- **Fund & Withdraw** - Easily manage your smart contract wallet balance
- **Pause/Resume** - Control your recurring payments anytime

### 📨 Payment Requests
- **Request Payments** - Send payment requests to any wallet address
- **Accept/Reject** - Manage incoming payment requests
- **Status Tracking** - Track pending, paid, and rejected requests

### 👥 Contacts
- **Address Book** - Save frequently used addresses with friendly names
- **Quick Access** - Select saved contacts for faster payments
- **Full Management** - Add, edit, and delete contacts

### 🔍 ENS Integration
- **ENS Lookup** - Resolve ENS names to wallet addresses
- **Payment Preferences** - Recipients set their preferred chain & token via ENS text records
- **Profile Information** - View ENS profile details, social links, and bio

### 👤 Profile & History
- **Multi-Chain Balances** - View USDC and native token balances across all chains
- **Transaction History** - Complete payment history with filters (Auto Pay, Cross-Chain)
- **Transaction Details** - View transaction hashes and explorer links

### 🌐 Arc Testnet
- **USDC-Native Gas** - Pay transaction fees in stablecoins, not volatile tokens
- **Sub-Second Finality** - Deterministic finality for instant settlement
- **Enterprise-Grade** - Built for reliability and compliance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or any Web3 wallet

### Installation

```bash
# Clone the repo
git clone https://github.com/ShivRaiGithub/EZ.git
cd EZ

# Install frontend dependencies
cd frontend
npm install

# Install server dependencies
cd ../server
npm install
```

### Environment Setup

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_RELAYER_ADDRESS=<your-relayer-public-address>
```

**Server** (`server/.env`):
```env
RELAYER_PRIVATE_KEY=<your-relayer-private-key>
PORT=3001
FRONTEND_URL=http://localhost:3000
MONGO_URI=<your-mongodb-uri>
```

### Run the Application

```bash
# Terminal 1: Start the server
cd server
npm run dev

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 16, TypeScript, Tailwind-inspired CSS |
| **Blockchain** | ethers.js, wagmi, RainbowKit |
| **Cross-Chain** | Circle CCTP |
| **ENS** | ENS text records for payment preferences |
| **Backend** | Node.js, Express, MongoDB |
| **L1** | Arc Testnet (Circle's Layer-1) |

## 🎯 How It Works

### For Receivers
1. Set payment preferences in your ENS profile:
   - `payment.chain` = "optimism"
   - `payment.token` = "USDC"

### For Senders
1. Enter the recipient's ENS name or wallet address
2. Specify the amount and destination chain
3. EZ automatically routes the payment via Circle CCTP
4. Payment is bridged to the receiver's preferred chain

## 📁 Project Structure

```
EZ/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (app)/              # App pages with sidebar
│       │   │   ├── cross-chain/    # Cross-chain payments
│       │   │   ├── autopay/        # Recurring payments
│       │   │   ├── requests/       # Payment requests
│       │   │   ├── contacts/       # Address book
│       │   │   ├── ens/            # ENS lookup
│       │   │   └── profile/        # Profile & history
│       │   └── page.tsx            # Landing page
│       ├── components/             # UI components
│       ├── hooks/                  # Custom hooks
│       └── lib/                    # Utilities & API
├── server/                         # Backend API & relayer
└── foundryContracts/               # Smart contracts (Foundry)
```

## 🔗 Supported Chains

| Chain | Status |
|-------|--------|
| Arc Testnet | ✅ Primary |
| Ethereum Sepolia | ✅ Supported |
| Base Sepolia | ✅ Supported |
| Arbitrum Sepolia | ✅ Supported |
| Optimism Sepolia | ✅ Supported |
| Polygon Amoy | ✅ Supported |

## 🏗️ Built With

- **[Arc](https://arc.circle.com)** - Circle's Layer-1 blockchain with USDC-native gas
- **[Circle CCTP](https://www.circle.com/en/cross-chain-transfer-protocol)** - Cross-chain transfer protocol
- **[ENS](https://ens.domains)** - Decentralized naming for payment preferences
- **[RainbowKit](https://www.rainbowkit.com)** - Wallet connection UI

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for seamless crypto payments**