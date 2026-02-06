// app/api/relay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ethers, JsonRpcProvider } from "ethers";

const CHAINS = {
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

export async function POST(request: NextRequest) {
  try {
    const { destinationChain, attestation } = await request.json();

    // Validate inputs
    if (!destinationChain || !attestation) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const chainConfig = CHAINS[destinationChain as keyof typeof CHAINS];
    if (!chainConfig) {
      return NextResponse.json({ error: "Invalid chain" }, { status: 400 });
    }

    // Initialize relayer wallet
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      return NextResponse.json(
        { error: "Relayer not configured" },
        { status: 500 }
      );
    }

    const provider = new JsonRpcProvider(chainConfig.rpc);
    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider);

    console.log(`Relayer minting on ${chainConfig.name}...`);

    // Create contract instance
    const messageTransmitter = new ethers.Contract(
      chainConfig.messageTransmitter,
      MESSAGE_TRANSMITTER_ABI,
      relayerWallet
    );

    // Send mint transaction
    const mintTx = await messageTransmitter.receiveMessage(
      attestation.message,
      attestation.attestation,
      {
        gasLimit: 300000, // Set reasonable gas limit
      }
    );

    console.log(`Mint tx submitted: ${mintTx.hash}`);

    // Wait for confirmation
    const receipt = await mintTx.wait();

    console.log(`Mint tx confirmed in block ${receipt.blockNumber}`);

    return NextResponse.json({
      success: true,
      mintTxHash: mintTx.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${chainConfig.explorer}/tx/${mintTx.hash}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete mint";
    console.error("Relayer error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
