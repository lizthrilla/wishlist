'use client';

export default function SubmitButton({ 
  isLoading, 
  buttonText, 
  loadingText,
  className = '',
  onClick,
  type = 'button'
}: { 
  isLoading?: boolean, 
  buttonText: string, 
  loadingText?: string,
  className?: string,
  onClick?: () => void,
  type?: 'button' | 'submit' | 'reset'
}) {
  const baseClasses = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const mergedClasses = `${baseClasses} ${className}`.trim();

  return (
    <button 
      className={mergedClasses} 
      type={type}
      disabled={isLoading} 
      onClick={onClick}
    >
      {isLoading ? loadingText : buttonText}
    </button>
  );
}