import mongoose, { Document } from 'mongoose';

export interface IList extends Document {
  board: mongoose.Types.ObjectId;
  name: string;
  position: number;
  cards: mongoose.Types.ObjectId[];
  isArchived: boolean;
}

const listSchema = new mongoose.Schema<IList>({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  name: { type: String, required: true, trim: true },
  position: { type: Number, required: true, default: 0 },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

listSchema.index({ board: 1, position: 1 });

export const List = mongoose.model<IList>('List', listSchema);