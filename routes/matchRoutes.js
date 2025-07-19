// ✅ server/routes/matchRoutes.js

import express from 'express';
import Participant from '../models/Participant.js';

const router = express.Router();

// 평점 계산 함수
const calculateRating = (k, a, d) => {
  const kills = Number(k) || 0;
  const assists = Number(a) || 0;
  const deaths = Number(d);
  if (deaths === 0) return kills + assists;
  if (isNaN(deaths)) return null;
  return ((kills + assists) / deaths).toFixed(2);
};

// 도큐먼트 ID 생성 함수
const createId = (nickname, champion, matchDate, matchTag = '') => {
  const date = matchDate.replace(/[-:/ ]/g, '');
  const tag = matchTag.trim().replace(/[^a-zA-Z0-9가-힣]/g, '').slice(0, 20) || 'default';
  return `${nickname}_${champion}_${date}_${tag}`;
};

// 전적 저장
router.post('/save', async (req, res) => {
  const { matchDate, teamBlue, teamRed } = req.body;

  if (!matchDate || !teamBlue || !teamRed) {
    return res.status(400).json({ error: '데이터 형식이 올바르지 않습니다.' });
  }

  const allPlayers = [...teamBlue, ...teamRed];

  const saveResults = await Promise.allSettled(
    allPlayers.map(async (p) => {
      const _id = createId(p.nickname, p.champion, matchDate, p.matchTag);
       console.log('📌 저장 시도 중:', _id);
      
      const data = {
        _id,
        nickname: p.nickname,
        champion: p.champion,
        k: p.k,
        d: p.d,
        a: p.a,
        win: p.win,
        perfect: p.perfect,
        matchDate,
        matchTag: p.matchTag || "",
        rating: calculateRating(p.k, p.a, p.d),
      };

      return Participant.updateOne(
        { _id },
        { $set: data },
        { upsert: true }
      );
    })
  );

  const successCount = saveResults.filter(r => r.status === 'fulfilled').length;
  const failCount = saveResults.filter(r => r.status === 'rejected').length;

  res.status(201).json({
    message: `✅ 저장 완료: ${successCount}명`,
    failed: failCount
  });
});

// 닉네임으로 검색
router.get('/player/:nickname', async (req, res) => {
  try {
    const nickname = req.params.nickname;
    const records = await Participant.find({ nickname });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '조회 실패' });
  }
});

// rating 누락된 전적 일괄 수정
router.get('/fix-rating', async (req, res) => {
  try {
    const players = await Participant.find({ rating: { $exists: false } });

    const updates = players.map((p) => {
      const rating = calculateRating(p.k, p.a, p.d);
      return Participant.updateOne(
        { _id: p._id },
        { $set: { rating } }
      );
    });

    await Promise.all(updates);
    res.json({ message: `${players.length}개 전적의 평점 갱신 완료` });
  } catch (err) {
    res.status(500).json({ error: '갱신 실패' });
  }
});

export default router;
