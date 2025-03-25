<<<<<<< HEAD
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
=======
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
>>>>>>> 0e8e10547351d6c31177cd0d2b899f50881f8389
import "../components/FacultyListPage.css";

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
  const [currentFaculty, setCurrentFaculty] = useState<Faculty[]>([]); // Holds filtered data
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("none");
  const [docsInTimeframeMap, setDocsInTimeframeMap] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchFaculty();
  }, []);

  // Fetch all faculty data
  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/faculty");
      setFaculty(response.data);
      setCurrentFaculty(response.data);
      setFilteredFaculty(response.data);
    } catch (err) {
      setError("Failed to fetch faculty data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch faculty based on timeframe
  const fetchFacultyByTimeframe = async (selectedTimeframe: string) => {
    setTimeframe(selectedTimeframe);
    if (selectedTimeframe === "none") {
      setDocsInTimeframeMap({});
      setFilteredFaculty(faculty);
      setCurrentFaculty(faculty);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/faculty/papers?timeframe=${selectedTimeframe}`);

      const docsMap: { [key: string]: number } = {};
      response.data.forEach((f: Faculty) => {
        docsMap[f.scopus_id] = f.timeframe_docs;
      });

      setDocsInTimeframeMap(docsMap);

      const updatedFaculty = faculty.map(member => ({
        ...member,
        docs_in_timeframe: docsMap[member.scopus_id] ?? 0,
      }));

      setFilteredFaculty(updatedFaculty);
      setCurrentFaculty(updatedFaculty);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    }
  };

  // Fetch faculty with <4 papers in the past year
  const fetchLowPaperFaculty = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/faculty/low-papers");

      const updatedFaculty = response.data.map((member: Faculty) => ({
        ...member,
        docs_in_timeframe: member.timeframe_docs,
      }));

      setFilteredFaculty(updatedFaculty);
      setCurrentFaculty(updatedFaculty); // Ensure this becomes the base for searching
    } catch (error) {
      console.error("Error fetching faculty with low papers:", error);
    }
  };

  // Handle search input
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (query === "") {
      setFilteredFaculty(currentFaculty); // Restore latest filter
      return;
    }

    const filtered = currentFaculty.filter(
      member =>
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
        <select
          value={timeframe}
          onChange={e => fetchFacultyByTimeframe(e.target.value)}
          className="dropdown"
        >
          <option value="none">None</option>
          <option value="1m">Last 1 Month</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last 1 Year</option>
          <option value="2y">Last 2 Years</option>
        </select>

        <button className="filter-button" onClick={fetchLowPaperFaculty}>
          Show Faculty (less than 4 Papers in 1 Year)
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Search by Name or Scopus ID..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilteredFaculty(currentFaculty); // Restore latest filter
              }}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                color: "red",
              }}
            >
              ❌
            </button>
          )}
        </div>
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
            {filteredFaculty.map(member => (
              <tr key={member.scopus_id}>
                <td>{member.faculty_id || "Not Available"}</td>
                <td>{member.scopus_id}</td>
                <td>{member.name}</td>
                <td>{member.docs_count}</td>
                <td>{member.docs_in_timeframe !== undefined ? member.docs_in_timeframe : "N/A"}</td>
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