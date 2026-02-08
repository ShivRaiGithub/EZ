# EZ - The Complete Cross-Chain Payment Suite 💸

A comprehensive multi-chain crypto payments platform built on Arc (Circle's Layer-1 blockchain) with Circle CCTP integration, ENS support, and smart contract automation. Send USDC across 6 chains, automate recurring payments, split bills, request payments, and manage contacts — all with human-readable ENS names and USDC-native transaction fees.

## NOTE
1. Only testnet supported right now
2. For getting preferred chain in ENS, users have to put "preferred_chain" as the key and a value for that in their ENS. Else, it falls back to Sepolia.
3. The relayer has to be funded with the native token on the supported chains in order to work.

## ✨ Features

### 🔄 Cross-Chain Payments
- **USDC Transfers** - Send USDC seamlessly across 6 chains using Circle CCTP
- **Circle CCTP Integration** - Secure, native cross-chain transfers with burn-and-mint mechanism
- **Multi-Chain Support** - Arc Testnet, Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Polygon Amoy
- **Same-Chain Transfers** - Fee-free direct transfers on the same chain
- **Cross-Chain Fee** - Transparent 0.05% fee for cross-chain transfers
- **Real-time Attestation** - Live tracking of burn, attestation, and mint process

### 💰 Split Payments
- **Bill Splitting** - Split payments equally among multiple recipients
- **Cross-Chain Distribution** - Send split payments to friends on any chain
- **Automatic Calculation** - Auto-calculate per-person amounts
- **Payment Requests** - Automatically create payment requests for each recipient
- **Request Tracking** - Monitor who has paid their share

### ⚡ Auto Payments (Recurring Payments)
- **Flexible Scheduling** - Set up automatic payments (daily, weekly, monthly, yearly)
- **Smart Contract Wallet** - Non-custodial AutoPayWallet managed by factory contract
- **Relayer System** - Backend scheduler executes payments on behalf of users
- **Fund & Withdraw** - Easily manage your smart contract wallet balance
- **Pause/Resume** - Control your recurring payments anytime
- **Multi-Chain Recipients** - Send recurring payments to any supported chain
- **Payment History** - View complete autopay transaction history with status tracking

### 📨 Payment Requests
- **Request Payments** - Send payment requests to any wallet address or ENS name
- **Accept/Reject** - Manage incoming payment requests with one click
- **Status Tracking** - Track pending, paid, and rejected requests in real-time
- **Contact Integration** - Display friendly names for known contacts
- **Transaction Proof** - Automatic txHash recording for paid requests

### 👥 Contacts & Address Book
- **Saved Addresses** - Save frequently used addresses with friendly names
- **ENS Support** - Save ENS names as contacts
- **Quick Access** - Select saved contacts for faster payments across all features
- **Full Management** - Add, edit, and delete contacts
- **Auto-resolution** - Contacts automatically resolve in all payment forms

### 🔍 ENS Integration
- **ENS Lookup** - Resolve ENS names to wallet addresses
- **Payment Preferences** - Recipients set their preferred chain & token via ENS text records
- **Profile Information** - View ENS profile details, avatar, social links, and bio
- **Auto-routing** - Payments automatically route to recipient's preferred chain
- **Address Resolution** - Use ENS names anywhere addresses are accepted

### 👤 Profile & Transaction History
- **Multi-Chain Balances** - View USDC and native token balances across all 6 chains
- **Real-time Balance Tracking** - Live portfolio updates across all chains
- **Transaction History** - Complete payment history with filters (All, Auto Pay, Cross-Chain, Arc Testnet)
- **Transaction Details** - View transaction hashes, amounts, timestamps, and explorer links
- **Total Portfolio Value** - Aggregate USDC value across all chains
- **Refresh Function** - Manually refresh balances and transaction history


## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or any Web3 wallet
- Foundry (if deploying contracts)

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
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-wallet-connect-id>
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

## �️ Architecture

![alt text](ez-architecture.png)

### Architecture Overview

**EZ** is built with a modular, multi-layer architecture:

#### 1. **Frontend Layer** (Next.js 16 + TypeScript)
- **Wallet Integration**: RainbowKit for seamless wallet connection (MetaMask, WalletConnect, etc.)
- **ENS Resolution**: Automatic resolution of ENS names to addresses and payment preferences
- **Real-time Updates**: Live transaction tracking and balance updates across all chains
- **Responsive UI**: Tailwind CSS for modern, mobile-first design

#### 2. **Smart Contract Layer** (Solidity + Foundry)
- **AutoPayFactory**: Factory contract deploys individual AutoPayWallet contracts per user
- **AutoPayWallet**: Non-custodial smart contract wallet that holds USDC for recurring payments
- **Relayer Authorization**: Only authorized relayer can execute scheduled payments
- **Cross-chain Execution**: Supports sending payments to any supported chain via CCTP

#### 3. **Backend Layer** (Node.js + Express + MongoDB)
- **RESTful API**: Manages payment requests, contacts, friends, autopayments, and history
- **Payment Scheduler**: Cron-based scheduler checks for due autopayments every 12 hours
- **Transaction Relayer**: Executes autopayments on behalf of users using relayer private key
- **Database**: MongoDB stores user data, payment schedules, and transaction history
- **CORS Protection**: Secured API endpoints with CORS middleware

#### 4. **Blockchain Layer**
- **Arc Testnet (Primary Hub)**: Circle's Layer-1 with USDC-native fees and sub-second finality
- **Multi-Chain Support**: Ethereum Sepolia, Base, Arbitrum, Optimism, Polygon testnets
- **USDC Contracts**: Native USDC on each chain, managed via Circle CCTP
- **TokenMessenger**: Circle's CCTP contract for burn-and-mint cross-chain transfers

#### 5. **Circle CCTP Protocol**
- **Burn**: USDC is burned on source chain via TokenMessenger
- **Attestation**: Circle's attestation service signs the burn message
- **Mint**: USDC is minted on destination chain using the attestation

## 🎯 How It Works

### Cross-Chain Payment Flow
1. **User initiates payment** - Enter recipient (address/ENS), amount, and destination chain
2. **ENS resolution** (optional) - Resolve ENS name and fetch preferred chain
3. **Approve USDC** - User approves TokenMessenger to spend USDC
4. **Burn USDC** - USDC is burned on source chain (e.g., Arc Testnet)
5. **Fetch attestation** - Frontend polls Circle's Attestation API for signed message
6. **Receive on destination** - Backend relayer mints USDC on destination chain
7. **Transaction complete** - User receives confirmation with both burn and mint tx hashes

### AutoPay (Recurring Payments) Flow
1. **Deploy wallet** - User creates AutoPayWallet via AutoPayFactory
2. **Fund wallet** - User transfers USDC to their AutoPayWallet
3. **Create schedule** - User sets recipient, amount, frequency, and destination chain
4. **Backend monitors** - Scheduler checks once every 12 hours for due payments
5. **Relayer executes** - Relayer calls `sendPayment()` on AutoPayWallet
6. **Cross-chain transfer** - Payment uses CCTP if destination chain differs from Arc
7. **History tracking** - Transaction recorded in MongoDB with status and txHash

### Split Payment Flow
1. **User enters details** - Total amount, recipient list, and destination chain
2. **Calculate splits** - Frontend divides amount equally among all participants
3. **Initial transfer** - User sends their share to main recipient via CCTP
4. **Create requests** - Backend creates payment requests for other participants
5. **Participants pay** - Each participant receives request and can pay their share
6. **Track completion** - Main recipient tracks who has paid via request status

### Payment Request Flow
1. **Sender creates request** - Specify recipient, amount, and optional message
2. **Stored in database** - Request saved as "pending" in MongoDB
3. **Recipient views** - Recipient sees request in their "Received" tab
4. **Accept/Reject** - Recipient transfers USDC (accept) or marks as rejected
5. **Status update** - Request updated with txHash and "paid" status
6. **History** - Both parties can view request in their transaction history

### ENS Integration Flow
1. **User enters ENS name** - Type `rising.eth` instead of `0x...`
2. **Resolve address** - Frontend queries ENS resolver for primary address
3. **Fetch preferences** - Read `preferred_chain` to show the chain preferred for payments

## 📁 Project Structure

```
EZ/
├── frontend/                       # Next.js 16 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (app)/             # App pages with sidebar layout
│   │   │   │   ├── cross-chain/   # Cross-chain USDC transfers
│   │   │   │   ├── split-pay/     # Split payment feature
│   │   │   │   ├── autopay/       # Recurring autopayments
│   │   │   │   ├── requests/      # Payment request management
│   │   │   │   ├── contacts/      # Address book & contacts
│   │   │   │   ├── ens/           # ENS lookup & resolution
│   │   │   │   └── profile/       # Profile & transaction history
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── layout.tsx         # Root layout with providers
│   │   │   └── globals.css        # Global styles
│   │   ├── components/
│   │   │   ├── AddressInput.tsx   # ENS-enabled address input
│   │   │   ├── ENSLookup.tsx      # ENS resolution component
│   │   │   ├── ChainLogos.tsx     # Chain logo components
│   │   │   ├── Sidebar.tsx        # App navigation sidebar
│   │   │   ├── ThemeProvider.tsx  # Dark mode provider
│   │   │   └── Web3Provider.tsx   # Wagmi + RainbowKit setup
│   │   ├── hooks/
│   │   │   ├── useENS.ts          # ENS resolution hook
│   │   │   └── useAddressResolution.ts
│   │   └── lib/
│   │       ├── config.ts          # Chain configs & addresses
│   │       ├── contracts.ts       # Contract ABIs & instances
│   │       ├── wagmi.ts           # Wagmi configuration
│   │       ├── api.ts             # API client (Axios)
│   │       ├── transaction-utils.ts # Transaction helpers
│   │       └── utils.ts           # General utilities
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── server/                        # Node.js Backend
│   ├── server.ts                  # Main Express server
│   ├── config/
│   │   └── database.ts            # MongoDB connection
│   ├── models/
│   │   ├── AutoPayment.ts         # AutoPayment schema
│   │   ├── PaymentHistory.ts      # Payment history schema
│   │   ├── PaymentRequest.ts      # Payment request schema
│   │   ├── SavedAddress.ts        # Saved address schema
│   │   └── Friend.ts              # Friend/contact schema
│   ├── services/
│   │   └── scheduler.ts           # Cron job for autopayments
│   ├── package.json
│   └── tsconfig.json
│
└── foundryContracts/              # Solidity Smart Contracts
    ├── src/
    │   ├── AutoPayFactory.sol     # Factory for deploying wallets
    │   └── AutoPayWallet.sol      # User's autopay wallet contract
    ├── lib/
    │   ├── forge-std/             # Foundry standard library
    │   └── openzeppelin-contracts/ # OpenZeppelin contracts
    ├── cache/                     # Foundry build cache
    ├── foundry.toml               # Foundry configuration
    └── remappings.txt             # Solidity import remappings
```

## 🔗 Supported Chains

| Chain | Network | Chain ID | CCTP Domain | Status | Purpose |
|-------|---------|----------|-------------|--------|--------|
| Arc Testnet | Arc | 5042002 | 7 | ✅ Primary | Main hub, USDC-native fees |
| Ethereum Sepolia | Sepolia | 11155111 | 0 | ✅ Supported | L1 testnet |
| Base Sepolia | Base | 84532 | 6 | ✅ Supported | L2 scaling |
| Arbitrum Sepolia | Arbitrum | 421614 | 3 | ✅ Supported | L2 scaling |
| Optimism Sepolia | Optimism | 11155420 | 2 | ✅ Supported | L2 scaling |
| Polygon Amoy | Polygon | 80002 | 7 | ✅ Supported | Sidechain |

### Chain Capabilities

- **All chains** support direct USDC transfers (same-chain, no fee)
- **Cross-chain transfers** use Circle CCTP (0.05% fee)
- **Arc Testnet** uses USDC for gas fees (no ETH/MATIC needed)
- **AutoPay wallets** can send to any chain via CCTP integration

## 🏗️ Built With

- **[Arc](https://arc.circle.com)** - Circle's Layer-1 blockchain with USDC-native fees and sub-second finality
- **[Circle CCTP](https://www.circle.com/en/cross-chain-transfer-protocol)** - Secure cross-chain USDC transfer protocol
- **[ENS](https://ens.domains)** - Decentralized naming for payment preferences and address resolution
- **[RainbowKit](https://www.rainbowkit.com)** - Beautiful wallet connection UI
- **[Wagmi](https://wagmi.sh)** - React hooks for Ethereum
- **[ethers.js](https://ethers.org)** - Ethereum library for contract interactions
- **[Next.js 16](https://nextjs.org)** - React framework with App Router
- **[MongoDB](https://www.mongodb.com)** - NoSQL database for off-chain data
- **[Express.js](https://expressjs.com)** - Backend API framework
- **[Foundry](https://book.getfoundry.sh)** - Fast, modern Solidity development toolkit
- **[OpenZeppelin](https://www.openzeppelin.com)** - Secure smart contract library

## 🎓 Key Technical Highlights

### 1. **Circle CCTP Integration**
- Native burn-and-mint mechanism for USDC transfers
- Eliminates wrapped tokens and liquidity pools
- Cryptographically secure attestation from Circle
- Sub-minute cross-chain finality

### 2. **Smart Contract Architecture**
- **Factory Pattern**: AutoPayFactory deploys deterministic wallet addresses
- **Access Control**: Only relayer can execute scheduled payments
- **Gas Optimization**: Efficient USDC handling with minimal gas costs
- **Upgradeable Design**: Relayer address can be updated by wallet owner

### 3. **Relayer System**
- Backend service executes autopayments on behalf of users
- Cron-based scheduler checks once every 12 hours for due payments
- Automatic retry logic for failed transactions
- Transaction history tracking in MongoDB

### 4. **ENS Payment Preferences**
Users can set payment preferences in ENS text records:
```
preferred_chain = "optimism" | "arbitrum" | "base" | "arc" | etc.
```
EZ automatically routes payments to the preferred chain.

### 5. **Multi-Chain Balance Tracking**
- Parallel RPC calls to fetch balances across all 6 chains
- Real-time USDC and native token balance display
- Total portfolio aggregation in USD

### 6. **Transaction History Indexing**
- Off-chain MongoDB database for fast queries
- Filter by type: All, Auto Pay, Cross-Chain, Arc Testnet
- Explorer links for on-chain verification

## 💡 Use Cases

- **Freelancers**: Receive payments in preferred chain/token automatically
- **Subscriptions**: Set up monthly payments for SaaS, memberships, donations
- **Friend Payments**: Split bills at restaurants, trips, or group purchases
- **DAO Treasury**: Automate recurring contributor payments
- **Cross-Chain DeFi**: Move USDC between chains for yield farming
- **International Payments**: Send USDC globally with ENS names instead of bank accounts

## 🔐 Security Considerations

- **Non-Custodial**: Users maintain full control of their AutoPayWallet via owner address
- **Relayer Authorization**: Only authorized relayer can execute autopayments (prevents unauthorized drains)
- **Transparent Fees**: Only 0.05% fee on cross-chain payments
- **On-Chain Verification**: All transactions verifiable on block explorers

## 🚧 Limitations & Future Improvements

### Current Limitations
- **Testnet Only**: Currently deployed on testnets (Arc Testnet, Sepolia, etc.)
- **USDC Only**: Only supports USDC transfers (no ETH, WETH, DAI, etc.)
- **Manual Relayer**: Backend relayer requires server uptime for autopayments
- **Gas Costs**: Users pay gas on source chain when making payments
- **ENS Testnet**: ENS resolution currently uses Ethereum Testnet (not mainnet)

## 📄 License

This project is open source and available under the MIT License.

---
