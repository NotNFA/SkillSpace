
# SkillSpace

SkillSpace is a platform that connects Clients and Creators, allowing users to collaborate on projects, manage submissions, communicate, schedule meetings, and track project progress.

## Features

- Creator and Client registration and authentication
- Separate Admin account and Admin dashboard
- Creator profiles and discovery
- Project creation and management
- Project submissions and AI-powered project assurance
- Real-time chat and notifications
- Zoom meeting scheduling and joining
- Creator payment methods (UPI and Bank)
- Payment and milestone management
- User reporting and Admin moderation
- Creator verification
- Cloudinary media uploads
- PostgreSQL database integration
- Responsive user interface

## Technology Stack

- Backend: Node.js and Express.js
- Frontend: HTML, CSS and JavaScript
- Database: PostgreSQL (Supabase)
- Authentication: JWT
- Real-time communication: Socket.IO
- File storage: Cloudinary
- Video meetings: Zoom API
- AI integrations: Configured AI providers

## Requirements

- Node.js (version supported by the project)
- npm
- Supabase PostgreSQL database
- Cloudinary account
- Required API credentials for enabled integrations

## Installation

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd YOUR_PROJECT_FOLDER
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
copy .env.example .env
```

Configure the required environment variables in `.env`.

Start the application:

```bash
npm start
```

## Environment Variables

Configure the variables required by your project in `.env`.

Examples of integrations that may require credentials:

- PostgreSQL / Supabase
- JWT authentication
- Cloudinary
- Zoom API
- AI provider APIs
- Payment gateway

Refer to `.env.example` for the exact variable names.

Never commit `.env` or expose API keys, database passwords, JWT secrets, or payment credentials.

## Deployment

SkillSpace is designed to run as a Node.js web service.

For Render deployment:

1. Create a new Web Service.
2. Connect this GitHub repository.
3. Select the appropriate project root directory.
4. Set the Build Command to `npm install`.
5. Set the Start Command to `npm start`.
6. Add the required environment variables in Render.
7. Deploy the application.

Make sure the database and external integrations are configured before deployment.

## Database

SkillSpace uses PostgreSQL through Supabase.

Database migrations should be applied carefully using the provided migration files.

Do not reset, truncate, or recreate an existing production database during deployment.

## Security

- Never commit `.env` files.
- Keep API keys and credentials server-side.
- Use secure authentication and authorization.
- Protect Admin-only routes.
- Do not expose private meeting host links or sensitive payment information.

## License

All rights reserved.
