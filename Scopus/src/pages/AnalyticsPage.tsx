import React from 'react';
import GlobalCollabMap from '../components/GlobalCollabMap';
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
};

export default AnalyticsPage;
