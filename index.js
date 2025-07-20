// ✅ server/index.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import matchRoutes from './routes/matchRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

// ✅ 미들웨어
app.use(cors());
app.use(express.json());

// ✅ API 라우터 등록
app.use('/api/match', matchRoutes);
app.use('/api/ranking', rankingRoutes);

// ✅ 정적 파일 서비스 (클라이언트가 빌드된 경우)
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// ✅ MongoDB 연결
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB 연결 완료');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB 연결 실패', err);
  });
