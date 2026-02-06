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
