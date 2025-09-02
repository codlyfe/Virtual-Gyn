const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/doctorAI');

router.post('/doctor-chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const reply = await getAIResponse(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

module.exports = router;