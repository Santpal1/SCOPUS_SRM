import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

const SDGInsightsDashboard: React.FC = () => {
  const [data, setData] = useState<SDGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'detailed'>('overview');

  // Improved SDG color mapping with official UN colors and better descriptions
  const sdgInfo: { [key: string]: { color: string; title: string; description: string; number: string } } = {
    'SDG 1': { color: '#E5243B', title: 'No Poverty', description: 'End poverty in all its forms everywhere', number: '1' },
    'SDG 2': { color: '#DDA63A', title: 'Zero Hunger', description: 'End hunger, achieve food security and improved nutrition', number: '2' },
    'SDG 3': { color: '#4C9F38', title: 'Good Health and Well-being', description: 'Ensure healthy lives and promote well-being for all', number: '3' },
    'SDG 4': { color: '#C5192D', title: 'Quality Education', description: 'Ensure inclusive and equitable quality education', number: '4' },
    'SDG 5': { color: '#FF3A21', title: 'Gender Equality', description: 'Achieve gender equality and empower all women and girls', number: '5' },
    'SDG 6': { color: '#26BDE2', title: 'Clean Water and Sanitation', description: 'Ensure availability and sustainable management of water', number: '6' },
    'SDG 7': { color: '#FCC30B', title: 'Affordable and Clean Energy', description: 'Ensure access to affordable, reliable, sustainable energy', number: '7' },
    'SDG 8': { color: '#A21942', title: 'Decent Work and Economic Growth', description: 'Promote sustained, inclusive economic growth', number: '8' },
    'SDG 9': { color: '#FD6925', title: 'Industry, Innovation and Infrastructure', description: 'Build resilient infrastructure, promote innovation', number: '9' },
    'SDG 10': { color: '#DD1367', title: 'Reduced Inequalities', description: 'Reduce inequality within and among countries', number: '10' },
    'SDG 11': { color: '#FD9D24', title: 'Sustainable Cities and Communities', description: 'Make cities and human settlements inclusive', number: '11' },
    'SDG 12': { color: '#BF8B2E', title: 'Responsible Consumption and Production', description: 'Ensure sustainable consumption and production patterns', number: '12' },
    'SDG 13': { color: '#3F7E44', title: 'Climate Action', description: 'Take urgent action to combat climate change', number: '13' },
    'SDG 14': { color: '#0A97D9', title: 'Life Below Water', description: 'Conserve and sustainably use oceans and marine resources', number: '14' },
    'SDG 15': { color: '#56C02B', title: 'Life on Land', description: 'Protect, restore and promote sustainable use of ecosystems', number: '15' },
    'SDG 16': { color: '#00689D', title: 'Peace, Justice and Strong Institutions', description: 'Promote peaceful and inclusive societies', number: '16' },
    'SDG 17': { color: '#19486A', title: 'Partnerships for the Goals', description: 'Strengthen means of implementation and global partnerships', number: '17' },
    '-': { color: '#64748B', title: 'Unspecified', description: 'Projects without specified SDG alignment', number: '?' }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/insights/sdg-counts');
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
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-500/5 rounded-full blur-2xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                SDG Impact Overview
              </h2>
              <p className="text-slate-400 text-lg">Sustainable Development Goals Distribution</p>
            </div>
            
            <div className="flex bg-slate-800/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-700">
              <button
                onClick={() => setActiveView('overview')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeView === 'overview'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveView('detailed')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeView === 'detailed'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Total Projects</p>
                  <p className="text-3xl font-bold text-white mb-1">{totalProjects.toLocaleString()}</p>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full w-full transition-all duration-1000"></div>
                  </div>
                </div>
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">SDG Aligned</p>
                  <p className="text-3xl font-bold text-white mb-1">{specifiedProjects.toLocaleString()}</p>
                  <p className="text-emerald-400 text-sm font-medium">{((specifiedProjects / totalProjects) * 100).toFixed(1)}% of total</p>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(specifiedProjects / totalProjects) * 100}%` }}></div>
                  </div>
                </div>
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-between border border-emerald-500/30">
                  <div className="w-6 h-6 bg-emerald-500 rounded-lg mx-auto"></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Unspecified</p>
                  <p className="text-3xl font-bold text-white mb-1">{unspecifiedProjects.toLocaleString()}</p>
                  <p className="text-amber-400 text-sm font-medium">{((unspecifiedProjects / totalProjects) * 100).toFixed(1)}% of total</p>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                    <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(unspecifiedProjects / totalProjects) * 100}%` }}></div>
                  </div>
                </div>
                <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
                  <div className="w-6 h-6 bg-amber-500 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {activeView === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top SDGs Bar Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                Top Performing SDGs
              </h3>
              <div className="bg-slate-900/50 rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94A3B8"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#F8FAFC'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value} projects`,
                        props.payload.description
                      ]}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]}
                      fill={(entry: any) => entry.color}
                    >
                      {chartData.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution Pie Chart */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                SDG Distribution
              </h3>
              <div className="bg-slate-900/50 rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={1}
                      dataKey="value"
                      stroke="#1E293B"
                      strokeWidth={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#F8FAFC'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value} projects`,
                        props.payload.description
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {chartData.slice(0, 8).map((entry, index) => (
                  <div key={index} className="flex items-center group cursor-pointer p-2 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                    <div 
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-slate-300 text-xs font-medium truncate">
                      SDG {entry.number}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Detailed View */
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              Complete SDG Breakdown
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(data)
                .sort(([,a], [,b]) => b - a)
                .map(([sdg, count]) => (
                  <div 
                    key={sdg}
                    className="group bg-slate-900/50 rounded-2xl p-4 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0"
                            style={{ backgroundColor: sdgInfo[sdg]?.color || '#64748B' }}
                          >
                            {sdgInfo[sdg]?.number || '?'}
                          </div>
                          <p className="font-semibold text-white text-sm leading-tight">
                            {sdgInfo[sdg]?.title || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-white">{count}</p>
                          <p className="text-slate-400 text-xs">
                            {((count / totalProjects) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000 rounded-full"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(data))) * 100}%`,
                            backgroundColor: sdgInfo[sdg]?.color || '#64748B'
                          }}
                        ></div>
                      </div>
                      
                      <div className="text-xs text-slate-500 leading-tight">
                        {sdgInfo[sdg]?.description || 'No description available'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SDGInsightsDashboard;