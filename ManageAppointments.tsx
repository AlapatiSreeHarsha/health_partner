import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';
import { useNavigate, useLocation } from 'react-router-dom';

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

const GOOGLE_MEET_API_KEY = 'AIzaSyA5ApdEfOE9W34XxH2IGtGUETRdmrnfLFo';

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const ManageAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>(timeSlots);
  const [initialLoading, setInitialLoading] = useState(true);
  const [meetLoading, setMeetLoading] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { message: 'Please login to view appointments', type: 'info' } });
        return;
      }

      console.log('Fetching appointments with token:', token);
      const response = await fetch(`${API_BASE_URL}/api/appointments/my-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('token'); // Clear the invalid token
        navigate('/login', { state: { message: 'Session expired. Please login again.', type: 'info' } });
        return;
      }

      const data = await response.json();
      console.log('Appointments response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch appointments');
      }

      // Check if data is an array (the server might be sending the appointments directly)
      if (Array.isArray(data)) {
        setAppointments(data);
        if (data.length === 0) {
          setMessage({ text: 'You have no appointments scheduled', type: 'info' });
        }
      } 
      // If data has a success property, handle it the original way
      else if (data.success) {
        setAppointments(data.appointments);
        if (data.appointments.length === 0) {
          setMessage({ text: 'You have no appointments scheduled', type: 'info' });
        }
      } 
      // If we get here, something unexpected happened with the response format
      else {
        console.error('Unexpected response format:', data);
        throw new Error(data.message || 'Unexpected response format');
      }

    } catch (error) {
      console.error('Error fetching appointments:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'Error fetching appointments', 
        type: 'error' 
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Check slot availability
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
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  };

  // Cancel appointment
  const handleCancel = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setLoading(true);
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
        fetchAppointments(); // Refresh the list
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Error cancelling appointment', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Submit reschedule
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !newDate || !newTimeSlot) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/appointments/reschedule/${selectedAppointment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: newDate,
          timeSlot: newTimeSlot,
          doctorName: selectedAppointment.doctorName,
          specialization: selectedAppointment.specialization,
          patientName: selectedAppointment.patientName,
          patientPhone: selectedAppointment.patientPhone,
          reason: selectedAppointment.reason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Close the popup first
        closeReschedulingModal();
        
        // Then fetch new appointments and show success message
        await fetchAppointments();
        setMessage({ text: 'Appointment rescheduled successfully', type: 'success' });
      } else {
        throw new Error(data.message || 'Failed to reschedule appointment');
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Error rescheduling appointment', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to close the modal and reset all related states
  const closeReschedulingModal = () => {
    setIsRescheduling(false);
    setSelectedAppointment(null);
    setNewDate('');
    setNewTimeSlot('');
    setLoading(false);
  };

  // Start rescheduling process
  const startRescheduling = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduling(true);
    setNewDate('');
    setNewTimeSlot('');
    setAvailableSlots(timeSlots);
  };

  // Check available slots for new date
  const handleDateChange = async (date: string) => {
    setNewDate(date);
    if (selectedAppointment && date) {
      try {
        const availabilityData = await checkAvailability(
          selectedAppointment.doctorName,
          date,
          ''
        );
        setAvailableSlots(availabilityData.availableSlots || timeSlots);
      } catch (error) {
        console.error('Error checking date availability:', error);
      }
    }
  };

  // Add this useEffect to ensure form is hidden when appointments are refreshed
  useEffect(() => {
    if (!isRescheduling) {
      setSelectedAppointment(null);
      setNewDate('');
      setNewTimeSlot('');
    }
  }, [isRescheduling]);

  // Add useEffect to handle incoming state messages
  useEffect(() => {
    const locationState = location.state as Location & { message?: string; type?: string };
    if (locationState?.message) {
      setMessage({ text: locationState.message, type: locationState.type || 'info' });
      // Clear the message from navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Create Google Meet link
  const createMeetLink = async (appointment: Appointment) => {
    if (appointment.meetLink) {
      window.open(appointment.meetLink, '_blank');
      return;
    }

    setMeetLoading(prev => ({ ...prev, [appointment._id]: true }));
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
        throw new Error(errorText);
      }

      const data = await response.json();
      if (data.success && data.meetLink) {
        // Update the appointment in the local state with the meet link
        setAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt._id === appointment._id ? { ...apt, meetLink: data.meetLink } : apt
          )
        );
        window.open(data.meetLink, '_blank');
        setMessage({
          text: 'Google Meet link created successfully!',
          type: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to create meet link');
      }
    } catch (error) {
      console.error('Error creating meet link:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to create Google Meet link. Please try again.',
        type: 'error'
      });
    } finally {
      setMeetLoading(prev => ({ ...prev, [appointment._id]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Your Appointments</h2>
      
      {message.text && (
        <div className={`p-4 mb-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {initialLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading appointments...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-600">No appointments found.</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Doctor:</p>
                    <p>{appointment.doctorName}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Specialization:</p>
                    <p>{appointment.specialization}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Date:</p>
                    <p>{new Date(appointment.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Time:</p>
                    <p>{appointment.timeSlot}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Status:</p>
                    <p className={`${
                      appointment.status === 'scheduled' ? 'text-green-600' : 
                      appointment.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </p>
                  </div>
                </div>
                
                {appointment.status === 'scheduled' && (
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={() => startRescheduling(appointment)}
                      className="w-1/3 py-2 px-4 border border-indigo-500 text-indigo-500 rounded-md hover:bg-indigo-50"
                      disabled={loading}
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(appointment._id)}
                      className="w-1/3 py-2 px-4 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => createMeetLink(appointment)}
                      className={`w-1/3 py-2 px-4 border border-green-500 text-green-500 rounded-md hover:bg-green-50 ${
                        meetLoading[appointment._id] ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={meetLoading[appointment._id]}
                    >
                      {meetLoading[appointment._id] ? 'Creating...' : 
                       appointment.meetLink ? 'Join Meet' : 'Create Meet'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Rescheduling Modal */}
      {isRescheduling && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reschedule Appointment</h3>
              <button
                onClick={closeReschedulingModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">New Time Slot</label>
                <select
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  <option value="">Select time</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={closeReschedulingModal}
                  className="w-1/2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-1/2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAppointments; 