const express = require("express");
const router = express.Router();
const path = require("path");
const { spawn } = require("child_process");
const multer = require("multer");
const fs = require("fs");

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// ==============================
// Existing routes
// ==============================

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
                const parsed = JSON.parse(line); 
                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch (err) {
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

router.get("/run-scopus-scraper", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const scriptPath = path.join(__dirname, "../python_files/graphing_time.py");
    const pythonProcess = spawn("python", [scriptPath, "--express"]);

    let processedCount = 0;
    let totalCount = 0;

    pythonProcess.stdout.on("data", (data) => {
        const lines = data.toString().trim().split("\n");

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
                if (parsed.processed !== undefined) processedCount = parsed.processed;
                if (parsed.total !== undefined) totalCount = parsed.total;
            } catch (err) {
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

// ==============================
// NEW ROUTE: Quartile Uploader
// ==============================

router.post("/run-quartile-upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const scriptPath = path.join(__dirname, "../python_files/quartiles_update.py");
    const pythonProcess = spawn("python", [scriptPath, req.file.path]);

    pythonProcess.stdout.on("data", (data) => {
        const lines = data.toString().trim().split("\n");
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch (err) {
                res.write(`data: ${JSON.stringify({ status: "INFO", message: line })}\n\n`);
            }
        }
    });

    pythonProcess.stderr.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ status: "ERROR", message: data.toString().trim() })}\n\n`);
    });

    pythonProcess.on("close", (code) => {
        res.write(`data: ${JSON.stringify({ 
            status: code === 0 ? "COMPLETE" : "FAILED", 
            message: code === 0 ? "Quartile upload finished successfully!" : "Quartile upload failed", 
            code 
        })}\n\n`);
        res.end();

        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });
    });

    req.on("close", () => {
        pythonProcess.kill();
    });
});

// Optional: route to preview authors
router.get("/scopus-authors", (req, res) => {
    res.json({ message: "Endpoint for getting Scopus author list" });
});

module.exports = router;
