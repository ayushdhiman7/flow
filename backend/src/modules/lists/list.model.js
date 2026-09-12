import mongoose from 'mongoose';

const listSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  name: { type: String, required: true, trim: true },
  position: { type: Number, required: true, default: 0 },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

listSchema.index({ board: 1, position: 1 });

export const List = mongoose.model('List', listSchema);