const express = require('express');
const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
  res.send('Minimal test server is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

app.listen(PORT, () => {
  console.log(`--- MINIMAL SERVER LISTENING ON PORT ${PORT} ---`);
});
