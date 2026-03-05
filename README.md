# PantryPal Monorepo

## Apps
- `apps/web`: React + Vite frontend.
- `apps/api`: Node API for auth/profile bootstrap.
- `apps/workers`: background worker starter.

## Packages
- `packages/shared-types`: shared TypeScript interfaces.
- `packages/shared-utils`: shared utility functions.
- `packages/tsconfig`: base TypeScript config.
- `packages/eslint-config`: shared lint config starter.

## Quick start
1. `npm install`
2. `npm run dev:api`
3. `npm run dev:web`
4. `npm run dev:workers`

## Signup/Login v1 (Current)
Implemented:
- Cognito signup + email verification + login in frontend.
- `POST /me/bootstrap` in API verifies Cognito ID token and upserts `UserProfile`.
- `firstName` and `lastName` are stored from token claims.
- `displayName` defaults to `firstName` unless user changes it later.

Current API routes:
- `GET /health`
- `POST /me/bootstrap`

## Local environment

Create `apps/api/.env`:

```env
PORT=8788
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?schema=pantrypal_app
COGNITO_REGION=us-east-2
COGNITO_USER_POOL_ID=us-east-2_xxxxxxxx
COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-2
CURATED_RECIPES_BUCKET=pantrypal-recipe-images
CURATED_RECIPES_PREFIX=images
```

Create `apps/web/.env`:

```env
VITE_API_BASE_URL=http://localhost:8788
VITE_COGNITO_REGION=us-east-2
VITE_COGNITO_USER_POOL_ID=us-east-2_xxxxxxxx
VITE_COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Local AWS profile for S3-backed recipe images
When running API locally, ensure the same terminal has an AWS identity that can read
`pantrypal-recipe-images/images/*`.

PowerShell:
```powershell
$env:AWS_PROFILE="your-profile-name"
aws sts get-caller-identity
npm run dev:api
```

Command Prompt:
```cmd
set AWS_PROFILE=your-profile-name
aws sts get-caller-identity
npm run dev:api
```

## AWS deploy: Lambda + Amplify

SAM template:
- [infra/aws/sam/template.yaml](C:\W26\PROG8950 - AI-Assisted\pantrypal-app\infra\aws\sam\template.yaml)

### 1) Deploy API with SAM
Prerequisites:
- AWS CLI configured.
- SAM CLI installed.

From repo root:

```bash
sam build -t infra/aws/sam/template.yaml
sam deploy --guided --template-file .aws-sam/build/template.yaml
```

Provide these parameter values during deploy:
- `FrontendOrigin` (Amplify URL or localhost for testing)
- `DatabaseUrl`
- `CognitoRegion`
- `CognitoUserPoolId`
- `CognitoAppClientId`
- `AwsRegion`
- `BedrockRegion`
- `BedrockModelId`
- `DailySpecialsBucket`
- `UnsplashAccessKey` (optional, can be blank)
- `DefaultDishImageUrl` (optional, can be blank)

Copy CloudFormation output:
- `ApiBaseUrl` -> use as frontend `VITE_API_BASE_URL`.

Daily special automation:
- A dedicated Lambda now runs on EventBridge schedule `cron(5 0 * * ? *)` (00:05 UTC daily).
- It calls `getOrCreateDailySpecial("global")` and persists the generated result.

Note for Prisma on Lambda:
- Build/deploy from an environment compatible with Lambda Linux runtime so Prisma engine artifacts match.
- If your DB is in a private subnet, attach Lambda to VPC and prefer RDS Proxy.

### 2) Deploy frontend with Amplify Hosting
Amplify settings:
1. Connect repository.
2. App root: `apps/web`.
3. Build commands:

```bash
npm ci
npm run build -w @pantrypal/web
```

4. Output directory: `apps/web/dist`.

Amplify environment variables:
- `VITE_API_BASE_URL` = `ApiBaseUrl` from SAM output
- `VITE_COGNITO_REGION`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_APP_CLIENT_ID`

### 3) Verify production flow
1. Signup in Amplify app.
2. Confirm email code.
3. Login.
4. Confirm `POST /me/bootstrap` returns profile JSON.
5. Check CloudWatch logs for Lambda if any auth/database failures.
