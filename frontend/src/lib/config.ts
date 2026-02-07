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
