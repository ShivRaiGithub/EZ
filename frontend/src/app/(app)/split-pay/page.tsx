'use client';

import { useState, useEffect } from 'react';
import { BrowserProvider, ethers } from 'ethers';
import { Users, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { api, paymentHistoryApi, paymentRequestApi } from '@/lib/api';
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';

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

export default function SplitPayPage() {
  // Wagmi hooks
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const sourceChain: ChainKey = "arc"; // Always Arc as source
  const [destChain, setDestChain] = useState<ChainKey>("sepolia");
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [splitUsers, setSplitUsers] = useState<string[]>([]);
  const [newSplitUser, setNewSplitUser] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [finalResult, setFinalResult] = useState<{
    success: boolean;
    message: string;
    burnTxHash?: string;
    mintTxHash?: string;
    splitAmount?: string;
    requestsSent?: number;
  } | null>(null);

  // Update signer when wallet client changes
  useEffect(() => {
    if (walletClient) {
      const provider = new BrowserProvider(walletClient);
      provider.getSigner().then(setSigner);
    } else {
      setSigner(null);
    }
  }, [walletClient]);

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

  // Switch network using wagmi
  const switchNetwork = async (chainId: number) => {
    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId });
        addLog("Network Switched", "success");
      }
    } catch (error) {
      addLog("Failed to switch network", "error");
      throw error;
    }
  };

  // Add split user
  const handleAddSplitUser = () => {
    if (!newSplitUser) return;
    
    if (!ethers.isAddress(newSplitUser)) {
      alert("Invalid Ethereum address!");
      return;
    }
    
    if (splitUsers.includes(newSplitUser)) {
      alert("This address is already in the split list!");
      return;
    }
    
    if (newSplitUser.toLowerCase() === userAddress?.toLowerCase()) {
      alert("You are automatically included in the split!");
      return;
    }
    
    setSplitUsers([...splitUsers, newSplitUser]);
    setNewSplitUser("");
  };

  // Remove split user
  const handleRemoveSplitUser = (address: string) => {
    setSplitUsers(splitUsers.filter(u => u !== address));
  };

  // Calculate split amount
  const calculateSplitAmount = () => {
    if (!totalAmount || !userAddress) return "0";
    const totalPeople = splitUsers.length + 1; // +1 for the payer
    const amount = parseFloat(totalAmount) / totalPeople;
    return amount.toFixed(6);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mint failed";
      addLog(`Mint Failed: ${message}`, "error");
      throw new Error(message);
    }
  };

  // Main split payment execution
  const executeSplitPayment = async () => {
    if (!signer || !isConnected || !userAddress) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      alert("Invalid recipient address!");
      return;
    }

    if (parseFloat(totalAmount) <= 0) {
      alert("Invalid amount!");
      return;
    }

    if (splitUsers.length === 0) {
      alert("Please add at least one person to split with!");
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setSteps([]);
    setFinalResult(null);

    try {
      const sourceConfig = CHAINS[sourceChain];
      const destConfig = CHAINS[destChain];
      const amountInSubunits = ethers.parseUnits(totalAmount, 6);
      const splitAmount = calculateSplitAmount();

      addLog("Starting Split Payment", "info");

      // Step 1: Switch to Arc
      updateStep("switch-network", "Switch to Arc Network", "pending");
      addLog("Switching Network...");
      await switchNetwork(sourceConfig.chainId);
      updateStep(
        "switch-network",
        "Switch to Arc Network",
        "success",
        `Connected to ${sourceConfig.name}`
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!walletClient) {
        throw new Error("Wallet client not available");
      }
      const provider = new BrowserProvider(walletClient);
      const newSigner = await provider.getSigner();

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

      // Step 3: Burn USDC
      updateStep("burn", "Send Payment to Recipient", "pending");
      addLog("Burning USDC...");

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
        "Send Payment to Recipient",
        "pending",
        `Tx: ${burnTx.hash}`
      );

      addLog("Confirming...");
      await burnTx.wait();

      addLog("Payment Sent", "success");
      updateStep(
        "burn",
        "Send Payment to Recipient",
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

      // Step 6: Send payment requests to split users
      updateStep("requests", "Sending Split Payment Requests", "pending");
      addLog("Sending payment requests...");

      let requestsSent = 0;
      for (const splitUser of splitUsers) {
        try {
          await paymentRequestApi.create({
            from: userAddress,
            to: splitUser,
            amount: splitAmount,
            message: description || `Split payment for ${totalAmount} USDC to ${recipientAddress.slice(0, 6)}...`,
          });
          requestsSent++;
          addLog(`Request sent to ${splitUser.slice(0, 6)}...`, "success");
        } catch {
          addLog(`Failed to send request to ${splitUser.slice(0, 6)}...`, "warning");
        }
      }

      updateStep(
        "requests",
        "Sending Split Payment Requests",
        "success",
        `Sent ${requestsSent} of ${splitUsers.length} requests`
      );

      // Step 7: Complete
      updateStep("complete", "Split Payment Complete", "success");
      addLog("Success!", "success");

      // Store transaction in database
      try {
        await paymentHistoryApi.createCrossChain({
          userId: userAddress,
          recipient: recipientAddress,
          amount: totalAmount,
          sourceChain: sourceChain,
          destinationChain: destChain,
          burnTxHash: burnTx.hash,
          mintTxHash: mintTxHash,
          status: 'success',
        });
      } catch (error) {
        console.error('Failed to store transaction in database:', error);
      }

      setFinalResult({
        success: true,
        message: `Successfully sent ${totalAmount} USDC to ${recipientAddress}`,
        burnTxHash: burnTx.hash,
        mintTxHash: mintTxHash,
        splitAmount: splitAmount,
        requestsSent: requestsSent,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("Split Payment Failed", "error");
      console.error(error);

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

  const totalPeople = splitUsers.length + 1;
  const splitAmountPreview = calculateSplitAmount();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Split Pay</h1>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            Arc Testnet
          </span>
        </div>
        <p className="text-gray-600">Pay someone and split the cost with friends</p>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 mb-1">How Split Pay Works</p>
            <p className="text-sm text-blue-700">
              1. You pay the full amount to the recipient on their chosen chain<br />
              2. Payment requests are automatically sent to split users for their share<br />
              3. Split users pay you back on Arc Testnet
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      {!isConnected && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Connect your wallet to start split payments</p>
            <p className="text-sm text-gray-500">Use the &quot;Connect Wallet&quot; button in the top right corner</p>
          </div>
        </div>
      )}

      {isConnected && userAddress && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600 mb-1">Connected Wallet</div>
              <div className="font-mono bg-gray-50 px-4 py-2 rounded-lg text-sm">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {isConnected && userAddress && (
        <div className="space-y-6 mb-8">
          {/* Recipient & Amount */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Payment Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Amount (USDC)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this for?"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* Destination Chain */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Destination Chain (where recipient receives)
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
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold">{CHAINS[key].name}</div>
                  </button>
                ))}
            </div>
          </div>

          {/* Split Users */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Split With</h3>
            
            {/* Add User Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSplitUser}
                onChange={(e) => setNewSplitUser(e.target.value)}
                placeholder="0x... (friend's address)"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                disabled={isProcessing}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSplitUser()}
              />
              <button
                onClick={handleAddSplitUser}
                disabled={isProcessing || !newSplitUser}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Split Users List */}
            {splitUsers.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">
                  {totalPeople} people total (including you)
                </div>
                {splitUsers.map((user) => (
                  <div key={user} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                    <span className="font-mono text-sm">{user}</span>
                    <button
                      onClick={() => handleRemoveSplitUser(user)}
                      disabled={isProcessing}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Add people to split the payment with</p>
              </div>
            )}
          </div>

          {/* Split Summary */}
          {splitUsers.length > 0 && totalAmount && (
            <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
              <h3 className="font-semibold mb-3 text-green-900">Split Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Total Amount:</span>
                  <span className="font-semibold text-green-900">{totalAmount} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Split Between:</span>
                  <span className="font-semibold text-green-900">{totalPeople} people</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-green-700">Each Person Pays:</span>
                  <span className="font-bold text-lg text-green-900">{splitAmountPreview} USDC</span>
                </div>
                <p className="text-xs text-green-600 mt-3">
                  You&apos;ll pay {totalAmount} USDC now and receive {(parseFloat(totalAmount) - parseFloat(splitAmountPreview)).toFixed(6)} USDC back from split requests
                </p>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={executeSplitPayment}
            disabled={isProcessing || splitUsers.length === 0 || !totalAmount || !recipientAddress}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
              isProcessing || splitUsers.length === 0 || !totalAmount || !recipientAddress
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-linear-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:-translate-y-1"
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </span>
            ) : (
              "Pay & Send Split Requests"
            )}
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
                        ? "border-green-500 bg-green-50"
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
                          <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
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
              
              {finalResult.success && finalResult.splitAmount && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Split Details:</p>
                  <p className="text-lg font-bold text-green-600">
                    {finalResult.splitAmount} USDC per person
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {finalResult.requestsSent} payment requests sent
                  </p>
                </div>
              )}
              
              {finalResult.burnTxHash && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Burn Tx: </span>
                    <a
                      href={`${CHAINS.arc.explorer}/tx/${finalResult.burnTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
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
                        className="text-green-600 hover:underline"
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
