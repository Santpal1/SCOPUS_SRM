function errorHandler(err, req, res, next) {
<<<<<<< HEAD
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
}

module.exports = errorHandler;
=======
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
}

module.exports = errorHandler;
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
