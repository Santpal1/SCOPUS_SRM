const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/publications'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api', require('./routes/papers'));
app.use('/api/insights', require('./routes/insights'));


// Test API route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
