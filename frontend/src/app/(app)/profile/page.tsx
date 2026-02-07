'use client';

import { useState, useEffect } from 'react';
import { User, Wallet, History, ChevronDown, ExternalLink, Copy, CheckCircle2, XCircle, RefreshCw, Zap, Layers } from 'lucide-react';
import { CHAIN_LOGOS } from '@/components/ChainLogos';
import { BrowserProvider, Contract, formatUnits } from 'ethers';
import { fetchUserTransactions, getExplorerUrl, FormattedTransaction } from '@/lib/transaction-utils';

// Chain configurations (Testnets)
const CHAINS = {
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpc: 'https://sepolia.drpc.org',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    explorer: 'https://sepolia.etherscan.io',
    nativeSymbol: 'ETH',
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    explorer: 'https://sepolia.arbiscan.io',
    nativeSymbol: 'ETH',
  },
  optimismSepolia: {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    rpc: 'https://sepolia.optimism.io',
    usdc: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    explorer: 'https://sepolia-optimism.etherscan.io',
    nativeSymbol: 'ETH',
  },
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpc: 'https://sepolia.base.org',
    usdc: '0x3600000000000000000000000000000000000000',
    explorer: 'https://sepolia.basescan.org',
    nativeSymbol: 'ETH',
  },
  polygonAmoy: {
    name: 'Polygon Amoy',
    chainId: 80002,
    rpc: 'https://rpc-amoy.polygon.technology',
    usdc: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    explorer: 'https://amoy.polygonscan.com',
    nativeSymbol: 'MATIC',
  },
  arc: {
    name: 'Arc Testnet',
    chainId: 5042002,
    rpc: 'https://rpc.testnet.arc.network',
    usdc: '0x3600000000000000000000000000000000000000',
    explorer: 'https://testnet.arcscan.app',
    nativeSymbol: 'ETH',
  },
} as const;

type ChainKey = keyof typeof CHAINS;

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

interface ChainBalance {
  usdc: string;
  native: string;
  nativeSymbol: string;
  isLoading: boolean;
}

// Type for MetaMask provider
interface MetaMaskProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

