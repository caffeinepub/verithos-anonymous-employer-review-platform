import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Влизане...' : isAuthenticated ? 'Изход' : 'Вход';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={disabled}
      className={`px-6 py-2 rounded-full transition-colors font-medium ${
        isAuthenticated
          ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          : 'bg-amber-500 hover:bg-amber-600 text-blue-900'
      } disabled:opacity-50`}
    >
      {text}
    </button>
  );
}
