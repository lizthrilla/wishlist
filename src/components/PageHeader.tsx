'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import SignOutButton from './SignOutButton';
import { signOut } from 'next-auth/react';

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const { status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: '/auth' });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex justify-between items-baseline">
      <h1 className="text-2xl font-bold">{title}</h1>
      {status === 'authenticated' && (
        <SignOutButton
          onClick={handleSignOut}
          disabled={isSigningOut}
          buttonText={isSigningOut ? 'Signing out...' : 'Sign Out'}
        />
      )}
    </div>
  );
}