import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshToken: { type: String, required: true, unique: true, index: true },
  userAgent: { type: String },
  ip: { type: String },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  revoked: { type: Boolean, default: false },
}, { timestamps: true });

sessionSchema.index({ userId: 1, revoked: 1 });

export const Session = mongoose.model('Session', sessionSchema);