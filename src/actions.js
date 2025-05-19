import { HttpError } from 'wasp/server'
import { translateText } from './gpt.js'
import { Document, Packer, Paragraph } from 'docx';

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

export const deleteTranslation = async ({ translationId }, context) => {
  if (!context.user) { throw new HttpError(401) };

  const translation = await context.entities.Translation.findUnique({
    where: { id: translationId },
    select: { userId: true }
  });
  
  if (!translation) { throw new HttpError(404, 'Translation not found') };
  if (translation.userId !== context.user.id) { throw new HttpError(403) };

  return context.entities.Translation.delete({
    where: { id: translationId }
  });
}

export const downloadTranslationDocx = async ({ translationId }, context) => {
  if (!context.user) throw new HttpError(401);

  const translation = await context.entities.Translation.findUnique({
    where: { id: translationId, userId: context.user.id }
  });
  if (!translation) throw new HttpError(404, 'Translation not found');

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'Translation',
          heading: 'TITLE',
          spacing: { after: 300 },
          alignment: 'center',
          style: 'myTitleStyle',
        }),
        new Paragraph({
          text: translation.translatedText || '',
          style: 'myContentStyle',
        }),
      ],
    }],
    styles: {
      paragraphStyles: [
        {
          id: 'myTitleStyle',
          name: 'My Title Style',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: 48, // 24pt
            bold: true,
            color: '2E74B5',
            font: 'Calibri',
          },
          paragraph: {
            alignment: 'center',
            spacing: { after: 300 },
          },
        },
        {
          id: 'myContentStyle',
          name: 'My Content Style',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: 28, // 14pt
            font: 'Calibri',
            color: '222222',
          },
          paragraph: {
            border: {
              color: '2E74B5',
              space: 4,
              value: 'single',
              size: 6,
            },
            spacing: { before: 200, after: 200 },
            indent: { left: 400, right: 400 },
          },
        },
      ],
    },
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    buffer: buffer.toString('base64'),
    filename: `translation-${translationId}.docx`
  };
};
