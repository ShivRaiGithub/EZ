import { api } from './api';

export interface TransactionHistoryItem {
  _id: string;
  userId: string;
  autoPaymentId?: string;
  recipient: string;
  amount: string;
  destinationChain: string;
  status: 'success' | 'failed' | 'pending';
  createdAt: string;
  txHash?: string;
  errorMessage?: string;
}

export interface FormattedTransaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  token: string;
  from: string;
  to: string;
  chain: string;
  date: string;
  status: 'success' | 'failed' | 'pending';
  txHash: string;
  isAutoPay: boolean;
}

// Fetch all transaction history for a user
export const fetchUserTransactions = async (
  userAddress: string
): Promise<FormattedTransaction[]> => {
  try {
    // Fetch autopay history
    const autopayResponse = await api.get(`/api/payment-history/${userAddress}`);
    const autopayHistory: TransactionHistoryItem[] = autopayResponse.data.history || [];

    // Format autopay transactions
    const formattedTransactions: FormattedTransaction[] = autopayHistory.map((tx) => ({
      id: tx._id,
      type: 'send', // Autopayments are always sends
      amount: tx.amount,
      token: 'USDC',
      from: userAddress,
      to: tx.recipient,
      chain: tx.destinationChain,
      date: new Date(tx.createdAt).toISOString().split('T')[0],
      status: tx.status,
      txHash: tx.txHash || '',
      isAutoPay: true,
    }));

    // Sort by date (most recent first)
    formattedTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return formattedTransactions;
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return [];
  }
};

// Fetch transactions from block explorer APIs (optional enhancement)
export const fetchBlockExplorerTransactions = async (
  address: string,
  chainKey: string
): Promise<FormattedTransaction[]> => {
  // This is a placeholder for block explorer API integration
  // You can implement this using:
  // - Etherscan API
  // - Alchemy API
  // - Moralis API
  // - The Graph
  
  try {
    // Example: Etherscan API call
    // const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
    // const response = await fetch(
    //   `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${apiKey}`
    // );
    // const data = await response.json();
    // return formatEtherscanTransactions(data.result);
    
    return [];
  } catch (error) {
    console.error('Error fetching from block explorer:', error);
    return [];
  }
};

// Get explorer URL for a transaction
export const getExplorerUrl = (chain: string, txHash: string): string => {
  const explorers: Record<string, string> = {
    'sepolia': 'https://sepolia.etherscan.io',
    'arbitrumSepolia': 'https://sepolia.arbiscan.io',
    'optimismSepolia': 'https://sepolia-optimism.etherscan.io',
    'baseSepolia': 'https://sepolia.basescan.org',
    'polygonAmoy': 'https://amoy.polygonscan.com',
    'arc': 'https://testnet.arcscan.app',
  };
  
  return `${explorers[chain] || explorers.sepolia}/tx/${txHash}`;
};