const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Minimal test server is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`--- MINIMAL SERVER LISTENING ON PORT ${PORT} ---`);
});
