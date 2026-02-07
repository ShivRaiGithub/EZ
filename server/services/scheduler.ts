import cron from 'node-cron';
import AutoPayment from '../models/AutoPayment';
import PaymentHistory from '../models/PaymentHistory';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';

interface ChainConfig {
  name: string;
  rpc: string;
  usdc: string;
  tokenMessenger: string;
  messageTransmitter: string;
  domain: number;
  explorer: string;
}

interface ChainConfigs {
  sepolia: ChainConfig;
  base: ChainConfig;
  arc: ChainConfig;
  ethereum: ChainConfig;
  arbitrum: ChainConfig;
  optimism: ChainConfig;
  polygon: ChainConfig;
}

const CHAINS: ChainConfigs = {
  sepolia: {
    name: "Ethereum Sepolia",
    rpc: "https://sepolia.drpc.org",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    domain: 0,
    explorer: "https://sepolia.etherscan.io",
  },
  base: {
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    usdc: "0x3600000000000000000000000000000000000000",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    domain: 6,
    explorer: "https://sepolia.basescan.org",
  },
arc: {
  name: "Arc Testnet",
  rpc: "https://rpc.testnet.arc.network",
  usdc: "0x3600000000000000000000000000000000000000",
  tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  messageTransmitter: "0xE737E5cEBeEBa77eFE34D4AA090756590b1CE275",
  domain: 26,
  explorer: "https://testnet.arcscan.app",
},
  ethereum: {
    name: "Ethereum Mainnet",
    rpc: "https://eth.drpc.org",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    tokenMessenger: "0xbd3fa81b58ba92a82136038b25adec7066af3155",
    messageTransmitter: "0x0a992d191deec32afe36203ad87d7d289a738f81",
    domain: 0,
    explorer: "https://etherscan.io",
  },
  arbitrum: {
    name: "Arbitrum",
    rpc: "https://arb1.arbitrum.io/rpc",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    tokenMessenger: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
    messageTransmitter: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
    domain: 3,
    explorer: "https://arbiscan.io",
  },
  optimism: {
    name: "Optimism",
    rpc: "https://mainnet.optimism.io",
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    tokenMessenger: "0x2B4069517957735bE00ceE0fadAE88a26365528f",
    messageTransmitter: "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8",
    domain: 2,
    explorer: "https://optimistic.etherscan.io",
  },
  polygon: {
    name: "Polygon",
    rpc: "https://polygon-rpc.com",
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    tokenMessenger: "0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE",
    messageTransmitter: "0xF3be9355363857F3e001be68856A2f96b4C39Ba9",
    domain: 7,
    explorer: "https://polygonscan.com",
  },
};

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const TOKEN_MESSENGER_ABI = [
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) returns (uint64)",
];

const AUTOPAY_WALLET_ABI = [
  "function executeAutoPayment(string memory id) external",
  "function getBalance() external view returns (uint256)",
  "function autoPayments(string memory id) external view returns (tuple(string id, address recipient, uint256 amount, string frequency, string destinationChain, bool isActive, uint256 createdAt))",
];

const MESSAGE_TRANSMITTER_ABI = [
  "function receiveMessage(bytes message, bytes attestation) returns (bool)",
];

// Circle API Response Types
interface CircleMessage {
  message: string;
  attestation: string;
  status: string;
}

interface CircleApiResponse {
  messages?: CircleMessage[];
}

// Calculate next payment date based on frequency
function calculateNextPayment(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from);
  
  switch (frequency) {
    case 'minute':  // ADD THIS
      next.setMinutes(next.getMinutes() + 1);
      break;
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}

