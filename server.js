import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import twilio from 'twilio';
import { google } from 'googleapis';
import { config } from './src/api/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Add Meet API configuration
const MEET_API_KEY = process.env.MEET_API_KEY || 'your-meet-api-key';

// Generate Meet Link function
const generateMeetLink = () => {
  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).substring(7);
  const meetingCode = `${timestamp}-${uniqueId}`.substring(0, 12);
  return `https://meet.google.com/lookup/${meetingCode}?authuser=0&hs=179&apiKey=${MEET_API_KEY}`;
};

// Development CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Remove hardcoded credentials
const client = twilio(config.twilio.accountSid, config.twilio.authToken);

// MongoDB connection with error handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
    
    // Test the connection
    const collections = await mongoose.connection.db.collections();
    console.log('Available collections:', collections.map(c => c.collectionName));
    
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Handle MongoDB events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Chat Schema
const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    content: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      enum: ['user', 'system'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

// User Input Schemas
const healthMonitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skinCondition: String,
  symptoms: [String],
  imageUrl: String,
  notes: String,
  date: {
    type: Date,
    default: Date.now
  }
});

// Add this near the top of your server.js file
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

// Updated Appointment Schema
const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  doctorName: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  reason: String,
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  meetLink: String
}, {
  timestamps: true
});

// Add indexes for better query performance
appointmentSchema.index({ userId: 1, date: 1 });
appointmentSchema.index({ doctorName: 1, date: 1, timeSlot: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

const fitnessDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  height: Number,
  weight: Number,
  age: Number,
  activityLevel: String,
  goals: [String],
  medicalConditions: [String],
  date: {
    type: Date,
    default: Date.now
  }
});

const bloodTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testDate: Date,
  hemoglobin: Number,
  whiteBloodCells: Number,
  redBloodCells: Number,
  platelets: Number,
  otherMetrics: Map,
  notes: String
});

const medicalRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  condition: String,
  medications: [String],
  allergies: [String],
  surgeries: [{
    name: String,
    date: Date,
    notes: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create models
const HealthMonitor = mongoose.model('HealthMonitor', healthMonitorSchema);
const FitnessData = mongoose.model('FitnessData', fitnessDataSchema);
const BloodTest = mongoose.model('BloodTest', bloodTestSchema);
const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

app.post('/api/sos', async (req, res) => {
  try {
    const message = await client.messages.create({
      body: "🚨Urgent! I am in a medical emergency. Please assist me and alert emergency services immediately.🚨",
      from: config.twilio.phoneNumber,
      to: config.twilio.recipientNumber
    });
    
    console.log(`Message sent! SID: ${message.sid}`);
    res.json({ success: true, messageId: message.sid });
  } catch (error) {
    console.error('Error sending SOS message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("MongoDB Connected!");
});

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Middleware to protect routes
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Protected route example
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chat routes
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    // Find existing chat or create new one
    let chat = await Chat.findOne({ userId });
    
    if (!chat) {
      chat = new Chat({ userId, messages: [] });
    }

    // Add new message
    chat.messages.push({
      content: message,
      sender: 'user'
    });

    // Save chat
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Server error during chat' });
  }
});

// Get chat history
app.get('/api/chat/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const chat = await Chat.findOne({ userId });
    res.json(chat || { messages: [] });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error fetching chat history' });
  }
});

// API Routes for storing user inputs
app.post('/api/health-monitor', authMiddleware, async (req, res) => {
  try {
    const newHealthData = new HealthMonitor({
      userId: req.user.userId,
      ...req.body
    });
    await newHealthData.save();
    res.json(newHealthData);
  } catch (error) {
    res.status(500).json({ message: 'Error saving health data', error: error.message });
  }
});

// Check slot availability
app.post('/api/appointments/check-availability', authMiddleware, async (req, res) => {
  try {
    const { doctorName, date, timeSlot } = req.body;

    // Convert the requested date to start and end of day
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    // Get all appointments for this doctor on this day
    const existingAppointments = await Appointment.find({
      doctorName: doctorName,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    });

    console.log('Existing appointments for the day:', existingAppointments);

    // Check if requested slot is available
    const isSlotBooked = existingAppointments.some(apt => apt.timeSlot === timeSlot);

    if (isSlotBooked) {
      // Get all booked slots for this day
      const bookedSlots = existingAppointments.map(apt => apt.timeSlot);
      const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

      return res.json({
        available: false,
        message: 'Selected slot is not available',
        availableSlots: availableSlots
      });
    }

    res.json({
      available: true,
      message: 'Slot is available'
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      message: 'Error checking availability',
      error: error.message
    });
  }
});

