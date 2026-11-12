import mongoose from 'mongoose';
import { ACTIONS } from '../constants.js';

// One row per security-relevant action. Reads of this collection are not
// written back here — otherwise opening the dashboard would flood the log.
const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    userName: { type: String, required: true },
    userRole: { type: String, default: null },
    action: { type: String, enum: ACTIONS, required: true, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String, default: null },
    ip: { type: String, default: 'unknown', index: true },
    userAgent: { type: String, default: '' },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: ['success', 'failed'], required: true, index: true },
    failureReason: { type: String, default: null },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export function publicAuditLog(doc) {
  return {
    id: doc._id,
    userId: doc.userId,
    userName: doc.userName,
    userRole: doc.userRole,
    action: doc.action,
    resourceType: doc.resourceType,
    resourceId: doc.resourceId,
    ip: doc.ip,
    userAgent: doc.userAgent,
    oldValue: doc.oldValue,
    newValue: doc.newValue,
    status: doc.status,
    failureReason: doc.failureReason,
    createdAt: doc.createdAt,
  };
}
