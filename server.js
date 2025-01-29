const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const xssClean = require('xss-clean');
require('dotenv').config();
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

// Apply XSS protection
app.use(xssClean());

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not set in environment variables.');
  process.exit(1);
}

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure the 'uploads' directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// CORS middleware (Allow only requests from your frontend)
app.use(
  cors({
    origin: 'https://web-8du.pages.dev', // ✅ Correct frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Use the employee routes
app.use('/api', employeeRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: '✅ Server is running successfully!' });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ error: '❌ Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '❌ Internal server error' });
});

// Use correct PORT from .env or fallback
const PORT = parseInt(process.env.PORT, 10) || 5001;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

let server = app.listen(PORT, () => {
  console.log(`🚀 Server running at: ${BACKEND_URL}`);
});

// Handle EADDRINUSE error (port already in use)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Retrying on another port...`);
    setTimeout(() => {
      server.close();
      server = app.listen(PORT + 1, () => {
        console.log(`🚀 Server running on port ${PORT + 1}`);
      });
    }, 1000);
  } else {
    console.error(err);
  }
});
