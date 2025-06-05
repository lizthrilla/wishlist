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

    {profile.anniversaries && profile.anniversaries.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700">Anniversaries</label>
        <div className="mt-2 space-y-2">
          {profile.anniversaries.map((anniversary) => (
            <div key={anniversary.id} className="flex items-center gap-2">
              <span className="text-lg">
                {anniversary.label}: {formatDate(anniversary.date)}
              </span>
              {anniversary.isPrimary && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {profile.wishlistLinks && profile.wishlistLinks.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700">Wishlist Links</label>
        <div className="mt-2 space-y-2">
          {profile.wishlistLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-2">
              <a 
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500"
              >
                {link.label}
              </a>
            </div>
          ))}
        </div>
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