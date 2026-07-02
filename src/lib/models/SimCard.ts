import mongoose, { Schema } from 'mongoose'

const SimCardSchema = new Schema({
  _id: { type: Number, required: true },
  modemId: { type: Number, required: true },
  imsi: { type: String, required: true },
  phoneNumber: { type: Number },
  balance: { type: Number, default: 0 },
  verifiedAt: { type: Date },
  isActive: { type: Boolean, default: true },
  status: { type: Number, required: true },
  firstSeen: { type: Date },
  lastSeen: { type: Date },
  removedAt: { type: Date },
  replacedAt: { type: Date },
  machineId: { type: String, default: '' },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  archivedAt: { type: Date, default: null }
}, { collection: 'simcards', timestamps: false })

SimCardSchema.index({ modemId: 1, archivedAt: 1, isActive: 1 })
SimCardSchema.index({ archivedAt: 1, isActive: 1 })

export const SimCard = mongoose.models.SimCard || mongoose.model('SimCard', SimCardSchema)
