'use client';

import { useState } from 'react';
import SubmitButton from './SubmitButton';

interface ProfileFormProps {
  initialProfile: {
    name: string;
    email: string;
    birthday: string | null;
    avatarUrl: string | null;
  };
  onSave: (data: { name: string; email: string; birthday: string; avatarUrl: string }) => void;
  onCancel: () => void;
}

export default function ProfileForm({ initialProfile, onSave, onCancel }: ProfileFormProps) {
  const [form, setForm] = useState({
    name: initialProfile.name || '',
    email: initialProfile.email || '',
    birthday: initialProfile.birthday || '',
    avatarUrl: initialProfile.avatarUrl || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="sr-only">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Name"
          />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email"
          />
        </div>
        <div>
          <label htmlFor="birthday" className="sr-only">Birthday</label>
          <input
            id="birthday"
            name="birthday"
            type="date"
            value={form.birthday}
            onChange={handleChange}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          />
        </div>
      </div>
      <div className="flex justify-between">
        <SubmitButton buttonText="Save" type="submit" />
        <SubmitButton buttonText="Cancel" onClick={onCancel} />
      </div>
    </form>
  );
} 