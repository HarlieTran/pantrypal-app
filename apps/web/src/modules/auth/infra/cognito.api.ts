import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from "amazon-cognito-identity-js";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;

function getPool() {
  if (!userPoolId || !clientId) {
    throw new Error("Missing VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_APP_CLIENT_ID");
  }

  return new CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
  });
}

export type SignUpInput = {
  email: string;
  password: string;
  givenName?: string;
  familyName?: string;
};

export function signUp(input: SignUpInput) {
  const pool = getPool();

  return new Promise<void>((resolve, reject) => {
    const attrs: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: "email", Value: input.email.trim() }),
    ];

    if (input.givenName?.trim()) {
      attrs.push(new CognitoUserAttribute({ Name: "given_name", Value: input.givenName.trim() }));
    }

    if (input.familyName?.trim()) {
      attrs.push(new CognitoUserAttribute({ Name: "family_name", Value: input.familyName.trim() }));
    }

    pool.signUp(input.email.trim(), input.password, attrs, [], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function confirmSignUp(email: string, code: string) {
  const pool = getPool();

  return new Promise<void>((resolve, reject) => {
    const user = new CognitoUser({ Username: email.trim(), Pool: pool });
    user.confirmRegistration(code.trim(), true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function resendCode(email: string) {
  const pool = getPool();

  return new Promise<void>((resolve, reject) => {
    const user = new CognitoUser({ Username: email.trim(), Pool: pool });
    user.resendConfirmationCode((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function signIn(email: string, password: string) {
  const pool = getPool();

  return new Promise<string>((resolve, reject) => {
    const user = new CognitoUser({ Username: email.trim(), Pool: pool });
    const auth = new AuthenticationDetails({
      Username: email.trim(),
      Password: password,
    });

    user.authenticateUser(auth, {
      onSuccess: (session) => resolve(session.getIdToken().getJwtToken()),
      onFailure: (err) => reject(err),
    });
  });
}

export function signOut(email: string) {
  const pool = getPool();
  const user = new CognitoUser({ Username: email.trim(), Pool: pool });
  user.signOut();
}
