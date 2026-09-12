import mongoose from 'mongoose';
import { CHANNEL_TYPES } from '../../utils/constants.js';

const channelSchema = new mongoose.Schema({
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

export const Channel = mongoose.model('Channel', channelSchema);