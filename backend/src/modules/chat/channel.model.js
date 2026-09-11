import mongoose, { Document } from 'mongoose';
import { CHANNEL_TYPES } from '../../utils/constants.js';

export interface IChannel extends Document {
  workspace: mongoose.Types.ObjectId;
  name?: string;
  type: typeof CHANNEL_TYPES[keyof typeof CHANNEL_TYPES];
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  isArchived: boolean;
  lastMessageAt?: Date;
}

const channelSchema = new mongoose.Schema<IChannel>({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, trim: true },
  type: { type: String, enum: Object.values(CHANNEL_TYPES), required: true, default: CHANNEL_TYPES.CHANNEL },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isArchived: { type: Boolean, default: false },
  lastMessageAt: { type: Date },
}, { timestamps: true });

channelSchema.index({ workspace: 1, type: 1 });
channelSchema.index({ members: 1 });

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);