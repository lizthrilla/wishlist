'use client';

import { useState } from 'react';
import SubmitButton from './SubmitButton';

interface Anniversary {
  id?: string;
  label: string;
  date: string;
  isPrimary: boolean;
}

interface WishlistLink {
  id?: string;
  label: string;
  url: string;
}

interface ProfileFormProps {
  initialProfile: {
    name: string;
    email: string;
    birthday: string | null;
    avatarUrl: string | null;
    anniversaries: Anniversary[];
    wishlistLinks: WishlistLink[];
  };
  onSave: (data: {
    name: string;
    email: string;
    birthday: string;
    avatarUrl: string;
    anniversaries: Anniversary[];
    wishlistLinks: WishlistLink[];
  }) => void;
  onCancel: () => void;
}

export default function ProfileForm({ initialProfile, onSave, onCancel }: ProfileFormProps) {
  const [form, setForm] = useState({
    name: initialProfile.name || '',
    email: initialProfile.email || '',
    birthday: initialProfile.birthday || '',
    avatarUrl: initialProfile.avatarUrl || '',
    anniversaries: initialProfile.anniversaries || [],
    wishlistLinks: initialProfile.wishlistLinks || []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAnniversaryChange = (index: number, field: string, value: string | boolean) => {
    const newAnniversaries = [...form.anniversaries];
    newAnniversaries[index] = {
      ...newAnniversaries[index],
      [field]: value
    };
    setForm({ ...form, anniversaries: newAnniversaries });
  };

  const handleWishlistLinkChange = (index: number, field: string, value: string) => {
    const newLinks = [...form.wishlistLinks];
    newLinks[index] = {
      ...newLinks[index],
      [field]: value
    };
    setForm({ ...form, wishlistLinks: newLinks });
  };

  const addAnniversary = () => {
    setForm({
      ...form,
      anniversaries: [
        ...form.anniversaries,
        { label: '', date: '', isPrimary: false }
      ]
    });
  };

  const addWishlistLink = () => {
    setForm({
      ...form,
      wishlistLinks: [
        ...form.wishlistLinks,
        { label: '', url: '' }
      ]
    });
  };

  const removeAnniversary = (index: number) => {
    const newAnniversaries = form.anniversaries.filter((_, i) => i !== index);
    setForm({ ...form, anniversaries: newAnniversaries });
  };

  const removeWishlistLink = (index: number) => {
    const newLinks = form.wishlistLinks.filter((_, i) => i !== index);
    setForm({ ...form, wishlistLinks: newLinks });
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
        <div>
          <label htmlFor="avatarUrl" className="sr-only">Avatar URL</label>
          <input
            id="avatarUrl"
            name="avatarUrl"
            type="text"
            value={form.avatarUrl}
            onChange={handleChange}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Avatar URL"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Anniversaries</h3>
            <button
              type="button"
              onClick={addAnniversary}
              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-500"
            >
              Add Anniversary
            </button>
          </div>
          
          {form.anniversaries.map((anniversary, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={anniversary.label}
                  onChange={(e) => handleAnniversaryChange(index, 'label', e.target.value)}
                  placeholder="Anniversary Label"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={anniversary.date}
                  onChange={(e) => handleAnniversaryChange(index, 'date', e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={anniversary.isPrimary}
                  onChange={(e) => handleAnniversaryChange(index, 'isPrimary', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-600">Primary</label>
              </div>
              <button
                type="button"
                onClick={() => removeAnniversary(index)}
                className="text-red-600 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Wishlist Links</h3>
            <button
              type="button"
              onClick={addWishlistLink}
              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-500"
            >
              Add Link
            </button>
          </div>
          
          {form.wishlistLinks.map((link, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleWishlistLinkChange(index, 'label', e.target.value)}
                  placeholder="Link Label"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleWishlistLinkChange(index, 'url', e.target.value)}
                  placeholder="URL"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeWishlistLink(index)}
                className="text-red-600 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <SubmitButton buttonText="Save" type="submit" />
        <SubmitButton buttonText="Cancel" onClick={onCancel} />
      </div>
    </form>
  );
} 