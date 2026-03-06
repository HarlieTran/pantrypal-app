export type SessionStatus =
  | "bootstrapping"   // app just loaded, checking for existing session
  | "guest"           // no session found, or refresh failed
  | "authenticated";  // valid session, user is known

export type SessionState =
  | { status: "bootstrapping" }
  | { status: "guest" }
  | { status: "authenticated"; token: string; userId: string; email: string };