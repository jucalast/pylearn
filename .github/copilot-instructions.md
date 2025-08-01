<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# PyLearn - AI Programming Teacher

This is a web application that serves as an AI-powered programming teacher. The system uses Google Gemini AI to provide personalized programming education through an interactive chat interface combined with a code editor.

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and React
- **Backend**: Next.js API routes 
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini AI for intelligent tutoring
- **Editor**: Monaco Editor for code editing
- **Authentication**: JWT-based authentication

## Key Features

1. **AI-Powered Teaching**: Uses Google Gemini AI to adapt teaching style to user's knowledge level
2. **Hybrid Interface**: Split-screen view with chat on one side and code editor on the other
3. **Knowledge Assessment**: AI evaluates user responses to determine programming skill level
4. **Personalized Study Plans**: AI creates custom learning paths based on user assessment
5. **Real-time Feedback**: AI provides instant feedback on code submissions
6. **Exercise Generation**: AI generates programming exercises tailored to user's level
7. **Progress Tracking**: Database stores user progress and learning analytics

## Database Schema

- **Users**: User authentication and profile data
- **LearningProfile**: User's programming language preferences, skill level, and study plans
- **ChatSession**: Chat conversations with the AI teacher
- **ChatMessage**: Individual messages in chat sessions
- **Exercise**: Programming exercises generated by AI
- **CodeSubmission**: User's code submissions and AI feedback
- **LearningPath**: Structured learning paths for different languages/levels

## AI Integration

The application uses Google Gemini AI for:
- Assessing user knowledge level through conversational questions
- Creating personalized study plans and learning paths
- Generating programming exercises with solutions and test cases
- Providing real-time feedback on code quality and correctness
- Conducting intelligent tutoring conversations

## Development Guidelines

- Use TypeScript for type safety
- Follow Next.js 14 App Router patterns
- Implement proper error handling for AI API calls
- Ensure responsive design for mobile and desktop
- Use Prisma for database operations
- Implement proper authentication middleware
- Follow React best practices with hooks and state management

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini AI API key
- `JWT_SECRET`: Secret for JWT token signing
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `NEXTAUTH_URL`: Application URL

## API Endpoints

- `/api/auth/*`: Authentication (login, register)
- `/api/chat`: AI chat conversations
- `/api/learning-profile`: User learning profiles and assessments
- `/api/exercises`: Exercise generation and retrieval
- `/api/code-submission`: Code submission and AI feedback
