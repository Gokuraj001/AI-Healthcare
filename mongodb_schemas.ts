/**
 * MindCare AI - Mongoose Models (Requested)
 * Note: The active application uses Firestore for real-time capabilities in the AI Studio environment.
 * These models are provided for scalability and local MongoDB development.
 */

/*
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  photoURL: String,
  joinedAt: { type: Date, default: Date.now },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' }
});

const LogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  mood: { type: String, enum: ['happy', 'neutral', 'sad', 'anxious', 'angry'], required: true },
  energy: { type: Number, min: 1, max: 10 },
  sleepHours: Number,
  journalEntry: String,
  sentiment: {
    score: Number,
    label: String,
    emotions: [String],
    riskDetected: Boolean
  },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  authorId: { type: String, required: true },
  authorName: String,
  isAnonymous: { type: Boolean, default: false },
  title: String,
  content: { type: String, required: true },
  likesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export const Log = mongoose.model('Log', LogSchema);
export const Post = mongoose.model('Post', PostSchema);
*/
