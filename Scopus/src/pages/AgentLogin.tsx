import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import srmLogo from "../assets/srm_logo.png";
import styles from "../components/AgentLogin.module.css";

const AgentLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });

      if (response.data.success) {
        setSuccess("Login Successful!");
        setError("");

        // Navigate to dashboard after 1 second
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        setError("Invalid Username or Password");
        setUsername("");
        setPassword("");
        setSuccess("");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setError("Invalid Username or Password!");
      setUsername("");
      setPassword("");
      setSuccess("");
    }
  };

  // ✅ Redirect to signup
  const handleRequestNow = () => {
    navigate("/signup");
  };

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <div className={styles.navbar}>
        <h1 className={styles.logo}>SRM SP</h1>
      </div>

      {/* Main Container */}
      <div className={styles.mainContainer}>
        <div className={styles.leftSide}>
          <div className={styles.loginBox}>
            <h2 className={styles.loginTitle}>Agent Login</h2>
            <p className={styles.loginSubtitle}>Enter your details to log in</p>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Username</label>
              <input
                type="text"
                placeholder="Username"
                className={styles.inputField}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                  setSuccess("");
                }}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Password</label>
              <input
                type="password"
                placeholder="Password"
                className={styles.inputField}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setSuccess("");
                }}
              />
            </div>

            {/* Inline Error Message */}
            {error && <p className={styles.errorMsg}>{error}</p>}

            {/* Inline Success Message */}
            {success && <p className={styles.successMsg}>{success}</p>}

            <button className={styles.signInBtn} onClick={handleLogin}>
              Login
            </button>

            {/* ✅ Updated "Request Now" to navigate */}
            <p className={styles.requestText}>
              Don’t have an account?{" "}
              <span className={styles.requestLink} onClick={handleRequestNow}>
                Request now
              </span>
            </p>
          </div>
        </div>

        {/* Right Side - Banner */}
        <div className={styles.rightSide}>
          <h3 className={styles.bannerTitle}>
            From Research to Results: Delivering Insightful Analysis
          </h3>
          <div>
            <img src={srmLogo} alt="SRM Logo" className={styles.bannerImage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;
