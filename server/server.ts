import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { connectDB } from './config/database';
import AutoPayment from './models/AutoPayment';
import PaymentHistory from './models/PaymentHistory';
import SavedAddress from './models/SavedAddress';
import PaymentRequest from './models/PaymentRequest';
import Friend from './models/Friend';
import { startScheduler } from './services/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Types
interface ChainConfig {
  name: string;
  rpc: string;
  messageTransmitter: string;
  explorer: string;
}

interface ChainConfigs {
  sepolia: ChainConfig;
  base: ChainConfig;
  arc: ChainConfig;
}

type ChainKey = keyof ChainConfigs;

interface RelayRequest {
  burnTxHash: string;
  destinationChain: ChainKey;
  attestation: {
    message: string;
    attestation: string;
    status?: string;
  };
}

interface RelayResponse {
  success: boolean;
  mintTxHash: string;
  blockNumber: number;
  gasUsed: string;
  explorerUrl: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  timestamp?: string;
  required?: string[];
  supportedChains?: string[];
}

interface HealthResponse {
  status: string;
  timestamp: string;
  relayerConfigured: boolean;
}

interface ChainBalance {
  balance?: string;
  chain?: string;
  error?: string;
}

interface RelayerInfoResponse {
  address: string;
  balances: Record<string, ChainBalance>;
  supportedChains: string[];
}

// Chain configurations
const CHAINS: ChainConfigs = {
  sepolia: {
    name: "Ethereum Sepolia",
    rpc: "https://sepolia.drpc.org",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    explorer: "https://sepolia.etherscan.io",
  },
  base: {
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    explorer: "https://sepolia.basescan.org",
  },
  arc: {
    name: "Arc Testnet",
    rpc: "https://rpc.testnet.arc.network",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    explorer: "https://testnet.arcscan.app",
  },
};

const MESSAGE_TRANSMITTER_ABI = [
  "function receiveMessage(bytes message, bytes attestation) returns (bool)",
];

// Health check endpoint
app.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    relayerConfigured: !!process.env.RELAYER_PRIVATE_KEY 
  });
});

