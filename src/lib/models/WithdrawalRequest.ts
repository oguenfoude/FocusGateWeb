import mongoose, { Schema } from 'mongoose'

const WithdrawalRequestSchema = new Schema({
  _id: { type: Number, required: true },
  userId: { type: Number, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  status: { type: Number, required: true },
  note: { type: String, default: null },
  adminNote: { type: String, default: null },
  processedByAdminId: { type: Number, default: null },
  requestedAt: { type: Date },
  processedAt: { type: Date },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  archivedAt: { type: Date, default: null },
  machineId: { type: String, default: '' }
}, { collection: 'withdrawalrequests', timestamps: false })

WithdrawalRequestSchema.index({ status: 1, archivedAt: 1 })
WithdrawalRequestSchema.index({ userId: 1, archivedAt: 1 })

export const WithdrawalRequest = mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', WithdrawalRequestSchema)