export default function ProfilePage() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<ChainKey>('arc');
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chainBalances, setChainBalances] = useState<Record<ChainKey, ChainBalance>>({} as any);
  const [transactions, setTransactions] = useState<FormattedTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTxFilter, setSelectedTxFilter] = useState<'all' | 'auto-pay' | 'cross-chain' | 'arc-testnet'>('all');

  // Get MetaMask provider
  const getMetaMaskProvider = (): MetaMaskProvider | null => {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    const eth = window.ethereum as any;
    if (eth.providers) {
      const provider = eth.providers.find((p: any) => p.isMetaMask);
      return provider as MetaMaskProvider | null;
    }
    if (eth.isMetaMask) {
      return eth as MetaMaskProvider;
    }
    return null;
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      const metamaskProvider = getMetaMaskProvider();
      if (!metamaskProvider) {
        alert('Please install MetaMask!');
        return;
      }

      const web3Provider = new BrowserProvider(metamaskProvider);
      await web3Provider.send('eth_requestAccounts', []);
      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();

      setUserAddress(address);

      // Fetch balances for all chains
      await fetchAllBalances(address);

      // Fetch transaction history
      await fetchTransactionHistory(address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setUserAddress('');
    setChainBalances({} as any);
    setTransactions([]);
  };

  // Fetch balance for a specific chain
  const fetchChainBalance = async (chainKey: ChainKey, address: string) => {
    try {
      const chain = CHAINS[chainKey];

      // Create a provider using the chain's RPC
      const rpcProvider = new BrowserProvider({
        request: async ({ method, params }: any) => {
          const response = await fetch(chain.rpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method,
              params: params || [],
            }),
          });
          const data = await response.json();
          return data.result;
        },
      } as any);

      const nativeBalance = await rpcProvider.getBalance(address);
      const nativeFormatted = parseFloat(formatUnits(nativeBalance, 18)).toFixed(4);

      let usdcFormatted = '0.00';
      try {
        const usdcContract = new Contract(chain.usdc, ERC20_ABI, rpcProvider);
        const usdcBalance = await usdcContract.balanceOf(address);
        usdcFormatted = parseFloat(formatUnits(usdcBalance, 6)).toFixed(2);
      } catch (usdcError) {
        console.warn(`USDC balance fetch failed for ${chainKey}:`, usdcError);
      }

      setChainBalances(prev => ({
        ...prev,
        [chainKey]: {
          usdc: usdcFormatted,
          native: nativeFormatted,
          nativeSymbol: chain.nativeSymbol,
          isLoading: false,
        }
      }));
    } catch (error) {
      console.error(`Error fetching balance for ${chainKey}:`, error);
      setChainBalances(prev => ({
        ...prev,
        [chainKey]: {
          usdc: '0.00',
          native: '0.0000',
          nativeSymbol: CHAINS[chainKey].nativeSymbol,
          isLoading: false,
        }
      }));
    }
  };

  // Fetch balances for all chains
  const fetchAllBalances = async (address: string) => {
    // Initialize loading state for all chains
    const initialBalances = Object.keys(CHAINS).reduce((acc, key) => {
      acc[key as ChainKey] = {
        usdc: '0.00',
        native: '0.0000',
        nativeSymbol: CHAINS[key as ChainKey].nativeSymbol,
        isLoading: true,
      };
      return acc;
    }, {} as Record<ChainKey, ChainBalance>);

    setChainBalances(initialBalances);

    // Fetch balances in parallel
    const fetchPromises = Object.keys(CHAINS).map(key =>
      fetchChainBalance(key as ChainKey, address)
    );

    await Promise.allSettled(fetchPromises);
  };

  // Fetch transaction history
  const fetchTransactionHistory = async (address: string, filter?: 'auto-pay' | 'cross-chain' | 'arc-testnet') => {
    setIsLoadingTransactions(true);
    try {
      const txHistory = await fetchUserTransactions(address, filter);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Refresh balances
  const refreshBalances = async () => {
    if (!userAddress) return;
    setIsRefreshing(true);
    await fetchAllBalances(userAddress);
    const filter = selectedTxFilter === 'all' ? undefined : selectedTxFilter;
    await fetchTransactionHistory(userAddress, filter);
    setIsRefreshing(false);
  };

  // Copy address
  const copyAddress = () => {
    if (!userAddress) return;
    navigator.clipboard.writeText(userAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Listen for account changes
  useEffect(() => {
    const metamaskProvider = getMetaMaskProvider();
    if (!metamaskProvider || !metamaskProvider.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== userAddress) {
        setUserAddress(accounts[0]);
        fetchAllBalances(accounts[0]);
        fetchTransactionHistory(accounts[0]);
      }
    };

    metamaskProvider.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (metamaskProvider.removeListener) {
        metamaskProvider.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [userAddress]);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      const metamaskProvider = getMetaMaskProvider();
      if (!metamaskProvider) return;

      try {
        const web3Provider = new BrowserProvider(metamaskProvider);
        const accounts = await web3Provider.send('eth_accounts', []);

        if (accounts && (accounts as string[]).length > 0) {
          const signer = await web3Provider.getSigner();
          const address = await signer.getAddress();
          setUserAddress(address);
          await fetchAllBalances(address);
          await fetchTransactionHistory(address);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();
  }, []);

  const balance = chainBalances[selectedChain] || {
    usdc: '0.00',
    native: '0.0000',
    nativeSymbol: CHAINS[selectedChain].nativeSymbol,
    isLoading: true,
  };

  const LogoComponent = CHAIN_LOGOS[CHAINS[selectedChain].name] || CHAIN_LOGOS['Ethereum'];

  // Calculate total USDC across all chains
  const totalUSDC = Object.values(chainBalances).reduce(
    (sum, chain) => sum + parseFloat(chain.usdc || '0'),
    0
  ).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>
        <p className="text-gray-600">View your balances and transaction history across all chains</p>
      </div>

      {/* Connect Wallet Button */}
      {!userAddress && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-6">
          <p className="text-gray-700 text-lg mb-2">Connect your wallet to view your profile</p>
          <p className="text-gray-500 text-sm">Use the "Connect Wallet" button in the top right corner</p>
        </div>
      )}

      {/* Wallet Card */}
      {userAddress && (
        <>
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span className="font-medium">Connected Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                >
                  <span className="font-mono">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={refreshBalances}
                  disabled={isRefreshing}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                  title="Refresh balances"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={disconnectWallet}
                  className="px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Total Portfolio Value */}
            <div className="mb-4 pb-4 border-b border-white/20">
              <p className="text-sm text-white/70 mb-1">Total Portfolio Value (USDC)</p>
              <p className="text-4xl font-bold">${totalUSDC}</p>
              <p className="text-xs text-white/60 mt-1">Across {Object.keys(CHAINS).length} chains</p>
            </div>

            {/* Chain Selector */}
            <div className="relative mb-4">
              <button
                onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors w-full"
              >
                <LogoComponent className="w-6 h-6" />
                <span className="font-medium flex-1 text-left">{CHAINS[selectedChain].name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isChainDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10 max-h-80 overflow-y-auto">
                  {(Object.keys(CHAINS) as ChainKey[]).map((chainKey) => {
                    const chain = CHAINS[chainKey];
                    const ChainLogo = CHAIN_LOGOS[chain.name] || CHAIN_LOGOS['Ethereum'];
                    const chainBalance = chainBalances[chainKey];
                    return (
                      <button
                        key={chainKey}
                        onClick={() => {
                          setSelectedChain(chainKey);
                          setIsChainDropdownOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-50 transition-colors ${selectedChain === chainKey ? 'bg-indigo-50' : ''
                          }`}
                      >
                        <ChainLogo className="w-6 h-6" />
                        <div className="flex-1 text-left">
                          <div className="text-gray-900 font-medium">{chain.name}</div>
                          {chainBalance && !chainBalance.isLoading && (
                            <div className="text-xs text-gray-500">${chainBalance.usdc} USDC</div>
                          )}
                        </div>
                        {selectedChain === chainKey && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Balance Display */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-white/70 mb-1">USDC Balance</p>
                {balance.isLoading ? (
                  <div className="h-9 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold">${balance.usdc}</p>
                )}
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-white/70 mb-1">{balance.nativeSymbol} Balance</p>
                {balance.isLoading ? (
                  <div className="h-9 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold">{balance.native} {balance.nativeSymbol}</p>
                )}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Transaction History</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {transactions.length}
                  </span>
                </div>
                {isLoadingTransactions && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setSelectedTxFilter('all');
                    await fetchTransactionHistory(userAddress, undefined);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedTxFilter === 'all'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={async () => {
                    setSelectedTxFilter('auto-pay');
                    await fetchTransactionHistory(userAddress, 'auto-pay');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedTxFilter === 'auto-pay'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  AutoPay
                </button>
                <button
                  onClick={async () => {
                    setSelectedTxFilter('cross-chain');
                    await fetchTransactionHistory(userAddress, 'cross-chain');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedTxFilter === 'cross-chain'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Cross-Chain
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {transactions.length === 0 && !isLoadingTransactions && (
                <div className="px-6 py-12 text-center text-gray-500">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No transactions yet</p>
                  <p className="text-sm text-gray-400 mt-2">Your payment history will appear here</p>
                </div>
              )}

              {isLoadingTransactions && (
                <div className="px-6 py-12 text-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading transactions...</p>
                </div>
              )}

              {transactions.slice(0, 20).map((tx) => (
                <div key={tx.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  {/* Type Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'send' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                    <span className={`text-lg font-bold ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {tx.type === 'send' ? '↑' : '↓'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {tx.type === 'send' ? 'Sent to' : 'Received from'}
                      </span>
                      <span className="font-mono text-sm text-gray-600 truncate">
                        {tx.type === 'send'
                          ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                          : `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
                        }
                      </span>
                      {tx.paymentType === 'auto-pay' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          <Zap className="w-3 h-3" />
                          AutoPay
                        </span>
                      )}
                      {tx.paymentType === 'cross-chain' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          <Layers className="w-3 h-3" />
                          Cross-Chain
                        </span>
                      )}
                      {tx.paymentType === 'arc-testnet' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <Zap className="w-3 h-3" />
                          Arc
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{tx.date}</span>
                      <span>•</span>
                      {tx.paymentType === 'cross-chain' && tx.sourceChain ? (
                        <span className="capitalize">{tx.sourceChain} → {tx.destinationChain}</span>
                      ) : (
                        <span className="capitalize">{CHAINS[tx.chain as ChainKey]?.name || tx.chain}</span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-xs">
                      {tx.status === 'success' && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </span>
                      )}
                      {tx.status === 'failed' && (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* External Link */}
                  {tx.txHash && (
                    <a
                      href={getExplorerUrl(tx.chain, tx.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {transactions.length > 20 && (
              <div className="px-6 py-4 border-t border-gray-200 text-center">
                <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                  View All Transactions ({transactions.length})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}