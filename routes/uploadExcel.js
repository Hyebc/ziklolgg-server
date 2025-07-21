// ✅ server/routes/uploadExcel.js

import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import Participant from '../models/Participant.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// 평점 계산 함수
const calculateRating = (k, a, d) => {
  const kills = Number(k) || 0;
  const assists = Number(a) || 0;
  const deaths = Number(d);
  if (deaths === 0) return kills + assists;
  if (isNaN(deaths)) return null;
  return ((kills + assists) / deaths).toFixed(2);
};

// 엑셀 업로드 전용 라우트
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const nickname = req.body.nickname || '기본닉네임'; // 프론트에서 nickname 전달 또는 기본값

    const participants = rows.map(row => ({
      nickname,
      champion: row['챔피언'],
      k: Number(row['K']) || 0,
      d: Number(row['D']) || 0,
      a: Number(row['A']) || 0,
      win: row['결과'] === '승',
      perfect: false,
      matchDate: row['대회명'],
      matchTag: row['분석자'] || '',
      rating: calculateRating(row['K'], row['A'], row['D']),
    }));

    await Participant.insertMany(participants); // _id 자동 생성됨

    res.status(200).json({ message: `✅ ${participants.length}개 전적 업로드 성공` });
  } catch (error) {
    res.status(500).json({ error: '업로드 실패', detail: error.message });
  }
});

export default router;
