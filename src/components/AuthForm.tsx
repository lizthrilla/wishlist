'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import SubmitButton from './SubmitButton';
import Error from './Error';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear form when switching modes
  useEffect(() => {
    setForm({ name: '', email: '', password: '' });
    setError('');
  }, [mode]);

  // Redirect to profile when session is established
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/profile');
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!form.email || !form.password) {
      setError('Please fill in all required fields');
      return false;
    }
    if (mode === 'signup' && !form.name) {
      setError('Please enter your name');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await handleLogin();
      } else {
        // Handle signup
        const res = await fetch('/api/auth', {
          method: 'POST',
          body: JSON.stringify(form),
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (res.ok) {
          // After successful signup, automatically log in
          const loginSuccess = await handleLogin();
          if (!loginSuccess) {
            // If login fails after signup, redirect to login page with message
            router.push('/auth?mode=login&message=Account created successfully. Please sign in.');
          }
        } else {
          setError(data.error || 'Something went wrong');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm -space-y-px">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Name"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
              mode === 'signup' ? '' : 'rounded-t-md'
            } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
            placeholder="Email address"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            value={form.password}
            onChange={handleChange}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

      {error && (<Error error={error} />)}

      <div>
        <SubmitButton 
          isLoading={isLoading} 
          buttonText={mode === 'login' ? 'Sign in' : 'Sign up'} 
          loadingText={mode === 'login' ? 'Signing in...' : 'Signing up...'} 
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" 
        />
      </div>

      <div className="text-sm text-center">
        <button
          type="button"
          onClick={onToggleMode}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </form>
  );
} 