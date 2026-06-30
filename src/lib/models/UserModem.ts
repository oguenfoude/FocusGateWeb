import mongoose, { Schema } from 'mongoose'

const UserModemSchema = new Schema({
  _id: { type: Number, required: true },
  userId: { type: Number, required: true },
  modemId: { type: Number, required: true },
  assignedAt: { type: Date },
  removedAt: { type: Date },
  machineId: { type: String, required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  archivedAt: { type: Date, default: null }
}, { collection: 'usermodems', timestamps: false })

UserModemSchema.index({ removedAt: 1, archivedAt: 1, userId: 1 })
UserModemSchema.index({ removedAt: 1, archivedAt: 1, modemId: 1 })

export const UserModem = mongoose.models.UserModem || mongoose.model('UserModem', UserModemSchema)
