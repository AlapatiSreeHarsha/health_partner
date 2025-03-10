import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Calendar, Clock, Mic, MicOff, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const genAI = new GoogleGenerativeAI('AIzaSyBOi1AVal5k5okLlJEeme2o5s-xSQSX2s8');

// Add interfaces for conversation and appointment tracking
interface Conversation {
  timestamp: number;
  userMessage: string;
  aiResponse: string;
}

interface Appointment {
  _id: string;
  doctorName: string;
  specialization: string;
  date: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  reason: string;
  status: string;
  meetLink?: string;
}

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Maximum requests per window
  windowMs: 60000, // Time window in milliseconds (1 minute)
  requests: [] as number[] // Timestamp array for tracking requests
};

// Function to check if we can make a new request
const canMakeRequest = () => {
  const now = Date.now();
  // Remove timestamps older than our window
  RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
    timestamp => now - timestamp < RATE_LIMIT.windowMs
  );
  // Check if we're under the limit
  return RATE_LIMIT.requests.length < RATE_LIMIT.maxRequests;
};

// Function to track a new request
const trackRequest = () => {
  RATE_LIMIT.requests.push(Date.now());
};

// Fallback response generation without API
const generateFallbackResponse = (doctor: string | null, date: string | null, time: string | null) => {
  if (!doctor && !date && !time) {
    return {
      action: "unknown",
      doctor: null,
      date: null,
      time: null,
      message: "I couldn't understand your request. Please try specifying a doctor, date, and time."
    };
  }

  return {
    action: "schedule",
    doctor: doctor,
    date: date,
    time: time,
    message: `I understand you want to schedule an appointment${doctor ? ` with ${doctor}` : ''}${date ? ` on ${date}` : ''}${time ? ` at ${time}` : ''}. Please fill in any missing details in the form.`
  };
};

interface Doctor {
  name: string;
  shift: string;
  specialization: string;
  availableSlots: string[];
}

const doctors: Doctor[] = [
  { name: "Dr. Naresh", shift: "12:00 AM - 3:00 AM", specialization: "Cardiology", availableSlots: [] },
  { name: "Dr. Suresh", shift: "3:00 AM - 6:00 AM", specialization: "Cardiology", availableSlots: [] },
  { name: "Dr. Siva", shift: "6:00 AM - 9:00 AM", specialization: "Orthopedics", availableSlots: [] },
  { name: "Dr. Balu", shift: "9:00 AM - 12:00 PM", specialization: "Orthopedics", availableSlots: [] },
  { name: "Dr. Raju", shift: "12:00 PM - 3:00 PM", specialization: "Neurology", availableSlots: [] },
  { name: "Dr. Harsha", shift: "3:00 PM - 6:00 PM", specialization: "Neurology", availableSlots: [] },
  { name: "Dr. Santhosh", shift: "6:00 PM - 9:00 PM", specialization: "Pediatrics", availableSlots: [] },
  { name: "Dr. Mahesh", shift: "9:00 PM - 12:00 AM", specialization: "Pediatrics", availableSlots: [] },
];

// Simple natural language processing for fallback
const extractInfoFromText = (text: string) => {
  const doctorMatch = doctors.find(d => 
    text.toLowerCase().includes(d.name.toLowerCase())
  );

  // Simple date extraction (looking for tomorrow or specific dates)
  let date = null;
  if (text.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = tomorrow.toISOString().split('T')[0];
  }

  // Simple time extraction (looking for time patterns)
  const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  let time = null;
  if (timeMatch) {
    const [_, hours, minutes = '00', meridiem] = timeMatch;
    time = `${hours}:${minutes} ${meridiem.toUpperCase()}`;
  }

  return {
    doctor: doctorMatch?.name || null,
    date,
    time
  };
};

interface SmartSchedulingProps {
  className?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

// Add this at the top of your SmartScheduling.tsx file, outside the component
const timeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM"
];

