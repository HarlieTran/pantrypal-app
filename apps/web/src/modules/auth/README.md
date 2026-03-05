# Auth Module

## Responsibility
- Handle Cognito sign-in/sign-up/confirmation flows.
- Expose auth pages used by app-level routing.

## Public API
- `LoginPage`
- `SignUpPage`
- `signUp`, `confirmSignUp`, `resendCode`, `signIn`

## Dependencies
- `amazon-cognito-identity-js`
- Environment variables: `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_APP_CLIENT_ID`
