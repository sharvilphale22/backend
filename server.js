require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const socketHandler = require('./socket/socketHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Make io accessible in controllers
app.set('io', io);

// Initialize socket handler
socketHandler(io);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/student', studentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log(`📋 API Health: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
