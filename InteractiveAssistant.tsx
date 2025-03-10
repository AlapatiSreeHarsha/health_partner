import React, { useState, useEffect, useRef } from 'react';
import { getGeminiResponse } from '../utils/gemini';
import { API_BASE_URL } from '../api/config';

interface Message {
  content: string;
  speaker: 'user' | 'assistant';
  timestamp: Date;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  availability: Array<{
    day: string;
    slots: string[];
  }>;
}

const InteractiveAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    fetchDoctors();
    startConversation();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/doctors`);
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const startConversation = async () => {
    const initialMessage = "Hello! I'm your medical appointment assistant. How can I help you today? I can help you find a doctor and book an appointment based on your medical needs.";
    await addMessage(initialMessage, 'assistant');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = async (content: string, speaker: 'user' | 'assistant') => {
    const newMessage = { content, speaker, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/chat/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: content, speaker })
      });
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput('');
    await addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userResponse = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userResponse.json();

      const appointmentsResponse = await fetch(`${API_BASE_URL}/api/appointments/my-appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appointmentsData = await appointmentsResponse.json();

      const context = {
        doctors,
        appointments: appointmentsData,
        currentUser: userData
      };

      const assistantResponse = await getGeminiResponse(userMessage, context);
      await addMessage(assistantResponse, 'assistant');
    } catch (error) {
      console.error('Error processing message:', error);
      await addMessage("I apologize, but I'm having trouble processing your request. Please try again.", 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.speaker === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.speaker === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-75">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default InteractiveAssistant; 