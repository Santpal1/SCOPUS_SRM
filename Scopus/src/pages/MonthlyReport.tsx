import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import style from "../components/MonthlyReport.module.css";
import srmLogo from "../assets/srmist-logo.png";

interface MonthlyReportData {
    faculty_id: string | null;
    faculty_name: string;
    scopus_id: string;
    docs_added: number;
    citations_added: number;
    total_docs: number;
    total_citations: number;
    report_year?: number;
    report_month?: number;
    created_at?: string;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthlyReport() {
    const [reportData, setReportData] = useState<MonthlyReportData[]>([]);
    const [filteredData, setFilteredData] = useState<MonthlyReportData[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // Fetch monthly report data
    const fetchMonthlyReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:5001/api/monthly-report");
            setReportData(res.data);
            setFilteredData(res.data);
        } catch (error) {
            console.error("Error fetching monthly report:", error);
            setReportData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyReport();
    }, []);

    // Handle search
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredData(reportData);
        } else {
            const filtered = reportData.filter((item) =>
                (item.faculty_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.faculty_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.scopus_id.toString().includes(searchQuery)
            );
            setFilteredData(filtered);
        }
    }, [searchQuery, reportData]);

    const clearSearch = () => {
        setSearchQuery("");
    };

    const hasActiveFilters = searchQuery.trim() !== "";

    const downloadReport = () => {
        if (filteredData.length === 0) {
            alert("No data available to download");
            return;
        }

        // Create CSV content
        const headers = [
            "Author Name",
            "Faculty ID",
            "Scopus ID",
            "Period",
            "Docs Added",
            "Citations Added",
            "Total Docs",
            "Total Citations"
        ];

        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.faculty_name}"`,
                `"${item.faculty_id || "N/A"}"`,
                `"${item.scopus_id}"`,
                `"${item.report_month && item.report_year
                    ? `${monthNames[item.report_month - 1]} ${item.report_year}`
                    : "No Report"}"`,
                item.docs_added,
                item.citations_added,
                item.total_docs,
                item.total_citations
            ].join(","))
        ].join("\n");

        // Create and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `monthly_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={style.pageWrapper}>
            {/* Navbar */}
            <div className={style.navbar}>
                <div className={style.logo1}>
                    <img src={srmLogo} alt="SRM Logo" className={style.navLogo} />
                    <span>SRM SP</span>
                </div>
            </div>

            {/* Main Content */}
            <div className={style.mainContentContainer}>
                <div className={style.container}>

                    {/* Unified Content Card */}
                    <div className={style.contentCard}>

                        {/* Back Button */}
                        <div className={style.backButtonContainer}>
                            <Link to="/dashboard" className={style.backButton}>
                                <span className={style.backIcon}>←</span>
                                Back to Dashboard
                            </Link>
                        </div>

                        {/* Title */}
                        <div className={style.titleSection}>
                            <div className={style.titleContent}>
                                <h2 className={style.pageTitle}>Monthly Author Report</h2>
                                <p className={style.pageSubtitle}>
                                    View monthly publication and citation data for all faculty members
                                </p>
                            </div>
                            <button
                                className={style.downloadButton}
                                onClick={downloadReport}
                                disabled={filteredData.length === 0}
                            >
                                <span className={style.downloadIcon}>📥</span>
                                Download Report
                            </button>
                        </div>

                        {/* Filters Section */}
                        <div className={style.filtersSection}>
                            <div className={style.filtersContainer}>
                                {/* Search Box */}
                                <div className={style.searchContainer}>
                                    <div className={style.searchBox}>
                                        <div className={style.searchIcon}>🔍</div>
                                        <input
                                            type="text"
                                            placeholder="Search by name, faculty ID, or Scopus ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={style.searchInput}
                                        />
                                        {searchQuery && (
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
                            </div>

                            {/* Active Filters */}
                            {hasActiveFilters && (
                                <div className={style.activeFiltersSection}>
                                    <div className={style.activeFiltersHeader}>
                                        <span className={style.activeFiltersIcon}>🏷️</span>
                                        Active Filters:
                                    </div>
                                    <div className={style.activeFiltersList}>
                                        {searchQuery.trim() && (
                                            <div className={`${style.activeFilterChip} ${style.searchChip}`}>
                                                <span className={style.filterChipIcon}>🔍</span>
                                                <span className={style.filterChipText}>
                                                    Search: "{searchQuery.trim()}"
                                                </span>
                                                <button
                                                    className={style.filterChipClose}
                                                    onClick={clearSearch}
                                                    type="button"
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
                                        {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'} found
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className={style.tableSection}>
                            <div className={style.tableContainer}>
                                <table className={style.authorTable}>
                                    <thead>
                                        <tr>
                                            <th className={style.nameColumn}>
                                                <div className={style.columnHeader}>
                                                    <span className={style.columnIcon}>👤</span>
                                                    Author Name
                                                </div>
                                            </th>
                                            <th className={style.scopusColumn}>
                                                <div className={style.columnHeader}>
                                                    <span className={style.columnIcon}>🆔</span>
                                                    Faculty ID
                                                </div>
                                            </th>
                                            <th className={style.scopusColumn}>
                                                <div className={style.columnHeader}>
                                                    <span className={style.columnIcon}>🔢</span>
                                                    Scopus ID
                                                </div>
                                            </th>
                                            <th className={style.hindexColumn}>
                                                <div className={style.columnHeader}>
                                                    <span className={style.columnIcon}>📅</span>
                                                    Period
                                                </div>
                                            </th>
                                            <th className={style.hindexColumn}>
                                                <div className={style.columnHeader}>
                                                    <span className={style.columnIcon}>📄</span>
                                                    Docs Added
                                                </div>
                                            </th>
                                            <th className={style.hindexColumn}>
                                                <div className={style.columnHeader}>
                                                    <span className={style.columnIcon}>📈</span>
                                                    Citations Added
                                                </div>
                                            </th>
                                            <th className={style.hindexColumn}>
                                                <div className={style.columnHeader}>
                                                    <span className={style.columnIcon}>📚</span>
                                                    Total Docs
                                                </div>
                                            </th>
                                            <th className={style.hindexColumn}>
                                                <div className={style.columnHeader}>
                                                    <span className={style.columnIcon}>⭐</span>
                                                    Total Citations
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className={style.loadingCell}>
                                                    <div className={style.loadingContent}>
                                                        <div className={style.spinner}></div>
                                                        <span>Loading monthly report...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredData.length > 0 ? (
                                            filteredData.map((item, index) => (
                                                <tr
                                                    key={`${item.scopus_id}-${index}`}
                                                    className={style.authorRow}
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <td className={style.nameCell}>
                                                        <div className={style.authorInfo}>
                                                            <div className={style.authorAvatar}>
                                                                {item.faculty_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className={style.authorName}>{item.faculty_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className={style.scopusCell}>
                                                        <span className={style.scopusId}>{item.faculty_id || "N/A"}</span>
                                                    </td>
                                                    <td className={style.scopusCell}>
                                                        <span className={style.scopusId}>{item.scopus_id}</span>
                                                    </td>
                                                    <td className={style.hindexCell}>
                                                        <div className={style.hindexBadge}>
                                                            {item.report_month && item.report_year
                                                                ? `${monthNames[item.report_month - 1]} ${item.report_year}`
                                                                : "No Report"}
                                                        </div>
                                                    </td>
                                                    <td className={style.hindexCell}>
                                                        <div className={style.hindexBadge}>
                                                            {item.docs_added}
                                                        </div>
                                                    </td>
                                                    <td className={style.hindexCell}>
                                                        <div className={style.hindexBadge}>
                                                            {item.citations_added}
                                                        </div>
                                                    </td>
                                                    <td className={style.hindexCell}>
                                                        <div className={style.hindexBadge}>
                                                            {item.total_docs}
                                                        </div>
                                                    </td>
                                                    <td className={style.hindexCell}>
                                                        <div className={style.hindexBadge}>
                                                            {item.total_citations}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className={style.emptyStateCell}>
                                                    <div className={style.emptyStateContent}>
                                                        <div className={style.emptyStateIcon}>📊</div>
                                                        <h3>No records found</h3>
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
        </div>
    );
}