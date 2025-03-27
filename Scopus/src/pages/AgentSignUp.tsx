import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import srmLogo from "../assets/srm_logo.png";
import styles from "../components/AgentSignUp.module.css";

const AgentSignUp: React.FC = () => {
  const navigate = useNavigate(); // Initialize navigate function

  const handleSignUp = () => {
    // Redirect to dashboard
    navigate("/dashboard");
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
            <h2 className={styles.loginTitle}>Agent Sign Up</h2>
            <p className={styles.loginSubtitle}>
              Enter your details to get sign in into your account
            </p>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Username</label>
              <input
                type="text"
                placeholder="Username"
                className={styles.inputField}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Email ID</label>
              <input
                type="email"
                placeholder="username@example.com"
                className={styles.inputField}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Password</label>
              <input
                type="password"
                placeholder="Password"
                className={styles.inputField}
              />
            </div>

            {/* Updated Sign Up Button with Redirect */}
            <button className={styles.signUpBtn} onClick={handleSignUp}>
              Sign Up
            </button>
          </div>
        </div>

        {/* Right Side - Banner */}
        <div className={styles.rightSide}>
          <h3 className={styles.bannerTitle}>
            Insightful and Real Time Analysis of Published Research Papers
          </h3>
          <div>
            <img src={srmLogo} alt="Analytics" className={styles.bannerImage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSignUp;
