import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    ArcElement,
    Chart as ChartJS,
    Legend,
    Tooltip,
} from 'chart.js';
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
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            });
        });
    }, []);

    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', fontSize: '1.2rem' }}>
                Loading chart...
            </div>
        );
    }

    return (
        <div style={{
            width: '90vw',
            padding: '3rem 5vw',
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '6px solid #1A4D6C',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
            boxSizing: 'border-box',
        }}>
            <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                Sustainable Development Goals (SDG) Distribution
            </h2>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                width: '100%',
                gap: '2rem'
            }}>
                {/* Pie Chart */}
                <div style={{ flex: '1 1 40%', minWidth: '300px' }}>
                    <Pie style = {{fontWeight: '300px'}}
                        data={data}
                        options={{
                            plugins: {
                                legend: {
                                    display: false
                                },
                                
                                tooltip: {
                                    bodyFont: { size: 14 },
                                    padding: 10,
                                    backgroundColor : 'white',
                                    titleColor: 'blue',
                                    titleFont: {
        size: 16,
        weight: 'bold',
      },
                                }
                            }
                        }}
                    />
                </div>

                {/* Improved Legend */}
                {/* <div> LABELS </div> */}
                <div style={{
                    flex: '1 1 50%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '12px',
                    alignContent: 'start',
                    margin : '35px',
                    marginTop: '150px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    padding: '1rem'
                }}>
                    {data.labels.map((label: string, i: number) => (
                        <div key={label} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '18px',
                            fontWeight: '500',
                            color: '#444'
                        }}>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: data.datasets[0].backgroundColor[i],
                                borderRadius: '3px',
                                flexShrink: 0,
                                margin : '20px',
                                fontWeight : '500'
                            }} />
                            <span style = {{fontWeight : '500'}}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SDGPieChart;
