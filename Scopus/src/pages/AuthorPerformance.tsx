import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import style from "../components/AuthorPerformance.module.css";
import srmLogoN from "../assets/srmist-logo.png";

interface Author {
    scopus_id: string;
    name: string;
    h_index?: number; // Added h_index property
}

export default function AuthorPerformance() {
    const [searchTerm, setSearchTerm] = useState("");
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(false);
    const [hIndexFilter, setHIndexFilter] = useState("none"); // Added H-index filter state
    const navigate = useNavigate();

    useEffect(() => {
        fetchAuthors("", "none"); // Load all authors on page load
    }, []);

    // Debounced search - now includes H-index filter
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchAuthors(searchTerm.trim(), hIndexFilter);
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, hIndexFilter]);

    const fetchAuthors = async (term: string, hIndex: string) => {
        try {
            setLoading(true);
            const params: any = { search: term };

            // Add h_index filter parameter if not "none"
            if (hIndex !== "none") {
                params.h_index_filter = hIndex;
            }

            const res = await axios.get(`http://localhost:5001/api/faculty/author-list`, {
                params: params,
            });
            setAuthors(res.data || []);
        } catch (error) {
            console.error("Error fetching authors:", error);
            setAuthors([]);
        } finally {
            setLoading(false);
        }
    };

    // Clear search function
    const clearSearch = () => {
        setSearchTerm("");
    };

    // Handle H-index filter change
    const handleHIndexFilterChange = (value: string) => {
        setHIndexFilter(value);
    };

    return (
        <div className={style.pageWrapper}>
            {/* Navbar */}
            <div className={style.navbar}>
                <a className={style.logo1}>
                    <img src={srmLogoN} alt="Srm Logo" className={style.navLogo} />
                    <span>SRM SP</span>
                </a>
            </div>

            <div className={style.container}>
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
                    <Link to="/dashboard" className="back-button">
                        &laquo; Back to Dashboard
                    </Link>
                </div>

                <h2>Author Yearly Performance</h2>

                {/* Filters Row */}
                <div className={style.filtersContainer}>
                    {/* Search Box with Clear Button */}
                    <div className={style.searchBox}>
                        <input
                            type="text"
                            placeholder="Search by name or Scopus ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className={style.clearButton}
                                onClick={clearSearch}
                                type="button"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* H-index Filter */}
                    <div className={style.filterBox}>
                        <label htmlFor="hIndexFilter">H-Index:</label>
                        <select
                            id="hIndexFilter"
                            value={hIndexFilter}
                            onChange={(e) => handleHIndexFilterChange(e.target.value)}
                            className={style.filterSelect}
                        >
                            <option value="none">All</option>
                            <option value="1-3">1-3</option>
                            <option value="4-6">4-6</option>
                            <option value="7-9">7-9</option>
                            <option value="10-12">10-12</option>
                            <option value="12+">More than 12</option>
                        </select>
                    </div>
                </div>

                {/* Table stays mounted to prevent shrinking */}
                <div className={style.tableContainer}>
                    <table className={style.authorTable}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Scopus ID</th>
                                <th>H-Index</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className={style.statusCell}>
                                        Loading…
                                    </td>
                                </tr>
                            ) : authors.length > 0 ? (
                                authors.map((author) => (
                                    <tr
                                        key={author.scopus_id}
                                        onClick={() => navigate(`/author-performance/${author.scopus_id}`)}
                                    >
                                        <td>{author.name}</td>
                                        <td>{author.scopus_id}</td>
                                        <td>{author.h_index || 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                // Empty state row keeps height consistent
                                <tr>
                                    <td colSpan={3} className={style.emptyState}>
                                        No authors found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}