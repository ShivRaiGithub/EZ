export const AutoPayFactoryABI = [
  "function createWallet() external returns (address wallet)",
  "function getWallet(address user) external view returns (address)",
  "function userWallets(address) external view returns (address)",
  "function getWalletCount() external view returns (uint256)",
  "function usdcToken() external view returns (address)",
  "event WalletCreated(address indexed user, address indexed wallet, uint256 timestamp)"
];

export const AutoPayWalletABI = [
  "function owner() external view returns (address)",
  "function usdcToken() external view returns (address)",
  "function relayer() external view returns (address)",
  "function fund(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function addAutoPayment(string memory id, address recipient, uint256 amount, string memory frequency, string memory destinationChain) external",
  "function cancelAutoPayment(string memory id) external",
  "function executeAutoPayment(string memory id) external",
  "function setRelayer(address _relayer) external",
  "function getBalance() external view returns (uint256)",
  "function getAutoPayment(string memory id) external view returns (tuple(string id, address recipient, uint256 amount, string frequency, string destinationChain, bool isActive, uint256 createdAt))",
  "function getPaymentCount() external view returns (uint256)",
  "function getPaymentIdByIndex(uint256 index) external view returns (string)",
  "event Funded(address indexed funder, uint256 amount, uint256 timestamp)",
  "event Withdrawn(address indexed owner, uint256 amount, uint256 timestamp)",
  "event AutoPaymentAdded(string indexed id, address indexed recipient, uint256 amount, uint256 timestamp)",
  "event AutoPaymentCancelled(string indexed id, uint256 timestamp)",
  "event AutoPaymentExecuted(string indexed id, address indexed recipient, uint256 amount, uint256 timestamp)",
  "event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer, uint256 timestamp)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
