import React from 'react';
import { Link } from 'react-router-dom';
import GlobalCollabMap from '../components/GlobalCollabMap';
import CombinedSDGDashboard from '../components/CombinedSDGDashboard';
import srmLogo from "../assets/srmist-logo.png";
import '../components/AnalyticsPage.css';

import { useEffect } from 'react';


const AnalyticsPage: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    
    return (
        <div>
            {/* Navbar */}
            <div className="analytics-navbar">
                <a className="analytics-logo">
                    <img src={srmLogo} alt="SRM Logo" className="analytics-navLogo" />
                    <span>SRM SP</span>
                </a>
            </div>

            <div className="analytics-container">
                {/* Back Button */}
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
                    <Link to="/dashboard" className="back-button">
                        &laquo; Back to Dashboard
                    </Link>
                </div>

                <h1 style={{ textAlign: 'center', fontSize: 50, color: '#2980b9' }}>
                    ANALYTICS DASHBOARD
                </h1>

                <section style={{ marginBottom: 40 }}>
                    <GlobalCollabMap />
                </section>

                <section style={{ marginBottom: 40 }}>
                    <CombinedSDGDashboard />
                </section>

            </div>
        </div>
    );
};

export default AnalyticsPage;
