'use client';

export default function SignOutButton({ onClick, disabled, buttonText }: { onClick: () => void, disabled: boolean, buttonText: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{buttonText}</button>
  );
}