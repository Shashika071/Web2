const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const xssClean = require('xss-clean');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

// Environment variables directly in the file (instead of .env)
const MONGODB_URI = "mongodb+srv://thirasaim21062:fDfu0hcev0z9KfBq@cluster0.mlkd8.mongodb.net/employeeManagement?retryWrites=true&w=majority&appName=Cluster0";
const PORT = 5001;
const BACKEND_URL = "https://webproject-dzhpfpf7dtfgcshh.southindia-01.azurewebsites.net"; // Adjust to the proper backend URL
const FRONTEND_URL = "https://web-8du.pages.dev"; // Your frontend URL

// Apply XSS protection
app.use(xssClean());

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
    origin: FRONTEND_URL, // ✅ Correct frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
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
