import mongoose, { Document } from 'mongoose';
import { ROLES } from '../../utils/constants.js';

export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: typeof ROLES[keyof typeof ROLES];
  joinedAt: Date;
}

export interface IWorkspace extends Document {
  name: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  settings: {
    isPublic: boolean;
    allowMemberInvite: boolean;
    defaultBoardVisibility: 'private' | 'workspace';
  };
  avatar?: string;
}

const workspaceMemberSchema = new mongoose.Schema<IWorkspaceMember>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
  joinedAt: { type: Date, default: Date.now },
});

const workspaceSchema = new mongoose.Schema<IWorkspace>({
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

export const Workspace = mongoose.model<IWorkspace>('Workspace', workspaceSchema);