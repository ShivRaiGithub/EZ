import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export  const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout for long-running requests
});

export const autopaymentApi = {
  // Create a new autopayment
  create: (data: {
    userId: string;
    walletAddress: string;
    recipient: string;
    amount: string;
    frequency: string;
    destinationChain: string;
  }) => {
    return axios.post(`${API_BASE_URL}/api/autopayments`, data);
  },

  // Get all autopayments for a user
  getAll: (userId: string) => {
    return axios.get(`${API_BASE_URL}/api/autopayments/${userId}`);
  },

  // Update autopayment status
  updateStatus: (id: string, status: 'active' | 'paused') => {
    return axios.patch(`${API_BASE_URL}/api/autopayments/${id}/status`, { status });
  },

  // Delete autopayment
  delete: (id: string) => {
    return axios.delete(`${API_BASE_URL}/api/autopayments/${id}`);
  },

  // Get payment history
  getHistory: (userId: string) => {
    return axios.get(`${API_BASE_URL}/api/payment-history/${userId}`);
  },
};

export const relayerApi = {
  // Get relayer info
  getInfo: () => {
    return axios.get(`${API_BASE_URL}/api/relayer-info`);
  },

  // Health check
  health: () => {
    return axios.get(`${API_BASE_URL}/health`);
  },
};

export const savedAddressApi = {
  // Create a saved address
  create: (data: {
    userId: string;
    address: string;
    name: string;
  }) => {
    return axios.post(`${API_BASE_URL}/api/saved-addresses`, data);
  },

  // Get all saved addresses for a user
  getAll: (userId: string) => {
    return axios.get(`${API_BASE_URL}/api/saved-addresses/${userId}`);
  },

  // Update saved address name
  update: (id: string, name: string) => {
    return axios.patch(`${API_BASE_URL}/api/saved-addresses/${id}`, { name });
  },

  // Delete saved address
  delete: (id: string) => {
    return axios.delete(`${API_BASE_URL}/api/saved-addresses/${id}`);
  },
};

export const paymentRequestApi = {
  // Create a payment request
  create: (data: {
    from: string;
    to: string;
    amount: string;
    message?: string;
  }) => {
    return axios.post(`${API_BASE_URL}/api/payment-requests`, data);
  },

  // Get sent payment requests (requested tab)
  getSent: (userId: string) => {
    return axios.get(`${API_BASE_URL}/api/payment-requests/sent/${userId}`);
  },

  // Get received payment requests (requests tab)
  getReceived: (userId: string) => {
    return axios.get(`${API_BASE_URL}/api/payment-requests/received/${userId}`);
  },

  // Update payment request status
  updateStatus: (id: string, status: 'pending' | 'paid' | 'rejected', txHash?: string) => {
    return axios.patch(`${API_BASE_URL}/api/payment-requests/${id}/status`, { status, txHash });
  },

  // Delete payment request
  delete: (id: string) => {
    return axios.delete(`${API_BASE_URL}/api/payment-requests/${id}`);
  },
};

export const friendApi = {
  // Add a friend
  create: (data: {
    userId: string;
    friendAddress: string;
    friendName: string;
  }) => {
    return axios.post(`${API_BASE_URL}/api/friends`, data);
  },

  // Get all friends for a user
  getAll: (userId: string) => {
    return axios.get(`${API_BASE_URL}/api/friends/${userId}`);
  },

  // Update friend name
  update: (id: string, friendName: string) => {
    return axios.patch(`${API_BASE_URL}/api/friends/${id}`, { friendName });
  },

  // Delete friend
  delete: (id: string) => {
    return axios.delete(`${API_BASE_URL}/api/friends/${id}`);
  },
};
