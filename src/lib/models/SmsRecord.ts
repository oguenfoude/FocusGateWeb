import mongoose, { Schema } from 'mongoose'

const SmsRecordSchema = new Schema({
  _id: { type: Number, required: true },
  simCardId: { type: Number, required: true },
  senderNumber: { type: String, default: '' },
  content: { type: String, default: '' },
  receivedAt: { type: Date },
  processedAt: { type: Date },
  machineId: { type: String, default: '' },
  updatedAt: { type: Date },
  archivedAt: { type: Date, default: null }
}, { collection: 'smsrecords', timestamps: false })

SmsRecordSchema.index({ archivedAt: 1, simCardId: 1, receivedAt: -1 })
SmsRecordSchema.index({ archivedAt: 1, updatedAt: 1 })

export const SmsRecord = mongoose.models.SmsRecord || mongoose.model('SmsRecord', SmsRecordSchema)
