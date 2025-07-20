import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  _id: String, // 예: 혼자놀아라_제라스_20250718
  nickname: String,
  champion: String,
  k: Number,
  d: Number,
  a: Number,
  win: Boolean,
  perfect: Boolean,
  matchTag: { type: String },
  matchDate: String // YYYY-MM-DD or YYYYMMDD
});

export default mongoose.model('Participant', participantSchema, 'participants');
