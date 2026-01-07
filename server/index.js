const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/donations', require('./src/routes/donationRoutes'));
app.use('/api/ngo', require('./src/routes/ngoRoutes'));
app.use('/api/ngo-activity', require('./src/routes/volunteerManageRoutes'));
app.use('/api/volunteer', require('./src/routes/volunteerRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.send('FoodBridge Backend is Running!');
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (e) => {
  console.error('Server Listen Error:', e);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
