export type SignUpInput = {
  email: string;
  password: string;
  givenName?: string;
  familyName?: string;
};

export type AuthError = {
  code: string;
  message: string;
};