// Book appointment route
app.post('/api/appointments/book', authMiddleware, async (req, res) => {
  try {
    const { 
      doctorName, 
      specialization, 
      date, 
      timeSlot, 
      patientName, 
      patientPhone, 
      reason 
    } = req.body;

    console.log('Attempting to book appointment:', {
      doctorName,
      date,
      timeSlot
    });

    // Convert the requested date to start and end of day for comparison
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    // Check for existing appointments in the same slot
    const existingAppointment = await Appointment.findOne({
      doctorName: doctorName,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      timeSlot: timeSlot,
      status: { $ne: 'cancelled' } // Exclude cancelled appointments
    });

    console.log('Existing appointment check result:', existingAppointment);

    if (existingAppointment) {
      // Find available slots for this doctor on this day
      const bookedAppointments = await Appointment.find({
        doctorName: doctorName,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $ne: 'cancelled' }
      });

      const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);
      const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

      return res.status(409).json({
        success: false,
        message: 'This slot is already booked',
        availableSlots: availableSlots,
        error: 'Slot already booked'
      });
    }

    // If no existing appointment, create new one
    const newAppointment = new Appointment({
      userId: req.user.userId,
      doctorName,
      specialization,
      date: new Date(date),
      timeSlot,
      patientName,
      patientPhone,
      reason: reason || '',
      status: 'scheduled'
    });

    await newAppointment.save();
    console.log('New appointment booked successfully:', newAppointment);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
});

// Get user's appointments
app.get('/api/appointments/my-appointments', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      userId: req.user.userId
    }).sort({ date: 1, timeSlot: 1 });

    res.json({
      success: true,
      appointments,
      count: appointments.length
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Helper function to get available slots
async function getAvailableSlots(date, doctorName) {
  const existingAppointments = await Appointment.find({
    doctorName,
    date: {
      $gte: new Date(date).setHours(0,0,0),
      $lt: new Date(date).setHours(23,59,59)
    },
    status: 'scheduled'
  });

  const bookedSlots = existingAppointments.map(apt => apt.timeSlot);
  return timeSlots.filter(slot => !bookedSlots.includes(slot));
}

app.post('/api/fitness-data', authMiddleware, async (req, res) => {
  try {
    const newFitnessData = new FitnessData({
      userId: req.user.userId,
      ...req.body
    });
    await newFitnessData.save();
    res.json(newFitnessData);
  } catch (error) {
    res.status(500).json({ message: 'Error saving fitness data', error: error.message });
  }
});

app.post('/api/blood-test', authMiddleware, async (req, res) => {
  try {
    const newBloodTest = new BloodTest({
      userId: req.user.userId,
      ...req.body
    });
    await newBloodTest.save();
    res.json(newBloodTest);
  } catch (error) {
    res.status(500).json({ message: 'Error saving blood test data', error: error.message });
  }
});

app.post('/api/medical-record', authMiddleware, async (req, res) => {
  try {
    const newRecord = new MedicalRecord({
      userId: req.user.userId,
      ...req.body
    });
    await newRecord.save();
    res.json(newRecord);
  } catch (error) {
    res.status(500).json({ message: 'Error saving medical record', error: error.message });
  }
});

// Get user's data
app.get('/api/health-monitor', authMiddleware, async (req, res) => {
  try {
    const data = await HealthMonitor.find({ userId: req.user.userId }).sort('-date');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health data', error: error.message });
  }
});

// Google Meet endpoint
app.post('/api/appointments/create-meet', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    // Find the appointment first
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has permission to modify this appointment
    if (appointment.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this appointment'
      });
    }

    // Generate meet link using the new function
    const meetLink = generateMeetLink();

    // Update appointment with meet link
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { meetLink: meetLink },
      { new: true }
    );

    res.json({
      success: true,
      meetLink: meetLink,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Google Meet'
    });
  }
});

// Similar GET routes for other data types...

// Middleware to check MongoDB connection
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    return res.status(500).json({
      message: 'Database connection is not ready',
      state: mongoose.connection.readyState
    });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cancel appointment
app.put('/api/appointments/cancel/:id', authMiddleware, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment belongs to user
    if (appointment.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Check if appointment is in the past
    if (new Date(appointment.date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel past appointments'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment'
    });
  }
});

// Reschedule appointment route
app.put('/api/appointments/reschedule/:id', authMiddleware, async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const appointmentId = req.params.id;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment belongs to user
    if (appointment.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reschedule this appointment'
      });
    }

    // Check if appointment is in the past
    if (new Date(appointment.date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule past appointments'
      });
    }

    // Check if new slot is available
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      doctorName: appointment.doctorName,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      timeSlot: timeSlot,
      status: 'scheduled',
      _id: { $ne: appointmentId } // Exclude current appointment
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Selected slot is not available'
      });
    }

    // Update appointment
    appointment.date = new Date(date);
    appointment.timeSlot = timeSlot;
    await appointment.save();

    // Log the update
    console.log('Appointment rescheduled:', {
      id: appointment._id,
      newDate: date,
      newTimeSlot: timeSlot
    });

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment
    });

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error rescheduling appointment',
      error: error.message
    });
  }
});

// Debug route to check all appointments (you can remove this later)
app.get('/api/appointments/debug', authMiddleware, async (req, res) => {
  try {
    const allAppointments = await Appointment.find({});
    const userAppointments = await Appointment.find({ userId: req.user.userId });
    
    res.json({
      success: true,
      debug: {
        totalAppointments: allAppointments.length,
        userAppointments: userAppointments.length,
        userId: req.user.userId,
        allAppointments,
        userAppointments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in debug route',
      error: error.message
    });
  }
});


