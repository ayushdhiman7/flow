import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  background: { type: String, default: '#6366f1' },
  visibility: { type: String, enum: ['private', 'workspace'], default: 'private' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

boardSchema.index({ workspace: 1, createdAt: -1 });
boardSchema.index({ members: 1 });

export const Board = mongoose.model('Board', boardSchema);