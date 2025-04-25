import { useQuery } from 'wasp/client/operations';
import { getTranslation } from 'wasp/client/operations';
import { useParams } from 'react-router-dom';
import { Link } from 'wasp/client/router';

export default function TranslationPage() {
  const { translationId } = useParams();
  const { data: translation, isLoading, error } = useQuery(getTranslation, { translationId: parseInt(translationId) });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md text-red-600">
          Error: {error}
        </div>
      </div>
    </div>
  );

  const isTranslating = translation.translatedText && (
    translation.translatedText.includes('Translating') || 
    translation.translatedText.includes('Preparing')
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Translation Details</h2>
            <div className="text-sm text-gray-500">
              {translation.sourceLanguage} → {translation.targetLanguage}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Original Text</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {translation.originalText}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Translated Text</h3>
              {!translation.translatedText ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-yellow-600">Translation pending...</div>
                </div>
              ) : isTranslating ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-blue-600 mb-2">
                    {translation.translatedText}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md">
                  {translation.translatedText}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
