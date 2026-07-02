import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema({
  _id: { type: Number, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  displayName: { type: String },
  role: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  balance: { type: Number, default: 0 },
  machineId: { type: String, default: '' },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  archivedAt: { type: Date, default: null }
}, { collection: 'users', timestamps: false })

UserSchema.index({ archivedAt: 1, role: 1 })
UserSchema.index({ username: 1, password: 1 })

export const User = mongoose.models.User || mongoose.model('User', UserSchema)
