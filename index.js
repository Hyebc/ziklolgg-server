// ✅ server/index.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import matchRoutes from './routes/matchRoutes.js';
import uploadExcelRoute from './routes/uploadExcel.js';
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

// ✅ 1. API 라우팅 먼저 등록
app.use('/api/match', matchRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/matches', uploadExcelRoute);


// ✅ 2. 그다음 클라이언트 build 정적 파일 제공
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

// ✅ 3. 마지막 catch-all fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next(); // → API 요청은 패스하고 다음 미들웨어로
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
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
