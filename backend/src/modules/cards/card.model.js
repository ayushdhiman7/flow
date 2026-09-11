import mongoose, { Document } from 'mongoose';

export interface ICard extends Document {
  list: mongoose.Types.ObjectId;
  board: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  position: number;
  assignees: mongoose.Types.ObjectId[];
  labels: string[];
  dueDate?: Date;
  startDate?: Date;
  isArchived: boolean;
  completedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

const cardSchema = new mongoose.Schema<ICard>({
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true, index: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  position: { type: Number, required: true, default: 0 },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  labels: [{ type: String, trim: true }],
  dueDate: { type: Date },
  startDate: { type: Date },
  isArchived: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
  }],
}, { timestamps: true });

cardSchema.index({ list: 1, position: 1 });
cardSchema.index({ board: 1, isArchived: 1 });
cardSchema.index({ assignees: 1 });
cardSchema.index({ dueDate: 1 });
cardSchema.index({ title: 'text', description: 'text' });

export const Card = mongoose.model<ICard>('Card', cardSchema);