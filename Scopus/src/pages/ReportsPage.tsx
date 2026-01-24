import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import srmLogo from '../assets/srmist-logo.png';
import UserMenu from '../components/UserMenu';
import styles from './ReportsPage.module.css';
import {
  Download, TrendingUp, Users, FileText, BarChart3, Calendar, Award,
  Globe, BookOpen, Zap, Target, AlertCircle
} from 'lucide-react';

interface Faculty {
  faculty_id: string;
  name: string;
  h_index?: number;
  citations?: number;
  docs_count?: number;
  access_level?: number;
}

interface Paper {
  doi: string;
  title: string;
  publication_name: string;
  date: string;
  quartile: string;
  type: string;
}

interface ReportStats {
  totalFaculty: number;
  totalPapers: number;
  totalCitations: number;
  avgHIndex: number;
  avgCitations: number;
  avgPapers: number;
  maxHIndex: number;
  minHIndex: number;
  q1Papers: number;
  q2Papers: number;
  q3Papers: number;
  q4Papers: number;
  recentPapers: number;
  citationTrend: Array<{ year: number; count: number }>;
  hIndexDistribution: Array<{ range: string; count: number }>;
  topFaculty: Faculty[];
  papersByYear: Array<{ year: number; count: number }>;
}

const ReportsPage: React.FC = () => {
  // Filters
  const [minHIndex, setMinHIndex] = useState<number>(0);
  const [maxHIndex, setMaxHIndex] = useState<number>(100);
  const [minCitations, setMinCitations] = useState<number>(0);
  const [maxCitations, setMaxCitations] = useState<number>(5000);
  const [minPapers, setMinPapers] = useState<number>(0);
  const [maxPapers, setMaxPapers] = useState<number>(500);
  const [startYear, setStartYear] = useState<number>(2020);
  const [endYear, setEndYear] = useState<number>(2024);
  const [selectedQuartile, setSelectedQuartile] = useState<string>('all');

  // Data
  const [facultyData, setFacultyData] = useState<Faculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalFaculty: 0,
    totalPapers: 0,
    totalCitations: 0,
    avgHIndex: 0,
    avgCitations: 0,
    avgPapers: 0,
    maxHIndex: 0,
    minHIndex: 0,
    q1Papers: 0,
    q2Papers: 0,
    q3Papers: 0,
    q4Papers: 0,
    recentPapers: 0,
    citationTrend: [],
    hIndexDistribution: [],
    topFaculty: [],
    papersByYear: [],
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [minHIndex, maxHIndex, minCitations, maxCitations, minPapers, maxPapers, facultyData]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [facultyRes, chartRes] = await Promise.all([
        axios.get('http://localhost:5001/api/faculty'),
        axios.get('http://localhost:5001/api/publications?timeframe=1y').catch(() => ({ data: [] })),
      ]);

      setFacultyData(facultyRes.data);
      setChartData(chartRes.data);
      calculateComprehensiveStats(facultyRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateComprehensiveStats = (data: Faculty[]) => {
    if (data.length === 0) return;

    // Basic calculations
    const totalCitations = data.reduce((sum, f) => sum + (f.citations || 0), 0);
    const totalDocs = data.reduce((sum, f) => sum + (f.docs_count || 0), 0);
    const hIndices = data.map(f => f.h_index || 0).filter(h => h > 0);
    const avgHIndex = hIndices.length > 0 ? hIndices.reduce((a, b) => a + b) / hIndices.length : 0;
    const maxHIndex = Math.max(...hIndices, 0);
    const minHIndex = Math.min(...hIndices, 0);

    // H-Index Distribution
    const hIndexRanges = [
      { range: '0-5', min: 0, max: 5 },
      { range: '6-10', min: 6, max: 10 },
      { range: '11-20', min: 11, max: 20 },
      { range: '21-50', min: 21, max: 50 },
      { range: '50+', min: 50, max: Infinity },
    ];
    const hIndexDistribution = hIndexRanges.map(r => ({
      range: r.range,
      count: hIndices.filter(h => h >= r.min && h <= r.max).length,
    }));

    // Top Faculty
    const topFaculty = [...data]
      .sort((a, b) => (b.h_index || 0) - (a.h_index || 0))
      .slice(0, 10);

    setStats({
      totalFaculty: data.length,
      totalPapers: totalDocs,
      totalCitations,
      avgHIndex: parseFloat(avgHIndex.toFixed(2)),
      avgCitations: parseFloat((totalCitations / data.length).toFixed(2)),
      avgPapers: parseFloat((totalDocs / data.length).toFixed(2)),
      maxHIndex,
      minHIndex: minHIndex === Infinity ? 0 : minHIndex,
      q1Papers: 0,
      q2Papers: 0,
      q3Papers: 0,
      q4Papers: 0,
      recentPapers: 0,
      citationTrend: [],
      hIndexDistribution,
      topFaculty,
      papersByYear: [],
    });
  };

  const applyFilters = () => {
    let filtered = [...facultyData];

    filtered = filtered.filter(
      f =>
        (f.h_index || 0) >= minHIndex &&
        (f.h_index || 0) <= maxHIndex &&
        (f.citations || 0) >= minCitations &&
        (f.citations || 0) <= maxCitations &&
        (f.docs_count || 0) >= minPapers &&
        (f.docs_count || 0) <= maxPapers
    );

    setFilteredFaculty(filtered);
  };

  const exportFacultyCSV = async () => {
    try {
      setExporting(true);
      const headers = ['Faculty ID', 'Name', 'H-Index', 'Citations', 'Total Papers'];
      const rows = filteredFaculty.map(f => [
        f.faculty_id,
        f.name,
        f.h_index || 0,
        f.citations || 0,
        f.docs_count || 0,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faculty-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const exportDetailedAnalysis = async () => {
    try {
      setExporting(true);
      const analysis = `Faculty Analytics Report
Generated: ${new Date().toISOString()}

SUMMARY STATISTICS
==================
Total Faculty: ${stats.totalFaculty}
Total Papers: ${stats.totalPapers}
Total Citations: ${stats.totalCitations}
Average H-Index: ${stats.avgHIndex}
Average Citations: ${stats.avgCitations}
Average Papers per Faculty: ${stats.avgPapers}

H-INDEX DISTRIBUTION
====================
${stats.hIndexDistribution.map(d => `${d.range}: ${d.count} faculty`).join('\n')}

TOP 10 FACULTY BY H-INDEX
=========================
${stats.topFaculty.map((f, i) => `${i + 1}. ${f.name} (H-Index: ${f.h_index}, Citations: ${f.citations}, Papers: ${f.docs_count})`).join('\n')}

FILTERED FACULTY (${filteredFaculty.length})
=========================
${filteredFaculty.map(f => `${f.name}: H-Index=${f.h_index}, Citations=${f.citations}, Papers=${f.docs_count}`).join('\n')}
`;

      const blob = new Blob([analysis], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faculty-analysis-${new Date().toISOString().split('T')[0]}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export analysis');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading comprehensive faculty data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Navbar */}
      <div className={styles.navbar}>
        <a className={styles.logo}>
          <img src={srmLogo} alt="SRM Logo" className={styles.navLogo} />
          <span>SRM SP</span>
        </a>
        <UserMenu />
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/dashboard" className={styles.backButton}>← Back to Dashboard</Link>
          <h1 className={styles.title}>Faculty Analytics & Reports</h1>
          <p className={styles.subtitle}>Comprehensive analysis of faculty performance and publications</p>
        </div>

        {/* Main Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Users size={24} />
            <div>
              <p className={styles.statLabel}>Total Faculty</p>
              <p className={styles.statValue}>{stats.totalFaculty}</p>
              <p className={styles.statSubtext}>Filtered: {filteredFaculty.length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <FileText size={24} />
            <div>
              <p className={styles.statLabel}>Publications</p>
              <p className={styles.statValue}>{stats.totalPapers}</p>
              <p className={styles.statSubtext}>Avg: {stats.avgPapers.toFixed(1)} per faculty</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <Award size={24} />
            <div>
              <p className={styles.statLabel}>Total Citations</p>
              <p className={styles.statValue}>{stats.totalCitations.toLocaleString()}</p>
              <p className={styles.statSubtext}>Avg: {stats.avgCitations.toFixed(1)} per faculty</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={24} />
            <div>
              <p className={styles.statLabel}>Average H-Index</p>
              <p className={styles.statValue}>{stats.avgHIndex.toFixed(2)}</p>
              <p className={styles.statSubtext}>Range: {stats.minHIndex} - {stats.maxHIndex}</p>
            </div>
          </div>
        </div>

        {/* H-Index Distribution */}
        <div className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>
            <BarChart3 size={20} />
            H-Index Distribution
          </h2>
          <div className={styles.distributionChart}>
            {stats.hIndexDistribution.map((item, idx) => {
              const maxCount = Math.max(...stats.hIndexDistribution.map(d => d.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={idx} className={styles.distributionBar}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${height}%` }}
                    title={`${item.range}: ${item.count}`}
                  />
                  <p className={styles.barLabel}>{item.range}</p>
                  <p className={styles.barCount}>{item.count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Faculty */}
        <div className={styles.topFacultySection}>
          <h2 className={styles.sectionTitle}>
            <Award size={20} />
            Top 10 Faculty by H-Index
          </h2>
          <div className={styles.facultyRanking}>
            {stats.topFaculty.map((faculty, idx) => (
              <div key={idx} className={styles.rankingItem}>
                <div className={styles.rank}>#{idx + 1}</div>
                <div className={styles.facultyInfo}>
                  <p className={styles.facultyName}>{faculty.name}</p>
                  <p className={styles.facultyId}>{faculty.faculty_id}</p>
                </div>
                <div className={styles.metrics}>
                  <span className={styles.metric}>
                    <span className={styles.label}>H-Index:</span>
                    <span className={styles.value}>{faculty.h_index || 0}</span>
                  </span>
                  <span className={styles.metric}>
                    <span className={styles.label}>Citations:</span>
                    <span className={styles.value}>{faculty.citations || 0}</span>
                  </span>
                  <span className={styles.metric}>
                    <span className={styles.label}>Papers:</span>
                    <span className={styles.value}>{faculty.docs_count || 0}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          <h2 className={styles.sectionTitle}>Filter & Analyze</h2>

          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label>H-Index Range</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minHIndex}
                  onChange={(e) => setMinHIndex(Number(e.target.value))}
                  className={styles.input}
                />
                <span className={styles.rangeSeparator}>to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxHIndex}
                  onChange={(e) => setMaxHIndex(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label>Citations Range</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  min="0"
                  value={minCitations}
                  onChange={(e) => setMinCitations(Number(e.target.value))}
                  className={styles.input}
                />
                <span className={styles.rangeSeparator}>to</span>
                <input
                  type="number"
                  min="0"
                  value={maxCitations}
                  onChange={(e) => setMaxCitations(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label>Papers Range</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  min="0"
                  value={minPapers}
                  onChange={(e) => setMinPapers(Number(e.target.value))}
                  className={styles.input}
                />
                <span className={styles.rangeSeparator}>to</span>
                <input
                  type="number"
                  min="0"
                  value={maxPapers}
                  onChange={(e) => setMaxPapers(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.filterStats}>
            <p>Showing <strong>{filteredFaculty.length}</strong> faculty matching filters</p>
          </div>
        </div>

        {/* Export Section */}
        <div className={styles.exportSection}>
          <h2 className={styles.sectionTitle}>
            <Download size={20} />
            Export Reports
          </h2>

          <div className={styles.exportGrid}>
            <button onClick={exportFacultyCSV} disabled={exporting} className={styles.exportBtn}>
              <Download size={18} />
              <div>
                <p>Filtered Faculty</p>
                <span>CSV Export</span>
              </div>
            </button>

            <button onClick={exportDetailedAnalysis} disabled={exporting} className={styles.exportBtn}>
              <FileText size={18} />
              <div>
                <p>Detailed Analysis</p>
                <span>Text Report</span>
              </div>
            </button>
          </div>

          {exporting && <p className={styles.loadingMsg}>Generating report...</p>}
        </div>

        {/* Filtered Faculty Table */}
        <div className={styles.tableSection}>
          <h2 className={styles.sectionTitle}>Filtered Faculty Data</h2>

          {filteredFaculty.length === 0 ? (
            <div className={styles.emptyState}>
              <AlertCircle size={48} />
              <p>No faculty matches current filters</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>ID</th>
                    <th>H-Index</th>
                    <th>Citations</th>
                    <th>Papers</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.slice(0, 50).map(faculty => (
                    <tr key={faculty.faculty_id}>
                      <td className={styles.nameCell}>{faculty.name}</td>
                      <td>{faculty.faculty_id}</td>
                      <td className={styles.hIndexCell}>{faculty.h_index || '-'}</td>
                      <td>{faculty.citations || 0}</td>
                      <td>{faculty.docs_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFaculty.length > 50 && (
                <p className={styles.tableFooter}>Showing 50 of {filteredFaculty.length} faculty</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
