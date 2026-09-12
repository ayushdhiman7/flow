import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../../utils/constants.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  name: { type: String, required: true, trim: true },
  avatar: { type: String },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  chatCode: { type: String, unique: true, sparse: true, index: true },
}, { timestamps: true });

function generateChatCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

userSchema.pre('save', async function (next) {
  if (!this.chatCode) {
    let code;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generateChatCode();
      exists = await mongoose.models.User.exists({ chatCode: code });
      attempts++;
    }
    this.chatCode = code;
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ name: 'text' });

export const User = mongoose.model('User', userSchema);