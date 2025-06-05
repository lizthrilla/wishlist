'use client';

interface ErrorProps {
  error: string;
}

export default function Error({ error }: ErrorProps) {  
  return (
    <div className="text-red-500 text-sm text-center">{error}</div>
  );
}