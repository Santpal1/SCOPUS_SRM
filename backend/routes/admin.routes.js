const express = require("express");
const router = express.Router();
const path = require("path");
const { spawn } = require("child_process");
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

router.get("/run-refresh-stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const scriptPath = path.join(__dirname, "../python_files/scopus_sync.py");
    const pythonProcess = spawn("python3", [scriptPath]);

    pythonProcess.stdout.on("data", (data) => {
        const lines = data.toString().trim().split("\n");
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch {
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
    const pythonProcess = spawn("python3", [scriptPath, "--express"]);

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
            } catch {
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
        res.write(`data: ${JSON.stringify({ 
            status: "ERROR", 
            message: data.toString().trim(),
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
            } catch {
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
        fs.unlink(req.file.path, () => {});
    });

    req.on("close", () => {
        pythonProcess.kill();
    });
});

router.post("/run-scival-upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const scriptPath = path.join(__dirname, "../python_files/scival_data_to_db.py");
    const pythonProcess = spawn("python", [scriptPath, req.file.path]);

    pythonProcess.stdout.on("data", (data) => {
        const lines = data.toString().trim().split("\n");
        for (const line of lines) {
            res.write(`data: ${JSON.stringify({ status: "INFO", message: line })}\n\n`);
        }
    });

    pythonProcess.stderr.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ status: "ERROR", message: data.toString().trim() })}\n\n`);
    });

    pythonProcess.on("close", (code) => {
        res.write(`data: ${JSON.stringify({ 
            status: code === 0 ? "COMPLETE" : "FAILED", 
            message: code === 0 ? "Scival upload finished successfully!" : "Scival upload failed", 
            code 
        })}\n\n`);
        res.end();
        fs.unlink(req.file.path, () => {});
    });

    req.on("close", () => {
        pythonProcess.kill();
    });
});

// 🆕 New Route: Add Author to Database
router.post("/add-author", express.json(), async (req, res) => {
    try {
        const { name, scopus_id, faculty_id, email, designation, mobile_no, doj } = req.body;

        console.log("=== ADD AUTHOR REQUEST ===");
        console.log("Name:", name);
        console.log("Scopus ID:", scopus_id);
        console.log("Faculty ID:", faculty_id);
        console.log("Email:", email);
        console.log("Designation:", designation);
        console.log("Mobile No:", mobile_no);
        console.log("DOJ:", doj);

        // Validate input
        if (!name || !scopus_id || !faculty_id) {
            return res.status(400).json({ 
                error: "Missing required fields: name, scopus_id, and faculty_id are required" 
            });
        }

        // Validate Scopus ID format (should be numeric)
        if (!/^\d+$/.test(scopus_id)) {
            return res.status(400).json({ 
                error: "Invalid Scopus ID format. Must contain only numbers." 
            });
        }

        // Call Python script to add author to database
        const scriptPath = path.join(__dirname, "../db_thingies/add_author.py");
        console.log("Script path:", scriptPath);
        console.log("Script exists:", fs.existsSync(scriptPath));
        
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn("python3", [
                scriptPath,
                name.trim(),
                scopus_id.trim(),
                faculty_id.trim(),
                email ? email.trim() : "",
                designation ? designation.trim() : "",
                mobile_no ? mobile_no.trim() : "",
                doj ? doj.trim() : ""
            ]);

            let stdout = "";
            let stderr = "";

            pythonProcess.stdout.on("data", (data) => {
                const output = data.toString();
                console.log("Python stdout:", output);
                stdout += output;
            });

            pythonProcess.stderr.on("data", (data) => {
                const error = data.toString();
                console.log("Python stderr:", error);
                stderr += error;
            });

            pythonProcess.on("close", (code) => {
                console.log("Python process exited with code:", code);
                console.log("Full stdout:", stdout);
                console.log("Full stderr:", stderr);

                if (code === 0) {
                    try {
                        // Try to parse JSON response from Python script
                        const result = JSON.parse(stdout.trim());
                        res.status(200).json({
                            success: true,
                            message: `Author "${name}" added successfully`,
                            data: result
                        });
                        resolve();
                    } catch (parseError) {
                        console.log("JSON parse error:", parseError);
                        // If not JSON, return raw output
                        res.status(200).json({
                            success: true,
                            message: `Author "${name}" added successfully`,
                            output: stdout.trim()
                        });
                        resolve();
                    }
                } else {
                    // Parse error details
                    let errorDetails = stderr.trim() || stdout.trim() || `Process exited with code ${code}`;
                    let parsedError = null;
                    
                    try {
                        // Try to parse JSON error from Python
                        parsedError = JSON.parse(stderr.trim() || stdout.trim());
                    } catch (e) {
                        // Not JSON, use raw text
                    }

                    // Check if author already exists
                    if (stderr.includes("already exists") || stdout.includes("already exists")) {
                        res.status(409).json({
                            error: `Author with Scopus ID ${scopus_id} already exists in the database`,
                            details: parsedError
                        });
                    } else {
                        res.status(500).json({
                            error: parsedError?.message || "Failed to add author to database",
                            exitCode: code,
                            stdout: stdout.trim(),
                            stderr: stderr.trim(),
                            details: parsedError || errorDetails
                        });
                    }
                    resolve();
                }
            });

            pythonProcess.on("error", (error) => {
                console.error("Python process error:", error);
                res.status(500).json({
                    error: "Failed to execute Python script",
                    details: error.message,
                    scriptPath: scriptPath
                });
                reject(error);
            });
        });

    } catch (error) {
        console.error("Add author error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
});

module.exports = router;