# Converge AI
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/PheonixCodder/converge-AI)

Converge AI is an intelligent meeting platform that allows users to create and manage AI agents that join video calls, provide real-time transcription, and generate post-meeting summaries. It leverages a modern tech stack to deliver a seamless experience for scheduling, conducting, and analyzing meetings.

## Key Features

- **AI Agent Management**: Create custom AI agents with specific names and instructions.
- **Meeting Scheduling**: Schedule meetings and assign a specific AI agent to join.
- **Real-time Video & Transcription**: Integrated video calls using Stream.io, with live transcription and the AI agent as a participant.
- **Post-Meeting Analysis**: Automatically processes completed meetings to generate:
    - AI-powered summaries.
    - Full, searchable transcripts with speaker identification.
    - Complete video recordings.
- **Post-Meeting Chat**: An "Ask AI" feature to interact with the agent about the contents of a completed meeting.
- **Subscription Management**: A premium tier system powered by Polar for unlocking advanced features and increasing usage limits.
- **Authentication**: Secure sign-in and sign-up with email/password, GitHub, and Google.
- **Modular Dashboard**: A responsive and user-friendly dashboard to manage all agents and meetings.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API & State Management**: [tRPC](https://trpc.io/) with [React Query](https://tanstack.com/query/latest)
- **Database & ORM**: [Neon](https://neon.tech/) (Serverless PostgreSQL) & [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: `better-auth`
- **Video & Chat**: [Stream.io](https://getstream.io/) (Video SDK & Chat SDK)
- **AI & Background Jobs**: [OpenAI](https://openai.com/) (GPT-4o), [Inngest](https://www.inngest.com/)
- **Payments & Subscriptions**: [Polar](https://polar.sh/)

## Project Structure

The repository is structured using a modular approach to separate concerns by feature.

- **/app**: Contains all Next.js App Router pages, layouts, and API routes (`/api`).
- **/components**: Houses reusable UI components built with shadcn/ui.
- **/db**: Drizzle ORM schema definitions and database client configuration.
- **/inngest**: Defines background functions for asynchronous tasks, such as meeting summary generation.
- **/hooks**: Custom React hooks used across the application.
- **/lib**: Core utility functions and initialization for third-party clients (Auth, Stream, Polar, OpenAI).
- **/modules**: The core application logic, with each feature (e.g., `agents`, `meetings`, `auth`) in its own directory containing specific hooks, schemas, API procedures, and UI views.
- **/trpc**: Configuration for tRPC, including the main router, context, and client/server setup.
- **/public**: Static assets like images and logos.

## Getting Started

To run the project locally, follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/pheonixcodder/converge-ai.git
cd converge-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory and add the necessary environment variables. Use the following as a template:

```.env
# Database (Neon)
DATABASE_URL="your_neon_database_url"

# Authentication (Better Auth)
# GitHub
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
# Google
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# AI (OpenAI)
OPENAI_API_KEY="your_openai_api_key"

# Stream.io
NEXT_PUBLIC_STREAM_CHAT_API_KEY="your_stream_chat_api_key"
STREAM_CHAT_SECRET_KEY="your_stream_chat_secret_key"
NEXT_PUBLIC_STREAM_VIDEO_API_KEY="your_stream_video_api_key"
NEXT_PUBLIC_STREAM_VIDEO_SECRET_KEY="your_stream_video_secret_key"

# Subscriptions (Polar)
POLAR_ACCESS_TOKEN="your_polar_access_token"
```

### 4. Run Database Migrations

Apply the database schema to your Neon database.

```bash
npm run db:migrate
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Compiles the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality and style issues.
- `npm run db:migrate`: Executes Drizzle Kit migrations against the database.
- `npm run db:studio`: Opens Drizzle Studio for database inspection.
