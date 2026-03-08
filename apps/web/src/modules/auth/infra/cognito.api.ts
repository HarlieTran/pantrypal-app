import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { getPool } from "./cognito.pool";
import type { SignUpInput } from "../model/auth.types";

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

export function signOut() {
  const pool = getPool();
  // getCurrentUser reads from localStorage cache
  const cognitoUser = pool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  // Clear any remaining Cognito keys from localStorage
  Object.keys(localStorage)
    .filter((key) => key.startsWith("CognitoIdentityServiceProvider"))
    .forEach((key) => localStorage.removeItem(key));
}
