import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
        .map((item) => item.replace(/\s*\(\d+\)$/g, '').trim()) // remove trailing (number)
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
    const [paper, setPaper] = useState<Paper | null>(null);
    const [insights, setInsights] = useState<PaperInsights | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const encodedDOI = encodeURIComponent(doi || '');
                const response = await axios.get(`http://localhost:5000/api/paper/${encodedDOI}`);
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

    if (loading) return <div className={styles.loadingMessage}>Loading paper details...</div>;
    if (error) return <div className={styles.errorMessage}>{error}</div>;
    if (!paper) return <div className={styles.errorMessage}>No data found for this paper.</div>;

    return (
        <div className={styles.paperDetailContainer}>

            {/* Paper Info Card */}
            <div className={styles.card}>
                <h2>{paper.title}</h2>
                <p><span className={styles.label}>DOI:</span> <span className={styles.value}>{paper.doi}</span></p>
                <p><span className={styles.label}>Publication:</span> <span className={styles.value}>{paper.publication_name}</span></p>
                <p><span className={styles.label}>Type:</span> <span className={styles.value}>{paper.type}</span></p>
                <p><span className={styles.label}>Date:</span> <span className={styles.value}>{new Date(paper.date).toLocaleDateString()}</span></p>
            </div>

            {/* Analytics Card */}
            {insights ? (
                <div className={styles.section}>
                    <h3>Analytics</h3>
                    <p><span className={styles.label}>First Author ID:</span> <span className={styles.value}>{insights.scopus_author_id_first}</span></p>
                    <p><span className={styles.label}>Corresponding Author ID:</span> <span className={styles.value}>{insights.scopus_author_id_corresponding}</span></p>

                    <p>
                        <span className={styles.label}>SDGs:</span>{' '}
                        {insights.sustainable_development_goals
                            ? insights.sustainable_development_goals.split('|').map((sdg, idx) => (
                                <span key={idx} className={styles.tag}>{sdg.trim()}</span>
                            ))
                            : <span className={styles.value}>None</span>}
                    </p>

                    <p>
                        <span className={styles.label}>QS Subject:</span>{' '}
                        {parsePairedTags(insights.qs_subject_field_name, insights.qs_subject_code).map((tag, idx) => (
                            <span key={idx} className={styles.tag}>{tag}</span>
                        ))}
                    </p>

                    <p>
                        <span className={styles.label}>ASJC Field:</span>{' '}
                        {parsePairedTags(insights.asjc_field_name, insights.asjc_code).map((tag, idx) => (
                            <span key={idx} className={styles.tag}>{tag}</span>
                        ))}
                    </p>

                    <p><span className={styles.label}>Total Authors:</span> <span className={styles.value}>{insights.total_authors}</span></p>

                    <p>
                        <span className={styles.label}>Countries:</span>{' '}
                        {parseTags(insights.country_list).map((country, idx) => (
                            <span key={idx} className={styles.tag}>{country}</span>
                        ))}
                    </p>

                    <p>
                        <span className={styles.label}>Institutions:</span>{' '}
                        {parseTags(insights.institution_list).map((inst, idx) => (
                            <span key={idx} className={styles.tag}>{inst}</span>
                        ))}
                    </p>
                </div>
            ) : (
                <p className={styles.errorMessage}>No advanced insights available for this paper.</p>
            )}

        </div>
    );
};

export default PaperDetailPage;