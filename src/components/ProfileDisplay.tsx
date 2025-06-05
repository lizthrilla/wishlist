'use client';

import Image from 'next/image';
import SubmitButton from './SubmitButton';
import { formatDate } from '@/lib/datehelper';
import { Profile } from '@/types/apptypes';


export default function ProfileDisplay({ profile, setEditMode }: { profile: Profile, setEditMode: (editMode: boolean) => void }) {
  return (
    <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">Name</label>
      <p className="mt-1 text-lg">{profile.name}</p>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700">Email</label>
      <p className="mt-1 text-lg">{profile.email}</p>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700">Avatar</label>
      <div className="mt-2 relative w-32 h-32">
        <Image 
          src={profile.avatarUrl || '/Avatar.svg'} 
          alt="Profile" 
          fill
          className="rounded-full object-cover"
          priority
        />
      </div>
    </div>
    
    {profile.birthday && (
      <div>
        <label className="block text-sm font-medium text-gray-700">Birthday</label>
        <p className="mt-1 text-lg">
          {formatDate(profile.birthday)}
        </p>
      </div>
    )}
    
    <div className="text-sm text-gray-500 flex justify-between">
      <div>
        <p>Member since: {formatDate(profile.createdAt)}</p>
        <p>Last updated: {formatDate(profile.updatedAt)}</p>
      </div>
      <div>
        <SubmitButton 
          buttonText="Edit" 
          onClick={() => setEditMode(true)} 
        />
      </div>
    </div>
  </div>
  );
}