const SmartScheduling: React.FC<SmartSchedulingProps> = ({ className }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [processingVoice, setProcessingVoice] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showConversation, setShowConversation] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);

  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  
  // First step data
  const [initialData, setInitialData] = useState({
    doctorName: '',
    specialization: '',
    date: '',
    timeSlot: '',
    patientName: '',
    patientPhone: '',
    reason: ''
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthesisRef.current = new SpeechSynthesisUtterance();
    speechSynthesisRef.current.rate = 1;
    speechSynthesisRef.current.pitch = 1;
    speechSynthesisRef.current.volume = 1;

    speechSynthesisRef.current.onend = () => {
      setIsSpeaking(false);
    };

    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Function to speak text
  const speakResponse = (text: string) => {
    if (!speechSynthesisRef.current) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    speechSynthesisRef.current.text = text;
    setIsSpeaking(true);
    window.speechSynthesis.speak(speechSynthesisRef.current);
  };

  // Function to stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Modify setResponse to automatically speak new responses
  const setResponseAndSpeak = (text: string | null) => {
    setResponse(text);
    if (text) {
      speakResponse(text);
    }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map(result => result.transcript)
          .join('');
        
        setTranscript(transcript);
        
        // Process voice command when it's final
        if (event.results[0].isFinal) {
          await processVoiceCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Check if a time slot is available
  const isTimeSlotAvailable = (doctor: string, date: string, time: string) => {
    return !appointments.some(
      apt => 
        apt.doctorName === doctor && 
        apt.date === date && 
        apt.timeSlot === time
    );
  };

  // Add appointment
  const addAppointment = (doctor: string, date: string, time: string) => {
    const newAppointment: Appointment = {
      _id: '',
      doctorName: doctor,
      specialization: '',
      date,
      timeSlot: time,
      patientName: '',
      patientPhone: '',
      reason: '',
      status: 'scheduled',
      meetLink: ''
    };
    setAppointments(prev => [...prev, newAppointment]);
  };

  // Add conversation
  const addConversation = (userMessage: string, aiResponse: string) => {
    const newConversation: Conversation = {
      timestamp: Date.now(),
      userMessage,
      aiResponse
    };
    setConversations(prev => [...prev, newConversation]);
  };

  const processVoiceCommand = async (command: string) => {
    setProcessingVoice(true);
    try {
      if (!canMakeRequest()) {
        const extractedInfo = extractInfoFromText(command);
        const fallbackResponse = generateFallbackResponse(
          extractedInfo.doctor,
          extractedInfo.date,
          extractedInfo.time
        );

        if (fallbackResponse.action === "schedule") {
          if (fallbackResponse.doctor) {
            const doctor = doctors.find(d => d.name === fallbackResponse.doctor);
            if (doctor) {
              if (extractedInfo.date && extractedInfo.time &&
                  !isTimeSlotAvailable(doctor.name, extractedInfo.date, extractedInfo.time)) {
                const response = `Sorry, ${doctor.name} is already booked at ${extractedInfo.time}. Please choose another time.`;
                setResponseAndSpeak(response);
                addConversation(command, response);
                return;
              }
              setSelectedDoctor(doctor);
            }
          }
          if (fallbackResponse.date) setSelectedDate(fallbackResponse.date);
          if (fallbackResponse.time) setSelectedTime(fallbackResponse.time);
        }

        setResponseAndSpeak(fallbackResponse.message);
        addConversation(command, fallbackResponse.message);
        return;
      }

      trackRequest();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const systemPrompt = `You are an AI appointment scheduler. Available doctors and their shifts are:
      ${doctors.map(d => `${d.name}: ${d.shift}`).join('\n')}
      
      Current appointments:
      ${appointments.map(a => `${a.doctorName} on ${a.date} at ${a.timeSlot}`).join('\n')}
      
      Based on the user's voice command: "${command}"
      
      If you recognize a scheduling request, extract:
      1. Doctor name (if mentioned)
      2. Date (if mentioned)
      3. Time (if mentioned)
      
      Check if the requested time slot is already booked.
      
      Respond in JSON format:
      {
        "action": "schedule" | "info" | "unknown",
        "doctor": "doctor name or null",
        "date": "YYYY-MM-DD or null",
        "time": "HH:MM AM/PM or null",
        "message": "human readable response"
      }`;

      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text();
      
      try {
        const jsonStr = responseText.trim().replace(/```json\s*|\s*```/g, '');
        const parsedResponse = JSON.parse(jsonStr);
        
        if (parsedResponse.action === "schedule") {
          if (parsedResponse.doctor && parsedResponse.date && parsedResponse.time) {
            if (!isTimeSlotAvailable(parsedResponse.doctor, parsedResponse.date, parsedResponse.time)) {
              const response = `Sorry, ${parsedResponse.doctor} is already booked at ${parsedResponse.time}. Please choose another time.`;
              setResponseAndSpeak(response);
              addConversation(command, response);
              return;
            }
          }
          
          if (parsedResponse.doctor) {
            const doctor = doctors.find(d => d.name.toLowerCase().includes(parsedResponse.doctor.toLowerCase()));
            if (doctor) setSelectedDoctor(doctor);
          }
          if (parsedResponse.date) setSelectedDate(parsedResponse.date);
          if (parsedResponse.time) setSelectedTime(parsedResponse.time);
        }
        
        setResponseAndSpeak(parsedResponse.message);
        addConversation(command, parsedResponse.message);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        setResponseAndSpeak(responseText);
        addConversation(command, responseText);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      const extractedInfo = extractInfoFromText(command);
      const fallbackResponse = generateFallbackResponse(
        extractedInfo.doctor,
        extractedInfo.date,
        extractedInfo.time
      );

      if (fallbackResponse.action === "schedule") {
        if (fallbackResponse.doctor) {
          const doctor = doctors.find(d => d.name === fallbackResponse.doctor);
          if (doctor) setSelectedDoctor(doctor);
        }
        if (fallbackResponse.date) setSelectedDate(fallbackResponse.date);
        if (fallbackResponse.time) setSelectedTime(fallbackResponse.time);
      }

      setResponseAndSpeak(fallbackResponse.message);
      addConversation(command, fallbackResponse.message);
    } finally {
      setProcessingVoice(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setResponse('Listening... Try saying "Schedule an appointment with Dr. Harsha tomorrow at 4 PM"');
    }
    setIsListening(!isListening);
  };

  const handleScheduleAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !patientName || !phoneNumber || !reason) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // Check availability first
      const availabilityData = await checkAvailability(
        selectedDoctor.name,
        selectedDate,
        selectedTime
      );

      if (!availabilityData.available) {
        setMessage({
          text: `This slot is not available. Available slots: ${availabilityData.availableSlots.join(', ')}`,
          type: 'error'
        });
        return;
      }

      // Book the appointment
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorName: selectedDoctor.name,
          specialization: selectedDoctor.specialization,
          date: selectedDate,
          timeSlot: selectedTime,
          patientName,
          patientPhone: phoneNumber,
          reason
        })
      });
      

      const data = await response.json();

      if (data.success) {
        setMessage({ text: 'Appointment booked successfully!', type: 'success' });
        // Clear form
        setPatientName('');
        setPhoneNumber('');
        setReason('');
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedTime('');
        // Refresh appointments
        fetchAppointments();
        addConversation(
          `Schedule appointment with ${selectedDoctor.name}`,
          'Appointment booked successfully!'
        );
      } else {
        throw new Error(data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to book appointment',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSlots = (shift: string) => {
    const [start, end] = shift.split(' - ');
    const slots = [];
    let currentTime = new Date(`2024-01-01 ${start}`);
    const endTime = new Date(`2024-01-01 ${end}`);

    while (currentTime < endTime) {
      slots.push(currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }));
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { message: 'Please login to view appointments', type: 'info' } });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/appointments/my-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { state: { message: 'Session expired. Please login again.', type: 'info' } });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch appointments');
      }

      if (Array.isArray(data)) {
        setAppointments(data);
      } else if (data.success && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Error fetching appointments',
        type: 'error'
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/appointments/cancel/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Appointment cancelled successfully', type: 'success' });
        fetchAppointments();
        addConversation('Cancel appointment', 'Appointment cancelled successfully.');
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Error cancelling appointment', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAvailability = async (doctorName: string, date: string, timeSlot: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/appointments/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorName, date, timeSlot })
      });
      return await response.json();
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  };

  const handleJoinMeet = async (appointment: Appointment) => {
    if (appointment.meetLink) {
      window.open(appointment.meetLink, '_blank');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/appointments/create-meet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: appointment._id
        })
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        const errorText = contentType && contentType.includes("application/json") 
          ? (await response.json()).message 
          : await response.text();
        throw new Error(`Failed to create meet link: ${errorText}`);
      }

      const data = await response.json();
      if (data.success && data.meetLink) {
        // Update appointment in state
        setAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt._id === appointment._id ? { ...apt, meetLink: data.meetLink } : apt
          )
        );
        window.open(data.meetLink, '_blank');
        setMessage({
          text: 'Meet link created successfully!',
          type: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to create meet link');
      }
    } catch (error) {
      console.error('Error creating meet link:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to create meet link',
        type: 'error'
      });
    }
  };

  return (
    <div className={`${className} p-6`}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary-600 mb-2 flex items-center">
            <Calendar className="mr-2 h-6 w-6" />
            Smart Scheduling Assistant
          </h2>
          <button
            onClick={() => setShowConversation(!showConversation)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Toggle appointment history"
          >
            <MessageCircle className="h-5 w-5" />
            <span>History</span>
          </button>
        </div>
        <p className="text-gray-600">
          Schedule appointments with our healthcare professionals.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 mb-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {showConversation && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment History</h3>
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {conversations.map((conv) => (
              <div key={conv.timestamp} className="border-b border-gray-100 pb-2">
                <p className="text-sm text-gray-500">
                  {new Date(conv.timestamp).toLocaleString()}
                </p>
                <p className="text-gray-700 bg-gray-50 p-2 rounded mb-1">
                  <strong>Request:</strong> {conv.userMessage}
                </p>
                <p className="text-primary-600 bg-blue-50 p-2 rounded">
                  <strong>Status:</strong> {conv.aiResponse}
                </p>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-gray-500 text-center">No appointment history</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-4">
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Patient Name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />

            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone Number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for Visit"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none h-24"
              required
            />

            <select
              value={selectedDoctor?.name || ''}
              onChange={(e) => {
                const doctor = doctors.find(d => d.name === e.target.value);
                setSelectedDoctor(doctor || null);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.name} value={doctor.name}>
                  {doctor.name} - {doctor.specialization} ({doctor.shift})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />

            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              disabled={!selectedDoctor}
            >
              <option value="">Select Time</option>
              {selectedDoctor && generateTimeSlots(selectedDoctor.shift).map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>

            <button
              onClick={handleScheduleAppointment}
              disabled={isLoading || !selectedDoctor || !selectedDate || !selectedTime || !patientName || !phoneNumber || !reason}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                'Schedule Appointment'
              )}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Appointments</h3>
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{appointment.doctorName}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.timeSlot}
                      </p>
                      <p className="text-sm text-gray-600">Patient: {appointment.patientName}</p>
                      <p className="text-sm text-gray-600">Phone: {appointment.patientPhone}</p>
                      <p className="text-sm text-gray-600">Reason: {appointment.reason}</p>
                      <p className="text-sm text-gray-600">Status: {appointment.status}</p>
                    </div>
                  </div>
                  {appointment.status === 'scheduled' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleJoinMeet(appointment)}
                        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                      >
                        {appointment.meetLink ? 'Join Meeting' : 'Create Meet'}
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(appointment._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No appointments scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartScheduling; 