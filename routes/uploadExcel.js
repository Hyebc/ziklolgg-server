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
  if (deaths === 0) return (kills + assists).toFixed(2);
  if (isNaN(deaths)) return null;
  return ((kills + assists) / deaths).toFixed(2);
};

// 중복되지 않는 _id 생성 함수
const generateUniqueId = async (baseId) => {
  let suffix = 0;
  let candidateId = baseId;
  while (await Participant.exists({ _id: candidateId })) {
    suffix += 1;
    candidateId = `${baseId}_${suffix}`;
  }
  return candidateId;
};

// 엑셀 업로드 전용 라우트
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const headerIndex = rows.findIndex(row => row.includes("대회명"));
    if (headerIndex === -1) {
      return res.status(400).json({ error: '유효한 전적 테이블을 찾을 수 없습니다.' });
    }

    const headers = rows[headerIndex];
    const dataRows = rows.slice(headerIndex + 1);

    const nickname = workbook.SheetNames[0] || '기본닉네임';

    const participants = [];

    for (const row of dataRows) {
      const rowObj = {};
      headers.forEach((key, i) => {
        rowObj[key] = row[i];
      });

      if (!rowObj['챔피언'] || !rowObj['대회명']) continue;

      const k = Number(rowObj['K']) || 0;
      const d = Number(rowObj['D']) || 0;
      const a = Number(rowObj['A']) || 0;

      const baseId = `${nickname}_${rowObj['챔피언']}_${rowObj['대회명'].replace(/[-:/ ]/g, '')}_${rowObj['분석자'] || '기본'}`;
      const _id = await generateUniqueId(baseId);

      participants.push({
        _id,
        nickname,
        champion: rowObj['챔피언'],
        k,
        d,
        a,
        win: rowObj['결과'] === '승',
        perfect: false,
        matchDate: rowObj['대회명'],
        matchTag: rowObj['대회명'] || '',
        rating: calculateRating(k, a, d),
      });
    }

    await Participant.insertMany(participants);

    res.status(200).json({ message: `✅ ${participants.length}개 전적 업로드 성공` });
  } catch (error) {
    res.status(500).json({ error: '업로드 실패', detail: error.message });
  }
});

export default router;