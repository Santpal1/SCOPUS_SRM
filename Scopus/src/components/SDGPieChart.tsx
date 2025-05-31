import axios from 'axios';
import {
    ArcElement,
    Chart as ChartJS,
    Legend,
    Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const SDGPieChart: React.FC = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        axios.get('http://localhost:5000/api/sdg-count').then(res => {
            const labels = Object.keys(res.data);
            const values = Object.values(res.data);

            setData({
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#C9CBCF', '#3DC6FF', '#B5E61D', '#FF6F61',
                        '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1', '#955251',
                        '#B565A7', '#009B77'
                    ]
                }]
            });
        });
    }, []);

    if (!data) return <p>Loading chart...</p>;

    return (
        <div style={{ maxWidth: 800, margin: '10px auto' }}>
            <h2 style={{ textAlign: 'center' }}>SDG Distribution</h2>
            <Pie data={data} />
        </div>
    );
};

export default SDGPieChart;
