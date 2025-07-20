let cachedChampions = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 5;

import express from 'express';
import Participant from '../models/Participant.js'; // DB 모델

const router = express.Router();

// [1] 챔피언 목록 (필터용)
router.get('/champions', async (req, res) => {
  const now = Date.now();

  if (cachedChampions && now - lastCacheTime < CACHE_DURATION) {
    return res.json(cachedChampions);
  }

  try {
    const champions = await Participant.distinct('champion');
    const sorted = champions.sort();

    cachedChampions = sorted;
    lastCacheTime = now;

    res.json(sorted);
  } catch (err) {
    console.error('❌ 챔피언 목록 조회 실패:', err);
    res.status(500).send('챔피언 목록 조회 실패');
  }
});

// [2] 선택된 챔피언의 유저별 승률 집계
router.get('/winrate-by-user/:champion', async (req, res) => {
  const { champion } = req.params;
  try {
    const data = await Participant.aggregate([
      { $match: { champion } },
      {
        $group: {
          _id: "$nickname",
          wins: { $sum: { $cond: [{ $eq: ["$win", true] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          nickname: "$_id",
          winRate: { $multiply: [{ $divide: ["$wins", "$total"] }, 100] },
          games: "$total",
          _id: 0
        }
      },
      { $sort: { winRate: -1, games: -1 } }
    ]);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('챔피언별 유저 승률 조회 실패');
  }
});

// [3] 챔피언별 전체 승률
router.get('/champion-winrates', async (req, res) => {
  try {
    const result = await Participant.aggregate([
      {
        $group: {
          _id: "$champion",
          wins: { $sum: { $cond: [{ $eq: ["$win", true] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          champion: "$_id",
          winRate: { $multiply: [{ $divide: ["$wins", "$total"] }, 100] },
          games: "$total",
          _id: 0
        }
      },
      { $sort: { winRate: -1, games: -1 } }
    ]);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('챔피언 전체 승률 조회 실패');
  }
});

export default router;
