import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../../utils/constants.js';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role: typeof ROLES[keyof typeof ROLES];
  workspaces: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastLoginAt?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  name: { type: String, required: true, trim: true },
  avatar: { type: String },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ email: 1 });
userSchema.index({ name: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);