import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import srmLogo from "../assets/srm_logo.png";
import styles from "../components/AgentSignUp.module.css";

const AgentSignUp: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignUp = () => {
    let newErrors: { username?: string; email?: string; password?: string } = {};

    if (!username) newErrors.username = "Username is required";
    if (!email) newErrors.email = "Email is required";
    else if (!email.endsWith("@gmail.com") && !email.endsWith("@srmist.edu.in")) {
      newErrors.email = "Email must be @gmail.com or @srmist.edu.in";
    }
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);

    // If no errors, show success message and navigate after 1.5s
    if (Object.keys(newErrors).length === 0) {
      setSuccessMessage("Account created successfully!");
      setTimeout(() => navigate("/login"), 1000);
    }
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
              Enter your details to sign in to your account
            </p>

            {/* Username Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Username</label>
              <input
                type="text"
                placeholder="Username"
                className={styles.inputField}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {errors.username && <p className={styles.errorText}>{errors.username}</p>}
            </div>

            {/* Email Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Email ID</label>
              <input
                type="email"
                placeholder="username@srmist.edu.in"
                className={styles.inputField}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Password</label>
              <input
                type="password"
                placeholder="Password"
                className={styles.inputField}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>

            {/* Success Message */}
            {successMessage && <p className={styles.successText}>{successMessage}</p>}

            {/* Sign Up Button */}
            <button className={styles.signUpBtn} onClick={handleSignUp}>
              Sign Up
            </button>
          </div>
        </div>

        {/* Right Side - Banner */}
        <div className={styles.rightSide}>
          <h3 className={styles.bannerTitle}>
            Insightful and Real-Time Analysis of Published Research Papers
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
