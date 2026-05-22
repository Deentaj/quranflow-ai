# 🌙 QuranFlow AI

> *"Consistency grows quietly."*

An AI-powered web application that helps users build a consistent, meaningful relationship with the Qur'an — beyond Ramadan — through personalized guidance, reflection, and habit-building.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [AI Integration](#ai-integration)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [Design Philosophy](#design-philosophy)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

QuranFlow AI is a production-ready full-stack application that combines authentic Qur'an content with intelligent AI to create a personalized spiritual experience.

The platform is designed to be **calm, supportive, and non-judgmental**, focusing on sustainable consistency rather than pressure.

---

## Problem Statement

Many people reconnect with the Qur'an during Ramadan but struggle to maintain that connection afterward. QuranFlow AI solves this by:

- Simplifying daily engagement with the Qur'an
- Providing personalized, AI-guided spiritual support
- Building gentle, consistent habits over time
- Offering a low-pressure way to reconnect on busy days

---

## Features

### 📖 Daily Ayah Journey
- Personalized daily ayah with Arabic text and translation
- Audio recitation playback
- AI-generated explanation and context
- "Apply this today" practical guidance

### 🤖 AI Companion
- Ask questions about verses and receive simple, clear explanations
- Emotional and spiritual support through conversation
- Context-aware, non-judgmental responses

### 📝 Reflection Journal
- Write and store personal reflections
- Filter entries by mood or ayah
- Track personal growth and insights over time

### 😊 Mood-Based Guidance
- Daily mood check-in
- AI suggests relevant ayahs based on how you're feeling
- Personalized reflections and actionable steps

### 🔥 Streak & Consistency Tracking
- Daily engagement tracking
- Current and longest streak display
- Gentle recovery system for missed days — no guilt

### ⚡ 5-Minute Reconnect Mode
- A quick spiritual reset for busy days
- One ayah + one reflection + one action
- Designed for users who are short on time

### 🎯 Goal Planner
- Set personal Qur'an reading and reflection goals
- Track progress over time
- AI-assisted motivation and reminders

### 🔖 Bookmark System
- Save favourite ayahs, reflections, and AI responses
- Build a personal library of meaningful content

### 📊 Progress Dashboard
- Weekly and monthly activity insights
- Reflection count and mood trend visualizations
- AI-generated weekly summaries

---

## AI Integration

AI is deeply woven into the core experience:

| Feature | AI Role |
|---|---|
| Daily Ayah | Generates explanation and "apply today" guidance |
| AI Companion | Answers questions, provides spiritual support |
| Mood Guidance | Recommends relevant ayahs based on emotional state |
| Journal | Suggests reflection prompts |
| Dashboard | Summarizes weekly progress and patterns |

All AI responses are crafted to be simple, supportive, and non-judgmental.

> ⚠️ **Important:** QuranFlow AI does not provide religious rulings (fatwas). Users are encouraged to consult qualified scholars for detailed Islamic guidance.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT (HTTP-only cookies), Google Sign-In (NextAuth) |
| **AI** | OpenAI API |
| **Qur'an Content** | Quran Foundation Content APIs |

---

## Project Structure

```
quranflow-ai/
├── app/                    # Next.js App Router pages and layouts
├── components/             # Shared UI components
│   └── dashboard/          # Dashboard-specific components
├── lib/                    # Utilities and configuration
│   └── ai/                 # AI prompt logic and handlers
├── models/                 # Mongoose database models
├── services/               # Business logic and API services
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── middleware.ts            # Route protection middleware
```

---

## Authentication

- Email and password login
- Google Sign-In via NextAuth
- Secure JWT sessions stored in HTTP-only cookies
- Protected routes enforced via middleware

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/quranflow-ai.git
cd quranflow-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_uri

# Auth
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run the development server

```bash
npm run dev
```

Visit `http://localhost:3000` to view the app.

---

## Deployment

This project can be deployed on any modern hosting platform:

- **[Vercel](https://vercel.com)** *(recommended — native Next.js support)*
- **[Render](https://render.com)**
- **[DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)**
- **AWS (EC2 / ECS)**

Ensure all environment variables from `.env.local` are configured in your production environment before deploying.

---

## Design Philosophy

QuranFlow AI is built around four core principles:

1. **Minimal & clean** — No clutter, no distractions
2. **Calm & distraction-free** — A space for reflection, not noise
3. **Emotionally supportive** — Kind, gentle, and encouraging
4. **Consistency over pressure** — Progress celebrated quietly

---

## Roadmap

- [ ] Surah journey mode
- [ ] AI personalization engine
- [ ] Community reflections feed
- [ ] Advanced analytics and insights
- [ ] Ramadan mode
- [ ] Mobile app (iOS & Android)

---

## Contributing

Contributions are welcome and appreciated.

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes and commit (`git commit -m 'Add your feature'`)
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please keep your contributions aligned with the calm, supportive spirit of the project.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <p>Built to serve as a gentle companion on your journey with the Qur'an. 🌙</p>
</div>