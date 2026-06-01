
  # FitProgress Mobile App UI

  This is a code bundle for FitProgress Mobile App UI. The original project is available at https://www.figma.com/design/7j5BLUKVsy5D1XC1QKfXrP/FitProgress-Mobile-App-UI.

## Features

- User authentication (login/register)
- Workout tracking and diary
- Exercise library
- Statistics and analytics
- Premium subscription with payment integration
- Dark/light theme support
- Multi-language support (EN, RU, UK)
- PWA capabilities
- Mobile app via Expo

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, MongoDB
- **Mobile**: Expo, React Native WebView
- **Payment**: Mono Bank API
- **Auth**: JWT, Google OAuth

## Running the code

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   cd ../mobile && npm install
   ```

2. Set up environment variables (see .env.example)

3. Start the development server:
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

4. For mobile:
   ```bash
   npm run mobile  # Starts Expo dev server
   ```

## API Endpoints

- `/api/auth/*` - Authentication
- `/api/billing/*` - Subscription and payments
- `/api/exercises/*` - Exercise management
- `/api/workouts/*` - Workout tracking
- `/api/user/*` - User profile

## Deployment

Build for production:
```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.
  