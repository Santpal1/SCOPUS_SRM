import React, { useState, useEffect, useRef } from "react";
import styles from "../components/AdminPage.module.css";

interface ProgressEntry {
  time?: string;
  status: string;
  progress?: number;
  processed?: number;
  total?: number;
  message?: string;
  details?: Record<string, any>;
}

const AdminPage: React.FC = () => {
  const [logs, setLogs] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>("");
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [quartileFile, setQuartileFile] = useState<File | null>(null);
  const [quartileUploading, setQuartileUploading] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when logs change
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleRunRefresh = () => {
    setLogs([]);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(0);
    setLoading(true);
    setModalOpen(true);
    setCurrentOperation("Data Refresh");

    const eventSource = new EventSource("http://localhost:5001/admin/run-refresh-stream");

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEntry = JSON.parse(event.data);
        setLogs((prev) => [...prev, data]);

        if (typeof data.progress === "number") {
          setProgress(data.progress);
        }

        if (data.status === "COMPLETE") {
          setLoading(false);
          eventSource.close();
        }
      } catch (err) {
        console.error("Invalid SSE data:", event.data);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      setLoading(false);
      eventSource.close();
    };
  };

  const handleRunScopusScraper = () => {
    setLogs([]);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(0);
    setLoading(true);
    setModalOpen(true);
    setCurrentOperation("Scopus Scraping");

    const eventSource = new EventSource("http://localhost:5001/admin/run-scopus-scraper");

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEntry = JSON.parse(event.data);
        setLogs((prev) => [...prev, data]);

        // Update progress tracking
        if (typeof data.progress === "number") {
          setProgress(data.progress / 100); // Convert percentage to decimal
        }
        
        if (typeof data.processed === "number") {
          setProcessedCount(data.processed);
        }
        
        if (typeof data.total === "number") {
          setTotalCount(data.total);
          // Calculate progress from processed/total if not explicitly provided
          if (data.progress === undefined && data.total > 0) {
            setProgress(data.processed / data.total);
          }
        }

        if (data.status === "COMPLETE" || data.status === "FAILED") {
          setLoading(false);
          eventSource.close();
        }
      } catch (err) {
        console.error("Invalid SSE data:", event.data);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      setLoading(false);
      eventSource.close();
    };
  };

  const handleQuartileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setQuartileFile(e.target.files[0]);
    }
  };

  const handleRunQuartileUpload = () => {
    if (!quartileFile) return;
    setLogs([]);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(0);
    setLoading(true);
    setQuartileUploading(true);
    setModalOpen(true);
    setCurrentOperation("Quartile Upload");

    const formData = new FormData();
    formData.append("file", quartileFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5001/admin/run-quartile-upload", true);
    xhr.setRequestHeader("Accept", "text/event-stream");

    xhr.onreadystatechange = () => {
      // Ignore non-streaming states
      if (xhr.readyState !== 3 && xhr.readyState !== 4) return;
      // Parse SSE lines
      const lines = xhr.responseText.split("\n").filter(Boolean);
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const data: ProgressEntry = JSON.parse(line.replace("data: ", ""));
            setLogs((prev) => [...prev, data]);
            if (typeof data.progress === "number") setProgress(data.progress / 100);
            if (data.status === "COMPLETE" || data.status === "FAILED") {
              setLoading(false);
              setQuartileUploading(false);
            }
          } catch {}
        }
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      setQuartileUploading(false);
    };

    xhr.send(formData);
  };

  const closeModal = () => {
    if (!loading) {
      setModalOpen(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Panel</h1>
        <p>Manage data operations and monitor progress</p>
      </div>

      <div className={styles.actionCards}>
        <div className={styles.actionCard}>
          <div className={styles.cardIcon}>🔄</div>
          <h3>Monthly Data Refresh</h3>
          <p>Synchronize and update monthly data from external sources</p>
          <button
            onClick={handleRunRefresh}
            disabled={loading}
            className={`${styles.actionButton} ${loading && currentOperation === "Data Refresh" ? styles.loading : ''}`}
          >
            {loading && currentOperation === "Data Refresh" ? "Running..." : "Start Refresh"}
          </button>
        </div>

        <div className={styles.actionCard}>
          <div className={styles.cardIcon}>🔍</div>
          <h3>Scopus Scraper</h3>
          <p>Extract and process academic data from Scopus database</p>
          <button
            onClick={handleRunScopusScraper}
            disabled={loading}
            className={`${styles.actionButton} ${loading && currentOperation === "Scopus Scraping" ? styles.loading : ''}`}
          >
            {loading && currentOperation === "Scopus Scraping" ? "Running..." : "Start Scraper"}
          </button>
        </div>

        <div className={styles.actionCard}>
          <div className={styles.cardIcon}>📤</div>
          <h3>Quartile Upload</h3>
          <p>Upload a CSV file to update faculty quartile data</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleQuartileFileChange}
            disabled={loading || quartileUploading}
            style={{ marginBottom: "8px" }}
          />
          <button
            onClick={handleRunQuartileUpload}
            disabled={loading || quartileUploading || !quartileFile}
            className={`${styles.actionButton} ${quartileUploading ? styles.loading : ''}`}
          >
            {quartileUploading ? "Uploading..." : "Upload Quartile CSV"}
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>{currentOperation} Progress</h2>

            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>

            {/* Show processed/total counts for Scopus scraper */}
            {currentOperation === "Scopus Scraping" && totalCount > 0 && (
              <div className={styles.progressText}>
                Progress: {processedCount} / {totalCount} ({Math.round(progress * 100)}%)
              </div>
            )}

            <pre className={styles.logs}>
              {logs.map((log, i) => (
                <div key={i}>
                  [{log.time}] {log.status}
                  {log.message && ` - ${log.message}`}
                  {log.details && Object.keys(log.details).length > 0 &&
                    ` | ${JSON.stringify(log.details)}`
                  }
                </div>
              ))}
              <div ref={logsEndRef} />
            </pre>

            <div className={styles.modalFooter}>
              <button
                onClick={closeModal}
                disabled={loading}
                className={styles.closeButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;