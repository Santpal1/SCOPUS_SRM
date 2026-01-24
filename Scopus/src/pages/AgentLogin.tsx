import axios from "axios";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import srmLogo from "../assets/srmist-logo.png";
import srmLogoN from "../assets/srmist-logo.png"; 
import styles from "../components/AgentLogin.module.css";

const AgentLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on access level
      if (user.accessLevel === 3) {
        // Restricted faculty - go to their detail page
        navigate(`/faculty/${user.scopusId || user.facultyId}`);
      } else {
        // Admin and full-access faculty - go to dashboard
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async () => {
    let newErrors: { username?: string; password?: string } = {};

    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await login(username, password);
      setSuccessMessage("Login Successful!");
      setErrors({});
      setUsername("");
      setPassword("");
      // Navigation will happen automatically via useEffect
    } catch (error: any) {
      console.error("Login Error:", error);
      setErrors({ password: error.message || "Invalid Username or Password!" });
      setUsername("");
      setPassword("");
      setSuccessMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNow = () => {
    navigate("/signup");
  };

  const handleBack = () => {
    navigate("/");
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <button className={styles.backButton} onClick={handleBack} title="Go to Home">
          <ArrowLeft size={24} />
        </button>
        <a className={styles.logo1}>
          <img src={srmLogoN} alt="Srm Logo" className={styles.navLogo} /> 
          <span>SRM SP</span>
        </a>
      </div>
      <div className={styles.mainContainer}>
        <div className={styles.leftSide}>
          <div className={styles.loginBox} onKeyDown={handleKeyDown}>
            <h2 className={styles.loginTitle}>Faculty Login</h2>
            <p className={styles.loginSubtitle}>Enter your Faculty ID and Password to log in</p>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Faculty ID / Username</label>
              <input
                type="text"
                placeholder="Faculty ID or Username"
                className={styles.inputField}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
              {errors.username && <p className={styles.errorText}>{errors.username}</p>}
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
                  disabled={isLoading}
                />
                <span className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>
            {successMessage && <p className={styles.successText}>{successMessage}</p>}
            <button 
              className={styles.signInBtn} 
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
            <p className={styles.requestText}>
              Don't have an account? <span className={styles.requestLink} onClick={handleRequestNow}>Request now</span>
            </p>
          </div>
        </div>
        <div className={styles.rightSide}>
          <h3 className={styles.bannerTitle}>From Research to Results: Delivering Insightful Analysis</h3>
          <div>
            <img src={srmLogo} alt="SRM Logo" className={styles.bannerImage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;
