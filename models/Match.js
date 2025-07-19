import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  nickname: String,
  champion: String,
  k: Number,
  d: Number,
  a: Number,
  win: Boolean,
  perfect: Boolean,
});

const matchSchema = new mongoose.Schema({
  matchDate: Date,
  teamBlue: [participantSchema],
  teamRed: [participantSchema],
});

export default mongoose.model('Match', matchSchema);
