# Complete Infrastructure Deployment Guide

Deploy entire PantryPal infrastructure from scratch (0 → production).

## What Gets Created

- **Cognito**: User Pool + App Client for authentication
- **RDS**: PostgreSQL database (db.t3.micro)
- **S3**: 4 buckets (recipe images, daily specials, pantry uploads, community posts)
- **DynamoDB**: Community feed table
- **VPC**: Private subnets for Lambda + RDS
- **Lambda**: API function + Daily special worker
- **API Gateway**: HTTP API with CORS

## Prerequisites

1. AWS CLI configured
2. SAM CLI installed
3. Node.js 20+ installed

## Deployment Steps

### 1. Update Parameters

Edit `infra/aws/sam/params.complete.json`:

```json
{
  "Parameters": {
    "Environment": "dev",
    "FrontendOrigin": "https://your-app.amplifyapp.com",
    "DBUsername": "postgres",
    "DBPassword": "YOUR_STRONG_PASSWORD_HERE",
    "UnsplashAccessKey": "your_unsplash_key",
    "SpoonacularApiKeys": "key1,key2,key3"
  }
}
```

### 2. Build & Deploy

```bash
# From repo root
sam build -t infra/aws/sam/template.complete.yaml

sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name pantrypal-complete-dev \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides file://infra/aws/sam/params.complete.json \
  --region us-east-2
```

### 3. Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name pantrypal-complete-dev \
  --query 'Stacks[0].Outputs' \
  --region us-east-2
```

### 4. Run Prisma Migrations

```bash
# Set DATABASE_URL from stack outputs
export DATABASE_URL="postgresql://postgres:PASSWORD@endpoint:5432/postgres?schema=pantrypal_app"

cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

### 5. Update Frontend .env

Create `apps/web/.env`:

```env
VITE_API_BASE_URL=<ApiBaseUrl from outputs>
VITE_COGNITO_REGION=<CognitoRegion from outputs>
VITE_COGNITO_USER_POOL_ID=<CognitoUserPoolId from outputs>
VITE_COGNITO_APP_CLIENT_ID=<CognitoClientId from outputs>
```

### 6. Deploy Frontend to Amplify

```bash
# Connect GitHub repo to Amplify
# Set build settings:
# - App root: apps/web
# - Build command: npm ci && npm run build -w @pantrypal/web
# - Output directory: apps/web/dist
# - Add environment variables from step 5
```

### 7. Update CORS

After Amplify deployment, update stack with real frontend URL:

```bash
# Edit params.complete.json
"FrontendOrigin": "https://main.xxxxx.amplifyapp.com"

# Redeploy
sam deploy --no-confirm-changeset
```

## Cost Estimate (Monthly)

- RDS db.t3.micro: ~$15
- Lambda: ~$5 (within free tier)
- S3: ~$1
- DynamoDB: ~$1 (within free tier)
- API Gateway: ~$1 (within free tier)

**Total: ~$23/month**

## Cleanup

```bash
# Delete stack (keeps S3 buckets by default)
aws cloudformation delete-stack --stack-name pantrypal-complete-dev --region us-east-2

# Manually delete S3 buckets if needed
aws s3 rb s3://pantrypal-recipe-images-dev --force
aws s3 rb s3://pantrypal-daily-specials-dev --force
aws s3 rb s3://pantrypal-user-pantry-uploads-dev --force
aws s3 rb s3://pantrypal-community-posts-dev --force
```

## Troubleshooting

### Lambda can't connect to RDS
- Check VPC configuration
- Verify security group rules
- Ensure Lambda has VPC execution role

### Prisma migrations fail
- Verify DATABASE_URL format
- Check RDS security group allows your IP
- Use bastion host or VPN for private RDS

### CORS errors
- Update FrontendOrigin parameter
- Redeploy stack
- Clear browser cache
