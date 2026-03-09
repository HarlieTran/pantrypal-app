# Lambda Jobs

Lambda handlers for scheduled/async tasks. Deployed separately from main API.

## Files

- **prewarm.lambda.ts** - Daily special prewarm (6 AM UTC)
  - Calls `getOrCreateDailySpecial("global")`
  - Deploy: `infra/aws/sam/template.prewarm.yaml`
  - Stack: `pantrypal-prewarm`

- **daily-special-prewarm.lambda.ts** - Alternative with locale support
  - Deploy: main `template.yaml`
  - Stack: `pantrypal-api`

## Deploy Standalone Prewarm

```bash
cd apps/api
npm run build
cd ../..
sam build -t infra/aws/sam/template.prewarm.yaml
sam deploy --guided --config-file infra/aws/sam/samconfig-prewarm.toml
```

## Test Locally

```bash
cd apps/api
tsx src/jobs/prewarm.lambda.ts
```
