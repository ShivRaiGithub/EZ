import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';

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
    rpc: "https://testnet.rpc.arc.foundation",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    explorer: "https://testnet.explorer.arc.foundation",
  },
};

const MESSAGE_TRANSMITTER_ABI = [
  "function receiveMessage(bytes message, bytes attestation) returns (bool)",
];

// Health check endpoint
app.get('/health', (req: Request, res: Response<HealthResponse>) => {
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
app.get('/api/relayer-info', async (req: Request, res: Response<RelayerInfoResponse | ErrorResponse>) => {
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

    res.json({
      address,
      balances,
      supportedChains: Object.keys(CHAINS)
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get relayer info',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Cross-Chain Payment Relayer Server');
  console.log('='.repeat(50));
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Relay endpoint: http://localhost:${PORT}/api/relay`);
  console.log(`Relayer configured: ${!!process.env.RELAYER_PRIVATE_KEY}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});