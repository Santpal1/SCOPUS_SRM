import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import style from "../components/AuthorPerformance.module.css";
import srmLogoN from "../assets/srmist-logo.png";

interface Author {
    scopus_id: string;
    name: string;
    h_index?: number;
}

export default function AuthorPerformance() {
    const [searchTerm, setSearchTerm] = useState("");
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(false);
    const [hIndexFilter, setHIndexFilter] = useState("none");
    const navigate = useNavigate();

    useEffect(() => {
        fetchAuthors("", "none");
    }, []);

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

    const clearSearch = () => {
        setSearchTerm("");
    };

    const clearHIndexFilter = () => {
        setHIndexFilter("none");
    };

    const handleHIndexFilterChange = (value: string) => {
        setHIndexFilter(value);
    };

    const handleRowClick = (scopusId: string) => {
        navigate(`/author-performance/${scopusId}`);
    };

    // Helper function to get filter display text
    const getFilterDisplayText = (filter: string) => {
        const filterMap: { [key: string]: string } = {
            "1-3": "H-Index: 1-3",
            "4-6": "H-Index: 4-6",
            "7-9": "H-Index: 7-9",
            "10-12": "H-Index: 10-12",
            "12+": "H-Index: 12+"
        };
        return filterMap[filter] || filter;
    };

    // Check if any filters are active
    const hasActiveFilters = searchTerm.trim() !== "" || hIndexFilter !== "none";

    return (
        <div className={style.pageWrapper}>
            {/* Navbar */}
            <div className={style.navbar}>
                <div className={style.logo1}>
                    <img src={srmLogoN} alt="SRM Logo" className={style.navLogo} />
                    <span>SRM SP</span>
                </div>
            </div>

            {/* Main Content Container */}
            <div className={style.mainContentContainer}>
                <div className={style.container}>
                    {/* Header Section */}
                    <div className={style.headerSection}>
                        <div className={style.backButtonContainer}>
                            <Link to="/dashboard" className={style.backButton}>
                                <span className={style.backIcon}>←</span>
                                Back to Dashboard
                            </Link>
                        </div>

                        <div className={style.titleSection}>
                            <h2 className={style.pageTitle}>Author Yearly Performance</h2>
                            <p className={style.pageSubtitle}>Search and filter faculty members by their research performance</p>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className={style.filtersSection}>
                        <div className={style.filtersContainer}>
                            {/* Enhanced Search Box */}
                            <div className={style.searchContainer}>
                                <div className={style.searchBox}>
                                    <div className={style.searchIcon}>🔍</div>
                                    <input
                                        type="text"
                                        placeholder="Search by name or Scopus ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={style.searchInput}
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
                            </div>

                            {/* Enhanced H-index Filter */}
                            <div className={style.filterContainer}>
                                <div className={style.filterBox}>
                                    <div className={style.filterIcon}>📊</div>
                                    <label htmlFor="hIndexFilter" className={style.filterLabel}>
                                        H-Index Range
                                    </label>
                                    <select
                                        id="hIndexFilter"
                                        value={hIndexFilter}
                                        onChange={(e) => handleHIndexFilterChange(e.target.value)}
                                        className={style.filterSelect}
                                    >
                                        <option value="none">All Ranges</option>
                                        <option value="1-3">1 - 3</option>
                                        <option value="4-6">4 - 6</option>
                                        <option value="7-9">7 - 9</option>
                                        <option value="10-12">10 - 12</option>
                                        <option value="12+">12+</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {hasActiveFilters && (
                            <div className={style.activeFiltersSection}>
                                <div className={style.activeFiltersHeader}>
                                    <span className={style.activeFiltersIcon}>🏷️</span>
                                    Active Filters:
                                </div>
                                <div className={style.activeFiltersList}>
                                    {searchTerm.trim() && (
                                        <div className={`${style.activeFilterChip} ${style.searchChip}`}>
                                            <span className={style.filterChipIcon}>🔍</span>
                                            <span className={style.filterChipText}>
                                                Search: "{searchTerm.trim()}"
                                            </span>
                                            <button 
                                                className={style.filterChipClose}
                                                onClick={clearSearch}
                                                type="button"
                                                title="Remove search filter"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    {hIndexFilter !== "none" && (
                                        <div className={`${style.activeFilterChip} ${style.hIndexChip}`}>
                                            <span className={style.filterChipIcon}>📊</span>
                                            <span className={style.filterChipText}>
                                                {getFilterDisplayText(hIndexFilter)}
                                            </span>
                                            <button 
                                                className={style.filterChipClose}
                                                onClick={clearHIndexFilter}
                                                type="button"
                                                title="Remove H-Index filter"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Results Summary */}
                        <div className={style.resultsSummary}>
                            {!loading && (
                                <span className={style.resultsCount}>
                                    {authors.length} {authors.length === 1 ? 'author' : 'authors'} found
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Table Container */}
                    <div className={style.tableSection}>
                        <div className={style.tableContainer}>
                            <table className={style.authorTable}>
                                <thead>
                                    <tr>
                                        <th className={style.nameColumn}>
                                            <div className={style.columnHeader}>
                                                <span className={style.columnIcon}>👤</span>
                                                Name
                                            </div>
                                        </th>
                                        <th className={style.scopusColumn}>
                                            <div className={style.columnHeader}>
                                                <span className={style.columnIcon}>🆔</span>
                                                Scopus ID
                                            </div>
                                        </th>
                                        <th className={style.hindexColumn}>
                                            <div className={style.columnHeader}>
                                                <span className={style.columnIcon}>📈</span>
                                                H-Index
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className={style.loadingCell}>
                                                <div className={style.loadingContent}>
                                                    <div className={style.spinner}></div>
                                                    <span>Loading authors...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : authors.length > 0 ? (
                                        authors.map((author, index) => (
                                            <tr
                                                key={author.scopus_id}
                                                className={style.authorRow}
                                                onClick={() => handleRowClick(author.scopus_id)}
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <td className={style.nameCell}>
                                                    <div className={style.authorInfo}>
                                                        <div className={style.authorAvatar}>
                                                            {author.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className={style.authorName}>{author.name}</span>
                                                    </div>
                                                </td>
                                                <td className={style.scopusCell}>
                                                    <span className={style.scopusId}>{author.scopus_id}</span>
                                                </td>
                                                <td className={style.hindexCell}>
                                                    <div className={style.hindexBadge}>
                                                        {author.h_index || 'N/A'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className={style.emptyStateCell}>
                                                <div className={style.emptyStateContent}>
                                                    <div className={style.emptyStateIcon}>🔍</div>
                                                    <h3>No authors found</h3>
                                                    <p>Try adjusting your search terms or filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}