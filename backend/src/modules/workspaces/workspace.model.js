import mongoose from 'mongoose';
import { ROLES } from '../../utils/constants.js';

const workspaceMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
  joinedAt: { type: Date, default: Date.now },
});

const joinRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handledAt: { type: Date },
});

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [workspaceMemberSchema],
  joinRequests: [joinRequestSchema],
  settings: {
    isPublic: { type: Boolean, default: false },
    allowMemberInvite: { type: Boolean, default: true },
    defaultBoardVisibility: { type: String, enum: ['private', 'workspace'], default: 'private' },
  },
  avatar: { type: String },
}, { timestamps: true });

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ 'joinRequests.user': 1 });
workspaceSchema.index({ 'joinRequests.status': 1 });

export const Workspace = mongoose.model('Workspace', workspaceSchema);