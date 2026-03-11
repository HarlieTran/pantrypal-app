# IAM Setup for PantryPal Deployment

## Option 1: Create IAM User (Recommended for Co-workers)

```bash
# Create user
aws iam create-user --user-name pantrypal-deployer

# Attach policy
aws iam put-user-policy \
  --user-name pantrypal-deployer \
  --policy-name PantryPalDeploymentPolicy \
  --policy-document file://infra/aws/sam/deployment-policy.json

# Create access keys
aws iam create-access-key --user-name pantrypal-deployer
```

## Option 2: Use Existing User

```bash
# Attach policy to existing user
aws iam put-user-policy \
  --user-name YOUR_USERNAME \
  --policy-name PantryPalDeploymentPolicy \
  --policy-document file://infra/aws/sam/deployment-policy.json
```

## Option 3: AWS Console (Manual)

1. Go to IAM → Users → Create user
2. User name: `pantrypal-deployer`
3. Attach policies directly → Create policy
4. JSON tab → Paste content from `deployment-policy.json`
5. Name: `PantryPalDeploymentPolicy`
6. Create user → Security credentials → Create access key
7. Use access key in AWS CLI:

```bash
aws configure --profile pantrypal
# Enter Access Key ID
# Enter Secret Access Key
# Region: us-east-2
# Output: json

# Use profile for deployment
export AWS_PROFILE=pantrypal
sam deploy --guided
```

## Minimum Permissions Required

The policy grants access to:
- **CloudFormation**: Stack management
- **S3**: Bucket creation, SAM artifacts
- **Lambda**: Function deployment
- **API Gateway**: HTTP API creation
- **IAM**: Role/policy creation for Lambda
- **Cognito**: User Pool creation
- **RDS**: Database provisioning
- **DynamoDB**: Table creation
- **EC2**: VPC/subnet/security group creation
- **CloudWatch Logs**: Lambda logging
- **EventBridge**: Scheduled events

## Security Note

This policy is broad for initial setup. For production, use least-privilege policies per service.
