'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Loader2,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { savedAddressApi } from '@/lib/api';
import { useAccount } from 'wagmi';

interface SavedAddress {
  _id: string;
  address: string;
  name: string;
  createdAt: string;
}

export default function ContactsPage() {
  // Wagmi hooks
  const { address: userAddress, isConnected } = useAccount();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [newAddressAddress, setNewAddressAddress] = useState('');
  const [newAddressName, setNewAddressName] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddressName, setEditingAddressName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch data when user connects
  useEffect(() => {
    if (userAddress) {
      fetchSavedAddresses();
    }
  }, [userAddress]);

  const fetchSavedAddresses = async () => {
    if (!userAddress) return;
    
    try {
      const response = await savedAddressApi.getAll(userAddress);
      if (response.data.success) {
        setSavedAddresses(response.data.savedAddresses);
      }
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddressAddress || !newAddressName || !userAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await savedAddressApi.create({
        userId: userAddress,
        address: newAddressAddress,
        name: newAddressName,
      });
      
      if (response.data.success) {
        await fetchSavedAddresses();
        setNewAddressAddress('');
        setNewAddressName('');
        setSuccessMessage('Contact saved successfully!');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save contact');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAddress = async (id: string) => {
    if (!editingAddressName) return;
    
    try {
      await savedAddressApi.update(id, editingAddressName);
      await fetchSavedAddresses();
      setEditingAddressId(null);
      setEditingAddressName('');
      setSuccessMessage('Contact updated successfully!');
    } catch {
      setError('Failed to update contact');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await savedAddressApi.delete(id);
      await fetchSavedAddresses();
      setSuccessMessage('Contact removed successfully!');
    } catch {
      setError('Failed to delete contact');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        </div>
        <p className="text-gray-600">Save and manage frequently used addresses</p>
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
          <div className="bg-linear-to-r from-blue-600 to-cyan-600 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Your Address</p>
                <p className="font-mono text-sm">{userAddress}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm mb-1">Total Contacts</p>
                <p className="text-2xl font-bold">{savedAddresses.length}</p>
              </div>
            </div>
          </div>

          {/* Add New Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Contact</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={newAddressAddress}
                  onChange={(e) => setNewAddressAddress(e.target.value)}
                  placeholder="0x... or name.eth"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newAddressName}
                  onChange={(e) => setNewAddressName(e.target.value)}
                  placeholder="Alice, Bob, etc."
                  className="input-field w-full"
                />
              </div>
            </div>
            <button
              onClick={handleAddAddress}
              disabled={isLoading || !newAddressAddress || !newAddressName}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Save Contact
                </>
              )}
            </button>
          </div>

          {/* Contacts List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Your Contacts</h3>
            {savedAddresses.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No contacts saved yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedAddresses.map((addr) => (
                  <div key={addr._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingAddressId === addr._id ? (
                          <input
                            type="text"
                            value={editingAddressName}
                            onChange={(e) => setEditingAddressName(e.target.value)}
                            className="input-field mb-2"
                          />
                        ) : (
                          <p className="font-semibold text-gray-900 mb-1">{addr.name}</p>
                        )}
                        <p className="text-sm text-gray-600 font-mono">{addr.address}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Saved {new Date(addr.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {editingAddressId === addr._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateAddress(addr._id)}
                              className="text-green-600 hover:text-green-700 p-2"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingAddressId(null);
                                setEditingAddressName('');
                              }}
                              className="text-gray-600 hover:text-gray-700 p-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingAddressId(addr._id);
                                setEditingAddressName(addr.name);
                              }}
                              className="text-blue-600 hover:text-blue-700 p-2"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr._id)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
