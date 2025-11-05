"use client";

interface AuthLoadingMessageProps {
  text: string;
  spinnerColor?: string;
}

const AuthLoadingMessage: React.FC<AuthLoadingMessageProps> = ({ 
  text, 
  spinnerColor = "border-blue-500" 
}) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center p-8">
      <div className="inline-block">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${spinnerColor}`}></div>
      </div>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{text}</p>
    </div>
  </div>
);

export default AuthLoadingMessage;
