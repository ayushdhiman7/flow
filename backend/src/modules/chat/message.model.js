import mongoose, { Document } from 'mongoose';

export interface IMessage extends Document {
  channel: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  replyTo?: mongoose.Types.ObjectId;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  editedAt?: Date;
  isDeleted: boolean;
}

const messageSchema = new mongoose.Schema<IMessage>({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
  }],
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ user: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);