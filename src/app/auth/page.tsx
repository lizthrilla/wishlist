'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import AuthForm from '@/components/AuthForm';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(() => {
    // Initialize mode based on URL parameter
    return searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const messageParam = searchParams.get('message');
    if (messageParam) {
      setMessage(messageParam);
    }
  }, [searchParams]);

  const toggleMode = () => {
    const newMode = mode === 'login' ? 'signup' : 'login';
    setMode(newMode);
    setMessage(null);
    // Update URL without full page reload
    window.history.replaceState(
      {},
      '',
      `/auth?mode=${newMode}`
    );
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <PageHeader 
            title="Loading..." 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <PageHeader 
          title={mode === 'login' ? 'Sign in to your account' : 'Create your account'} 
        />
        
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </div>
    </div>
  );
} 