# Collaborative Notes App

A real-time collaborative note-taking application built with React, TypeScript, and PeerJS. This application allows users to create, edit, and share notes in real-time with other users through peer-to-peer connections.

## Features

- 📝 Create and edit rich text notes with TipTap editor
- 🤝 Real-time collaboration with multiple users with Peer-to-peer communication (no server required)
- 💾 Local storage persistence for notes
- 🔗 Shareable note links

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/MinhOmega/collaborative-notes-app
cd collaborative-notes-app
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Build for Production

To build the application for production:

```bash
pnpm build
```

## Usage

1. When you first open the app, you're presented with some sample notes
2. Create new notes using the "+ New Note" button in the sidebar
3. Edit notes using the rich text editor
4. Share notes with other users by clicking the share button and copying the unique link
5. Join shared notes by pasting the link in your browser or using the Join button in the top

## Testing

The application includes basic unit tests for key components. Tests are written using Vitest and React Testing Library.

### Running Tests

```bash
pnpm test
```

## Project Structure

- `src/components/` - React components
- `src/lib/` - Core library code including store and utilities
- `src/hooks/` - Custom React hooks
- `src/pages/` - Page components used in routing
- `src/types/` - TypeScript type definitions
- `src/assets/` - Static assets
- `src/tests/` - Test files and utilities
