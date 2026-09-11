import mongoose, { Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  revoked: boolean;
}

const sessionSchema = new mongoose.Schema<ISession>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshToken: { type: String, required: true, unique: true, index: true },
  userAgent: { type: String },
  ip: { type: String },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  revoked: { type: Boolean, default: false },
}, { timestamps: true });

sessionSchema.index({ userId: 1, revoked: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);