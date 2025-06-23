import express from 'express';
import { getFinancialInsight } from '../services/deepseek-ai-service';

const router = express.Router();

router.post('/test-ai', async (req, res) => {
  try {
    const insight = await getFinancialInsight(req.body.prompt);
    res.json({ insight });
  } catch (error) {
    res.status(500).json({ error: "AI service unavailable" });
  }
});

export default router;