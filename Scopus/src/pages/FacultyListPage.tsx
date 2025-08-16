import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import srmLogo from "../assets/srmist-logo.png";
import "../components/FacultyListPage.css";

interface Faculty {
  scopus_id: string;
  name: string;
  docs_count: number;
  timeframe_docs: number;
  access: string;
  faculty_id?: string;
  docs_in_timeframe?: number;
  sdg?: string;
  domain?: string;
}

const FacultyListPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("none");
  const [docsInTimeframeMap, setDocsInTimeframeMap] = useState<{ [key: string]: number }>({});
  const [sdgFilter, setSdgFilter] = useState<string>("none");
  const [domainFilter, setDomainFilter] = useState<string>("none");

  const [criteriaVisible, setCriteriaVisible] = useState<boolean>(false);
  const [criteriaStart, setCriteriaStart] = useState<string>("");
  const [criteriaEnd, setCriteriaEnd] = useState<string>("");
  const [criteriaPapers, setCriteriaPapers] = useState<number>(0);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    if (!criteriaVisible) {
      fetchFaculty(); // Only fetch normal data if criteria filter is not active
    }
  }, [sdgFilter, domainFilter, timeframe]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const params: any = {};

      const isFiltering =
        sdgFilter !== "none" || domainFilter !== "none" || timeframe !== "none";

      if (sdgFilter !== "none") params.sdg = sdgFilter;
      if (domainFilter !== "none") params.domain = domainFilter;
      if (timeframe !== "none") params.year = timeframe;

      const response = await axios.get("http://localhost:5001/api/faculty", { params });

      const processedFaculty = response.data
        .map((f: Faculty) => ({
          ...f,
          docs_in_timeframe: isFiltering ? f.docs_in_timeframe : undefined,
        }))
        .filter(f => !isFiltering || f.docs_in_timeframe > 0)
        .sort((a, b) =>
          (b.docs_in_timeframe ?? b.docs_count) - (a.docs_in_timeframe ?? a.docs_count)
        );

      setFaculty(processedFaculty);
      setCurrentFaculty(processedFaculty);
      setFilteredFaculty(processedFaculty);
    } catch (err) {
      setError("Failed to fetch faculty data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCriteriaFilteredFaculty = async () => {
    if (!criteriaStart || !criteriaEnd || criteriaPapers <= 0) {
      alert("Please enter valid Start Date, End Date, and Paper Count.");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5001/api/faculty/criteria-filter`,
        { params: { start: criteriaStart, end: criteriaEnd, papers: criteriaPapers } }
      );

      const updatedFaculty = response.data
        .map((member: Faculty) => ({
          ...member,
          docs_in_timeframe: member.timeframe_docs,
        }))
        .sort((a, b) => (b.docs_in_timeframe ?? 0) - (a.docs_in_timeframe ?? 0));

      setFaculty(updatedFaculty);
      setCurrentFaculty(updatedFaculty);
      setFilteredFaculty(updatedFaculty);
    } catch (error) {
      console.error("Error fetching criteria-filtered faculty:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyByTimeframe = async (selectedTimeframe: string) => {
    setTimeframe(selectedTimeframe);
    if (selectedTimeframe === "none") {
      setDocsInTimeframeMap({});
      const sorted = [...faculty].sort((a, b) => b.docs_count - a.docs_count);
      setCurrentFaculty(sorted);
      applyAllFilters(sorted);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5001/api/faculty/papers?timeframe=${selectedTimeframe}`);
      const docsMap: { [key: string]: number } = {};
      response.data.forEach((f: Faculty) => {
        docsMap[f.scopus_id] = f.timeframe_docs;
      });

      setDocsInTimeframeMap(docsMap);

      const updatedFaculty = faculty
        .map(member => ({
          ...member,
          docs_in_timeframe: docsMap[member.scopus_id] ?? 0,
        }))
        .filter(member => member.docs_in_timeframe > 0)
        .sort((a, b) => (b.docs_in_timeframe ?? 0) - (a.docs_in_timeframe ?? 0));

      setCurrentFaculty(updatedFaculty);
      applyAllFilters(updatedFaculty);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    if (query === "") {
      setFilteredFaculty(currentFaculty);
      return;
    }
    const filtered = currentFaculty.filter(
      member =>
        member.name.toLowerCase().includes(query) ||
        member.scopus_id.toLowerCase().includes(query)
    );
    setFilteredFaculty(filtered);
  };

  const applyAllFilters = (baseList?: Faculty[]) => {
    let updatedList = baseList || currentFaculty;
    if (sdgFilter !== "none") {
      updatedList = updatedList.filter(f => f.sdg?.toLowerCase() === sdgFilter.toLowerCase());
    }
    if (domainFilter !== "none") {
      updatedList = updatedList.filter(f => f.domain?.toLowerCase() === domainFilter.toLowerCase());
    }
    setFilteredFaculty(updatedList);
  };

  const handleCriteriaClick = () => {
    if (criteriaVisible) {
      // If hiding, reset criteria inputs and reload faculty list
      setCriteriaStart("");
      setCriteriaEnd("");
      setCriteriaPapers(0);
      fetchFaculty();
    }
    setCriteriaVisible(!criteriaVisible);
  };

  // Helper function to build query parameters for View Details link
  const buildViewDetailsQuery = () => {
    const params = new URLSearchParams();
    
    if (criteriaVisible && criteriaStart && criteriaEnd) {
      // If criteria filter is active, pass the date range
      params.set("start", criteriaStart);
      params.set("end", criteriaEnd);
    } else {
      // Otherwise, pass the regular filters
      if (sdgFilter !== "none") params.set("sdg", sdgFilter);
      if (domainFilter !== "none") params.set("domain", domainFilter);
      if (timeframe !== "none") params.set("year", timeframe);
    }
    
    return params.toString();
  };

  if (loading) return <div className="loading">Loading faculty data...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      {/* NAVBAR */}
      <div className="faculty-navbar">
        <a className="faculty-logo">
          <img src={srmLogo} alt="SRM Logo" className="faculty-navLogo" />
          <span>SRM SP</span>
        </a>
      </div>
      <div className="faculty-container">
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
          <Link to="/dashboard" className="back-button">&laquo; Back to Dashboard</Link>
        </div>

        <h1 className="title">Faculty List</h1>

        {/* Filter Bar */}
        <div className="filter-bar">
          <select
            value={timeframe}
            onChange={(e) => fetchFacultyByTimeframe(e.target.value)}
            className="dropdown"
            disabled={criteriaVisible}
          >
            <option value="none" disabled hidden>Year Filter</option>
            <option value="none">None</option>
            <option value={currentYear.toString()}>{currentYear}</option>
            <option value={previousYear.toString()}>{previousYear}</option>
          </select>

          <select
            value={sdgFilter}
            onChange={(e) => setSdgFilter(e.target.value)}
            className="dropdown"
            disabled={criteriaVisible}
          >
            <option value="none" disabled hidden>SDG Filter</option>
            <option value="none">None</option>
            {[...Array(17)].map((_, i) => (
              <option key={i + 1} value={`SDG${i + 1}`}>{`SDG ${i + 1}`}</option>
            ))}
          </select>

          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="dropdown"
            disabled={criteriaVisible}
          >
            <option value="none" disabled hidden>Domain Filter</option>
            <option value="none">None</option>
            {[
              "Agriculture & Forestry", "Architecture", "Biological Sciences", "Business & Management Studies", "Chemistry",
              "Communication & Media Studies", "Computer Science & Information Systems", "Data Science", "Development Studies",
              "Earth & Marine Sciences", "Economics & Econometrics", "Education & Training", "Engineering - Chemical",
              "Engineering - Civil & Structural", "Engineering - Electrical & Electronic", "Engineering - Mechanical",
              "Engineering - Mineral & Mining", "Engineering - Petroleum", "Environmental Sciences", "Geography", "Geology",
              "Geophysics", "Law and Legal Studies", "Library & Information Management", "Linguistics", "Materials Science",
              "Mathematics", "Medicine", "Nursing", "Pharmacy & Pharmacology", "Physics & Astronomy", "Psychology",
              "Statistics & Operational Research"
            ].map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>

          <button className="criteria-button" onClick={handleCriteriaClick}>
            {criteriaVisible ? "Hide Criteria Filter" : "Criteria Filter"}
          </button>
        </div>

        {/* Criteria Inputs */}
        {criteriaVisible && (
          <div className="criteria-inputs" style={{ margin: "20px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", marginRight: "10px" }}>
              <label>Start Date</label>
              <input
                type="date"
                value={criteriaStart}
                onChange={(e) => setCriteriaStart(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginRight: "10px" }}>
              <label>End Date</label>
              <input
                type="date"
                value={criteriaEnd}
                onChange={(e) => setCriteriaEnd(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginRight: "10px" }}>
              <label>Minimum Papers</label>
              <input
                type="number"
                value={criteriaPapers === 0 ? "" : criteriaPapers}
                onChange={(e) => setCriteriaPapers(e.target.value === "" ? 0 : parseInt(e.target.value))}
                min={1}
              />
            </div>
            <button onClick={fetchCriteriaFilteredFaculty} className="apply-button">
              Apply
            </button>
          </div>
        )}

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
                  setFilteredFaculty(currentFaculty);
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

        {/* Table */}
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
                    <Link
                      to={`/faculty/${member.scopus_id}?${buildViewDetailsQuery()}`}
                      className="view-button"
                    >
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
    </div>
  );
};

export default FacultyListPage;