// Main relay endpoint
app.post('/api/relay', async (req: Request<{}, {}, RelayRequest>, res: Response<RelayResponse | ErrorResponse>) => {
  try {
    const { burnTxHash, destinationChain, attestation } = req.body;

    // Validate inputs
    if (!burnTxHash || !destinationChain || !attestation) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['burnTxHash', 'destinationChain', 'attestation']
      });
    }

    if (!attestation.message || !attestation.attestation) {
      return res.status(400).json({ 
        error: 'Invalid attestation format',
        required: ['attestation.message', 'attestation.attestation']
      });
    }

    const chainConfig = CHAINS[destinationChain];
    if (!chainConfig) {
      return res.status(400).json({ 
        error: 'Invalid destination chain',
        supportedChains: Object.keys(CHAINS)
      });
    }

    // Validate relayer configuration
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      console.error('RELAYER_PRIVATE_KEY not configured');
      return res.status(500).json({ 
        error: 'Relayer not configured on server'
      });
    }

    console.log(`[${new Date().toISOString()}] New relay request:`);
    console.log(`  Burn TX: ${burnTxHash}`);
    console.log(`  Destination: ${chainConfig.name}`);

    // Initialize provider and wallet
    const provider: JsonRpcProvider = new JsonRpcProvider(chainConfig.rpc);
    const relayerWallet: Wallet = new Wallet(relayerPrivateKey, provider);
    const relayerAddress: string = await relayerWallet.getAddress();

    console.log(`  Relayer address: ${relayerAddress}`);

    // Check relayer balance
    const balance: bigint = await provider.getBalance(relayerAddress);
    console.log(`  Relayer balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
      console.error('Relayer wallet has no funds!');
      return res.status(500).json({ 
        error: 'Relayer wallet has insufficient funds'
      });
    }

    // Create contract instance
    const messageTransmitter: Contract = new ethers.Contract(
      chainConfig.messageTransmitter,
      MESSAGE_TRANSMITTER_ABI,
      relayerWallet
    );

    console.log(`  Sending mint transaction...`);

    // Estimate gas first
    let gasLimit: bigint;
    try {
      const estimatedGas: bigint = await messageTransmitter.receiveMessage.estimateGas(
        attestation.message,
        attestation.attestation
      );
      gasLimit = (estimatedGas * 120n) / 100n; // Add 20% buffer
      console.log(`  Estimated gas: ${estimatedGas.toString()}`);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      gasLimit = 300000n; // Fallback gas limit
    }

    // Send mint transaction
    const mintTx = await messageTransmitter.receiveMessage(
      attestation.message,
      attestation.attestation,
      {
        gasLimit: gasLimit,
      }
    );

    console.log(`  Mint TX submitted: ${mintTx.hash}`);
    console.log(`  Waiting for confirmation...`);

    // Wait for confirmation
    const receipt = await mintTx.wait();

    console.log(`  ✓ Mint TX confirmed in block ${receipt.blockNumber}`);
    console.log(`  Gas used: ${receipt.gasUsed.toString()}`);

    return res.json({
      success: true,
      mintTxHash: mintTx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `${chainConfig.explorer}/tx/${mintTx.hash}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERROR] Relayer failed:', error);
    
    return res.status(500).json({ 
      error: 'Failed to complete mint transaction',
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Get relayer address endpoint
app.get('/api/relayer-info', async (_req: Request, res: Response<RelayerInfoResponse | ErrorResponse>) => {
  try {
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      return res.status(500).json({ error: 'Relayer not configured' });
    }

    const wallet: Wallet = new Wallet(relayerPrivateKey);
    const address: string = await wallet.getAddress();

    // Get balances for all chains
    const balances: Record<string, ChainBalance> = {};
    
    for (const [chainKey, chainConfig] of Object.entries(CHAINS)) {
      try {
        const provider: JsonRpcProvider = new JsonRpcProvider(chainConfig.rpc);
        const balance: bigint = await provider.getBalance(address);
        balances[chainKey] = {
          balance: ethers.formatEther(balance),
          chain: chainConfig.name
        };
      } catch (error) {
        balances[chainKey] = { error: 'Failed to fetch balance' };
      }
    }

    return res.json({
      address,
      balances,
      supportedChains: Object.keys(CHAINS)
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to get relayer info',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Calculate next payment date based on frequency
function calculateNextPayment(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from);
  
  switch (frequency) {
    case 'minute':
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

// AutoPayment CRUD endpoints

// Create autopayment
app.post('/api/autopayments', async (req: Request, res: Response) => {
  try {
    const { userId, walletAddress, recipient, amount, frequency, destinationChain } = req.body;

    if (!userId || !walletAddress || !recipient || !amount || !frequency || !destinationChain) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'walletAddress', 'recipient', 'amount', 'frequency', 'destinationChain']
      });
    }

    if (!ethers.isAddress(recipient)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const nextPayment = calculateNextPayment(frequency);

    const autoPayment = new AutoPayment({
      userId,
      walletAddress,
      recipient,
      amount,
      frequency,
      destinationChain,
      status: 'active',
      nextPayment,
    });

    await autoPayment.save();

    return res.json({
      success: true,
      autoPayment,
    });
  } catch (error) {
    console.error('Error creating autopayment:', error);
    return res.status(500).json({ 
      error: 'Failed to create autopayment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all autopayments for a user
app.get('/api/autopayments/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const autoPayments = await AutoPayment.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      autoPayments,
    });
  } catch (error) {
    console.error('Error fetching autopayments:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch autopayments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update autopayment status (pause/resume)
app.patch('/api/autopayments/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const autoPayment = await AutoPayment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!autoPayment) {
      return res.status(404).json({ error: 'Autopayment not found' });
    }

    return res.json({
      success: true,
      autoPayment,
    });
  } catch (error) {
    console.error('Error updating autopayment:', error);
    return res.status(500).json({ 
      error: 'Failed to update autopayment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete autopayment
app.delete('/api/autopayments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const autoPayment = await AutoPayment.findByIdAndDelete(id);

    if (!autoPayment) {
      return res.status(404).json({ error: 'Autopayment not found' });
    }

    return res.json({
      success: true,
      message: 'Autopayment deleted',
    });
  } catch (error) {
    console.error('Error deleting autopayment:', error);
    return res.status(500).json({ 
      error: 'Failed to delete autopayment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get payment history for a user
app.get('/api/payment-history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { paymentType } = req.query;

    let query: any = { userId };
    
    // Filter by payment type if provided
    if (paymentType && ['auto-pay', 'cross-chain', 'arc-testnet'].includes(paymentType as string)) {
      query.paymentType = paymentType;
    }

    const history = await PaymentHistory.find(query).sort({ createdAt: -1 }).limit(100);

    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch payment history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create cross-chain payment record
app.post('/api/payment-history/cross-chain', async (req: Request, res: Response) => {
  try {
    const { userId, recipient, amount, sourceChain, destinationChain, burnTxHash, mintTxHash, status } = req.body;

    if (!userId || !recipient || !amount || !sourceChain || !destinationChain || !burnTxHash) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'recipient', 'amount', 'sourceChain', 'destinationChain', 'burnTxHash']
      });
    }

    const paymentHistory = new PaymentHistory({
      userId,
      recipient,
      amount,
      sourceChain,
      destinationChain,
      burnTxHash,
      mintTxHash,
      txHash: mintTxHash || burnTxHash, // Use mintTxHash if available, otherwise burnTxHash
      status: status || 'success',
      paymentType: 'cross-chain',
    });

    await paymentHistory.save();

    return res.json({
      success: true,
      paymentHistory,
    });
  } catch (error) {
    console.error('Error creating cross-chain payment record:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create arc payment record
app.post('/api/payment-history/arc', async (req: Request, res: Response) => {
  try {
    const { userId, recipient, amount, destinationChain, burnTxHash, mintTxHash, status } = req.body;

    if (!userId || !recipient || !amount || !destinationChain || !burnTxHash) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'recipient', 'amount', 'destinationChain', 'burnTxHash']
      });
    }

    const paymentHistory = new PaymentHistory({
      userId,
      recipient,
      amount,
      sourceChain: 'arc',
      destinationChain,
      burnTxHash,
      mintTxHash,
      txHash: mintTxHash || burnTxHash,
      status: status || 'success',
      paymentType: 'arc-testnet',
    });

    await paymentHistory.save();

    return res.json({
      success: true,
      paymentHistory,
    });
  } catch (error) {
    console.error('Error creating arc payment record:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== SAVED ADDRESSES ENDPOINTS ==========

// Create saved address
app.post('/api/saved-addresses', async (req: Request, res: Response) => {
  try {
    const { userId, address, name } = req.body;

    if (!userId || !address || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'address', 'name']
      });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const savedAddress = new SavedAddress({
      userId,
      address,
      name,
    });

    await savedAddress.save();

    return res.json({
      success: true,
      savedAddress,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Address already saved' });
    }
    console.error('Error creating saved address:', error);
    return res.status(500).json({ 
      error: 'Failed to create saved address',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all saved addresses for a user
app.get('/api/saved-addresses/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const savedAddresses = await SavedAddress.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      savedAddresses,
    });
  } catch (error) {
    console.error('Error fetching saved addresses:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch saved addresses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update saved address
app.patch('/api/saved-addresses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const savedAddress = await SavedAddress.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!savedAddress) {
      return res.status(404).json({ error: 'Saved address not found' });
    }

    return res.json({
      success: true,
      savedAddress,
    });
  } catch (error) {
    console.error('Error updating saved address:', error);
    return res.status(500).json({ 
      error: 'Failed to update saved address',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete saved address
app.delete('/api/saved-addresses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const savedAddress = await SavedAddress.findByIdAndDelete(id);

    if (!savedAddress) {
      return res.status(404).json({ error: 'Saved address not found' });
    }

    return res.json({
      success: true,
      message: 'Saved address deleted',
    });
  } catch (error) {
    console.error('Error deleting saved address:', error);
    return res.status(500).json({ 
      error: 'Failed to delete saved address',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== PAYMENT REQUESTS ENDPOINTS ==========

// Create payment request
app.post('/api/payment-requests', async (req: Request, res: Response) => {
  try {
    const { from, to, amount, message } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['from', 'to', 'amount']
      });
    }

    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }

    const paymentRequest = new PaymentRequest({
      from,
      to,
      amount,
      message: message || '',
      status: 'pending',
    });

    await paymentRequest.save();

    return res.json({
      success: true,
      paymentRequest,
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get payment requests sent by user (requested tab)
app.get('/api/payment-requests/sent/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const requests = await PaymentRequest.find({ from: userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Error fetching sent payment requests:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch payment requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get payment requests received by user (requests tab)
app.get('/api/payment-requests/received/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const requests = await PaymentRequest.find({ to: userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Error fetching received payment requests:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch payment requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update payment request status
app.patch('/api/payment-requests/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, txHash } = req.body;

    if (!['pending', 'paid', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = { status };
    if (txHash) {
      updateData.txHash = txHash;
    }

    const paymentRequest = await PaymentRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    return res.json({
      success: true,
      paymentRequest,
    });
  } catch (error) {
    console.error('Error updating payment request:', error);
    return res.status(500).json({ 
      error: 'Failed to update payment request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete payment request
app.delete('/api/payment-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const paymentRequest = await PaymentRequest.findByIdAndDelete(id);

    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    return res.json({
      success: true,
      message: 'Payment request deleted',
    });
  } catch (error) {
    console.error('Error deleting payment request:', error);
    return res.status(500).json({ 
      error: 'Failed to delete payment request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========== FRIENDS ENDPOINTS ==========

// Add friend
app.post('/api/friends', async (req: Request, res: Response) => {
  try {
    const { userId, friendAddress, friendName } = req.body;

    if (!userId || !friendAddress || !friendName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'friendAddress', 'friendName']
      });
    }

    if (!ethers.isAddress(friendAddress)) {
      return res.status(400).json({ error: 'Invalid friend address' });
    }

    const friend = new Friend({
      userId,
      friendAddress,
      friendName,
      status: 'accepted',
    });

    await friend.save();

    return res.json({
      success: true,
      friend,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Friend already added' });
    }
    console.error('Error adding friend:', error);
    return res.status(500).json({ 
      error: 'Failed to add friend',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all friends for a user
app.get('/api/friends/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const friends = await Friend.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      friends,
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch friends',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update friend name
app.patch('/api/friends/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { friendName } = req.body;

    if (!friendName) {
      return res.status(400).json({ error: 'Friend name is required' });
    }

    const friend = await Friend.findByIdAndUpdate(
      id,
      { friendName },
      { new: true }
    );

    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    return res.json({
      success: true,
      friend,
    });
  } catch (error) {
    console.error('Error updating friend:', error);
    return res.status(500).json({ 
      error: 'Failed to update friend',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete friend
app.delete('/api/friends/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const friend = await Friend.findByIdAndDelete(id);

    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    return res.json({
      success: true,
      message: 'Friend removed',
    });
  } catch (error) {
    console.error('Error deleting friend:', error);
    return res.status(500).json({ 
      error: 'Failed to delete friend',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the autopayment scheduler
    startScheduler();
    
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('Cross-Chain Payment Relayer Server');
      console.log('='.repeat(50));
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Relay endpoint: http://localhost:${PORT}/api/relay`);
      console.log(`Autopayments endpoint: http://localhost:${PORT}/api/autopayments`);
      console.log(`Relayer configured: ${!!process.env.RELAYER_PRIVATE_KEY}`);
      console.log(`MongoDB configured: ${!!process.env.MONGO_URI}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
