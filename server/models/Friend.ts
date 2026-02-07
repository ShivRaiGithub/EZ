import mongoose, { Document, Schema } from 'mongoose';

export interface IFriend extends Document {
  userId: string;
  friendAddress: string;
  friendName: string;
  status: 'pending' | 'accepted';
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema = new Schema<IFriend>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  friendAddress: {
    type: String,
    required: true,
  },
  friendName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'accepted',
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique friend per user
FriendSchema.index({ userId: 1, friendAddress: 1 }, { unique: true });

export default mongoose.model<IFriend>('Friend', FriendSchema);
