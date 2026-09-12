import mongoose from 'mongoose';
import { ROLES } from '../../utils/constants.js';

const workspaceMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
  joinedAt: { type: Date, default: Date.now },
});

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [workspaceMemberSchema],
  settings: {
    isPublic: { type: Boolean, default: false },
    allowMemberInvite: { type: Boolean, default: true },
    defaultBoardVisibility: { type: String, enum: ['private', 'workspace'], default: 'private' },
  },
  avatar: { type: String },
}, { timestamps: true });

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1 });

export const Workspace = mongoose.model('Workspace', workspaceSchema);