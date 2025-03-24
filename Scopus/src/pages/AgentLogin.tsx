import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bannerImage from "../assets/image-2.jpg";
import styles from "../components/AgentLogin.module.css";

const AgentLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });

      if (response.data.success) {
        //alert("Login Successful");
        navigate("/dashboard"); // Route to your ResearchDashboard
      } else {
        alert("Invalid Credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Entered wrong Username or Password!");
    }
  };

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
            <h2 className={styles.loginTitle}>Agent Login</h2>
            <p className={styles.loginSubtitle}>Enter your details to log in</p>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Username</label>
              <input
                type="text"
                placeholder="Username"
                className={styles.inputField}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Password</label>
              <input
                type="password"
                placeholder="Password"
                className={styles.inputField}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className={styles.signInBtn} onClick={handleLogin}>
              Login
            </button>
            <p className={styles.requestText}>
              Don’t have an account?{" "}
              <a href="#" className={styles.requestLink}>
                Request now
              </a>
            </p>
          </div>
        </div>

        {/* Right Side - Banner */}
        <div className={styles.rightSide}>
          <h3 className={styles.bannerTitle}>
            From Research to Results: Delivering Insightful Analysis
          </h3>
          <div>
            <img src={bannerImage} alt="Analytics" className={styles.bannerImage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;
