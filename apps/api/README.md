# PantryPal API

Node.js API following Modular Monolith architecture with Separation of Concerns.

## Architecture

```
src/
├── common/           # Shared infrastructure
│   ├── ai/          # Bedrock AI client
│   ├── auth/        # JWT verification
│   ├── db/          # Prisma & DynamoDB clients
│   ├── routing/     # HTTP helpers
│   └── storage/     # S3 client
├── modules/         # Business modules
│   ├── api/         # Main router
│   ├── auth/        # Auth middleware
│   ├── community/   # Community feed
│   ├── home/        # Daily specials
│   ├── ingredients/ # Ingredient matching
│   ├── onboarding/  # User onboarding
│   ├── pantry/      # Pantry management
│   ├── recipes/     # Recipe suggestions
│   └── users/       # User profiles
├── jobs/            # Lambda workers
├── lambda.ts        # Lambda handler
└── main.ts          # Local dev server
```

## Module Structure

Each module follows:
- `model/` - Types and interfaces
- `routes/` - HTTP route handlers
- `services/` - Business logic
- `index.ts` - Public exports

## Key Principles

1. **Modular Monolith**: Each module is self-contained with clear boundaries
2. **Separation of Concerns**: Routes → Services → Data layer
3. **No Duplication**: Shared types in `common/`, shared utilities centralized
4. **Clean Exports**: Only public API exposed via `index.ts`

## Development

```bash
npm run dev:api    # Local server on :8788
npm run build      # TypeScript compilation
npm run test       # Jest tests
```

## Deployment

SAM template: `infra/aws/sam/template.yaml`

```bash
sam build -t infra/aws/sam/template.yaml
sam deploy --guided
```
