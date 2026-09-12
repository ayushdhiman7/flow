import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, default: '', maxlength: 10000 },
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  tags: [{ type: String, trim: true }],
}, { timestamps: true });

noteSchema.index({ workspace: 1, createdAt: -1 });
noteSchema.index({ title: 'text', content: 'text' });

export const Note = mongoose.model('Note', noteSchema);
