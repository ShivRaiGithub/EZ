'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Settings, History, Loader2, CheckCircle2, Trash2, Pause, Play, Wallet, DollarSign, ArrowUpRight } from 'lucide-react';
import { autopaymentApi } from '@/lib/api';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { AutoPayFactoryABI, AutoPayWalletABI, ERC20_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES, ARC_TESTNET_CONFIG } from '@/lib/config';
import { useAccount } from 'wagmi';

// Extend Window interface for MetaMask
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            isMetaMask?: boolean;
            providers?: Array<{
                request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
                isMetaMask?: boolean;
            }>;
        };
    }
}

interface AutoPayment {
    _id: string;
    recipient: string;
    amount: string;
    frequency: string;
    destinationChain: string;
    status: 'active' | 'paused';
    nextPayment: string;
    lastPayment?: string;
}

interface PaymentHistory {
    _id: string;
    recipient: string;
    amount: string;
    destinationChain: string;
    createdAt: string;
    status: 'success' | 'failed' | 'pending';
    txHash?: string;
    errorMessage?: string;
}

export default function AutoPayPage() {
    // Use wagmi hook for wallet connection
    const { address: userAddress, isConnected } = useAccount();

    const [walletAddress, setWalletAddress] = useState<string>('');
    const [walletBalance, setWalletBalance] = useState<string>('0');
    const [usdcBalance, setUsdcBalance] = useState<string>('0');
    const [tab, setTab] = useState<'setup' | 'manage' | 'history' | 'wallet'>('wallet');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [fundAmount, setFundAmount] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [destinationChain, setDestinationChain] = useState('sepolia');
    const [autoPayments, setAutoPayments] = useState<AutoPayment[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Get MetaMask provider specifically
    const getMetaMaskProvider = () => {
        if (!window.ethereum) return null;

        if (window.ethereum.providers) {
            return window.ethereum.providers.find(provider => provider.isMetaMask);
        }

        if (window.ethereum.isMetaMask) {
            return window.ethereum;
        }

        return null;
    };

    const getExplorerUrl = (chain: string, txHash: string) => {
        const explorers: Record<string, string> = {
            'sepolia': 'https://sepolia.etherscan.io',
            'base': 'https://sepolia.basescan.org',
            'arc': 'https://testnet.arcscan.app',
            'arbitrum-sepolia': 'https://sepolia.arbiscan.io',
            'optimism-sepolia': 'https://sepolia-optimism.etherscan.io',
            'polygon-amoy': 'https://amoy.polygonscan.com',
        };

        return `${explorers[chain] || explorers.arc}/tx/${txHash}`;
    };

    // Switch to Arc Testnet
    const switchToArcTestnet = async () => {
        const metamaskProvider = getMetaMaskProvider();
        if (!metamaskProvider) return;

        try {
            await metamaskProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${ARC_TESTNET_CONFIG.chainId.toString(16)}` }],
            });
        } catch (switchError: any) {
            // Chain not added, add it
            if (switchError.code === 4902) {
                try {
                    await metamaskProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${ARC_TESTNET_CONFIG.chainId.toString(16)}`,
                            chainName: ARC_TESTNET_CONFIG.chainName,
                            rpcUrls: [ARC_TESTNET_CONFIG.rpcUrl],
                            blockExplorerUrls: [ARC_TESTNET_CONFIG.explorer],
                            nativeCurrency: ARC_TESTNET_CONFIG.nativeCurrency,
                        }],
                    });
                } catch {
                    throw new Error('Failed to add Arc Testnet');
                }
            } else {
                throw switchError;
            }
        }
    };

    // Auto-check wallet contract when connected via wagmi
    useEffect(() => {
        if (isConnected && userAddress) {
            checkWalletContract(userAddress);
        } else {
            // Reset state when disconnected
            setWalletAddress('');
            setWalletBalance('0');
            setUsdcBalance('0');
        }
    }, [isConnected, userAddress]);

    // Check if user has a wallet contract
    const checkWalletContract = async (address: string) => {
        try {
            const metamaskProvider = getMetaMaskProvider();
            if (!metamaskProvider) return;

            const web3Provider = new BrowserProvider(metamaskProvider);
            const signer = await web3Provider.getSigner();

            const factoryContract = new Contract(
                CONTRACT_ADDRESSES.ARC_TESTNET.FACTORY,
                AutoPayFactoryABI,
                signer
            );

            const walletAddr = await factoryContract.getWallet(address);

            if (walletAddr !== '0x0000000000000000000000000000000000000000') {
                setWalletAddress(walletAddr);
                await fetchWalletBalance(walletAddr);
            }
        } catch (error) {
            console.error('Error checking wallet contract:', error);
        }
    };

    // Create wallet contract
    const createWalletContract = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const metamaskProvider = getMetaMaskProvider();
            if (!metamaskProvider) {
                throw new Error("MetaMask not found");
            }

            const web3Provider = new BrowserProvider(metamaskProvider);
            const signer = await web3Provider.getSigner();

            const factoryContract = new Contract(
                CONTRACT_ADDRESSES.ARC_TESTNET.FACTORY,
                AutoPayFactoryABI,
                signer
            );

            const tx = await factoryContract.createWallet();
            await tx.wait();

            // Get the wallet address
            const walletAddr = await factoryContract.getWallet(userAddress);
            setWalletAddress(walletAddr);

            // Set relayer in the wallet
            await setRelayerInWallet(walletAddr);

            setSuccessMessage('Wallet contract created successfully!');
            setTab('wallet');
        } catch (error: any) {
            console.error('Error creating wallet:', error);
            setError(error.message || 'Failed to create wallet contract');
        } finally {
            setIsLoading(false);
        }
    };

    // Set relayer in wallet
    const setRelayerInWallet = async (walletAddr: string) => {
        try {
            const metamaskProvider = getMetaMaskProvider();
            if (!metamaskProvider) return;

            const web3Provider = new BrowserProvider(metamaskProvider);
            const signer = await web3Provider.getSigner();

            const walletContract = new Contract(
                walletAddr,
                AutoPayWalletABI,
                signer
            );

            // Get relayer address from environment or use default
            const relayerAddress = process.env.NEXT_PUBLIC_RELAYER_ADDRESS || '';

            if (relayerAddress) {
                const tx = await walletContract.setRelayer(relayerAddress);
                await tx.wait();
                console.log('Relayer set successfully');
            }
        } catch (error) {
            console.error('Error setting relayer:', error);
        }
    };

    // Fetch wallet balance
    const fetchWalletBalance = async (walletAddr: string) => {
        try {
            const metamaskProvider = getMetaMaskProvider();
            if (!metamaskProvider) return;

            const web3Provider = new BrowserProvider(metamaskProvider);
            const signer = await web3Provider.getSigner();
            const signerAddress = await signer.getAddress();

            const walletContract = new Contract(
                walletAddr,
                AutoPayWalletABI,
                signer
            );

            const balance = await walletContract.getBalance();
            setWalletBalance(formatUnits(balance, 6));

            // Also get user's USDC balance
            const usdcContract = new Contract(
                CONTRACT_ADDRESSES.ARC_TESTNET.USDC,
                ERC20_ABI,
                signer
            );

            const userBalance = await usdcContract.balanceOf(signerAddress);
            setUsdcBalance(formatUnits(userBalance, 6));
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    // Fund wallet
    const fundWallet = async () => {
        if (!fundAmount || parseFloat(fundAmount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const metamaskProvider = getMetaMaskProvider();
            if (!metamaskProvider) throw new Error("MetaMask not found");

            const web3Provider = new BrowserProvider(metamaskProvider);
            const signer = await web3Provider.getSigner();

            const amountInSubunits = parseUnits(fundAmount, 6);

            // Approve USDC
            const usdcContract = new Contract(
                CONTRACT_ADDRESSES.ARC_TESTNET.USDC,
                ERC20_ABI,
                signer
            );

            const approveTx = await usdcContract.approve(walletAddress, amountInSubunits);
            await approveTx.wait();

            // Fund wallet
            const walletContract = new Contract(
                walletAddress,
                AutoPayWalletABI,
                signer
            );

            const fundTx = await walletContract.fund(amountInSubunits);
            await fundTx.wait();

            setSuccessMessage(`Successfully funded ${fundAmount} USDC`);
            setFundAmount('');
            await fetchWalletBalance(walletAddress);
        } catch (error: any) {
            console.error('Error funding wallet:', error);
            setError(error.message || 'Failed to fund wallet');
        } finally {
            setIsLoading(false);
        }
    };

    // Withdraw from wallet
    const withdrawFromWallet = async () => {
        if (!fundAmount || parseFloat(fundAmount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const metamaskProvider = getMetaMaskProvider();
            if (!metamaskProvider) throw new Error("MetaMask not found");

            const web3Provider = new BrowserProvider(metamaskProvider);
            const signer = await web3Provider.getSigner();

            const walletContract = new Contract(
                walletAddress,
                AutoPayWalletABI,
                signer
            );

            const amountInSubunits = parseUnits(fundAmount, 6);
            const tx = await walletContract.withdraw(amountInSubunits);
            await tx.wait();

            setSuccessMessage(`Successfully withdrew ${fundAmount} USDC`);
            setFundAmount('');
            await fetchWalletBalance(walletAddress);
        } catch (error: any) {
            console.error('Error withdrawing:', error);
            setError(error.message || 'Failed to withdraw');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch autopayments and history when wallet is connected
    useEffect(() => {
        if (userAddress && walletAddress) {
            fetchAutoPayments();
            fetchPaymentHistory();
        }
    }, [userAddress, walletAddress]);

    const fetchAutoPayments = async () => {
        if (!userAddress) return;

        setIsFetching(true);
        try {
            const response = await autopaymentApi.getAll(userAddress);
            if (response.data.success) {
                setAutoPayments(response.data.autoPayments);
            }
        } catch (error) {
            console.error('Error fetching autopayments:', error);
        } finally {
            setIsFetching(false);
        }
    };

    const fetchPaymentHistory = async () => {
        if (!userAddress) return;

        try {
            const response = await autopaymentApi.getHistory(userAddress);
            if (response.data.success) {
                setPaymentHistory(response.data.history);
            }
        } catch (error) {
            console.error('Error fetching payment history:', error);
        }
    };

    const chains = [
        { id: 'sepolia', name: 'Ethereum Sepolia' },
        { id: 'base', name: 'Base Sepolia' },
        { id: 'arc', name: 'Arc Testnet' },
    ];

    const frequencies = [
        { id: 'minute', name: 'Minute (Testing)' },
        { id: 'daily', name: 'Daily' },
        { id: 'weekly', name: 'Weekly' },
        { id: 'monthly', name: 'Monthly' },
        { id: 'yearly', name: 'Yearly' },
    ];

    const handleCreate = async () => {
        if (!recipient || !amount || !userAddress || !walletAddress) return;

        setIsLoading(true);
        setError(null);

        try {
            // First create in database to get ID
            const response = await autopaymentApi.create({
                userId: userAddress,
                walletAddress: walletAddress,
                recipient,
                amount,
                frequency,
                destinationChain,
            });

            if (response.data.success) {
                const paymentId = response.data.autoPayment._id;

                // Add to smart contract
                const metamaskProvider = getMetaMaskProvider();
                if (!metamaskProvider) throw new Error("MetaMask not found");

                const web3Provider = new BrowserProvider(metamaskProvider);
                const signer = await web3Provider.getSigner();

                const walletContract = new Contract(
                    walletAddress,
                    AutoPayWalletABI,
                    signer
                );

                const amountInSubunits = parseUnits(amount, 6);

                const tx = await walletContract.addAutoPayment(
                    paymentId,
                    recipient,
                    amountInSubunits,
                    frequency,
                    destinationChain
                );

                await tx.wait();

                await fetchAutoPayments();
                setRecipient('');
                setAmount('');
                setSuccessMessage('Auto payment created successfully!');
                setTab('manage');
            }
        } catch (error: any) {
            console.error('Error creating autopayment:', error);
            setError(error.response?.data?.error || error.message || 'Failed to create autopayment');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (id: string) => {
        const payment = autoPayments.find((p) => p._id === id);
        if (!payment) return;

        const newStatus = payment.status === 'active' ? 'paused' : 'active';

        try {
            // Update in database
            await autopaymentApi.updateStatus(id, newStatus);

            // Cancel in contract if pausing
            if (newStatus === 'paused' && walletAddress) {
                const metamaskProvider = getMetaMaskProvider();
                if (!metamaskProvider) throw new Error("MetaMask not found");

                const web3Provider = new BrowserProvider(metamaskProvider);
                const signer = await web3Provider.getSigner();

                const walletContract = new Contract(
                    walletAddress,
                    AutoPayWalletABI,
                    signer
                );

                const tx = await walletContract.cancelAutoPayment(id);
                await tx.wait();
            }

            await fetchAutoPayments();
            setSuccessMessage(`Payment ${newStatus === 'active' ? 'resumed' : 'paused'}`);
        } catch (error) {
            console.error('Error updating status:', error);
            setError('Failed to update payment status');
        }
    };

    const deletePayment = async (id: string) => {
        try {
            // Cancel in contract first
            if (walletAddress) {
                const metamaskProvider = getMetaMaskProvider();
                if (!metamaskProvider) throw new Error("MetaMask not found");

                const web3Provider = new BrowserProvider(metamaskProvider);
                const signer = await web3Provider.getSigner();

                const walletContract = new Contract(
                    walletAddress,
                    AutoPayWalletABI,
                    signer
                );

                const tx = await walletContract.cancelAutoPayment(id);
                await tx.wait();
            }

            // Delete from database
            await autopaymentApi.delete(id);
            await fetchAutoPayments();
            setSuccessMessage('Payment deleted successfully');
        } catch (error) {
            console.error('Error deleting payment:', error);
            setError('Failed to delete payment');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Auto Payments</h1>
                </div>
                <p className="text-gray-600">Set up and manage recurring payments with your smart contract wallet</p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="text-green-700 text-sm">{successMessage}</p>
                    </div>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-green-600 text-xs underline mt-2"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 text-xs underline mt-2"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Wallet Not Connected */}
            {!userAddress && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <p className="text-gray-700 text-lg mb-2">Connect your wallet to start using Auto Payments</p>
                    <p className="text-gray-500 text-sm">Use the "Connect Wallet" button in the top right corner</p>
                </div>
            )}

            {/* Connected but no wallet contract */}
            {userAddress && !walletAddress && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-900 font-semibold mb-2">Create Your Smart Contract Wallet</p>
                    <p className="text-gray-500 mb-6">You need a smart contract wallet to manage autopayments</p>
                    <button
                        onClick={createWalletContract}
                        disabled={isLoading}
                        className="bg-linear-to-r from-green-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                Creating...
                            </>
                        ) : (
                            'Create Wallet'
                        )}
                    </button>
                </div>
            )}

            {/* Main Content - Only show when wallet contract exists */}
            {userAddress && walletAddress && (
                <>
                    {/* Wallet Info Card */}
                    <div className="bg-linear-to-r from-green-600 to-teal-600 rounded-xl p-6 mb-6 text-white">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-green-100 text-sm mb-1">Your Address</p>
                                <p className="font-mono text-sm">{userAddress}</p>
                            </div>
                            <div>
                                <p className="text-green-100 text-sm mb-1">Contract Wallet</p>
                                <p className="font-mono text-sm">{walletAddress}</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-green-400/30">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-green-100 text-sm mb-1">Wallet Balance</p>
                                    <p className="text-2xl font-bold">{walletBalance} USDC</p>
                                </div>
                                <div>
                                    <p className="text-green-100 text-sm mb-1">Your USDC Balance</p>
                                    <p className="text-2xl font-bold">{usdcBalance} USDC</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
                        <button
                            onClick={() => setTab('wallet')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'wallet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Wallet className="w-4 h-4" />
                            Wallet
                        </button>
                        <button
                            onClick={() => setTab('setup')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'setup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            Setup
                        </button>
                        <button
                            onClick={() => setTab('manage')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'manage' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            Manage
                        </button>
                        <button
                            onClick={() => setTab('history')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            History
                        </button>
                    </div>

                    {/* Wallet Tab */}
                    {tab === 'wallet' && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Manage Wallet Funds</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (USDC)
                                </label>
                                <input
                                    type="number"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="input-field w-full"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <button
                                    onClick={fundWallet}
                                    disabled={isLoading || !fundAmount}
                                    className="btn-primary py-3 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpRight className="w-4 h-4 mr-2" />
                                            Fund Wallet
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={withdrawFromWallet}
                                    disabled={isLoading || !fundAmount}
                                    className="bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Withdraw'
                                    )}
                                </button>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    💡 <strong>Tip:</strong> Make sure to fund your wallet with enough USDC to cover all your scheduled autopayments plus gas fees.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Setup Tab */}
                    {tab === 'setup' && (
                        <div>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Recipient Address
                                        </label>
                                        <input
                                            type="text"
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            placeholder="0x... or ENS name"
                                            className="input-field w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Amount (USDC)
                                        </label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="input-field w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Frequency
                                        </label>
                                        <select
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value)}
                                            className="input-field w-full"
                                        >
                                            {frequencies.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {f.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Destination Chain
                                        </label>
                                        <select
                                            value={destinationChain}
                                            onChange={(e) => setDestinationChain(e.target.value)}
                                            className="input-field w-full"
                                        >
                                            {chains.map((chain) => (
                                                <option key={chain.id} value={chain.id}>
                                                    {chain.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreate}
                                    disabled={isLoading || !recipient || !amount}
                                    className="w-full btn-primary py-3 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Auto Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Manage Tab */}
                    {tab === 'manage' && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {autoPayments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No auto payments set up yet</p>
                                    <button onClick={() => setTab('setup')} className="mt-4 btn-primary">
                                        Create One
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Recipient</th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Frequency</th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Chain</th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {autoPayments.map((payment) => (
                                            <tr key={payment._id}>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                                    {payment.recipient.slice(0, 6)}...{payment.recipient.slice(-4)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{payment.amount} USDC</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{payment.frequency}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{payment.destinationChain}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                            }`}
                                                    >
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => toggleStatus(payment._id)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                                        >
                                                            {payment.status === 'active' ? (
                                                                <Pause className="w-4 h-4 text-gray-500" />
                                                            ) : (
                                                                <Play className="w-4 h-4 text-gray-500" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => deletePayment(payment._id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {tab === 'history' && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {paymentHistory.length === 0 ? (
                                <div className="p-12 text-center">
                                    <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No payment history yet</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Recipient</th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tx Hash</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paymentHistory.map((tx) => (
                                            <tr key={tx._id}>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                                    {tx.recipient.slice(0, 6)}...{tx.recipient.slice(-4)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{tx.amount} USDC</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'success'
                                                            ? 'bg-green-100 text-green-700'
                                                            : tx.status === 'failed'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                            }`}
                                                    >
                                                        {tx.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : null}
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                                    {tx.txHash ? (
                                                        <a
                                                            href={getExplorerUrl(tx.destinationChain, tx.txHash)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {tx.txHash.slice(0, 10)}...
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
