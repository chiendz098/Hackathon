const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Prompt Enhancer endpoint
router.post('/', auth, async (req, res) => {
  const { prompt, context } = req.body;
  // TODO: Có thể tích hợp LLM (Gemini/GPT-4) hoặc rule-based để nâng cấp prompt
  try {
    // Demo: Gọi Gemini API để rewrite prompt (nếu có API key)
    if (config.GOOGLE_API_KEY) {
      const apiRes = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + config.GOOGLE_API_KEY,
        { contents: [{ parts: [{ text: `Rewrite and enrich this prompt for best AI understanding, add missing info if possible. User context: ${JSON.stringify(context)}. Prompt: ${prompt}` }] }] }
      );
      const enhanced = apiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
      return res.json({ enhancedPrompt: enhanced });
    }
    // Nếu không có Gemini, trả về prompt gốc (hoặc có thể tự động thêm context)
    let enhancedPrompt = prompt;
    if (context && context.name) enhancedPrompt = `[User: ${context.name}] ${prompt}`;
    res.json({ enhancedPrompt });
  } catch (err) {
    res.status(500).json({ message: 'Prompt enhancer error', error: err.message });
  }
});

module.exports = router; 