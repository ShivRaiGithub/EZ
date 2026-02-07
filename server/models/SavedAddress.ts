import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedAddress extends Document {
  userId: string;
  address: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedAddressSchema = new Schema<ISavedAddress>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  address: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique address per user
SavedAddressSchema.index({ userId: 1, address: 1 }, { unique: true });

export default mongoose.model<ISavedAddress>('SavedAddress', SavedAddressSchema);
