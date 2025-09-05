// Debug logging for Railway
console.log('Starting server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT from env:', process.env.PORT);

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('Express initialized, PORT:', PORT);

app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.send('Minimal test server is running!');
});

app.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy', 
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

console.log('About to start listening on port:', PORT);

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`--- MINIMAL SERVER LISTENING ON PORT ${PORT} ---`);
  console.log('Server started successfully');
});
