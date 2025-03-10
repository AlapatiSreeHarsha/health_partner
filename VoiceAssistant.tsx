import React, { useState, useEffect } from 'react';

interface VoiceAssistantProps {
  onResult: (text: string) => void;
  onError: (error: string) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onResult, onError }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onResult(text);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        onError('Error occurred in recognition: ' + event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    } else {
      onError('Speech recognition not supported in this browser');
    }
  }, [onResult, onError]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`px-4 py-2 rounded-full ${
          isListening 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white flex items-center space-x-2`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
            clipRule="evenodd"
          />
        </svg>
        <span>{isListening ? 'Stop' : 'Start'} Voice Input</span>
      </button>
      {isListening && (
        <span className="text-blue-600 animate-pulse">Listening...</span>
      )}
    </div>
  );
};

export default VoiceAssistant; 