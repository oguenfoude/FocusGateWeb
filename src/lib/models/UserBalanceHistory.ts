import mongoose, { Schema } from 'mongoose'

const UserBalanceHistorySchema = new Schema({
  _id: { type: Number, required: true },
  userId: { type: Number, required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  type: { type: Number, required: true },
  simCardId: { type: Number, default: null },
  note: { type: String, default: null },
  recordedAt: { type: Date },
  updatedAt: { type: Date },
  archivedAt: { type: Date, default: null },
  machineId: { type: String, required: true }
}, { collection: 'userbalancehistories', timestamps: false })

UserBalanceHistorySchema.index({ userId: 1, archivedAt: 1, updatedAt: -1 })

export const UserBalanceHistory = mongoose.models.UserBalanceHistory || mongoose.model('UserBalanceHistory', UserBalanceHistorySchema)
