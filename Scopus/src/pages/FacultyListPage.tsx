import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [lowPaperFilter, setLowPaperFilter] = useState<string>("none");

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    if (lowPaperFilter === "none") {
      fetchFaculty(); // Only fetch normal data if not showing low papers
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



  const fetchFacultyByTimeframe = async (selectedTimeframe: string) => {
    setLowPaperFilter("none");
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

  const fetchLowPaperFacultyByYears = async (years: number) => {
    try {
      const response = await axios.get("http://localhost:5001/api/faculty/low-papers");

      const updatedFaculty = response.data
        .map((member: Faculty) => ({
          ...member,
          docs_in_timeframe: member.timeframe_docs,
        }))
        .filter(member => member.docs_in_timeframe > 0)
        .sort((a, b) => (b.docs_in_timeframe ?? 0) - (a.docs_in_timeframe ?? 0));

      setFaculty(updatedFaculty);
      setCurrentFaculty(updatedFaculty);
      setFilteredFaculty(updatedFaculty);
    } catch (error) {
      console.error("Error fetching faculty with low papers:", error);
    } finally {
      setLoading(false);
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

  const handleLowPaperSelect = (value: string) => {
    if (value === "none") {
      setLowPaperFilter("none");
      fetchFaculty(); // reset to full list
      return;
    }

    const hasOtherFilters = sdgFilter !== "none" || domainFilter !== "none" || timeframe !== "none";

    if (hasOtherFilters) {
      alert("Please clear other filters (Year, SDG, Domain) before using this option.");
      return;
    }

    setLowPaperFilter(value);
    fetchLowPaperFacultyByYears(parseInt(value));
  };

  if (loading) return <div className="loading">Loading faculty data...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="faculty-container">
  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
    <Link to="/dashboard" className="back-button">
      ⬅ Back to Dashboard
    </Link>
  </div>

      <h1 className="title">Faculty List</h1>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          value={timeframe}
          onChange={(e) => fetchFacultyByTimeframe(e.target.value)}
          className="dropdown"
          disabled={lowPaperFilter !== "none"}
        >
          <option value="none" disabled hidden>Year Filter</option>
          <option value="none">None</option>
          <option value={currentYear.toString()}>{currentYear}</option>
          <option value={previousYear.toString()}>{previousYear}</option>
        </select>

        <select
          value={sdgFilter}
          onChange={(e) => {
            setSdgFilter(e.target.value);
            setLowPaperFilter("none");
          }}
          className="dropdown"
          disabled={lowPaperFilter !== "none"}
        >
          <option value="none" disabled hidden>SDG Filter</option>
          <option value="none">None</option>
          {[...Array(17)].map((_, i) => (
            <option key={i + 1} value={`SDG${i + 1}`}>{`SDG ${i + 1}`}</option>
          ))}
        </select>


        <select
          value={domainFilter}
          onChange={(e) => {
            setDomainFilter(e.target.value);
            setLowPaperFilter("none");
          }}
          className="dropdown"
          disabled={lowPaperFilter !== "none"}
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

        <select
          className="dropdown"
          value={lowPaperFilter}
          onChange={(e) => handleLowPaperSelect(e.target.value)}
        >
          <option value="none" disabled hidden>Criteria Filter</option>
          <option value="none">None</option>
          <option value="1">Show Faculty with &lt; 4 Papers in 1 Year</option>
          <option value="2">Show Faculty with &lt; 4 Papers in 2 Years</option>
          <option value="3">Show Faculty with &lt; 4 Papers in 3 Years</option>
          <option value="4">Show Faculty with &lt; 4 Papers in 4 Years</option>
          <option value="5">Show Faculty with &lt; 4 Papers in 5 Years</option>
        </select>

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
                    to={{
                      pathname: `/faculty/${member.scopus_id}`,
                      search: `?sdg=${sdgFilter}&domain=${domainFilter}&year=${timeframe}`,
                    }}
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
  );
};

export default FacultyListPage;
