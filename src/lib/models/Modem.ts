import mongoose, { Schema } from 'mongoose'

const ModemSchema = new Schema({
  _id: { type: Number, required: true },
  imei: { type: String, required: true },
  comPort: { type: String },
  status: { type: Number, required: true },
  brand: { type: Number, required: true },
  manufacturer: { type: String },
  model: { type: String },
  machineId: { type: String, default: '' },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  archivedAt: { type: Date, default: null }
}, { collection: 'modems', timestamps: false })

ModemSchema.index({ archivedAt: 1 })
ModemSchema.index({ archivedAt: 1, status: 1, updatedAt: -1 })

export const Modem = mongoose.models.Modem || mongoose.model('Modem', ModemSchema)
