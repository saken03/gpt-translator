![gptTranslator Logo](logo.png)

# GPT Translator

GPT Translator is a SaaS web application built with [Wasp](https://wasp-lang.dev/) that allows users to translate text and PDF documents between multiple languages using OpenAI's GPT models. The app is designed for high-fidelity translation, preserving formatting and supporting religious and literary texts.

## Features

- **Text Translation:** Translate text between supported languages (Kazakh, Turkish, English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean).
- **PDF Upload:** Upload PDF files and extract their text for translation.
- **Formatting Preservation:** Maintains original formatting, including bold, italics, headings, and paragraph breaks.
- **Progress Tracking:** See translation progress for long texts.
- **User Authentication:** Secure login and signup with username and password.
- **Translation History:** View and manage your previous translations.
- **Download as DOCX:** Download translated text as a formatted DOCX file.

## Tech Stack

- **Wasp** (full-stack framework)
- **React** (frontend)
- **Node.js** (backend)
- **Prisma** (ORM)
- **SQLite** (development database)
- **OpenAI GPT-4** (translation engine)
- **Tailwind CSS** (styling)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Wasp](https://wasp-lang.dev/docs/installation) (`npm install -g wasp`)
- OpenAI API key ([get one here](https://platform.openai.com/account/api-keys))

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/saken03/gpt-translator.git
   cd gpt-translator
   ```
2. **Install dependencies:**
   ```bash
   wasp install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and add your OpenAI API key:
     ```env
     OPENAI_API_KEY=your_openai_api_key_here
     ```
4. **Run database migrations:**
   ```bash
   wasp db migrate-dev
   ```
5. **Start the development server:**
   ```bash
   wasp start
   ```
   - The app will be available at [http://localhost:3000](http://localhost:3000)

## Usage
- Sign up or log in.
- Enter text or upload a PDF to translate.
- Select source and target languages.
- Submit to translate. Progress will be shown for long texts.
- View, download, or delete your translations from the history list.

## Development
- **Hot reload** is enabled for both client and server code.
- To apply new database changes, update `schema.prisma` and run:
  ```bash
  wasp db migrate-dev
  ```
- For production, switch to PostgreSQL (see [Wasp docs](https://wasp-lang.dev/docs/data-model/databases#migrating-from-sqlite-to-postgresql)).

## License
MIT

## Acknowledgements
- [Wasp](https://wasp-lang.dev/)
- [OpenAI](https://openai.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/) 