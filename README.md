# Real-Time Interview Assistant

An AI-powered Windows desktop application that provides real-time interview assistance. The app listens to live audio, transcribes speech in real-time using detects questions, and generates professional answers using OpenAI GPT-4.

![Interview Assistant](./resources/icon.png)

## Features

- 🎤 **Real-time Speech Recognition** - Captures microphone audio and transcribes in real-time using OpenAI Whisper
- 🤖 **AI-Powered Answers** - Generates professional interview answers using OpenAI GPT-4o
- 🔒 **Screen Share Safe** - Window is hidden from screen sharing (Zoom, Teams, Google Meet)
- ⚡ **Low Latency** - Sub-2 second response time from question detection to answer generation
- 🎯 **Smart Question Detection** - Uses linguistic patterns and pause detection to identify questions
- 📌 **Always on Top** - Keeps the assistant visible during interviews
- 🌙 **Dark Theme** - Easy on the eyes during long interview sessions

## Tech Stack

- **Electron** - Cross-platform desktop app framework
- **React 19** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **OpenAI SDK** - GPT-4 answer generation

## Prerequisites

Before running this application, you'll need:

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **OpenAI API Key** - Get one at [platform.openai.com](https://platform.openai.com/api-keys)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ai-assistant
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy the environment example file:

```bash
cp .env.example .env
```

4. Add your API keys to `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Development

Run the app in development mode with hot reload:

```bash
pnpm dev
```

## Building

Build for Windows:

```bash
pnpm build:win
```

Build for other platforms:

```bash
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## Usage

1. **Launch the app** - The settings modal will open if API keys aren't configured
2. **Configure API keys** - Enter your OpenAI API key in Settings
3. **Click "Start"** - Begin listening for interview questions
4. **Speak or let the interviewer speak** - The app transcribes audio in real-time
5. **Wait for question detection** - When a pause is detected after a question, an answer is generated
6. **View suggested answers** - Professional answers appear in the bottom panel
7. **Click "Stop"** when done

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron Main Process                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Audio Capture  │  │  OpenAI Whisper │  │  OpenAI LLM     │  │
│  │  (System Audio) │  │  (WebSocket)    │  │  (Answer Gen)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ IPC
┌─────────────────────────────────────────────────────────────────┐
│                      Electron Renderer (React)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Mic Capture    │  │  Transcript     │  │  Answer         │  │
│  │  (Web Audio)    │  │  Display        │  │  Display        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── main/
│   ├── index.ts                    # Main process entry
│   ├── ipc/
│   │   └── handlers.ts             # IPC handlers
│   └── services/
│       ├── whisperService.ts      # Speech-to-text service
│       ├── openaiService.ts        # Answer generation service
│       ├── questionDetector.ts     # Question detection logic
│       └── settingsManager.ts      # Settings persistence
├── preload/
│   ├── index.ts                    # Preload scripts
│   └── index.d.ts                  # Type definitions
└── renderer/src/
    ├── App.tsx                     # Main React component
    ├── components/
    │   ├── Header.tsx              # Title bar with controls
    │   ├── StatusBar.tsx           # Recording status
    │   ├── TranscriptPanel.tsx     # Live transcription display
    │   ├── AnswerPanel.tsx         # Generated answers display
    │   └── SettingsModal.tsx       # Settings configuration
    ├── hooks/
    │   ├── useAudioCapture.ts      # Audio capture hook
    │   └── useInterview.ts         # Main interview logic
    ├── store/
    │   └── interviewStore.ts       # Zustand state management
    └── services/
        └── audioCapture.ts         # Web Audio implementation
```

## Configuration Options

| Setting         | Description                             | Default     |
| --------------- | --------------------------------------- | ----------- |
| OpenAI API Key  | Key for Whisper speech-to-text service  | Required    |
| OpenAI API Key  | Key for answer generation               | Required    |
| OpenAI Model    | GPT model to use                        | gpt-4o-mini |
| Pause Threshold | Silence duration before processing (ms) | 1500        |
| Window Opacity  | Window transparency                     | 100%        |
| Always on Top   | Keep window above others                | Enabled     |

## Security Features

- **Content Protection** - Window is hidden from screen capture software
- **Secure Storage** - API keys are encrypted using Electron's safeStorage API
- **Context Isolation** - Renderer process is isolated from main process
- **CSP Headers** - Content Security Policy restricts resource loading

## Troubleshooting

### Microphone not working

- Ensure microphone permissions are granted in Windows Settings
- Try selecting a different audio input device

### No transcription appearing

- Check that your OpenAI API key is valid
- Ensure you have an active internet connection

### Answers not generating

- Verify your OpenAI API key has sufficient credits
- Check the console for error messages

### Window visible in screen share

- The content protection feature works on Windows 10/11
- Some older screen sharing methods may still capture the window

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

# ai-assistant
