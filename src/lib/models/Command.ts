import mongoose, { Schema } from 'mongoose'

const CommandSchema = new Schema({
  machineId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
  errorAt: { type: Date, default: null },
  errorMessage: { type: String, default: null },
}, { collection: 'commands', timestamps: false })

CommandSchema.index({ machineId: 1, processedAt: 1 })

export const Command = mongoose.models.Command || mongoose.model('Command', CommandSchema)
