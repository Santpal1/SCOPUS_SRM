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

const sdgInfo: { [key: string]: { color: string; title: string; number: string } } = {
    'SDG 1': { color: '#E5243B', title: 'No Poverty', number: '1' },
    'SDG 2': { color: '#DDA63A', title: 'Zero Hunger', number: '2' },
    'SDG 3': { color: '#4C9F38', title: 'Good Health and Well-being', number: '3' },
    'SDG 4': { color: '#C5192D', title: 'Quality Education', number: '4' },
    'SDG 5': { color: '#FF3A21', title: 'Gender Equality', number: '5' },
    'SDG 6': { color: '#26BDE2', title: 'Clean Water and Sanitation', number: '6' },
    'SDG 7': { color: '#FCC30B', title: 'Affordable and Clean Energy', number: '7' },
    'SDG 8': { color: '#A21942', title: 'Decent Work and Economic Growth', number: '8' },
    'SDG 9': { color: '#FD6925', title: 'Industry, Innovation and Infrastructure', number: '9' },
    'SDG 10': { color: '#DD1367', title: 'Reduced Inequalities', number: '10' },
    'SDG 11': { color: '#FD9D24', title: 'Sustainable Cities and Communities', number: '11' },
    'SDG 12': { color: '#BF8B2E', title: 'Responsible Consumption and Production', number: '12' },
    'SDG 13': { color: '#3F7E44', title: 'Climate Action', number: '13' },
    'SDG 14': { color: '#0A97D9', title: 'Life Below Water', number: '14' },
    'SDG 15': { color: '#56C02B', title: 'Life on Land', number: '15' },
    'SDG 16': { color: '#00689D', title: 'Peace, Justice and Strong Institutions', number: '16' },
    'SDG 17': { color: '#19486A', title: 'Partnerships for the Goals', number: '17' },
    '-': { color: '#64748B', title: 'Unspecified', number: '?' }
};

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
                    backgroundColor: labels.map(label => sdgInfo[label]?.color || '#999'),
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
            width: '70%',
            padding: '3rem 5%',
            backgroundColor: '#fff',
            borderRadius: '1rem',
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.08)',
            boxSizing: 'border-box',
            margin: '0.5rem auto'
        }}>
            <h2 style={{
                fontSize: '2rem',
                fontWeight: 600,
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
                gap: '2rem',
                width: '100%',
            }}>
                <div style={{
                    flex: '1 1 40%',
                    minWidth: '18rem',
                    marginTop:'4rem',
                    marginLeft: '33%'
                }}>
                    <Pie
                        data={data}
                        options={{
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        title: () => '',
                                        label: function (context) {
                                            const label = context.label;
                                            const value = context.formattedValue;
                                            const info = sdgInfo[label];

                                            return [
                                                `SDG ${info?.number || '-'}: ${info?.title || label} - ${value}`
                                            ];
                                        }
                                    },
                                    backgroundColor: 'white',
                                    bodyColor: '#34383b',
                                    displayColors: true,
                                    padding: 10,
                                    bodyFont: {
                                        size: 14,
                                        weight: 'bold',
                                        lineHeight: 1.2,
                                        family: 'Helvetica'
                                    }
                                }
                            }
                        }}
                    />
                </div>

                <div style={{
                    flex: '1 1 50%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(7.5rem, 1fr))',
                    gap: '2rem',
                    alignContent: 'start',
                    marginTop: '4rem',
                    maxHeight: '30rem',
                    overflowY: 'auto',
                    padding: '0.5rem'
                }}>
                    {data.labels.map((label: string, i: number) => (
                        <div key={label} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            color: '#444'
                        }}>
                            <div style={{
                                width: '1rem',
                                height: '1rem',
                                backgroundColor: data.datasets[0].backgroundColor[i],
                                borderRadius: '0.25rem',
                                flexShrink: 0,
                                fontWeight: 500
                            }} />
                            <span style={{ fontWeight: 500 }}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SDGPieChart;