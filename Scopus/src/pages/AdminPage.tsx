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
  const [scivalFile, setScivalFile] = useState<File | null>(null);
  const [scivalUploading, setScivalUploading] = useState(false);
  
  // Add Author state
  const [addAuthorModalOpen, setAddAuthorModalOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [scopusId, setScopusId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [doj, setDoj] = useState("");
  const [addingAuthor, setAddingAuthor] = useState(false);
  const [authorFormError, setAuthorFormError] = useState("");
  const [authorFormSuccess, setAuthorFormSuccess] = useState("");

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
          setProgress(data.progress / 100);
        }
        
        if (typeof data.processed === "number") {
          setProcessedCount(data.processed);
        }
        
        if (typeof data.total === "number") {
          setTotalCount(data.total);
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
      if (xhr.readyState !== 3 && xhr.readyState !== 4) return;
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

  const handleScivalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setScivalFile(e.target.files[0]);
    }
  };

  const handleRunScivalUpload = () => {
    if (!scivalFile) return;
    setLogs([]);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(0);
    setLoading(true);
    setScivalUploading(true);
    setModalOpen(true);
    setCurrentOperation("Scival Upload");

    const formData = new FormData();
    formData.append("file", scivalFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5001/admin/run-scival-upload", true);
    xhr.setRequestHeader("Accept", "text/event-stream");

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 3 && xhr.readyState !== 4) return;
      const lines = xhr.responseText.split("\n").filter(Boolean);
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const data: ProgressEntry = JSON.parse(line.replace("data: ", ""));
            setLogs((prev) => [...prev, data]);
            if (typeof data.progress === "number") setProgress(data.progress / 100);
            if (data.status === "COMPLETE" || data.status === "FAILED") {
              setLoading(false);
              setScivalUploading(false);
            }
          } catch {}
        }
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      setScivalUploading(false);
    };

    xhr.send(formData);
  };

  const openAddAuthorModal = () => {
    setAddAuthorModalOpen(true);
    setAuthorName("");
    setScopusId("");
    setFacultyId("");
    setEmail("");
    setDesignation("");
    setMobileNo("");
    setDoj("");
    setAuthorFormError("");
    setAuthorFormSuccess("");
  };

  const closeAddAuthorModal = () => {
    if (!addingAuthor) {
      setAddAuthorModalOpen(false);
      setAuthorName("");
      setScopusId("");
      setFacultyId("");
      setEmail("");
      setDesignation("");
      setMobileNo("");
      setDoj("");
      setAuthorFormError("");
      setAuthorFormSuccess("");
    }
  };

  const handleAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthorFormError("");
    setAuthorFormSuccess("");

    if (!authorName.trim() || !scopusId.trim() || !facultyId.trim() || !email.trim() || !designation.trim() || !mobileNo.trim() || !doj.trim()) {
      setAuthorFormError("Please fill in all fields");
      return;
    }

    if (!/^\d+$/.test(scopusId.trim()) || scopusId.trim().length !== 11) {
      setAuthorFormError("Scopus ID should contain only numbers and be exactly 11 characters long");
      return;
    }

    if (facultyId.trim().length !== 6) {
      setAuthorFormError("Faculty ID should be exactly 6 characters long");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAuthorFormError("Please enter a valid email address");
      return;
    }

    if (!email.trim().endsWith("@srmist.edu.in")) {
      setAuthorFormError("Email must end with @srmist.edu.in");
      return;
    }

    if (!/^\d{10}$/.test(mobileNo.trim())) {
      setAuthorFormError("Mobile number must be exactly 10 digits");
      return;
    }

    setAddingAuthor(true);

    try {
      const response = await fetch("http://localhost:5001/admin/add-author", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: authorName.trim(),
          scopus_id: scopusId.trim(),
          faculty_id: facultyId.trim(),
          email: email.trim(),
          designation: designation.trim(),
          mobile_no: mobileNo.trim(),
          doj: doj.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAuthorFormSuccess(`✓ Author "${authorName}" added successfully!`);
        setAuthorName("");
        setScopusId("");
        setFacultyId("");
        setEmail("");
        setDesignation("");
        setMobileNo("");
        setDoj("");
        setTimeout(() => {
          closeAddAuthorModal();
        }, 2000);
      } else {
        setAuthorFormError(result.error || "Failed to add author");
      }
    } catch (error) {
      setAuthorFormError("Network error. Please try again.");
      console.error("Add author error:", error);
    } finally {
      setAddingAuthor(false);
    }
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
            className={styles.fileInput}
          />
          <button
            onClick={handleRunQuartileUpload}
            disabled={loading || quartileUploading || !quartileFile}
            className={`${styles.actionButton} ${quartileUploading ? styles.loading : ''}`}
          >
            {quartileUploading ? "Uploading..." : "Upload Quartile CSV"}
          </button>
        </div>
        
        <div className={styles.actionCard}>
          <div className={styles.cardIcon}>📈</div>
          <h3>Scival Upload</h3>
          <p>Upload a Scival CSV file to update faculty Scival data</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleScivalFileChange}
            disabled={loading || scivalUploading}
            className={styles.fileInput}
          />
          <button
            onClick={handleRunScivalUpload}
            disabled={loading || scivalUploading || !scivalFile}
            className={`${styles.actionButton} ${scivalUploading ? styles.loading : ''}`}
          >
            {scivalUploading ? "Uploading..." : "Upload Scival CSV"}
          </button>
        </div>

        <div className={styles.actionCard}>
          <div className={styles.cardIcon}>➕</div>
          <h3>Add New Author</h3>
          <p>Add a new faculty member with their Scopus ID</p>
          <button
            onClick={openAddAuthorModal}
            disabled={loading}
            className={styles.actionButton}
          >
            Add Author
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{currentOperation} Progress</h2>
              <div className={styles.statusIndicator}>
                <div className={styles.statusDot}></div>
                <span className={styles.statusText}>Live</span>
              </div>
            </div>

            <div className={styles.progressSection}>
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <div className={styles.progressPercentage}>
                {Math.round(progress * 100)}%
              </div>
            </div>

            {currentOperation === "Scopus Scraping" && totalCount > 0 && (
              <div className={styles.progressStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{processedCount.toLocaleString()}</span>
                  <span className={styles.statLabel}>Processed</span>
                </div>
                <div className={styles.statDivider}>/</div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{totalCount.toLocaleString()}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
              </div>
            )}

            <div className={styles.logsContainer}>
              <div className={styles.logsHeader}>
                <span>Console Output</span>
              </div>
              <pre className={styles.logs}>
                {logs.map((log, i) => (
                  <div key={i} className={styles.logEntry}>
                    <span className={styles.logTime}>[{log.time || new Date().toLocaleTimeString()}]</span>
                    <span className={`${styles.logStatus} ${styles[log.status.toLowerCase()]}`}>
                      {log.status}
                    </span>
                    {log.message && <span className={styles.logMessage}>- {log.message}</span>}
                    {log.details && Object.keys(log.details).length > 0 &&
                      <div className={styles.logDetails}>
                        {JSON.stringify(log.details)}
                      </div>
                    }
                  </div>
                ))}
                <div ref={logsEndRef} />
              </pre>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={closeModal}
                disabled={loading}
                className={styles.closeButton}
              >
                {loading ? 'Operation in Progress...' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addAuthorModalOpen && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) closeAddAuthorModal();
        }}>
          <div className={styles.addAuthorModal}>
            <div className={styles.addAuthorHeader}>
              <div className={styles.addAuthorIconWrapper}>
                <div className={styles.addAuthorIcon}>👤</div>
              </div>
              <h2 className={styles.addAuthorTitle}>Add New Author</h2>
              <p className={styles.addAuthorSubtitle}>Enter the author's details to add them to the database</p>
            </div>

            <form onSubmit={handleAddAuthor} className={styles.addAuthorForm}>
              <div className={styles.addAuthorFormGroup}>
                <label htmlFor="authorName" className={styles.addAuthorLabel}>
                  <span className={styles.labelIcon}>📝</span>
                  <span>Full Name</span>
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="authorName"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  disabled={addingAuthor}
                  className={styles.addAuthorInput}
                  autoFocus
                />
              </div>

              <div className={styles.addAuthorFormGroup}>
                <label htmlFor="scopusId" className={styles.addAuthorLabel}>
                  <span className={styles.labelIcon}>🔢</span>
                  <span>Scopus ID</span>
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="scopusId"
                  type="text"
                  value={scopusId}
                  onChange={(e) => setScopusId(e.target.value)}
                  placeholder="57123456789"
                  disabled={addingAuthor}
                  className={styles.addAuthorInput}
                />
                <p className={styles.inputHint}>Enter 11-digit numeric Scopus ID only</p>
              </div>

              <div className={styles.addAuthorFormGroup}>
                <label htmlFor="facultyId" className={styles.addAuthorLabel}>
                  <span className={styles.labelIcon}>🆔</span>
                  <span>Faculty ID</span>
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="facultyId"
                  type="text"
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  placeholder="FAC001"
                  disabled={addingAuthor}
                  className={styles.addAuthorInput}
                />
                <p className={styles.inputHint}>Enter 6-character faculty identifier</p>
              </div>

              <div className={styles.addAuthorFormGroup}>
                <label htmlFor="email" className={styles.addAuthorLabel}>
                  <span className={styles.labelIcon}>📧</span>
                  <span>Email</span>
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.smith@srmist.edu.in"
                  disabled={addingAuthor}
                  className={styles.addAuthorInput}
                />
                <p className={styles.inputHint}>Enter valid @srmist.edu.in email address</p>
              </div>

              <div className={styles.addAuthorFormGroup}>
                <label htmlFor="designation" className={styles.addAuthorLabel}>
                  <span className={styles.labelIcon}>👔</span>
                  <span>Designation</span>
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Associate Professor"
                  disabled={addingAuthor}
                  className={styles.addAuthorInput}
                />
                <p className={styles.inputHint}>e.g., Professor, Assistant Professor, etc.</p>
              </div>

              <div className={styles.addAuthorFormGroup}>
                <label htmlFor="mobileNo" className={styles.addAuthorLabel}>
                  <span className={styles.labelIcon}>📱</span>
                  <span>Mobile Number</span>
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="mobileNo"
                  type="tel"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  placeholder="9876543210"
                  disabled={addingAuthor}
                  className={styles.addAuthorInput}
                  maxLength={10}
                />
                <p className={styles.inputHint}>Enter 10-digit mobile number without country code</p>
              </div>

              <div className={styles.addAuthorFormGroup}>
                <label htmlFor="doj" className={styles.addAuthorLabel}>
                  <span className={styles.labelIcon}>📅</span>
                  <span>Date of Joining</span>
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="doj"
                  type="date"
                  value={doj}
                  onChange={(e) => setDoj(e.target.value)}
                  disabled={addingAuthor}
                  className={styles.addAuthorInput}
                />
                <p className={styles.inputHint}>Select the date when the faculty member joined</p>
              </div>

              {authorFormError && (
                <div className={styles.addAuthorError}>
                  <span className={styles.errorIcon}>⚠️</span>
                  <span>{authorFormError}</span>
                </div>
              )}

              {authorFormSuccess && (
                <div className={styles.addAuthorSuccess}>
                  <span className={styles.successIcon}>✓</span>
                  <span>{authorFormSuccess}</span>
                </div>
              )}

              <div className={styles.addAuthorFooter}>
                <button
                  type="button"
                  onClick={closeAddAuthorModal}
                  disabled={addingAuthor}
                  className={styles.addAuthorCancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAuthor || !authorName.trim() || !scopusId.trim() || !facultyId.trim() || !email.trim() || !designation.trim() || !mobileNo.trim()}
                  className={`${styles.addAuthorSubmitButton} ${addingAuthor ? styles.submitting : ''}`}
                >
                  {addingAuthor ? (
                    <>
                      <span className={styles.spinner}></span>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <span>➕</span>
                      <span>Add Author</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;