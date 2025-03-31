import React from 'react';

interface ErrorMessageProps {
  error: Error | null;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry }) => {
  if (!error) return null;
  
  return (
    <div className="error-message">
      <h3>Error</h3>
      <p>{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;