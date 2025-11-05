"use client";

interface AccessDeniedMessageProps {
  pathname: string;
}

const AccessDeniedMessage: React.FC<AccessDeniedMessageProps> = ({ pathname }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center p-8">
      <div className="mb-6">
        <svg className="mx-auto h-24 w-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Access Denied
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
        You don't have permission to access this page.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Requested path: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{pathname}</code>
      </p>
    </div>
  </div>
);

export default AccessDeniedMessage;
