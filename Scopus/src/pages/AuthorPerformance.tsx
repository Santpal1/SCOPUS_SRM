import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import style from "../components/AuthorPerformance.module.css";
import srmLogoN from "../assets/srmist-logo.png";

interface Author {
    scopus_id: string;
    name: string;
}

export default function AuthorPerformance() {
    const [searchTerm, setSearchTerm] = useState("");
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAuthors(""); // Load all authors on page load
    }, []);

    // Debounced search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchAuthors(searchTerm.trim());
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const fetchAuthors = async (term: string) => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5001/api/faculty/author-list`, {
                params: { search: term },
            });
            setAuthors(res.data || []);
        } catch (error) {
            console.error("Error fetching authors:", error);
            setAuthors([]);
        } finally {
            setLoading(false);
        }
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

                {/* Search Box */}
                <div className={style.searchBox}>
                    <input
                        type="text"
                        placeholder="Search by name or Scopus ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table stays mounted to prevent shrinking */}
                <div className={style.tableContainer}>
                    <table className={style.authorTable}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Scopus ID</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={2} className={style.statusCell}>
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
                                    </tr>
                                ))
                            ) : (
                                // Empty state row keeps height consistent
                                <tr>
                                    <td colSpan={2} className={style.emptyState}>
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
