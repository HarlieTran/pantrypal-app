import { CognitoUserPool } from "amazon-cognito-identity-js";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;

export function getPool(): CognitoUserPool {
  if (!userPoolId || !clientId) {
    throw new Error("Missing VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_APP_CLIENT_ID");
  }

  return new CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
  });
}