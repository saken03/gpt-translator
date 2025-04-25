import { HttpError } from 'wasp/server'
import { translateText } from './gpt.js'

export const createTranslation = async (args, context) => {
  if (!context.user) { throw new HttpError(401) };
  const { originalText, sourceLanguage, targetLanguage } = args;
  
  try {
    // Create translation record first with pending status
    const newTranslation = await context.entities.Translation.create({
      data: {
        originalText,
        translatedText: null, // Will be updated once translation is complete
        sourceLanguage,
        targetLanguage,
        user: { connect: { id: context.user.id } }
      }
    });

    // Now translate the text and update the record
    const translatedText = await translateText(
      originalText, 
      sourceLanguage, 
      targetLanguage,
      async (progress) => {
        // Update translation progress
        await context.entities.Translation.update({
          where: { id: newTranslation.id },
          data: { 
            translatedText: progress.status // Store progress status temporarily in translatedText
          }
        });
      }
    );
    
    // Update with final translation
    const updatedTranslation = await context.entities.Translation.update({
      where: { id: newTranslation.id },
      data: { translatedText }
    });

    return updatedTranslation;
  } catch (error) {
    console.error('Translation error:', error);
    throw new HttpError(500, 'Failed to translate text');
  }
}

export const updateTranslation = async ({ translationId, translatedText }, context) => {
  if (!context.user) { throw new HttpError(401) };

  const translation = await context.entities.Translation.findUnique({
    where: { id: translationId },
    select: { userId: true }
  });
  if (translation.userId !== context.user.id) { throw new HttpError(403) };

  return context.entities.Translation.update({
    where: { id: translationId },
    data: { translatedText }
  });
}
