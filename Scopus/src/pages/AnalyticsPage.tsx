import React from 'react';
import GlobalCollabMap from '../components/GlobalCollabMap';
import SDGPieChart from '../components/SDGPieChart';
import SDGTagCloud from '../components/SDGTagCloud';

const AnalyticsPage: React.FC = () => {
    return (
        <div style={{ padding: 40 }}>
            <h1 style={{ textAlign: 'center', fontSize: 50, color: '#2980b9' }}>ANALYTICS DASHBOARD</h1>

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