import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentRequest extends Document {
  from: string; // Who is requesting payment
  to: string; // Who should pay
  amount: string;
  message?: string;
  status: 'pending' | 'paid' | 'rejected';
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRequestSchema = new Schema<IPaymentRequest>({
  from: {
    type: String,
    required: true,
    index: true,
  },
  to: {
    type: String,
    required: true,
    index: true,
  },
  amount: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'rejected'],
    default: 'pending',
  },
  txHash: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IPaymentRequest>('PaymentRequest', PaymentRequestSchema);
