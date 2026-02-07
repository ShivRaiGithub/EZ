'use client';

import { useState } from 'react';
import { BrowserProvider, ethers } from "ethers";
import { Zap, CircleDollarSign } from 'lucide-react';
import {api, paymentHistoryApi} from '@/lib/api';

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

// Chain configurations
const CHAINS = {
  sepolia: {
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpc: "https://sepolia.drpc.org",
    domain: 0,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    explorer: "https://sepolia.etherscan.io",
  },
  base: {
    name: "Base Sepolia",
    chainId: 84532,
    rpc: "https://sepolia.base.org",
    domain: 6,
    usdc: "0x3600000000000000000000000000000000000000",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    explorer: "https://sepolia.basescan.org",
  },
  arc: {
    name: "Arc Testnet",
    chainId: 5042002,
    rpc: "https://rpc.testnet.arc.network",
    domain: 26,
    usdc: "0x3600000000000000000000000000000000000000",
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
    messageTransmitter: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
    explorer: "https://testnet.arcscan.app",
  },
} as const;

type ChainKey = keyof typeof CHAINS;

// ABIs
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const TOKEN_MESSENGER_ABI = [
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) returns (uint64)",
];

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface Step {
  id: string;
  title: string;
  status: "pending" | "success" | "error" | "idle";
  details?: string;
}

interface AttestationMessage {
  message: string;
  attestation: string;
  status: string;
}

