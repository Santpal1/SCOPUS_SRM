import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import srmLogo from "../assets/srmist-logo.png";
import style from "../components/AuthorPerformanceDetails.module.css";

interface ChartRow {
    year: number;
    documents: number;
    citations: number;
}

interface AcademicYearRow {
    academic_year: string;
    document_count: number;
}

interface PerformanceData {
    name: string;
    scopus_id: string;
    chart_data: ChartRow[];
    academic_year_data: AcademicYearRow[];
    consistency_status: 'green' | 'orange' | 'red';
}

export default function AuthorPerformanceDetail() {
    const { scopus_id } = useParams<{ scopus_id: string }>();
    const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                console.log("Fetching data for scopus_id:", scopus_id);
                const res = await axios.get(
                    `http://localhost:5001/api/faculty/author-performance/${scopus_id}`
                );
                console.log("Response data:", res.data);
                setPerformanceData(res.data);
                setError(null);
            } catch (error: any) {
                console.error("Error fetching performance:", error);
                if (error.response) {
                    console.error("Response data:", error.response.data);
                    console.error("Response status:", error.response.status);
                    setError(`Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
                } else if (error.request) {
                    console.error("No response received:", error.request);
                    setError("No response from server. Check if backend is running on port 5001.");
                } else {
                    console.error("Request setup error:", error.message);
                    setError(`Request error: ${error.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        if (scopus_id) {
            fetchPerformance();
        }
    }, [scopus_id]);

    if (loading) return <div className={style.loading}>Loading data...</div>;

    if (error) {
        return (
            <>
                {/* Navigation Bar */}
                <div className={style.navbar}>
                    <a className={style.logo1}>
                        <img src={srmLogo} alt="SRM Logo" className={style.navLogo} />
                        <span>SRM SP</span>
                    </a>
                </div>

                <div className={style.pageWrapper}>
                    <div className={style.pageHeader}>
                        <div className={style.navigationRow}>
                            <Link to="/author-performance" className={style.backButton}>
                                ← Back
                            </Link>
                            <h1 className={style.pageTitle}>Author Performance Report</h1>
                        </div>
                    </div>
                    <div className={style.contentArea}>
                        <p className={style.noData}>Error: {error}</p>
                    </div>
                </div>
            </>
        );
    }

    if (!performanceData) {
        return (
            <>
                {/* Navigation Bar */}
                <div className={style.navbar}>
                    <a className={style.logo1}>
                        <img src={srmLogo} alt="SRM Logo" className={style.navLogo} />
                        <span>SRM SP</span>
                    </a>
                </div>

                <div className={style.pageWrapper}>
                    <div className={style.pageHeader}>
                        <div className={style.navigationRow}>
                            <Link to="/author-performance" className={style.backButton}>
                                ← Back
                            </Link>
                            <h1 className={style.pageTitle}>Author Performance Report</h1>
                        </div>
                    </div>
                    <div className={style.contentArea}>
                        <p className={style.noData}>No data available.</p>
                    </div>
                </div>
            </>
        );
    }

    const getConsistencyMessage = (status: string) => {
        switch (status) {
            case 'green':
                return 'Faculty has been consistent for all 3 academic years (3+ papers each year)';
            case 'orange':
                return 'Faculty has been inconsistent for 1 academic year (less than 3 papers)';
            case 'red':
                return 'Faculty has been inconsistent for more than 1 academic year (less than 3 papers)';
            default:
                return '';
        }
    };

    const getEligibilityStatus = (status: string) => {
        return status === 'green' ? 'Yes' : 'No';
    };

    const getEligibilityClass = (status: string) => {
        return status === 'green' ? style.statusEligible : style.statusNotEligible;
    };

    return (
        <>
            {/* Navigation Bar */}
            <div className={style.navbar}>
                <a className={style.logo1}>
                    <img src={srmLogo} alt="SRM Logo" className={style.navLogo} />
                    <span>SRM SP</span>
                </a>
            </div>

            <div className={style.pageWrapper}>
                {/* Page Header */}
                <div className={style.pageHeader}>
                    <div className={style.navigationRow}>
                        <Link to="/author-performance" className={style.backButton}>
                            ← Back
                        </Link>
                        <h1 className={style.pageTitle}>Author Performance Report</h1>
                    </div>
                </div>

                {/* Content Area */}
                <div className={style.contentArea}>
                    {/* Author Information Box */}
                    <div className={style.authorInfoBox}>
                        <div className={style.authorInfoGrid}>
                            <div className={style.authorDetails}>
                                <h3>{performanceData.name}</h3>
                                <p>Scopus ID: {performanceData.scopus_id}</p>
                            </div>
                            <div className={style.statusInfo}>
                                <strong>Eligibility Status:</strong>
                            </div>
                            <div className={`${style.statusBadge} ${getEligibilityClass(performanceData.consistency_status)}`}>
                                {getEligibilityStatus(performanceData.consistency_status)}
                            </div>
                        </div>
                    </div>

                    {/* First Table: Year-wise Chart Data */}
                    <div className={style.tableSection}>
                        <h4>
                            <div className={style.tableIcon}>📊</div>
                            Year-wise Publications and Citations
                        </h4>
                        <table className={style.table}>
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Documents</th>
                                    <th>Citations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performanceData.chart_data && performanceData.chart_data.length > 0 ? (
                                    performanceData.chart_data.map((row) => (
                                        <tr key={row.year}>
                                            <td><strong>{row.year}</strong></td>
                                            <td>{row.documents}</td>
                                            <td>{row.citations}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3}>No chart data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Second Table: Academic Year Data */}
                    <div className={style.tableSection}>
                        <h4>
                            <div className={style.tableIcon}>📅</div>
                            Academic Year-wise Document Count
                        </h4>
                        <table className={style.table}>
                            <thead>
                                <tr>
                                    <th>Academic Year</th>
                                    <th>Documents Published</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performanceData.academic_year_data && performanceData.academic_year_data.length > 0 ? (
                                    performanceData.academic_year_data.map((row) => (
                                        <tr key={row.academic_year}>
                                            <td>
                                                <strong>
                                                    {row.academic_year === '2022-23' && 'July 2022 - June 2023'}
                                                    {row.academic_year === '2023-24' && 'July 2023 - June 2024'}
                                                    {row.academic_year === '2024-25' && 'July 2024 - June 2025'}
                                                </strong>
                                            </td>
                                            <td><strong>{row.document_count}</strong></td>
                                            <td>
                                                <span className={row.document_count >= 3 ? style.yes : style.no}>
                                                    {row.document_count >= 3 ? 'Consistent' : 'Inconsistent'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3}>No academic year data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Consistency Indicator */}
                    {performanceData.consistency_status && (
                        <div className={`${style.consistencyBar} ${style[performanceData.consistency_status]}`}>
                            {getConsistencyMessage(performanceData.consistency_status)}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}