// Fetch attestation from Circle API
async function fetchAttestation(txHash: string, sourceDomain: number): Promise<{ message: string; attestation: string }> {
  const url = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${txHash}`;
  
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status !== 404) {
          console.log('Retrying attestation fetch...');
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
        continue;
      }

      const data = await response.json() as CircleApiResponse;

      if (data?.messages?.[0]?.status === 'complete') {
        return {
          message: data.messages[0].message,
          attestation: data.messages[0].attestation,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error('Error fetching attestation:', error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }
  }

  throw new Error('Attestation timeout');
}

// Execute a single autopayment from user's contract wallet
async function executeAutoPayment(payment: any) {
  const historyEntry = new PaymentHistory({
    userId: payment.userId,
    autoPaymentId: payment._id.toString(),
    recipient: payment.recipient,
    amount: payment.amount,
    destinationChain: payment.destinationChain,
    status: 'pending',
    paymentType: 'auto-pay',
  });

  try {
    await historyEntry.save();

    console.log(`[AutoPay] Executing payment ${payment._id} to ${payment.recipient}`);

    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      throw new Error('Relayer private key not configured');
    }

    const isSameChain = payment.destinationChain === 'arc';

    // Source chain is always Arc (where user's contract wallet is)
    const sourceChain = CHAINS.arc;
    const destChain = CHAINS[payment.destinationChain as keyof typeof CHAINS];

    if (!destChain) {
      throw new Error(`Invalid destination chain: ${payment.destinationChain}`);
    }

    // Initialize provider and wallet for Arc Testnet
    const sourceProvider = new JsonRpcProvider(sourceChain.rpc);
    const relayerWallet = new Wallet(relayerPrivateKey, sourceProvider);
    
    const amountInSubunits = ethers.parseUnits(payment.amount, 6);

    // Get user's contract wallet address from payment
    // NOTE: You need to add walletAddress field to AutoPayment model
    const userWalletAddress = payment.walletAddress;
    if (!userWalletAddress) {
      throw new Error('User wallet address not found');
    }

    // Connect to user's AutoPayWallet contract
    const autoPayWallet = new Contract(
      userWalletAddress,
      AUTOPAY_WALLET_ABI,
      relayerWallet
    );

    // Check wallet balance
    const walletBalance = await autoPayWallet.getBalance();
    console.log(`[AutoPay] Wallet balance: ${ethers.formatUnits(walletBalance, 6)} USDC`);

    if (walletBalance < amountInSubunits) {
      throw new Error('Insufficient balance in user wallet');
    }

    const executeTx = await autoPayWallet.executeAutoPayment(payment._id.toString());
    await executeTx.wait();
    console.log(`[AutoPay] Executed payment from contract: ${executeTx.hash}`);

    if (isSameChain) {
      console.log(`[AutoPay] Same-chain payment, using direct transfer`);
      
      // Relayer now has the USDC, just transfer it to recipient
      const usdcContract = new Contract(sourceChain.usdc, ERC20_ABI, relayerWallet);
      const transferTx = await usdcContract.transfer(payment.recipient, amountInSubunits);
      await transferTx.wait();
      
      console.log(`[AutoPay] Direct transfer completed: ${transferTx.hash}`);
      
      // Update history
      historyEntry.status = 'success';
      historyEntry.txHash = transferTx.hash;
      await historyEntry.save();

      // Update autopayment
      payment.lastPayment = new Date();
      payment.nextPayment = calculateNextPayment(payment.frequency);
      await payment.save();

      console.log(`[AutoPay] Payment ${payment._id} completed successfully`);
      return true;
    }

    // Now relayer has the USDC, approve for bridging
    const usdcContract = new Contract(sourceChain.usdc, ERC20_ABI, relayerWallet);
    const currentAllowance = await usdcContract.allowance(
      await relayerWallet.getAddress(),
      sourceChain.tokenMessenger
    );

    if (currentAllowance < amountInSubunits) {
      const approveTx = await usdcContract.approve(
        sourceChain.tokenMessenger,
        ethers.MaxUint256
      );
      await approveTx.wait();
      console.log(`[AutoPay] Approved USDC for bridging`);
    }

    // Burn USDC on Arc Testnet
    const tokenMessenger = new Contract(
      sourceChain.tokenMessenger,
      TOKEN_MESSENGER_ABI,
      relayerWallet
    );

    const recipientBytes32 = ethers.zeroPadValue(payment.recipient, 32);
    const destinationCallerBytes32 = ethers.ZeroHash;

    const burnTx = await tokenMessenger.depositForBurn(
      amountInSubunits,
      destChain.domain,
      recipientBytes32,
      sourceChain.usdc,
      destinationCallerBytes32,
      500,
      1000
    );

    await burnTx.wait();
    console.log(`[AutoPay] Burn transaction confirmed: ${burnTx.hash}`);

    // Fetch attestation
    const attestation = await fetchAttestation(burnTx.hash, sourceChain.domain);

    // Mint on destination chain
    const destProvider = new JsonRpcProvider(destChain.rpc);
    const destWallet = new Wallet(relayerPrivateKey, destProvider);
    
    const messageTransmitter = new Contract(
      destChain.messageTransmitter,
      MESSAGE_TRANSMITTER_ABI,
      destWallet
    );

    const mintTx = await messageTransmitter.receiveMessage(
      attestation.message,
      attestation.attestation
    );

    await mintTx.wait();
    console.log(`[AutoPay] Mint transaction confirmed: ${mintTx.hash}`);

    // Update history entry
    historyEntry.status = 'success';
    historyEntry.txHash = mintTx.hash;
    await historyEntry.save();

    // Update autopayment
    payment.lastPayment = new Date();
    payment.nextPayment = calculateNextPayment(payment.frequency);
    await payment.save();

    console.log(`[AutoPay] Payment ${payment._id} completed successfully`);
    return true;

  } catch (error) {
    console.error(`[AutoPay] Failed to execute payment ${payment._id}:`, error);
    
    // Update history entry with error
    historyEntry.status = 'failed';
    historyEntry.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await historyEntry.save();

    return false;
  }
}

// Check and execute pending autopayments
async function checkAndExecutePayments() {
  try {
    const now = new Date();
    
    // Find all active autopayments that are due
    const duePayments = await AutoPayment.find({
      status: 'active',
      nextPayment: { $lte: now },
    });

    if (duePayments.length > 0) {
      console.log(`[AutoPay] Found ${duePayments.length} payments to execute`);
      
      for (const payment of duePayments) {
        await executeAutoPayment(payment);
        // Add delay between payments to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error('[AutoPay] Error checking payments:', error);
  }
}

// Start the scheduler
export function startScheduler() {
  cron.schedule('* * * * *', () => {
    console.log('[AutoPay] Checking for due payments...');
    checkAndExecutePayments();
  });

  // Also run on startup
  console.log('✓ AutoPayment scheduler started (runs every hour)');
  console.log('[AutoPay] Running initial check...');
  checkAndExecutePayments();
}
