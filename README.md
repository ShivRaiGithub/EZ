# EZ - Make Easy Payments 💸

Cross-chain crypto payments made simple. Pay anyone using their ENS name, and we automatically route the payment to their preferred chain and token.

![EZ Payments](https://img.shields.io/badge/HackMoney-2026-purple)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- **ENS Integration** - Pay anyone with their ENS name
- **Cross-Chain Routing** - Automatic bridging via Circle CCTP
- **Arc Testnet** - USDC-native gas fees with sub-second finality
- **Auto Payments** - Set up recurring payments
- **User Preferences** - Recipients set their preferred chain & token
- **No Backend** - Pure frontend, all on-chain
- **Multi-Chain** - Ethereum, Arbitrum, Optimism, Base, Polygon

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/ShivRaiGithub/EZ.git
cd EZ

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

##  Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: CSS + Tailwind-inspired utilities
- **Cross-Chain**: Circle CCTP
- **ENS**: ENS text records for payment preferences
- **Arc**: Circle's Arc L1 testnet

## 🎯 How It Works

1. **Receiver** sets payment preferences in their ENS profile:
   - `payment.chain` = "optimism"
   - `payment.token` = "USDC"

2. **Sender** enters the ENS name and amount

3. **EZ** fetches preferences and routes via Circle CCTP

4. **Payment** is automatically bridged to the receiver's preference

## 📁 Project Structure

```
src/
├── app/
│   ├── (app)/              # App pages with sidebar
│   │   ├── cross-chain/    # Cross-chain payments
│   │   ├── arc/            # Arc testnet payments
│   │   ├── autopay/        # Auto payments
│   │   ├── ens/            # ENS lookup
│   │   └── profile/        # Profile & history
│   └── page.tsx            # Landing page
├── components/             # UI components
└── hooks/                  # Custom hooks
```

This project is built using:
- **Arc** - Circle's Layer-1 blockchain
- **Circle CCTP** - Cross-chain transfer protocol
- **ENS** - Payment preferences via text records