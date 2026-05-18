## Live
- https://chat-vexa.vercel.app/

# chat-VEXA

A Vite + React + TypeScript application for chatting with an AI assistant.

## Features
- Chat UI with message history
- Voice input (speech recognition)
- Voice output (text-to-speech)
- Attach/upload: images + documents
- Optional modes via settings (e.g., offline mode, emotion mode)

## Tech Stack
- React
- TypeScript
- Vite
- TailwindCSS
- lucide-react (icons)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build (optional):
   ```bash
   npm run preview
   ```

## Project Structure (high level)
- `src/components/`
  - `ChatArea.tsx` – main chat layout (header, messages list, input area)
  - `MessageBubble.tsx` – renders each message
  - `AiAvatar.tsx` – AI speaking/listening indicator
- `src/hooks/`
  - `useSpeech.ts` – speech recognition + TTS handling
- `src/lib/`
  - `supabase.ts` – supabase helpers/types


## Notes
- To configure any backend (e.g., Supabase), ensure required environment variables are set as expected by the codebase.


