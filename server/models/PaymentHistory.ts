import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentHistory extends Document {
  userId: string;
  autoPaymentId?: string;
  recipient: string;
  amount: string;
  destinationChain: string;
  status: 'success' | 'failed' | 'pending';
  txHash?: string;
  errorMessage?: string;
  createdAt: Date;
}

const PaymentHistorySchema = new Schema<IPaymentHistory>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  autoPaymentId: {
    type: String,
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
  destinationChain: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending',
  },
  txHash: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IPaymentHistory>('PaymentHistory', PaymentHistorySchema);
