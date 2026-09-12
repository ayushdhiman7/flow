import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  resource: { type: String, required: true, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, index: true },
  ip: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);