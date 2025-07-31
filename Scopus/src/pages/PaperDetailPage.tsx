import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../components/PaperDetailPage.module.css';

interface Paper {
    doi: string;
    title: string;
    type: string;
    publication_name: string;
    date: string;
    scopus_id: string;
}

interface PaperInsights {
    scopus_author_id_first: string;
    scopus_author_id_corresponding: string;
    sustainable_development_goals: string;
    qs_subject_code: string;
    qs_subject_field_name: string;
    asjc_code: string;
    asjc_field_name: string;
    no_of_countries: number;
    country_list: string;
    no_of_institutions: number;
    institution_list: string;
    total_authors: number;
}

// Helper to split and clean tags (remove counts in parentheses and trim)
const parseTags = (str: string, separator = '|'): string[] => {
    if (!str) return [];
    return str
        .split(separator)
        .map((item) => item.trim())
        .map((item) => item.replace(/\s*\(\d+\)$/g, '').trim())
        .filter((item) => item.length > 0);
};

// Helper to parse paired fields like "Name (Code)" and return as tag text
const parsePairedTags = (namesStr: string, codesStr: string): string[] => {
    const names = namesStr ? namesStr.split('|').map((n) => n.trim()) : [];
    const codes = codesStr ? codesStr.split('|').map((c) => c.trim()) : [];
    let tags = [];
    for (let i = 0; i < names.length; i++) {
        const code = codes[i] ? codes[i] : '';
        const tag = code ? `${names[i]} (${code})` : names[i];
        tags.push(tag);
    }
    return tags;
};

