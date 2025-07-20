import express from 'express';
import Participant from '../models/Participant.js';

const router = express.Router();

// 챔피언별 승률 집계 API
router.get('/champion-winrates', async (req, res) => {
  try {
    const data = await Participant.aggregate([
      {
        $group: {
          _id: "$champion",
          wins: { $sum: { $cond: ["$win", 1, 0] } },
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

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching champion winrates");
  }
});

export default router;
