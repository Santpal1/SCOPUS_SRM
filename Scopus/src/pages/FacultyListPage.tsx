import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../components/FacultyListPage.css'; // Ensure your CSS is updated

interface Faculty {
  scopus_id: string;
  name: string;
  docs_count: number;
  timeframe_docs: number;
  access: string;
  faculty_id?: string;
  docs_in_timeframe?: number;
}

const FacultyListPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('none');

  useEffect(() => {
    fetchFaculty();
  }, []);

  // Fetch all faculty data
  const fetchFaculty = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/faculty');
      setFaculty(response.data);
      setFilteredFaculty(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch faculty data');
      setLoading(false);
      console.error('Error:', err);
    }
  };

  // Fetch faculty based on timeframe
  const fetchFacultyByTimeframe = async (selectedTimeframe: string) => {
    if (selectedTimeframe === 'none') {
      setFilteredFaculty(faculty.map(member => ({ ...member, docs_in_timeframe: undefined })));
      return;
    }
  
    try {
      const response = await axios.get(`http://localhost:5000/api/faculty/papers?timeframe=${selectedTimeframe}`);
  
      const updatedFaculty = faculty.map((member) => {
        const foundMember = response.data.find((f: Faculty) => f.scopus_id === member.scopus_id);
        return {
          ...member,
          docs_in_timeframe: foundMember ? foundMember.timeframe_docs : 0, 
        };
      });
  
      setFilteredFaculty(updatedFaculty);
    } catch (error) {
      console.error('Error fetching faculty data:', error);
    }
  };
  

  // Fetch faculty with <4 papers in the past year and update docs_in_timeframe
const fetchLowPaperFaculty = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/faculty/low-papers');

    const updatedFaculty = response.data.map((member: Faculty) => ({
      ...member,
      docs_in_timeframe: member.timeframe_docs,
    }));

    setFilteredFaculty(updatedFaculty);
  } catch (error) {
    console.error('Error fetching faculty with low papers:', error);
  }
};


const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
  const query = event.target.value.toLowerCase();
  setSearchQuery(query);

  if (query === "") {
    // Restore filtered data based on last timeframe selection
    return fetchFacultyByTimeframe(timeframe);
  }

  // Search within the currently displayed faculty list
  const filtered = filteredFaculty
    .filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.scopus_id.toLowerCase().includes(query)
    );

  setFilteredFaculty(filtered);
};

  if (loading) return <div className="loading">Loading faculty data...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="faculty-container">
      <h1 className="title">Faculty List</h1>

      {/* Filter Bar */}
      <div className="filter-bar">
        {/* Dropdown to select timeframe */}
        <select
          value={timeframe}
          onChange={(e) => {
            setTimeframe(e.target.value);
            fetchFacultyByTimeframe(e.target.value);
          }}
          className="dropdown"
        >
          <option value="none">None</option>
          <option value="1m">Last 1 Month</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last 1 Year</option>
        </select>

        {/* Button to fetch faculty with <4 papers in past year */}
        <button className="filter-button" onClick={fetchLowPaperFaculty}>
          Show Faculty (less than 4 Papers in 1 Year)
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Name or Scopus ID..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="table-wrapper">
        <table className="faculty-table">
          <thead>
            <tr>
              <th>Faculty ID</th>
              <th>Scopus ID</th>
              <th>Name</th>
              <th>Documents</th>
              <th>Filtered Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculty.map((member) => (
              <tr key={member.scopus_id}>
                <td>{member.faculty_id || 'Not Available'}</td>
                <td>{member.scopus_id}</td>
                <td>{member.name}</td>
                <td>{member.docs_count}</td>
                <td>{member.docs_in_timeframe !== undefined ? member.docs_in_timeframe : 'N/A'}</td>
                <td>
                  <Link to={`/faculty/${member.scopus_id}`} className="view-button">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredFaculty.length === 0 && <div className="no-records">No faculty records found.</div>}
    </div>
  );
};

export default FacultyListPage;
