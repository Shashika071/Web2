const express = require('express'); // Framework for web servers and APIs
const cors = require('cors'); // Middleware for enabling CORS to communicate between frontend and backend
const mongoose = require('mongoose');
const fs = require('fs'); // Work with file systems
require('dotenv').config(); // Load environment variables from a .env file
const employeeRoutes = require('./routes/employeeRoutes'); // Contains URLs to API requests
const path = require('path');
const xssClean = require('xss-clean');

const app = express();

// Apply XSS clean middleware
app.use(xssClean());

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set in the environment variables.');
  process.exit(1); // Exit the process if MONGODB_URI is not set
}

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line to parse form data

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// CORS middleware
app.use(
  cors({
    origin: 'https://employee-management-2z1.pages.dev', // Allow React frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers
    credentials: true, // Allow cookies if needed
  })
);

// MongoDB connection with error handling
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Use the employee routes
app.use('/api', employeeRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running successfully!' });
});

// General error handling middleware for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const PORT = parseInt(process.env.PORT, 10) || 5001;
let server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle EADDRINUSE error (port already in use)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying another port...`);
    setTimeout(() => {
      server.close();
      server = app.listen(PORT + 1, () => {
        console.log(`Server running on port ${PORT + 1}`);
      });
    }, 1000);
  } else {
    console.error(err);
  }
});
