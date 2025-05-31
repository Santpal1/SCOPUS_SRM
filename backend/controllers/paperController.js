const db = require('../config/db.js');

exports.getPaperDetails = (req, res) => {
    const { doi } = req.params;

    // Query paper basic info
    db.query('SELECT * FROM papers WHERE doi = ?', [doi], (err, paperResults) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch paper details' });
        if (!paperResults.length) return res.status(404).json({ error: 'Paper not found' });

        // Query insights for this paper
        db.query('SELECT * FROM paper_insights WHERE doi = ?', [doi], (err, insightsResults) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch paper insights' });

            // Merge paper + insights in response
            res.json({ paper: paperResults[0], insights: insightsResults[0] || null });
        });
    });
};