const PaperDetailPage: React.FC = () => {
    const { doi } = useParams<{ doi: string }>();
    const navigate = useNavigate();

    const [paper, setPaper] = useState<Paper | null>(null);
    const [insights, setInsights] = useState<PaperInsights | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const encodedDOI = encodeURIComponent(doi || '');
                const response = await axios.get(`http://localhost:5001/api/paper/${encodedDOI}`);
                setPaper(response.data.paper);
                setInsights(response.data.insights);
            } catch (err) {
                setError('Failed to fetch paper data');
            } finally {
                setLoading(false);
            }
        };

        fetchPaper();
    }, [doi]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div className={styles.loadingMessage}>Loading paper details...</div>
            </div>
        );
    }
    
    if (error) return <div className={styles.errorMessage}>{error}</div>;
    if (!paper) return <div className={styles.errorMessage}>No data found for this paper.</div>;

    return (
        <div className={styles.paperDetailContainer}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundPattern}></div>
            <div className={styles.floatingOrbs}>
                <div className={styles.orb}></div>
                <div className={styles.orb}></div>
                <div className={styles.orb}></div>
            </div>

            {/* Back Button */}
            <div className={styles.headerSection}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <span className={styles.backIcon}>←</span>
                    <span>Back to Faculty Details</span>
                    <div className={styles.buttonRipple}></div>
                </button>
            </div>

            {/* Paper Info Card */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.pulseIcon}>📄</div>
                    <div className={styles.cardHeaderContent}>
                        <h1 className={styles.paperTitle} title={paper.title}>{paper.title}</h1>
                        <div className={styles.titleUnderline}></div>
                    </div>
                </div>

                <div className={styles.paperMetadata}>
                    <div className={styles.metadataGrid}>
                        <div className={styles.metadataItem}>
                            <span className={styles.metadataIcon}>🔗</span>
                            <div className={styles.metadataContent}>
                                <span className={styles.label}>DOI</span>
                                <span className={styles.value}>{paper.doi}</span>
                            </div>
                        </div>

                        <div className={styles.metadataItem}>
                            <span className={styles.metadataIcon}>📖</span>
                            <div className={styles.metadataContent}>
                                <span className={styles.label}>Publication</span>
                                <span className={styles.value}>{paper.publication_name}</span>
                            </div>
                        </div>

                        <div className={styles.metadataItem}>
                            <span className={styles.metadataIcon}>📋</span>
                            <div className={styles.metadataContent}>
                                <span className={styles.label}>Type</span>
                                <span className={styles.value}>{paper.type}</span>
                            </div>
                        </div>

                        <div className={styles.metadataItem}>
                            <span className={styles.metadataIcon}>📅</span>
                            <div className={styles.metadataContent}>
                                <span className={styles.label}>Date</span>
                                <span className={styles.value}>{new Date(paper.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced View Paper Button */}
                <div className={styles.actionSection}>
                    <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.doiButton}
                    >
                        <span className={styles.buttonIcon}>🚀</span>
                        <span>View Paper on DOI.org</span>
                        <div className={styles.buttonGlow}></div>
                    </a>
                </div>
            </div>

            {/* Enhanced Analytics Card */}
            {insights ? (
                <div className={styles.analyticsCard}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.headerIcon}>📊</div>
                        <h3 className={styles.sectionTitle}>Research Analytics</h3>
                        <div className={styles.headerDecoration}></div>
                    </div>

                    <div className={styles.analyticsGrid}>
                        {/* Author Information */}
                        <div className={styles.analyticsSection}>
                            <h4 className={styles.subsectionTitle}>
                                <span className={styles.subsectionIcon}>👥</span>
                                Author Information
                            </h4>
                            <div className={styles.authorGrid}>
                                <div className={styles.authorCard}>
                                    <div className={styles.authorIconWrapper}>
                                        <span className={styles.authorIcon}>👤</span>
                                    </div>
                                    <div className={styles.authorContent}>
                                        <span className={styles.authorLabel}>First Author</span>
                                        <span className={styles.authorId}>ID: {insights.scopus_author_id_first}</span>
                                    </div>
                                </div>
                                
                                <div className={styles.authorCard}>
                                    <div className={styles.authorIconWrapper}>
                                        <span className={styles.authorIcon}>✍️</span>
                                    </div>
                                    <div className={styles.authorContent}>
                                        <span className={styles.authorLabel}>Corresponding Author</span>
                                        <span className={styles.authorId}>ID: {insights.scopus_author_id_corresponding}</span>
                                    </div>
                                </div>
                                
                                <div className={styles.authorCard}>
                                    <div className={styles.authorIconWrapper}>
                                        <span className={styles.authorIcon}>👥</span>
                                    </div>
                                    <div className={styles.authorContent}>
                                        <span className={styles.authorLabel}>Total Authors</span>
                                        <span className={styles.countBadge}>{insights.total_authors}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Research Classification */}
                        <div className={styles.analyticsSection}>
                            <h4 className={styles.subsectionTitle}>
                                <span className={styles.subsectionIcon}>🔬</span>
                                Research Classification
                            </h4>
                            
                            <div className={styles.tagSection}>
                                <div className={styles.tagGroup}>
                                    <span className={styles.tagGroupLabel}>🎯 SDGs</span>
                                    <div className={styles.tagContainer}>
                                        {insights.sustainable_development_goals
                                            ? insights.sustainable_development_goals.split('|').map((sdg, idx) => (
                                                <span key={idx} className={`${styles.tag} ${styles.sdgTag}`}>{sdg.trim()}</span>
                                            ))
                                            : <span className={styles.noDataTag}>None</span>}
                                    </div>
                                </div>

                                <div className={styles.tagGroup}>
                                    <span className={styles.tagGroupLabel}>🏫 QS Subject</span>
                                    <div className={styles.tagContainer}>
                                        {parsePairedTags(insights.qs_subject_field_name, insights.qs_subject_code).map((tag, idx) => (
                                            <span key={idx} className={`${styles.tag} ${styles.qsTag}`}>{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.tagGroup}>
                                    <span className={styles.tagGroupLabel}>🔬 ASJC Field</span>
                                    <div className={styles.tagContainer}>
                                        {parsePairedTags(insights.asjc_field_name, insights.asjc_code).map((tag, idx) => (
                                            <span key={idx} className={`${styles.tag} ${styles.asjcTag}`}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Global Reach */}
                        <div className={styles.analyticsSection}>
                            <h4 className={styles.subsectionTitle}>
                                <span className={styles.subsectionIcon}>🌍</span>
                                Global Reach
                            </h4>
                            
                            <div className={styles.reachStats}>
                                <div className={styles.statCard}>
                                    <span className={styles.statIcon}>🌍</span>
                                    <div className={styles.statContent}>
                                        <span className={styles.statNumber}>{insights.no_of_countries}</span>
                                        <span className={styles.statLabel}>Countries</span>
                                    </div>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statIcon}>🏛️</span>
                                    <div className={styles.statContent}>
                                        <span className={styles.statNumber}>{insights.no_of_institutions}</span>
                                        <span className={styles.statLabel}>Institutions</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.tagGroup}>
                                <span className={styles.tagGroupLabel}>🗺️ Countries</span>
                                <div className={styles.tagContainer}>
                                    {parseTags(insights.country_list).map((country, idx) => (
                                        <span key={idx} className={`${styles.tag} ${styles.countryTag}`}>{country}</span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.tagGroup}>
                                <span className={styles.tagGroupLabel}>🏢 Institutions</span>
                                <div className={styles.tagContainer}>
                                    {parseTags(insights.institution_list).map((inst, idx) => (
                                        <span key={idx} className={`${styles.tag} ${styles.institutionTag}`}>{inst}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.noDataCard}>
                    <div className={styles.noDataIcon}>📊</div>
                    <p className={styles.noDataMessage}>No advanced insights available for this paper.</p>
                </div>
            )}
        </div>
    );
};

export default PaperDetailPage;