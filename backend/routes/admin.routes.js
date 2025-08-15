const express = require("express");
const router = express.Router();
const path = require("path");
const { spawn } = require("child_process");

router.get("/run-refresh-stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const scriptPath = path.join(__dirname, "../python_files/scopus_sync.py");
    const pythonProcess = spawn("python", [scriptPath]);

    pythonProcess.stdout.on("data", (data) => {
        const lines = data.toString().trim().split("\n");

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line); // from log_progress()
                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch (err) {
                // Not JSON? send as plain message
                res.write(`data: ${JSON.stringify({ status: line })}\n\n`);
            }
        }
    });

    pythonProcess.stderr.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ status: "ERROR", message: data.toString().trim() })}\n\n`);
    });

    pythonProcess.on("close", (code) => {
        res.write(`data: ${JSON.stringify({ status: "COMPLETE", code })}\n\n`);
        res.end();
    });

    req.on("close", () => {
        pythonProcess.kill();
    });
});

// New route for Scopus scraper
router.get("/run-scopus-scraper", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const scriptPath = path.join(__dirname, "../python_files/graphing_time.py");
    // Pass --express flag to tell Python to get IDs from database
    const pythonProcess = spawn("python", [scriptPath, "--express"]);

    let processedCount = 0;
    let totalCount = 0;

    pythonProcess.stdout.on("data", (data) => {
        const lines = data.toString().trim().split("\n");

        for (const line of lines) {
            try {
                // Try to parse as JSON first (for structured progress updates)
                const parsed = JSON.parse(line);
                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
                
                // Update counters if progress info is available
                if (parsed.processed !== undefined) processedCount = parsed.processed;
                if (parsed.total !== undefined) totalCount = parsed.total;
                
            } catch (err) {
                // Not JSON, send as plain message (fallback)
                res.write(`data: ${JSON.stringify({ 
                    status: "INFO", 
                    message: line,
                    processed: processedCount,
                    total: totalCount
                })}\n\n`);
            }
        }
    });

    pythonProcess.stderr.on("data", (data) => {
        const errorMessage = data.toString().trim();
        res.write(`data: ${JSON.stringify({ 
            status: "ERROR", 
            message: errorMessage,
            processed: processedCount,
            total: totalCount
        })}\n\n`);
    });

    pythonProcess.on("close", (code) => {
        const finalStatus = {
            status: code === 0 ? "COMPLETE" : "FAILED",
            message: code === 0 ? "Scopus scraping completed successfully!" : "Scopus scraping failed",
            processed: processedCount,
            total: totalCount,
            progress: 100,
            code
        };
        res.write(`data: ${JSON.stringify(finalStatus)}\n\n`);
        res.end();
    });

    req.on("close", () => {
        pythonProcess.kill();
    });
});

// Optional: Route to get list of available Scopus IDs (if needed)
router.get("/scopus-authors", (req, res) => {
    // You can implement this to return available author IDs from your database
    // This would allow the frontend to show which authors will be processed
    res.json({ message: "Endpoint for getting Scopus author list" });
});

module.exports = router;