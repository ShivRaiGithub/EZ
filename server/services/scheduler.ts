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
  arbitrumSepolia: ChainConfig;
  optimismSepolia: ChainConfig;
  baseSepolia: ChainConfig;
  polygonAmoy: ChainConfig;
  arcTestnet: ChainConfig;
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
  arbitrumSepolia: {
    name: "Arbitrum Sepolia",
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    domain: 3,
    explorer: "https://sepolia.arbiscan.io",
  },
  optimismSepolia: {
    name: "Optimism Sepolia",
    rpc: "https://sepolia.optimism.io",
    usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    domain: 2,
    explorer: "https://sepolia-optimism.etherscan.io",
  },
  baseSepolia: {
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    domain: 6,
    explorer: "https://sepolia.basescan.org",
  },
  polygonAmoy: {
    name: "Polygon Amoy",
    rpc: "https://rpc-amoy.polygon.technology",
    usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    domain: 7,
    explorer: "https://amoy.polygonscan.com",
  },
  arcTestnet: {
    name: "Arc Testnet",
    rpc: "https://rpc.testnet.arc.network",
    usdc: "0x3600000000000000000000000000000000000000",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737E5cEBeEBa77eFE34D4AA090756590b1CE275",
    domain: 26,
    explorer: "https://testnet.arcscan.app",
  },
};

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
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

    const isSameChain = payment.destinationChain === 'arcTestnet';

    // Source chain is always Arc (where user's contract wallet is)
    const sourceChain = CHAINS.arcTestnet;
    const destChain = CHAINS[payment.destinationChain as keyof typeof CHAINS];

    if (!destChain) {
      throw new Error(`Invalid destination chain: ${payment.destinationChain}`);
    }

    // Initialize provider and wallet for Arc Testnet
    const sourceProvider = new JsonRpcProvider(sourceChain.rpc);
    const relayerWallet = new Wallet(relayerPrivateKey, sourceProvider);
    
    const amountInSubunits = ethers.parseUnits(payment.amount, 6);
    
    console.log(`[AutoPay] Processing payment: ${payment.amount} USDC`);

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

    // Check wallet balance (check for full amount, no fee deducted yet)
    const walletBalance = await autoPayWallet.getBalance();
    console.log(`[AutoPay] Wallet balance: ${ethers.formatUnits(walletBalance, 6)} USDC`);

    if (walletBalance < amountInSubunits) {
      throw new Error('Insufficient balance in user wallet');
    }

    const executeTx = await autoPayWallet.executeAutoPayment(payment._id.toString());
    await executeTx.wait();
    console.log(`[AutoPay] Executed payment from contract: ${executeTx.hash}`);

    // Now relayer has the full amount. Deduct fee before burning/transferring
    const feeAmount = (amountInSubunits * BigInt(5)) / BigInt(10000); // 0.05% fee
    const amountAfterFee = amountInSubunits - feeAmount;
    
    console.log(`[AutoPay] Fee deducted: ${ethers.formatUnits(feeAmount, 6)} USDC (0.05%)`);
    console.log(`[AutoPay] Amount to send: ${ethers.formatUnits(amountAfterFee, 6)} USDC`);

    if (isSameChain) {
      console.log(`[AutoPay] Same-chain payment, using direct transfer (with fee)`);
      
      // Relayer has the USDC, transfer amount after fee to recipient
      const usdcContract = new Contract(sourceChain.usdc, ERC20_ABI, relayerWallet);
      const transferTx = await usdcContract.transfer(payment.recipient, amountAfterFee);
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

    if (currentAllowance < amountAfterFee) {
      const approveTx = await usdcContract.approve(
        sourceChain.tokenMessenger,
        ethers.MaxUint256
      );
      await approveTx.wait();
      console.log(`[AutoPay] Approved USDC for bridging`);
    }

    // Burn USDC on Arc Testnet (amount after fee)
    const tokenMessenger = new Contract(
      sourceChain.tokenMessenger,
      TOKEN_MESSENGER_ABI,
      relayerWallet
    );

    const recipientBytes32 = ethers.zeroPadValue(payment.recipient, 32);
    const destinationCallerBytes32 = ethers.ZeroHash;

    const burnTx = await tokenMessenger.depositForBurn(
      amountAfterFee,
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
cron.schedule('0 */12 * * *', () => {
  console.log('[AutoPay] Checking for due payments...');
  checkAndExecutePayments();
});

  console.log('✓ AutoPayment scheduler started (runs every 12 hours)');
  checkAndExecutePayments();
}
