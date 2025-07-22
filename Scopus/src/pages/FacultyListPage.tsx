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

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    fetchFaculty(); // Trigger when filters change
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
          docs_in_timeframe: isFiltering ? f.docs_in_timeframe : undefined, // undefined = N/A
        }))
        .filter(f => !isFiltering || f.docs_in_timeframe > 0) // Filter only if filters are active
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

  const fetchLowPaperFaculty = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/faculty/low-papers");

      const updatedFaculty = response.data
        .map((member: Faculty) => ({
          ...member,
          docs_in_timeframe: member.timeframe_docs,
        }))
        .filter(member => member.docs_in_timeframe > 0)
        .sort((a, b) => (b.docs_in_timeframe ?? 0) - (a.docs_in_timeframe ?? 0));

      setCurrentFaculty(updatedFaculty);
      applyAllFilters(updatedFaculty);
    } catch (error) {
      console.error("Error fetching faculty with low papers:", error);
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

  if (loading) return <div className="loading">Loading faculty data...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="faculty-container">
      <h1 className="title">Faculty List</h1>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          value={timeframe}
          onChange={(e) => fetchFacultyByTimeframe(e.target.value)}
          className="dropdown"
        >
          <option value="none" disabled hidden>Year Filter</option>
          <option value="none">None</option>
          <option value={currentYear.toString()}>{`${currentYear}`}</option>
          <option value={previousYear.toString()}>{`${previousYear}`}</option>
        </select>

        <select
          value={sdgFilter}
          onChange={(e) => setSdgFilter(e.target.value)}
          className="dropdown"
        >
          <option value="none" disabled hidden>SDG Filter</option>
          <option value="none">None</option>
          <option value="SDG1">SDG 1</option>
          <option value="SDG2">SDG 2</option>
          <option value="SDG3">SDG 3</option>
          <option value="SDG4">SDG 4</option>
          <option value="SDG5">SDG 5</option>
          <option value="SDG6">SDG 6</option>
          <option value="SDG7">SDG 7</option>
          <option value="SDG8">SDG 8</option>
          <option value="SDG9">SDG 9</option>
          <option value="SDG10">SDG 10</option>
          <option value="SDG11">SDG 11</option>
          <option value="SDG12">SDG 12</option>
          <option value="SDG13">SDG 13</option>
          <option value="SDG14">SDG 14</option>
          <option value="SDG15">SDG 15</option>
          <option value="SDG16">SDG 16</option>
          <option value="SDG17">SDG 17</option>
        </select>


        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="dropdown"
        >
          <option value="none" disabled hidden>Domain Filter</option>
          <option value="none">None</option>
          <option value="Agriculture & Forestry">Agriculture & Forestry</option>
          <option value="Architecture">Architecture</option>
          <option value="Biological Sciences">Biological Sciences</option>
          <option value="Business & Management Studies">Business & Management Studies</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Communication & Media Studies">Communication & Media Studies</option>
          <option value="Computer Science & Information Systems">Computer Science & Information Systems</option>
          <option value="Data Science">Data Science</option>
          <option value="Development Studies">Development Studies</option>
          <option value="Earth & Marine Sciences">Earth & Marine Sciences</option>
          <option value="Economics & Econometrics">Economics & Econometrics</option>
          <option value="Education & Training">Education & Training</option>
          <option value="Engineering - Chemical">Engineering - Chemical</option>
          <option value="Engineering - Civil & Structural">Engineering - Civil & Structural</option>
          <option value="Engineering - Electrical & Electronic">Engineering - Electrical & Electronic</option>
          <option value="Engineering - Mechanical">Engineering - Mechanical</option>
          <option value="Engineering - Mineral & Mining">Engineering - Mineral & Mining</option>
          <option value="Engineering - Petroleum">Engineering - Petroleum</option>
          <option value="Environmental Sciences">Environmental Sciences</option>
          <option value="Geography">Geography</option>
          <option value="Geology">Geology</option>
          <option value="Geophysics">Geophysics</option>
          <option value="Law and Legal Studies">Law and Legal Studies</option>
          <option value="Library & Information Management">Library & Information Management</option>
          <option value="Linguistics">Linguistics</option>
          <option value="Materials Science">Materials Science</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Medicine">Medicine</option>
          <option value="Nursing">Nursing</option>
          <option value="Pharmacy & Pharmacology">Pharmacy & Pharmacology</option>
          <option value="Physics & Astronomy">Physics & Astronomy</option>
          <option value="Psychology">Psychology</option>
          <option value="Statistics & Operational Research">Statistics & Operational Research</option>
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
