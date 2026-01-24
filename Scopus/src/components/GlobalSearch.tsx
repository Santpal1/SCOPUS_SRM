import React, { useState } from 'react';
import axios from 'axios';
import { Search, AlertCircle, Loader } from 'lucide-react';
import styles from './GlobalSearch.module.css';

interface SearchResult {
  faculty?: any[];
  papers?: any[];
  sdgs?: string[];
  total?: number;
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || query.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.get('http://localhost:5001/api/search/global', {
        params: { q: query.trim() }
      });

      if (response.data.success) {
        setResults(response.data.results);
        setSearched(true);
      } else {
        setError(response.data.message || 'Search failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setResults(null);
    setError('');
    setSearched(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputWrapper}>
            <Search size={24} />
            <input
              type="text"
              placeholder="Search faculty, papers, SDGs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className={styles.input}
            />
            {query && (
              <button
                type="button"
                onClick={handleReset}
                className={styles.clearButton}
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={styles.searchButton}
          >
            {loading ? <Loader size={20} className={styles.spinner} /> : 'Search'}
          </button>
        </form>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {searched && results && (
        <div className={styles.resultsContainer}>
          {results.total === 0 ? (
            <div className={styles.noResults}>
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {results.faculty && results.faculty.length > 0 && (
                <div className={styles.resultSection}>
                  <h3 className={styles.sectionTitle}>
                    Faculty ({results.faculty.length})
                  </h3>
                  <div className={styles.resultsList}>
                    {results.faculty.map((faculty: any) => (
                      <div key={faculty.id} className={styles.resultItem}>
                        <div className={styles.resultTitle}>{faculty.faculty_name}</div>
                        <div className={styles.resultSubtitle}>
                          ID: {faculty.faculty_id} | Email: {faculty.email}
                        </div>
                        <div className={styles.resultMeta}>
                          Scopus ID: {faculty.scopus_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.papers && results.papers.length > 0 && (
                <div className={styles.resultSection}>
                  <h3 className={styles.sectionTitle}>
                    Papers ({results.papers.length})
                  </h3>
                  <div className={styles.resultsList}>
                    {results.papers.map((paper: any) => (
                      <div key={paper.doi} className={styles.resultItem}>
                        <div className={styles.resultTitle}>{paper.title}</div>
                        <div className={styles.resultSubtitle}>
                          {paper.publication_name}
                        </div>
                        <div className={styles.resultMeta}>
                          DOI: {paper.doi} | Date: {paper.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.sdgs && results.sdgs.length > 0 && (
                <div className={styles.resultSection}>
                  <h3 className={styles.sectionTitle}>
                    Sustainable Development Goals
                  </h3>
                  <div className={styles.sdgList}>
                    {results.sdgs.map((sdg: string) => (
                      <span key={sdg} className={styles.sdgTag}>
                        {sdg}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
