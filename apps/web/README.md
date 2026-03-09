# PantryPal Web App

React + Vite frontend for PantryPal application.

## Architecture

**Modular Monolith** with clean separation of concerns:

```
src/
├── app/              # Application shell & routing
│   └── styles/       # App-specific styles
├── lib/              # Shared utilities & hooks
├── modules/          # Feature modules
│   ├── auth/         # Authentication
│   ├── community/    # Community feed & posts
│   ├── home/         # Home page & layout
│   ├── onboarding/   # User onboarding
│   ├── pantry/       # Pantry management
│   ├── profile/      # User profile
│   └── recipes/      # Recipe suggestions
├── styles/           # Global styles
│   └── global.css    # Global CSS variables & base styles
└── main.tsx          # Application entry point
```

## Module Structure

Each module follows this pattern:

```
module/
├── application/      # Business logic (hooks)
├── infra/           # External services (API clients)
├── model/           # Types & constants
├── styles/          # Module-specific styles
├── ui/              # React components
│   ├── components/  # Reusable components
│   └── pages/       # Page components
└── index.ts         # Public API exports
```

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev:web

# Build for production
npm run build -w @pantrypal/web
```

## Environment Variables

Create `apps/web/.env`:

```env
VITE_API_BASE_URL=http://localhost:8788
VITE_COGNITO_REGION=us-east-2
VITE_COGNITO_USER_POOL_ID=us-east-2_xxxxxxxx
VITE_COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Documentation

See `/docs` folder for:
- Architecture decisions
- Refactoring history
- Module audit reports
