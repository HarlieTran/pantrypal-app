import { useState } from 'react';
import { signIn, signUp, confirmSignUp, resendCode } from '../infra/cognito.api';
import type { SignUpInput } from '../model/auth.types';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = await signIn(email, password);
      return token;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (input: SignUpInput): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await signUp(input);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (email: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await confirmSignUp(email, code);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Confirmation failed';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resend = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await resendCode(email);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Resend failed';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    login,
    register,
    confirm,
    resend,
  };
}