export default function ArcPage() {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [userAddress, setUserAddress] = useState<string>("");
    const [usdcBalance, setUsdcBalance] = useState<string>("0.00");
    const sourceChain: ChainKey = "arc"; // Always Arc as source
    const [destChain, setDestChain] = useState<ChainKey>("sepolia");
    const [recipientAddress, setRecipientAddress] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [finalResult, setFinalResult] = useState<{
        success: boolean;
        message: string;
        burnTxHash?: string;
        mintTxHash?: string;
    } | null>(null);

    // Logging function
    const addLog = (message: string, type: LogEntry["type"] = "info") => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev, { timestamp, message, type }]);
        console.log(`[${timestamp}] ${message}`);
    };

    // Update step status
    const updateStep = (
        stepId: string,
        title: string,
        status: Step["status"],
        details?: string
    ) => {
        setSteps((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === stepId);
        const newStep = { id: stepId, title, status, details };

        if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newStep;
            return updated;
        }
        return [...prev, newStep];
        });
    };

    // Get MetaMask provider specifically
    const getMetaMaskProvider = () => {
        if (!window.ethereum) return null;
        
        // If multiple providers exist, find MetaMask
        if (window.ethereum.providers) {
        return window.ethereum.providers.find(provider => provider.isMetaMask);
        }
        
        // Otherwise check if current provider is MetaMask
        if (window.ethereum.isMetaMask) {
        return window.ethereum;
        }
        
        return null;
    };

    // Fetch USDC balance
    const fetchBalance = async (address: string, currentSigner: ethers.Signer) => {
        try {
        const usdcContract = new ethers.Contract(
            CHAINS.arc.usdc,
            ERC20_ABI,
            currentSigner
        );
        const balance = await usdcContract.balanceOf(address);
        const formattedBalance = ethers.formatUnits(balance, 6);
        setUsdcBalance(formattedBalance);
        } catch (error) {
        console.error("Error fetching balance:", error);
        setUsdcBalance("0.00");
        }
    };

    // Connect wallet
    const connectWallet = async () => {
        try {
        const metamaskProvider = getMetaMaskProvider();
        
        if (!metamaskProvider) {
            alert("Please install MetaMask! If you have multiple wallets, make sure MetaMask is enabled.");
            return;
        }

        addLog("Connecting...");
        const web3Provider = new BrowserProvider(metamaskProvider);
        await web3Provider.send("eth_requestAccounts", []);
        
        // Switch to Arc network immediately
        await switchNetwork(CHAINS.arc.chainId);
        
        const web3Signer = await web3Provider.getSigner();
        const address = await web3Signer.getAddress();

        setProvider(web3Provider);
        setSigner(web3Signer);
        setUserAddress(address);

        // Fetch balance
        await fetchBalance(address, web3Signer);

        addLog("Connected", "success");
        } catch {
        addLog("Connection Failed", "error");
        }
    };

    // Switch network
    const switchNetwork = async (chainId: number) => {
        try {
        const metamaskProvider = getMetaMaskProvider();
        if (!metamaskProvider) {
            throw new Error("MetaMask not found");
        }
        await metamaskProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x" + chainId.toString(16) }],
        });
        addLog("Network Switched", "success");
        } catch (error) {
        const err = error as { code?: number };
        if (err.code === 4902) {
            addLog("Chain Not Found", "error");
        }
        throw error;
        }
    };

    // Fetch attestation from Circle API
    const fetchAttestation = async (
        txHash: string,
        sourceDomain: number
    ): Promise<AttestationMessage> => {
        const url = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${txHash}`;
        addLog("Fetching Attestation...");

        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
            if (response.status !== 404) {
                addLog("Retrying...", "warning");
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
            attempts++;
            continue;
            }

            const data = await response.json() as { messages?: AttestationMessage[] };

            if (data?.messages?.[0]?.status === "complete") {
            addLog("Attestation Received", "success");
            return data.messages[0];
            }

            addLog("Waiting...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
            attempts++;
        } catch {
            addLog("Error Fetching", "error");
            await new Promise((resolve) => setTimeout(resolve, 5000));
            attempts++;
        }
        }

        throw new Error("Attestation timeout - please try again later");
    };

    // Call backend relayer API
    const callRelayerAPI = async (
        burnTxHash: string,
        destinationChain: ChainKey,
        attestation: AttestationMessage
    ): Promise<string> => {
        addLog("Minting...");

        try {
            const response = await api.post('/api/relay', {
                burnTxHash,
                destinationChain,
                attestation
            });
            
            if (response.data.success && response.data.mintTxHash) {
                addLog("Mint Complete", "success");
                return response.data.mintTxHash;
            }
            
            throw new Error(response.data.error || "Mint failed");
        } catch (error: any) {
            const message = error.response?.data?.error || error.message || "Mint failed";
            addLog(`Mint Failed: ${message}`, "error");
            throw new Error(message);
        }
    };

    // Main payment execution
    const executePayment = async () => {
        if (!signer || !provider) {
        alert("Please connect your wallet first!");
        return;
        }

        if (!ethers.isAddress(recipientAddress)) {
        alert("Invalid recipient address!");
        return;
        }

        if (parseFloat(amount) <= 0) {
        alert("Invalid amount!");
        return;
        }

        if (sourceChain === destChain) {
        alert("Source and destination chains must be different!");
        return;
        }

        setIsProcessing(true);
        setLogs([]);
        setSteps([]);
        setFinalResult(null);

        try {
        const sourceConfig = CHAINS[sourceChain];
        const destConfig = CHAINS[destChain];
        const amountInSubunits = ethers.parseUnits(amount, 6);

        addLog("Starting Payment", "info");

        // Step 1: Switch to source network (Arc)
        updateStep("switch-network", "Switch to Arc Network", "pending");
        addLog("Switching Network...");
        await switchNetwork(sourceConfig.chainId);
        updateStep(
            "switch-network",
            "Switch to Arc Network",
            "success",
            `Connected to ${sourceConfig.name}`
        );

        // Refresh provider after network switch
        const metamaskProvider = getMetaMaskProvider();
        if (!metamaskProvider) {
            throw new Error("MetaMask not found");
        }
        const newProvider = new BrowserProvider(metamaskProvider);
        const newSigner = await newProvider.getSigner();

        // Step 2: Approve USDC
        updateStep("approve", "Approve USDC", "pending");
        addLog("Checking Allowance...");

        const usdcContract = new ethers.Contract(sourceConfig.usdc, ERC20_ABI, newSigner);

        const currentAllowance = await usdcContract.allowance(
            userAddress,
            sourceConfig.tokenMessenger
        );

        if (currentAllowance < amountInSubunits) {
            addLog("Approving...");
            const approveTx = await usdcContract.approve(
            sourceConfig.tokenMessenger,
            ethers.MaxUint256
            );
            updateStep(
            "approve",
            "Approve USDC",
            "pending",
            `Tx: ${approveTx.hash.slice(0, 10)}...`
            );
            addLog("Confirming...");
            await approveTx.wait();
            addLog("Approved", "success");
        } else {
            addLog("Already Approved", "success");
        }

        updateStep(
            "approve",
            "Approve USDC",
            "success",
            `Approved for Token Messenger`
        );

        // Step 3: Burn USDC (depositForBurn)
        updateStep("burn", "Burn USDC on Arc", "pending");
        addLog("Burning...");

        const tokenMessenger = new ethers.Contract(
            sourceConfig.tokenMessenger,
            TOKEN_MESSENGER_ABI,
            newSigner
        );

        const recipientBytes32 = ethers.zeroPadValue(recipientAddress, 32);
        const destinationCallerBytes32 = ethers.ZeroHash;

        const burnTx = await tokenMessenger.depositForBurn(
            amountInSubunits,
            destConfig.domain,
            recipientBytes32,
            sourceConfig.usdc,
            destinationCallerBytes32,
            500,
            1000
        );

        addLog("Burn Sent", "success");
        updateStep(
            "burn",
            "Burn USDC on Arc",
            "pending",
            `Tx: ${burnTx.hash}`
        );

        addLog("Confirming...");
        await burnTx.wait();

        addLog("Burn Confirmed", "success");
        updateStep(
            "burn",
            "Burn USDC on Arc",
            "success",
            `Explorer: ${sourceConfig.explorer}/tx/${burnTx.hash}`
        );

        // Step 4: Fetch attestation
        updateStep("attestation", "Fetch Attestation from Circle", "pending");
        const attestation = await fetchAttestation(burnTx.hash, sourceConfig.domain);
        updateStep(
            "attestation",
            "Fetch Attestation from Circle",
            "success",
            "Attestation received"
        );

        // Step 5: Relayer mints on destination
        updateStep("mint", "Relayer Minting on Destination", "pending");
        addLog("Minting on Destination...");

        const mintTxHash = await callRelayerAPI(burnTx.hash, destChain, attestation);

        updateStep(
            "mint",
            "Relayer Minting on Destination",
            "success",
            `Explorer: ${destConfig.explorer}/tx/${mintTxHash}`
        );

        // Step 6: Complete
        updateStep("complete", "Payment Complete", "success");
        addLog("Success!", "success");

        // Refresh balance
        await fetchBalance(userAddress, newSigner);

        // Store transaction in database
        try {
            await paymentHistoryApi.createArc({
                userId: userAddress,
                recipient: recipientAddress,
                amount: amount,
                destinationChain: destChain,
                burnTxHash: burnTx.hash,
                mintTxHash: mintTxHash,
                status: 'success',
            });
        } catch (error) {
            console.error('Failed to store transaction in database:', error);
            // Don't fail the overall transaction if database storage fails
        }

        setFinalResult({
            success: true,
            message: `Successfully sent ${amount} USDC to ${recipientAddress}`,
            burnTxHash: burnTx.hash,
            mintTxHash: mintTxHash,
        });
        } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        addLog("Payment Failed", "error");
        console.error(error);

        // Update current step as error
        if (steps.length > 0) {
            const lastStep = steps[steps.length - 1];
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            updateStep(lastStep.id, lastStep.title, "error", errorMsg);
        }

        setFinalResult({
            success: false,
            message: `Payment failed: ${message}`,
        });
        } finally {
        setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Arc Testnet Payments</h1>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Testnet Active
                    </span>
                </div>
                <p className="text-gray-600">Send USDC from Arc to any chain with instant finality</p>
            </div>

            {/* Arc Info Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-center gap-4">
                <CircleDollarSign className="w-8 h-8 text-purple-600" />
                <div>
                    <p className="font-medium text-purple-900">USDC-Native Gas</p>
                    <p className="text-sm text-purple-700">Gas fees are paid in USDC, not volatile tokens. Estimated: ~$0.01</p>
                </div>
            </div>

            {/* Wallet Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                {!userAddress ? (
                    <button
                        onClick={connectWallet}
                        className="w-full bg-linear-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all"
                    >
                        Connect MetaMask
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Connected Wallet</div>
                                <div className="font-mono bg-gray-50 px-4 py-2 rounded-lg text-sm">
                                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setProvider(null);
                                    setSigner(null);
                                    setUserAddress("");
                                    setUsdcBalance("0.00");
                                }}
                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors text-sm"
                            >
                                Disconnect
                            </button>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">USDC Balance on Arc</span>
                                <span className="text-2xl font-bold text-purple-600">{parseFloat(usdcBalance).toFixed(2)} USDC</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Form */}
            {userAddress && (
                <div className="space-y-6 mb-8">
                    {/* Recipient Address */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                            disabled={isProcessing}
                        />
                    </div>

                    {/* Destination Chain */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Destination Chain
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {(Object.keys(CHAINS) as ChainKey[])
                                .filter(key => key !== 'arc')
                                .map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setDestChain(key)}
                                        disabled={isProcessing}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            destChain === key
                                                ? "border-purple-600 bg-purple-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <div className="font-semibold">{CHAINS[key].name}</div>
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Amount (USDC)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                            disabled={isProcessing}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Sub-second finality on Arc Testnet
                        </p>
                    </div>

                    {/* Execute Button */}
                    <button
                        onClick={executePayment}
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                            isProcessing
                                ? "bg-gray-400 cursor-not-allowed text-white"
                                : "bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-1"
                        }`}
                    >
                        {isProcessing ? "Processing..." : "Send Payment"}
                    </button>
                </div>
            )}

            {/* Status Section */}
            {(steps.length > 0 || logs.length > 0) && (
                <div className="space-y-6">
                    {/* Steps */}
                    {steps.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-lg mb-4">Transaction Status</h3>
                            <div className="space-y-3">
                                {steps.map((step) => (
                                    <div
                                        key={step.id}
                                        className={`p-4 rounded-lg border-2 ${
                                            step.status === "success"
                                                ? "border-green-500 bg-green-50"
                                                : step.status === "error"
                                                ? "border-red-500 bg-red-50"
                                                : step.status === "pending"
                                                ? "border-purple-500 bg-purple-50"
                                                : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">{step.title}</div>
                                            <div>
                                                {step.status === "success" && (
                                                    <span className="text-green-600">✓</span>
                                                )}
                                                {step.status === "error" && (
                                                    <span className="text-red-600">✗</span>
                                                )}
                                                {step.status === "pending" && (
                                                    <span className="text-purple-600">⋯</span>
                                                )}
                                            </div>
                                        </div>
                                        {step.details && (
                                            <div className="text-sm text-gray-600 mt-2">
                                                {step.details}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Final Result */}
                    {finalResult && (
                        <div
                            className={`p-6 rounded-xl text-center border-2 ${
                                finalResult.success
                                    ? "bg-green-50 border-green-500"
                                    : "bg-red-50 border-red-500"
                            }`}
                        >
                            <h2
                                className={`text-2xl font-bold mb-4 ${
                                    finalResult.success ? "text-green-800" : "text-red-800"
                                }`}
                            >
                                {finalResult.success ? "✓ Success!" : "✗ Failed"}
                            </h2>
                            <p className="text-gray-700 mb-4">{finalResult.message}</p>
                            {finalResult.burnTxHash && (
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-semibold">Burn Tx: </span>
                                        <a
                                            href={`${CHAINS.arc.explorer}/tx/${finalResult.burnTxHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-600 hover:underline"
                                        >
                                            {finalResult.burnTxHash.slice(0, 10)}...
                                        </a>
                                    </div>
                                    {finalResult.mintTxHash && (
                                        <div>
                                            <span className="font-semibold">Mint Tx: </span>
                                            <a
                                                href={`${CHAINS[destChain].explorer}/tx/${finalResult.mintTxHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-600 hover:underline"
                                            >
                                                {finalResult.mintTxHash.slice(0, 10)}...
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
