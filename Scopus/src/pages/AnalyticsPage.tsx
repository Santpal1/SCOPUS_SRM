import React from 'react';
import GlobalCollabMap from '../components/GlobalCollabMap';

const AnalyticsPage: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Analytics Dashboard</h1>
      <GlobalCollabMap />
    </div>
  );
};

export default AnalyticsPage;
