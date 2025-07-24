import React from 'react';
import { Link } from 'react-router-dom';
import GlobalCollabMap from '../components/GlobalCollabMap';
import SDGPieChart from '../components/SDGPieChart';
import SDGTagCloud from '../components/SDGTagCloud';
import '../components/AnalyticsPage.css';

const AnalyticsPage: React.FC = () => {
    return (
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
                <SDGPieChart />
            </section>
            <section className="mt-6">
                <SDGTagCloud />
            </section>
        </div>
    );
};

export default AnalyticsPage;
