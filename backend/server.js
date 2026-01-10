/**
 * Express Server for Explanation Agent API
 * 
 * MVP implementation with stub fallback when no LLM key is available
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * Generate explanation using AI or stub
 */
async function generateExplanationWithAI(userMessage, videoContext, style) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    // Return stub response
    return generateStubResponse(userMessage, videoContext, style);
  }

  try {
    // For MVP: Use OpenAI API if key is available
    // You can switch to Anthropic, etc. by changing the API endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or 'gpt-3.5-turbo' for cheaper option
        messages: [
          {
            role: 'system',
            content: `You are a soccer analyst explaining tactics and plays. The user is watching a soccer video. 
            Current video time: ${videoContext?.currentTime || 0} seconds.
            Video source: ${videoContext?.provider || 'unknown'} (ID: ${videoContext?.videoId || 'N/A'})
            
            Style: ${style}
            - If style is "NFL analogies", use American football comparisons
            - If style is "Beginner friendly", explain in simple terms
            - If style is "Tactical", use technical soccer terminology
            
            Provide concise, insightful explanations. Include relevant tags like pressing, counter-attack, set-piece, etc.`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || 'Unable to generate explanation.';

    // Extract tags from response (simple keyword matching for MVP)
    const tags = extractTags(responseText);

    return {
      responseText,
      timestampUsed: videoContext?.currentTime || 0,
      tags: tags.length > 0 ? tags : undefined,
    };
  } catch (error) {
    console.error('AI API error:', error);
    // Fallback to stub
    return generateStubResponse(userMessage, videoContext, style);
  }
}

/**
 * Generate stub response when no API key is available
 */
function generateStubResponse(userMessage, videoContext, style) {
  const currentTime = videoContext?.currentTime || 0;
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const lowerMessage = userMessage.toLowerCase();
  const tags = [];

  if (lowerMessage.includes('press') || lowerMessage.includes('pressing')) {
    tags.push('pressing');
  }
  if (lowerMessage.includes('counter') || lowerMessage.includes('counter-attack')) {
    tags.push('counter');
  }
  if (lowerMessage.includes('set-piece') || lowerMessage.includes('corner') || lowerMessage.includes('free kick')) {
    tags.push('set-piece');
  }
  if (lowerMessage.includes('goal')) {
    tags.push('goal');
  }

  let responseText = '';

  if (style === 'NFL analogies') {
    responseText = `At ${minutes}:${seconds.toString().padStart(2, '0')}, we're seeing a tactical sequence. This is like a play call in football — the team has a plan, but the defense is reading it. The success depends on execution and timing.`;
  } else if (style === 'Beginner friendly') {
    responseText = `At ${minutes}:${seconds.toString().padStart(2, '0')}, the team with the ball is trying to create a scoring chance. They're passing, moving, and looking for gaps. The defense is trying to stay organized and prevent any clear chances.`;
  } else {
    responseText = `At ${minutes}:${seconds.toString().padStart(2, '0')}, we're analyzing the phase of play. The team in possession is in a build-up phase, looking to progress through the thirds.`;
  }

  return {
    responseText,
    timestampUsed: currentTime,
    tags: tags.length > 0 ? tags : undefined,
  };
}

/**
 * Extract tags from response text
 */
function extractTags(text) {
  const tagKeywords = {
    pressing: ['press', 'pressing', 'high press', 'counter-press'],
    counter: ['counter', 'counter-attack', 'transition', 'break'],
    'set-piece': ['set-piece', 'corner', 'free kick', 'throw-in'],
    goal: ['goal', 'score', 'finish'],
    defensive: ['defense', 'defensive', 'block', 'compact'],
  };

  const lowerText = text.toLowerCase();
  const foundTags = [];

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      foundTags.push(tag);
    }
  }

  return foundTags;
}

/**
 * POST /api/explain
 * Generate explanation for a video moment
 */
app.post('/api/explain', async (req, res) => {
  try {
    const { userMessage, videoContext, style } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const result = await generateExplanationWithAI(userMessage, videoContext, style);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/explain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API key available: ${!!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)}`);
});
