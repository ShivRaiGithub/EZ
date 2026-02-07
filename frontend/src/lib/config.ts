// Comprehensive chain configurations (Testnets)
export const CHAINS = {
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpc: 'https://sepolia.drpc.org',
    domain: 0,
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    tokenMessenger: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa',
    messageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275',
    explorer: 'https://sepolia.etherscan.io',
    nativeSymbol: 'ETH',
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
    domain: 1,
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    tokenMessenger: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa',
    messageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275',
    explorer: 'https://sepolia.arbiscan.io',
    nativeSymbol: 'ETH',
  },
  optimismSepolia: {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    rpc: 'https://sepolia.optimism.io',
    domain: 2,
    usdc: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    tokenMessenger: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa',
    messageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275',
    explorer: 'https://sepolia-optimism.etherscan.io',
    nativeSymbol: 'ETH',
  },
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpc: 'https://sepolia.base.org',
    domain: 6,
    usdc: '0x3600000000000000000000000000000000000000',
    tokenMessenger: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa',
    messageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275',
    explorer: 'https://sepolia.basescan.org',
    nativeSymbol: 'ETH',
  },
  polygonAmoy: {
    name: 'Polygon Amoy',
    chainId: 80002,
    rpc: 'https://rpc-amoy.polygon.technology',
    domain: 3,
    usdc: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    tokenMessenger: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa',
    messageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275',
    explorer: 'https://amoy.polygonscan.com',
    nativeSymbol: 'MATIC',
  },
  arcTestnet: {
    name: 'Arc Testnet',
    chainId: 5042002,
    rpc: 'https://rpc.testnet.arc.network',
    domain: 26,
    usdc: '0x3600000000000000000000000000000000000000',
    tokenMessenger: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa',
    messageTransmitter: '0xe737e5cebeeba77efe34d4aa090756590b1ce275',
    explorer: 'https://testnet.arcscan.app',
    nativeSymbol: 'ETH',
  },
} as const;

export type ChainKey = keyof typeof CHAINS;

// Contract addresses on Arc Testnet
export const CONTRACT_ADDRESSES = {
  ARC_TESTNET: {
    FACTORY: "0x6528b5c5baE50A43403201aB82d1cc5890C3a8f2",
    USDC: "0x3600000000000000000000000000000000000000",
    TOKEN_MESSENGER: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    MESSAGE_TRANSMITTER: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  }
};

export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorer: "https://testnet.arcscan.app",
  nativeCurrency: {
    name: "ARC",
    symbol: "ARC",
    decimals: 18,
  },
};
