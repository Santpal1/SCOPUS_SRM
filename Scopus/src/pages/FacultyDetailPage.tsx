import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../components/FacultyDetailPage.css';

interface Faculty {
  scopus_id: string;
  name: string;
  docs_count: number;
  access: string;
  faculty_id?: string;
}

interface Paper {
  scopus_id: string;
  doi: string;
  title: string;
  type: string;
  publication_name: string;
  date: string;
  author1?: string;
  author2?: string;
  author3?: string;
  author4?: string;
  author5?: string;
  author6?: string;
  affiliation1?: string;
  affiliation2?: string;
  affiliation3?: string;
}

interface FacultyDetailResponse {
  faculty: Faculty;
  papers: Paper[];
}

const FacultyDetailPage: React.FC = () => {
  const { scopusId } = useParams<{ scopusId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [facultyData, setFacultyData] = useState<FacultyDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacultyDetails = async () => {
      if (!scopusId) {
        setError('No Scopus ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/faculty/${scopusId}`);
        if (response.data) {
          setFacultyData(response.data);
        } else {
          setError('No data returned from API');
        }
      } catch (err) {
        setError(`Failed to fetch faculty details`);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetails();
  }, [scopusId]);

  if (loading) return <div className="loading">Loading faculty details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!facultyData) return <div className="no-records">No data found for this faculty member.</div>;

  const { faculty, papers } = facultyData;

  // Prepare data for the graph - Publications in the past 3 years
  const currentYear = new Date().getFullYear();
  const publicationCounts = [
    { year: currentYear - 2, count: 0 },
    { year: currentYear - 1, count: 0 },
    { year: currentYear, count: 0 },
  ];

  papers.forEach((paper) => {
    const paperYear = new Date(paper.date).getFullYear();
    publicationCounts.forEach((entry) => {
      if (entry.year === paperYear) {
        entry.count += 1;
      }
    });
  });

  return (
    <div className="faculty-detail-container">
      <Link to="/faculty" className="back-button">&laquo; Back to Faculty List</Link>

      <div className="faculty-card">
        <h2 className="faculty-name">{faculty.name}</h2>
        <p><strong>Scopus ID:</strong> {faculty.scopus_id}</p>
        {faculty.faculty_id && <p><strong>Faculty ID:</strong> {faculty.faculty_id}</p>}
        <p><strong>Documents Published:</strong> {faculty.docs_count}</p>
        <p><strong>Access Level:</strong> {faculty.access}</p>
      </div>

      <h3 className="publications-title">Publications</h3>
      {papers && papers.length > 0 ? (
        papers.map((paper, index) => (
          <div key={paper.doi || `paper-${index}`} className="publication-card">
            <h4>{paper.title}</h4>
            <p><strong>DOI:</strong> {paper.doi || 'N/A'}</p>
            <p><strong>Type:</strong> {paper.type || 'N/A'}</p>
            <p><strong>Publication:</strong> {paper.publication_name || 'N/A'}</p>
            <p><strong>Date:</strong> {paper.date ? new Date(paper.date).toLocaleDateString() : 'N/A'}</p>
          </div>
        ))
      ) : (
        <div className="no-records">No publications found for this faculty member.</div>
      )}

      {/* Bar Chart for last 3 years */}
      <h3 className="publications-title">Publications in the Last 3 Years</h3>
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <BarChart
            data={publicationCounts}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#007bff" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FacultyDetailPage;
