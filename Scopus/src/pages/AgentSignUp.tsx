import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import srmLogo from "../assets/srmist-logo.png";
import styles from "../components/AgentSignUp.module.css";

const AgentSignUp: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    if (Object.keys(newErrors).length === 0) {
      setSuccessMessage("Account created successfully!");
      setTimeout(() => navigate("/login"), 1000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <a className={styles.logo} href="http://localhost:5173/">
          SRM SP
        </a>
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.leftSide}>
          <div className={styles.loginBox}>
            <h2 className={styles.loginTitle}>Faculty Sign Up</h2>
            <p className={styles.loginSubtitle}>
              Enter your details to sign in to your account
            </p>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Username</label>
              <input
                type="text"
                placeholder="Username"
                className={styles.inputField}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {errors.username && (
                <p className={styles.errorText}>{errors.username}</p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Email ID</label>
              <input
                type="email"
                placeholder="username@srmist.edu.in"
                className={styles.inputField}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className={styles.errorText}>{errors.email}</p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className={styles.inputField}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              {errors.password && (
                <p className={styles.errorText}>{errors.password}</p>
              )}
            </div>

            {successMessage && (
              <p className={styles.successText}>{successMessage}</p>
            )}

            <button className={styles.signUpBtn} onClick={handleSignUp}>
              Sign Up
            </button>
          </div>
        </div>

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
