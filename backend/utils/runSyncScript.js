const { exec } = require('child_process');

module.exports = (req, res) => {
<<<<<<< HEAD
    exec('python3 sync.py', (error, stdout, stderr) => {
        if (error) {
            console.error('Sync error:', error.message);
            return res.status(500).json({ message: 'Sync failed' });
        }
        if (stderr) {
            console.error('Sync stderr:', stderr);
            return res.status(500).json({ message: 'Sync stderr' });
        }
        res.json({ message: 'Sync complete', output: stdout });
    });
};
=======
  exec('python3 sync.py', (error, stdout, stderr) => {
    if (error) {
      console.error('Sync error:', error.message);
      return res.status(500).json({ message: 'Sync failed' });
    }
    if (stderr) {
      console.error('Sync stderr:', stderr);
      return res.status(500).json({ message: 'Sync stderr' });
    }
    res.json({ message: 'Sync complete', output: stdout });
  });
};
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
