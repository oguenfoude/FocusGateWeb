import mongoose, { Schema } from 'mongoose'

const BalanceHistorySchema = new Schema({
  _id: { type: Number, required: true },
  simCardId: { type: Number, default: null },
  modemId: { type: Number, default: null },
  userId: { type: Number, default: null },
  balance: { type: Number, required: true },
  previousBalance: { type: Number, default: null },
  source: { type: Number, required: true },
  recordedAt: { type: Date },
  updatedAt: { type: Date },
  archivedAt: { type: Date, default: null },
  machineId: { type: String, required: true }
}, { collection: 'balancehistories', timestamps: false })

BalanceHistorySchema.index({ archivedAt: 1, simCardId: 1, recordedAt: -1 })
BalanceHistorySchema.index({ archivedAt: 1, userId: 1, updatedAt: -1 })
BalanceHistorySchema.index({ archivedAt: 1, updatedAt: 1, source: 1 })

export const BalanceHistory = mongoose.models.BalanceHistory || mongoose.model('BalanceHistory', BalanceHistorySchema)
