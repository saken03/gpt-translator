import { HttpError } from 'wasp/server'

export const getTranslations = async (args, context) => {
  if (!context.user) { throw new HttpError(401) }

  return context.entities.Translation.findMany({
    where: {
      userId: context.user.id
    }
  });
}

export const getTranslation = async ({ translationId }, context) => {
  if (!context.user) { throw new HttpError(401) }

  const translation = await context.entities.Translation.findUnique({
    where: { id: translationId, userId: context.user.id }
  });

  if (!translation) throw new HttpError(404, 'Translation not found');

  return translation;
}
