import { useState } from 'react';
import { Link } from 'wasp/client/router';
import { useQuery } from 'wasp/client/operations';
import { getTranslations } from 'wasp/client/operations';
import { createTranslation, deleteTranslation } from 'wasp/client/operations';
// Try-catch block for pdf-parse import
let pdfParse;
try {
  // We'll use dynamic import in the handler instead
  // pdfParse = require('pdf-parse');
} catch (err) {
  console.error('PDF parser not available:', err);
}

const LANGUAGES = [
  { code: 'kk', name: 'Kazakh' },
  { code: 'tr', name: 'Turkish' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

export default function HomePage() {
  const [originalText, setOriginalText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('tr');
  const [targetLanguage, setTargetLanguage] = useState('kz');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pdfError, setPdfError] = useState(null);
  const [pdfName, setPdfName] = useState('');

  const { data: translations, isLoading: isLoadingTranslations, refetch } = useQuery(getTranslations);

  const handleDelete = async (translationId) => {
    if (window.confirm('Are you sure you want to delete this translation?')) {
      try {
        await deleteTranslation({ translationId });
        refetch(); // Refresh the translations list
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: 0 });

    try {
      const response = await createTranslation({ 
        originalText, 
        sourceLanguage, 
        targetLanguage,
        onProgress: (progressData) => {
          setProgress(progressData);
        }
      });
      setOriginalText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handlePdfUpload = async (e) => {
    setPdfError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPdfName(file.name);
    if (file.type !== 'application/pdf') {
      setPdfError('Please upload a valid PDF file.');
      return;
    }
    
    try {
      setIsLoading(true);
      // Dynamically import pdf-parse
      let pdfParser;
      try {
        pdfParser = await import('pdf-parse');
      } catch (err) {
        console.error('Failed to load PDF parser:', err);
        setPdfError('PDF parser not available. Try installing pdf-parse.');
        setIsLoading(false);
        return;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const data = await pdfParser.default(new Uint8Array(arrayBuffer));
      setOriginalText(data.text);
      setIsLoading(false);
    } catch (err) {
      console.error('PDF extraction error:', err);
      setPdfError('Failed to extract text from PDF: ' + (err.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  const getProgressMessage = () => {
    if (!isLoading) return '';
    if (progress.total === 0) return 'Preparing translation...';
    return `Translating part ${progress.current} of ${progress.total}...`;
  };

  const getProgressPercentage = () => {
    if (!isLoading || progress.total === 0) return 0;
    return (progress.current / progress.total) * 100;
  };

  // Function to safely render HTML content
  const renderHTML = (html) => {
    return { __html: html };
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">GPT Translator</h1>
        
        {/* Debug element */}
        <div style={{background: 'red', color: 'white', padding: '10px', marginBottom: '10px', textAlign: 'center'}}>
          DEBUG: PDF UPLOAD SHOULD APPEAR BELOW
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Language
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={isLoading}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={isLoading}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Extremely basic PDF upload */}
          <div className="mb-4">
            <label className="block font-bold">PDF Upload Test:</label>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handlePdfUpload}
            />
            {pdfName && <div>Selected file: {pdfName}</div>}
            {pdfError && <div style={{color: 'red'}}>{pdfError}</div>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text to Translate
            </label>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              className="w-full p-2 border rounded-md h-32 font-sans whitespace-pre-wrap"
              placeholder="Enter text to translate or upload a PDF file above..."
              required={!pdfName}
              disabled={isLoading}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>

          {error && (
            <div className="mb-4 text-red-600">
              {error}
            </div>
          )}

          {isLoading && progress.total > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                {getProgressMessage()}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? getProgressMessage() || 'Translating...' : 'Translate'}
          </button>
        </form>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Translations</h2>
          {isLoadingTranslations ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : translations?.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No translations yet</div>
          ) : (
            <div className="space-y-4">
              {[...translations].reverse().map((translation) => (
                <Link
                  key={translation.id}
                  to={`/translation/${translation.id}`}
                  className="block p-4 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm text-gray-500">
                    {translation.sourceLanguage} → {translation.targetLanguage}
                  </div>
                  <div className="mt-1 font-medium">{translation.originalText.length > 100 ? translation.originalText.slice(0, 100) + '...' : translation.originalText}</div>
                  {translation.translatedText ? (
                    translation.translatedText.includes('Translating') || 
                    translation.translatedText.includes('Preparing') ? (
                      <div className="mt-2">
                        <div className="text-sm text-blue-600">
                          {translation.translatedText}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-full"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-600">
                        <div 
                          className="whitespace-pre-wrap font-sans"
                          dangerouslySetInnerHTML={renderHTML(translation.translatedText.length > 100 ? translation.translatedText.slice(0, 100) + '...' : translation.translatedText)}
                        ></div>
                      </div>
                    )
                  ) : (
                    <div className="mt-2 text-sm text-yellow-600">
                      Translation pending...
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

