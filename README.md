# ResumeAI

AI-powered resume optimization and job application platform built with Next.js 15, Claude AI, and MongoDB.

## Tech Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **AI Engine:** Anthropic Claude via `@anthropic-ai/sdk`
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js v5 (Google OAuth + credentials)
- **Styling:** Tailwind CSS v4, shadcn/ui, Radix UI primitives
- **Email:** Resend
- **File Parsing:** pdf-parse, mammoth (DOCX)
- **Charts:** Recharts
- **Validation:** Zod

## Features

- Upload and parse resumes (PDF, DOCX)
- AI-powered resume analysis and scoring
- Job description matching with tailored suggestions
- Resume optimization recommendations
- Application tracking dashboard
- Email notifications via Resend
- Google OAuth and email/password authentication
- Dark/light theme support

## Getting Started

### Prerequisites

- Node.js 18.17+
- MongoDB Atlas account (or local MongoDB instance)
- Anthropic API key
- Google OAuth credentials (optional, for social login)
- Resend API key (optional, for email features)

### Installation

```bash
git clone <repo-url>
cd resumeai
npm install
```

### Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

- `MONGODB_URI` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - Run `openssl rand -base64 32` to generate
- `ANTHROPIC_API_KEY` - From console.anthropic.com
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `RESEND_API_KEY` - From resend.com

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
resumeai/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── (auth)/          # Auth pages (login, register)
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── api/             # API route handlers
│   │   ├── globals.css      # Global styles and CSS variables
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/          # React components
│   │   └── ui/              # shadcn/ui primitives
│   ├── lib/                 # Utility functions and shared logic
│   │   ├── db/              # Database connection and models
│   │   ├── ai/              # Claude AI integration
│   │   ├── auth/            # NextAuth configuration
│   │   ├── email/           # Resend email templates
│   │   ├── parsers/         # Resume file parsers
│   │   └── utils.ts         # General utilities
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── .env.example             # Environment variable template
├── components.json          # shadcn/ui configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── postcss.config.mjs       # PostCSS / Tailwind v4 config
├── tailwind.config.ts       # Tailwind theme configuration
└── tsconfig.json            # TypeScript configuration
```

## License

Private project. All rights reserved.
# ResumeAI
