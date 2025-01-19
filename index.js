require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const twilioRouter = require('./routes/twilio.routes');
const agentRouter = require('./routes/agent.routes');
const callRouter = require('./routes/call.routes');

const app = express();

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3001', 'http://localhost:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'CONNECT', 'TRACE', 'PURGE'],
  },
});
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  '*'
];
// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(origin + ' Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'CONNECT', 'TRACE', 'PURGE'],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/call-center', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('agent:login', (agentId) => {
    socket.join(`agent:${agentId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/twilio', twilioRouter);
app.use('/api/agents', agentRouter);
app.use('/api/calls', callRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
