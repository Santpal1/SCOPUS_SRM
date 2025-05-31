import React from 'react';
import GlobalCollabMap from '../components/GlobalCollabMap';
<<<<<<< HEAD
import SDGPieChart from '../components/SDGPieChart';
import SDGTagCloud from '../components/SDGTagCloud';

const AnalyticsPage: React.FC = () => {
    return (
        <div style={{ padding: 20 }}>
            <h1>Analytics Dashboard</h1>
            <section style={{ marginBottom: 40 }}>
                <GlobalCollabMap />
            </section>
            <section style={{ marginBottom: 40 }}>
                <SDGPieChart />
            </section>
            <section className="mt-6">
                <h2 className="text-xl font-semibold mb-4">SDG Tag Cloud</h2>
                <SDGTagCloud />
            </section>
        </div>

    );
=======
import SDGTagCloud from '../components/SDGTagCloud';

const AnalyticsPage: React.FC = () => {
  

  return (
    <div style={{ padding: 20 }}>
      <h1>Analytics Dashboard</h1>

      <section style={{ marginBottom: 40 }}>
        <GlobalCollabMap />
      </section>

      <section className="mt-6">
      <h2 className="text-xl font-semibold mb-4">SDG Tag Cloud</h2>
      <SDGTagCloud />
    </section>

    </div>
  );
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
};

export default AnalyticsPage;
