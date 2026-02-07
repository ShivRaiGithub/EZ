'use client';

import { useState, useEffect } from 'react';
import { 
  Send, 
  Inbox, 
  Trash2, 
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Wallet,
  Check,
  X
} from 'lucide-react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import { paymentRequestApi } from '@/lib/api';
import { CONTRACT_ADDRESSES, ARC_TESTNET_CONFIG } from '@/lib/config';
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi';
import { AddressInput } from '@/components/AddressInput';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

interface PaymentRequest {
  _id: string;
  from: string;
  to: string;
  amount: string;
  message?: string;
  status: 'pending' | 'paid' | 'rejected';
  txHash?: string;
  createdAt: string;
}

export default function RequestsPage() {
  // Wagmi hooks
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  const [tab, setTab] = useState<'received' | 'sent'>('received');
  
  // Payment Requests State
  const [sentRequests, setSentRequests] = useState<PaymentRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<PaymentRequest[]>([]);
  const [requestRecipientInput, setRequestRecipientInput] = useState('');
  const [requestRecipient, setRequestRecipient] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Switch to Arc Testnet
  const switchToArcTestnet = async () => {
    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: ARC_TESTNET_CONFIG.chainId });
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  };

  // Handle resolved address from AddressInput
  const handleResolvedAddress = (address: string | null) => {
    setRequestRecipient(address || '');
  };

  // Fetch data when user connects
  useEffect(() => {
    if (userAddress) {
      fetchPaymentRequests();
    }
  }, [userAddress]);

  // ========== PAYMENT REQUESTS ==========

  const fetchPaymentRequests = async () => {
    if (!userAddress) return;
    
    try {
      const [sentRes, receivedRes] = await Promise.all([
        paymentRequestApi.getSent(userAddress),
        paymentRequestApi.getReceived(userAddress),
      ]);
      
      if (sentRes.data.success) {
        setSentRequests(sentRes.data.requests);
      }
      if (receivedRes.data.success) {
        setReceivedRequests(receivedRes.data.requests);
      }
    } catch {
      console.error('Error fetching payment requests:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestRecipient || !requestAmount || !userAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await paymentRequestApi.create({
        from: userAddress,
        to: requestRecipient,
        amount: requestAmount,
        message: requestMessage,
      });
      
      if (response.data.success) {
        await fetchPaymentRequests();
        setRequestRecipientInput('');
        setRequestRecipient('');
        setRequestAmount('');
        setRequestMessage('');
        setSuccessMessage('Payment request sent!');
        setTab('sent');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayRequest = async (request: PaymentRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!walletClient) throw new Error("Wallet not connected");

      const web3Provider = new BrowserProvider(walletClient as any);
      const signer = await web3Provider.getSigner();

      const usdcContract = new Contract(
        CONTRACT_ADDRESSES.ARC_TESTNET.USDC,
        ERC20_ABI,
        signer
      );

      const amountInSubunits = parseUnits(request.amount, 6);
      
      const tx = await usdcContract.transfer(request.from, amountInSubunits);
      await tx.wait();

      // Update request status
      await paymentRequestApi.updateStatus(request._id, 'paid', tx.hash);
      await fetchPaymentRequests();
      
      setSuccessMessage('Payment sent successfully!');
    } catch (error: any) {
      console.error('Error paying request:', error);
      setError(error.message || 'Failed to send payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await paymentRequestApi.updateStatus(id, 'rejected');
      await fetchPaymentRequests();
      setSuccessMessage('Request rejected');
    } catch {
      setError('Failed to reject request');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await paymentRequestApi.delete(id);
      await fetchPaymentRequests();
      setSuccessMessage('Request deleted');
    } catch {
      setError('Failed to delete request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Send className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Requests</h1>
        </div>
        <p className="text-gray-600">Send and receive payment requests on Arc Testnet</p>
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
      {!isConnected && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Connect your wallet to get started</p>
          <p className="text-sm text-gray-400">Use the &quot;Connect Wallet&quot; button in the top right corner</p>
        </div>
      )}

      {/* Main Content */}
      {isConnected && userAddress && (
        <>
          {/* User Info Card */}
          <div className="bg-linear-to-r from-purple-600 to-pink-600 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Your Address</p>
                <p className="font-mono text-sm">{userAddress}</p>
              </div>
              <div className="text-right">
                <p className="text-purple-100 text-sm mb-1">Network</p>
                <p className="text-sm font-semibold">Arc Testnet</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
            <button
              onClick={() => setTab('received')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'received' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Requests
            </button>
            <button
              onClick={() => setTab('sent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'sent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send className="w-4 h-4" />
              Requested
            </button>
          </div>

          {/* Received Requests Tab */}
          {tab === 'received' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Incoming Payment Requests</h3>
                {receivedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No payment requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedRequests.map((request) => (
                      <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900">{request.amount} USDC</p>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-gray-600 font-mono mb-1">From: {request.from}</p>
                            {request.message && (
                              <p className="text-sm text-gray-500 italic">{request.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(request.createdAt).toLocaleString()}
                            </p>
                            {request.txHash && (
                              <a
                                href={`${ARC_TESTNET_CONFIG.explorer}/tx/${request.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                View Transaction <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePayRequest(request)}
                                disabled={isLoading}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Pay
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request._id)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium flex items-center gap-1"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sent Requests Tab */}
          {tab === 'sent' && (
            <div className="space-y-4">
              {/* Create New Request */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Request Payment</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <AddressInput
                      value={requestRecipientInput}
                      onChange={setRequestRecipientInput}
                      onResolvedAddress={handleResolvedAddress}
                      userAddress={userAddress}
                      placeholder="0x... or name.eth or contact name"
                      label="From (Address or ENS)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (USDC)
                    </label>
                    <input
                      type="number"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="0.00"
                      className="input-field w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message (Optional)
                    </label>
                    <input
                      type="text"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="What's this for?"
                      className="input-field w-full"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateRequest}
                  disabled={isLoading || !requestRecipient || !requestAmount}
                  className="w-full btn-primary py-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 inline mr-2" />
                      Send Request
                    </>
                  )}
                </button>
              </div>

              {/* Sent Requests List */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Your Requests</h3>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No requests sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900">{request.amount} USDC</p>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-gray-600 font-mono mb-1">To: {request.to}</p>
                            {request.message && (
                              <p className="text-sm text-gray-500 italic">{request.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(request.createdAt).toLocaleString()}
                            </p>
                            {request.txHash && (
                              <a
                                href={`${ARC_TESTNET_CONFIG.explorer}/tx/${request.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                View Transaction <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleDeleteRequest(request._id)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
