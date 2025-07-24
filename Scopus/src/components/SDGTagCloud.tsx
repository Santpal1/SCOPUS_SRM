import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
// Import SDG images
import sdg1 from '../assets/sdg1.png';
import sdg2 from '../assets/sdg2.png';
import sdg3 from '../assets/sdg3.png';
import sdg4 from '../assets/sdg4.png';
import sdg5 from '../assets/sdg5.png';
import sdg6 from '../assets/sdg6.png';
import sdg7 from '../assets/sdg7.png';
import sdg8 from '../assets/sdg8.png';
import sdg9 from '../assets/sdg9.png';
import sdg10 from '../assets/sdg10.png';
import sdg11 from '../assets/sdg11.png';
import sdg12 from '../assets/sdg12.png';
import sdg13 from '../assets/sdg13.png';
import sdg14 from '../assets/sdg14.png';
import sdg15 from '../assets/sdg15.png';
import sdg16 from '../assets/sdg16.png';
import sdg17 from '../assets/sdg17.png';


interface SDGData {
  [key: string]: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  description: string;
  number: string;
}

type HoverButtonProps = {
  activeView: string; // or a union like 'detailed' | 'summary'
  handleClick: () => void;
};


const SDGInsightsDashboard: React.FC = () => {
  const [data, setData] = useState<SDGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'detailed'>('overview');
  const [hoveredButton, setHoveredButton] = useState<'overview' | 'detailed' | null>(null);
  const [hoveredButton1, setHoveredButton1] = useState<string | null>(null);


  // Improved SDG color mapping with official UN colors and better descriptions
  const sdgInfo: { [key: string]: { color: string; title: string; description: string; number: string; image: string } } = {
    'SDG 1': { color: '#E5243B', title: 'No Poverty', description: 'End poverty in all its forms everywhere', number: '1', image: sdg1 },
    'SDG 2': { color: '#DDA63A', title: 'Zero Hunger', description: 'End hunger, achieve food security and improved nutrition', number: '2', image: sdg2 },
    'SDG 3': { color: '#4C9F38', title: 'Good Health and Well-being', description: 'Ensure healthy lives and promote well-being for all', number: '3', image: sdg3 },
    'SDG 4': { color: '#C5192D', title: 'Quality Education', description: 'Ensure inclusive and equitable quality education', number: '4', image: sdg4 },
    'SDG 5': { color: '#FF3A21', title: 'Gender Equality', description: 'Achieve gender equality and empower all women and girls', number: '5', image: sdg5 },
    'SDG 6': { color: '#26BDE2', title: 'Clean Water and Sanitation', description: 'Ensure availability and sustainable management of water', number: '6', image: sdg6 },
    'SDG 7': { color: '#FCC30B', title: 'Affordable and Clean Energy', description: 'Ensure access to affordable, reliable, sustainable energy', number: '7', image: sdg7 },
    'SDG 8': { color: '#A21942', title: 'Decent Work and Economic Growth', description: 'Promote sustained, inclusive economic growth', number: '8', image: sdg8 },
    'SDG 9': { color: '#FD6925', title: 'Industry, Innovation and Infrastructure', description: 'Build resilient infrastructure, promote innovation', number: '9', image: sdg9 },
    'SDG 10': { color: '#DD1367', title: 'Reduced Inequalities', description: 'Reduce inequality within and among countries', number: '10', image: sdg10 },
    'SDG 11': { color: '#FD9D24', title: 'Sustainable Cities and Communities', description: 'Make cities and human settlements inclusive', number: '11', image: sdg11 },
    'SDG 12': { color: '#BF8B2E', title: 'Responsible Consumption and Production', description: 'Ensure sustainable consumption and production patterns', number: '12', image: sdg12 },
    'SDG 13': { color: '#3F7E44', title: 'Climate Action', description: 'Take urgent action to combat climate change', number: '13', image: sdg13 },
    'SDG 14': { color: '#0A97D9', title: 'Life Below Water', description: 'Conserve and sustainably use oceans and marine resources', number: '14', image: sdg14 },
    'SDG 15': { color: '#56C02B', title: 'Life on Land', description: 'Protect, restore and promote sustainable use of ecosystems', number: '15', image: sdg15 },
    'SDG 16': { color: '#00689D', title: 'Peace, Justice and Strong Institutions', description: 'Promote peaceful and inclusive societies', number: '16', image: sdg16 },
    'SDG 17': { color: '#19486A', title: 'Partnerships for the Goals', description: 'Strengthen means of implementation and global partnerships', number: '17', image: sdg17 },
    '-': { color: '#64748B', title: 'Unspecified', description: 'Projects without specified SDG alignment', number: '?', image: '' }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/insights/sdg-counts');
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getChartData = (): ChartData[] => {
    if (!data) return [];

    return Object.entries(data)
      .filter(([key]) => key !== '-') // Exclude unspecified for main charts
      .map(([key, value]) => ({
        name: key,
        value,
        color: sdgInfo[key]?.color || '#64748B',
        description: sdgInfo[key]?.title || key,
        number: sdgInfo[key]?.number || '?'
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getTotalProjects = () => {
    if (!data) return 0;
    return Object.values(data).reduce((sum, count) => sum + count, 0);
  };

  const getSpecifiedProjects = () => {
    if (!data) return 0;
    return Object.entries(data)
      .filter(([key]) => key !== '-')
      .reduce((sum, [, count]) => sum + count, 0);
  };

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 overflow-hidden min-h-[400px]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-64">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-400/30 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-center mt-4">
          <p className="text-slate-300 font-medium">Loading SDG insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative bg-gradient-to-br from-slate-900 via-red-900 to-rose-900 rounded-3xl p-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-400/30">
            <div className="w-8 h-8 bg-red-400 rounded-full"></div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Unable to Load Data</h3>
          <p className="text-red-300 text-lg mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const chartData = getChartData();
  const totalProjects = getTotalProjects();
  const specifiedProjects = getSpecifiedProjects();
  const unspecifiedProjects = data['-'] || 0;

  return (
    <div
      style={{
        width: '95%',                 // Same as SDGPieChart
        maxWidth: '1200px',           // Same max width
        margin: '2rem auto',          // Center align
        borderRadius: '1rem',
        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.08)',
        boxSizing: 'border-box',
        padding: '20px',
        backgroundColor: '#ffffff',
      }}
      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden"
    >
      {/* Subtle Blurred Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10">
        {/* Header & Toggle */}
        <div className="mb-8">
          <div style={{ padding: '1rem' }} className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">SDG Impact Overview</h2>
              <p className="text-slate-400 text-lg">Sustainable Development Goals Distribution</p>
            </div>
            <div className="flex bg-slate-800/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-700">
              <button
                onClick={() => setActiveView("overview")}
                onMouseEnter={() => setHoveredButton("overview")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: "12px 24px",
                  fontSize: "18px",
                  backgroundColor: activeView === "overview" ? '#4caf50' : 'white',
                  color: activeView === "overview" ? "white" : '#4caf50',
                  boxShadow: '0 8px 16px rgba(251, 1, 1, 0.08)',
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.3s ease, transform 0.2s ease",
                  transform:
                    hoveredButton === "overview"
                      ? "scale(1.05)"
                      : "scale(1)",
                  margin: '40px',
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${activeView === "overview"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
              >
                Overview
              </button>

              <button
                onClick={() => setActiveView("detailed")}
                onMouseEnter={() => setHoveredButton("detailed")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: "12px 24px",
                  fontSize: "18px",
                  backgroundColor: activeView === "detailed" ? '#4caf50' : 'white',
                  color: activeView === "detailed" ? "white" : '#4caf50',
                  boxShadow: '0 8px 16px rgba(251, 1, 1, 0.08)',
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.3s ease, transform 0.2s ease",
                  transform:
                    hoveredButton === "detailed"
                      ? "scale(1.05)"
                      : "scale(1)",
                  margin: '40px',
                }}
                className={`rounded-xl font-semibold transition-transform duration-300 ${activeView === "detailed"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
              >
                Detailed
              </button>


            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'flex', marginRight: '30rem', marginLeft: '1rem', gap: '20%' }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Total Projects",
                value: totalProjects,
                percent: 100,
                color: "blue",
                border: "2px solid black",
                barColor: "bg-blue-500",
              },
            ].map(({ title, value, percent, color, barColor }) => (
              <div
                onMouseEnter={() => setHoveredButton1(title)}
                onMouseLeave={() => setHoveredButton1(null)}
                style={{
                  border: '2px solid black',
                  width: '21rem',
                  marginBottom: '15px',
                  fontSize: '1.5rem',
                  color: '#123a5b',
                  borderBottom: '3px solid #1a3d6c',
                  paddingBottom: '8px',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                  borderRadius: '10px',
                  padding: '10px',
                  backgroundColor: '#d0e6fb',
                  boxShadow:
                    hoveredButton1 === title
                      ? '0 8px 16px rgba(18, 75, 124, 0.5)'
                      : '0 2px 5px rgba(18, 75, 124, 0.4)',
                  transform: hoveredButton1 === title ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
                key={title}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300"
              >
                <div className="flex items-center justify-between" style={{ width: '20rem' }}>
                  <div>
                    <div className="text-slate-400 text-sm font-medium mb-2">{title} : {value.toLocaleString()}</div>
                    {/* <div className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</div> */}
                    {title !== "Total Projects" && (
                      <p className={`text-${color}-400 text-sm font-medium`}>
                        {percent.toFixed(1)}% of total
                      </p>
                    )}
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                      <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                  <div
                    className={`w-14 h-14 bg-${color}-500/20 rounded-2xl flex items-center justify-center border border-${color}-500/30`}
                  >
                    <div className={`w-6 h-6 ${barColor} rounded-lg`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chart Section */}
        {activeView === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" >
            {/* Bar Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700">
              <h3 style={{ margin: '50px', marginLeft: '27rem' }} className="text-xl font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                TOP PERFORMING SDGs
              </h3>
              <div className="bg-slate-900/50 rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "3px solid #e1ebf5",
                        borderRadius: "12px",
                        color: "red",
                      }}
                      formatter={(value: any, name: any, props: any) => [`${value} projects`, props.payload.description]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.slice(0, 8).map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
          </div>
        ) : (
          /* Detailed Breakdown View */
          <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-8 border border-slate-700 shadow-md">
            <h3
              style={{
                margin: "2rem",
                marginLeft: "21.5rem",
                fontSize: "28px",
                color: "#124b7c",
              }}
              className="text-2xl font-bold text-white mb-10 flex items-center"
            >
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center mr-4">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              COMPLETE SDG BREAKDOWN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.entries(data)
                .sort(([, a], [, b]) => b - a)
                .map(([sdg, count]) => (
                  <div
                    key={sdg}
                    onMouseEnter={() => setHoveredButton1(sdg)}
                    onMouseLeave={() => setHoveredButton1(null)}
                    className="group rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-500 hover:shadow-xl transition-all duration-300 ease-in-out"
                    style={{
                      backgroundColor: "#e1ebf5",
                      margin: "5px",
                      marginBottom: "30px",
                      borderRadius: "5px",
                      position: "relative",
                      boxShadow:
                        hoveredButton1 === sdg
                          ? "0 8px 16px rgba(18, 75, 124, 0.5)"
                          : "0 2px 5px rgba(18, 75, 124, 0.4)",
                      transform: hoveredButton1 === sdg ? "scale(1.02)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {/* Heading with SDG Number & Title */}
                    <div
                      style={{
                        backgroundColor: sdgInfo[sdg]?.color || "#1a3d6c",
                        padding: "16px",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      <h4 style={{ fontSize: "18px", marginBottom: "4px" }}>
                        SDG {sdgInfo[sdg]?.number || "?"}: {sdgInfo[sdg]?.title || "Unknown"}
                      </h4>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 relative" style={{ marginLeft: "15px" }}>
                      {/* Description */}
                      <p className="text-slate-700 text-sm mb-4">
                        {sdgInfo[sdg]?.description || "No description available"}
                      </p>

                      {/* Project Count */}
                      <div className="mb-3 font-semibold text-slate-800">
                        {count} Projects ({((count / totalProjects) * 100).toFixed(1)}% of the total)
                      </div>


                      {/* Progress Bar */}
                      <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden mb-4">
                        <div
                          className="h-full transition-all duration-1000 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(data))) * 100}%`,
                            backgroundColor: sdgInfo[sdg]?.color || "#64748B",
                          }}
                        ></div>
                      </div>

                      {/* SDG Image */}
                      <img
                        src={sdgInfo[sdg]?.image}
                        alt={sdgInfo[sdg]?.title}
                        style={{
                          width: "80px",
                          height: "80px",
                          position: "absolute",
                          bottom: "20px",
                          right: "20px",
                          borderRadius: "10px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          background: "white",
                          padding: "5px",
                        }}
                      />
                    </div>

                  </div>
                ))}
            </div>
          </div>

        )}
      </div>
    </div >
  );
};
export default SDGInsightsDashboard;