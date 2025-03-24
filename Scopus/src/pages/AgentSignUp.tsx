import React from "react";
import styles from "../components/AgentSignUp.module.css";
import bannerImage from "../assets/image-1.avif";

const AgentSignUp: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Navbar */}
      <div className={styles.navbar}>
        <h1 className={styles.logo}>ResearchVault</h1>
        <button className={styles.contactBtn}>Contact us</button>
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

            <button className={styles.signUpBtn}>Sign Up</button>
          </div>
        </div>

        {/* Right Side - Banner */}
        <div className={styles.rightSide}>
          <h3 className={styles.bannerTitle}>
            Insightful and Real Time
            Analysis of Published
            Research Papers
          </h3>
          <div>
            <img
              src={bannerImage}
              alt="Analytics"
              className={styles.bannerImage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSignUp;
