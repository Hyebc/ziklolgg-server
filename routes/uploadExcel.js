// ✅ server/routes/uploadExcel.js

import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import Participant from '../models/Participant.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const calculateRating = (k, a, d) => {
  const kills = Number(k) || 0;
  const assists = Number(a) || 0;
  const deaths = Number(d);
  if (deaths === 0) return (kills + assists).toFixed(2);
  if (isNaN(deaths)) return null;
  return ((kills + assists) / deaths).toFixed(2);
};

router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const headerIndex = raw.findIndex(row => row.includes("대회명"));
    if (headerIndex === -1) return res.status(400).json({ error: '헤더를 찾을 수 없습니다.' });

    const headers = raw[headerIndex];
    const dataRows = raw.slice(headerIndex + 1);
    const nickname = req.body.nickname || workbook.SheetNames[0] || '기본닉네임';

    const participants = dataRows
      .map(row => {
        const obj = {};
        headers.forEach((key, idx) => {
          obj[key] = row[idx];
        });

        if (!obj['챔피언']) return null;

        const k = Number(obj['K']).toFixed(2);
        const d = Number(obj['D']).toFixed(2);
        const a = Number(obj['A']).toFixed(2);

        return {
          nickname,
          champion: obj['챔피언'],
          k,
          d,
          a,
          win: obj['결과'] === '승',
          perfect: false,
          matchDate: obj['대회명'],
          matchTag: obj['분석자'] || '',
          rating: calculateRating(k, a, d),
        };
      })
      .filter(p => p !== null);

    await Participant.insertMany(participants);
    res.status(200).json({ message: `✅ ${participants.length}개 전적 업로드 성공` });
  } catch (error) {
    res.status(500).json({ error: '업로드 실패', detail: error.message });
  }
});

export default router;
