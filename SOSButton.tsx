import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface SOSButtonProps {
  className?: string;
  variant?: 'nav' | 'card';
}

const SOSButton: React.FC<SOSButtonProps> = ({ className, variant = 'card' }) => {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const sendSOSMessage = async () => {
    if (sending) return;

    setSending(true);
    setStatus('idle');

    try {
      const response = await fetch('http://localhost:5000/api/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SOS');
      }

      setStatus('success');
      alert('Emergency SOS message sent successfully! Help is on the way.');
    } catch (error) {
      console.error('Error sending SOS message:', error);
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  if (variant === 'nav') {
    return (
      <button
        onClick={sendSOSMessage}
        disabled={sending}
        className={`flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors ${
          sending ? 'opacity-50 cursor-not-allowed' : ''
        } ${className || ''}`}
      >
        <AlertCircle className="h-4 w-4" />
        <span>{sending ? 'Sending...' : 'SOS'}</span>
      </button>
    );
  }

  return (
    <div className={`${className || ''} p-6 bg-white rounded-xl shadow-lg border-2 border-red-500`}>
      <div className="text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        <h3 className="text-2xl font-bold text-gray-800">Emergency SOS</h3>
        <p className="text-gray-600">
          Click the button below to immediately alert emergency contacts and request assistance.
        </p>
        <button
          onClick={sendSOSMessage}
          disabled={sending}
          className={`w-full py-4 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
            sending ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {sending ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending SOS...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Send SOS Alert</span>
            </div>
          )}
        </button>
        {status === 'success' && (
          <p className="text-green-600 font-medium">Emergency contacts have been notified</p>
        )}
        {status === 'error' && (
          <p className="text-red-600 font-medium">Failed to send alert. Please try again or call emergency services directly.</p>
        )}
      </div>
    </div>
  );
};

export default SOSButton; 