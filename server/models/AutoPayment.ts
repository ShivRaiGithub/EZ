import mongoose, { Document, Schema } from 'mongoose';

export interface IAutoPayment extends Document {
  userId: string;
  walletAddress: string; // User's AutoPayWallet contract address
  recipient: string;
  amount: string;
  frequency: 'minute' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  destinationChain: string;
  status: 'active' | 'paused';
  nextPayment: Date;
  lastPayment?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AutoPaymentSchema = new Schema<IAutoPayment>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  walletAddress: {
    type: String,
    required: true,
    index: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    enum: ['minute', 'daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  destinationChain: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused'],
    default: 'active',
  },
  nextPayment: {
    type: Date,
    required: true,
  },
  lastPayment: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for finding payments that need to be executed
AutoPaymentSchema.index({ nextPayment: 1, status: 1 });

// Index for finding payments by wallet address
AutoPaymentSchema.index({ walletAddress: 1 });

export default mongoose.model<IAutoPayment>('AutoPayment', AutoPaymentSchema);
