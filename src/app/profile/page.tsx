'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import ProfileForm from '@/components/ProfileForm';
import ProfileDisplay from '@/components/ProfileDisplay';
import { Profile } from '@/types/apptypes';


export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (status !== 'authenticated') return;
      
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Profile fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [status]);

  const handleSave = async (formData: { name: string; email: string; birthday: string; avatarUrl: string }) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error('Failed to update profile');
      
      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setEditMode(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show loading state while fetching profile
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-lg">No profile data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <PageHeader title={`${profile.name}'s profile`} />
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        {editMode ? (
          <ProfileForm
            initialProfile={profile}
            onSave={handleSave}
            onCancel={() => setEditMode(false)}
          />
        ) : (
          <ProfileDisplay profile={profile} setEditMode={setEditMode} />
        )}
      </div>
    </div>
  );
} 