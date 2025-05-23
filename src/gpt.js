import OpenAI from 'openai';
import { HttpError } from 'wasp/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = "You are a professional translator specializing in Islamic religious texts. Your task is to translate Turkish texts written by Fethullah Gülen (Hocaefendi) into Kazakh. Translate the text faithfully, preserving the spiritual tone, theological accuracy, and sentence structure as much as possible. IMPORTANT: You must preserve the exact formatting of the original text, including all blank lines, paragraph breaks, bold text, italics, and any other formatting elements. For bold text, use <strong> HTML tags. For italic text, use <em> HTML tags. For headings, use the appropriate <h1>, <h2>, etc. HTML tags. Do not add interpretations or explanations. Use a literary Kazakh style that remains accessible to the reader. If there are Arabic terms or Qur'anic verses, keep them in Arabic and give their Kazakh meaning accurately and respectfully. Do not summarize or omit any part of the original text.";

// Simple rate limiting
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
};

const requestCounts = new Map();

function checkRateLimit() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;
  
  // Clean up old entries
  for (const [timestamp] of requestCounts) {
    if (timestamp < windowStart) {
      requestCounts.delete(timestamp);
    }
  }
  
  // Count requests in the current window
  const currentCount = Array.from(requestCounts.values()).reduce((sum, count) => sum + count, 0);
  
  if (currentCount >= RATE_LIMIT.maxRequests) {
    throw new HttpError(429, 'Too many requests. Please try again later.');
  }
  
  // Add current request
  requestCounts.set(now, (requestCounts.get(now) || 0) + 1);
}

// Function to split text into chunks while preserving sentence boundaries
function splitTextIntoChunks(text, maxChunkLength = 1500) {
  // Split text into sentences (considering multiple punctuation marks)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // If adding this sentence would exceed maxChunkLength and we already have content,
    // save the current chunk and start a new one
    if (currentChunk.length + sentence.length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += sentence + ' ';
  }

  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function translateChunk(chunk, sourceLanguage, targetLanguage, isFirstChunk = false, isLastChunk = false) {
  const prompt = `Translate the following ${isFirstChunk ? 'beginning' : isLastChunk ? 'end' : 'middle'} part of a longer text from ${sourceLanguage} to ${targetLanguage}. 
  Maintain the original meaning, tone, and cultural context.
  CRITICAL: You MUST preserve the exact formatting of the original text:
  - Keep all blank lines exactly where they appear in the original
  - Preserve all paragraph breaks
  - Use <strong>bold text</strong> for bold text
  - Use <em>italic text</em> for italic text
  - Use appropriate heading tags (<h1>, <h2>, etc.) for headings
  - Keep all other formatting elements exactly as they appear
  If there are any idioms or cultural references, adapt them appropriately for the target language.
  Ensure the translation flows naturally with the previous and next parts.
  Only return the translated text, nothing else.

  Text to translate: "${chunk}"`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2,
    max_tokens: 2000,
    top_p: 0.95,
  });

  if (!completion.choices?.[0]?.message?.content) {
    throw new Error('No translation received from GPT-4');
  }

  return completion.choices[0].message.content.trim();
}

export async function translateText(text, sourceLanguage, targetLanguage, onProgress = null) {
  try {
    checkRateLimit();

    // If text is short enough, translate it directly
    if (text.length <= 1500) {
      if (onProgress) {
        onProgress({ current: 0, total: 1, status: 'Preparing translation...' });
      }

      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
      Maintain the original meaning, tone, and cultural context.
      CRITICAL: You MUST preserve the exact formatting of the original text:
      - Keep all blank lines exactly where they appear in the original
      - Preserve all paragraph breaks
      - Use <strong>bold text</strong> for bold text
      - Use <em>italic text</em> for italic text
      - Use appropriate heading tags (<h1>, <h2>, etc.) for headings
      - Keep all other formatting elements exactly as they appear
      If there are any idioms or cultural references, adapt them appropriately for the target language.
      Only return the translated text, nothing else.

      Text to translate: "${text}"`;

      if (onProgress) {
        onProgress({ current: 1, total: 1, status: 'Translating...' });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        top_p: 0.95,
      });

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('No translation received from GPT-4');
      }

      return completion.choices[0].message.content.trim();
    }

    // For longer texts, split into chunks and translate each chunk
    const chunks = splitTextIntoChunks(text);
    const translatedChunks = [];

    if (onProgress) {
      onProgress({ 
        current: 0, 
        total: chunks.length,
        status: `Preparing to translate ${chunks.length} parts...`
      });
    }

    for (let i = 0; i < chunks.length; i++) {
      const isFirstChunk = i === 0;
      const isLastChunk = i === chunks.length - 1;
      
      if (onProgress) {
        onProgress({ 
          current: i + 1, 
          total: chunks.length,
          status: `Translating part ${i + 1} of ${chunks.length}...`
        });
      }

      // Add rate limit delay between chunks
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between chunks
      }

      const translatedChunk = await translateChunk(
        chunks[i],
        sourceLanguage,
        targetLanguage,
        isFirstChunk,
        isLastChunk
      );
      translatedChunks.push(translatedChunk);
    }

    // Combine all translated chunks
    const finalTranslation = translatedChunks.join(' ');

    if (onProgress) {
      onProgress({ 
        current: chunks.length, 
        total: chunks.length,
        status: 'Translation completed!'
      });
    }

    return finalTranslation;

  } catch (error) {
    console.error('Translation error:', error);
    
    if (error instanceof HttpError) {
      throw error;
    }
    
    if (error.response?.status === 429) {
      throw new HttpError(429, 'OpenAI API rate limit exceeded. Please try again later.');
    }
    
    if (error.response?.status === 401) {
      throw new HttpError(401, 'Invalid OpenAI API key. Please check your configuration.');
    }
    
    throw new HttpError(500, 'Failed to translate text. Please try again later.');
  }
} 