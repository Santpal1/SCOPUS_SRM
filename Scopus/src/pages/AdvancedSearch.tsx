import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  X,
  Loader,
  Users,
  FileText,
  TrendingUp,
  Filter,
} from 'lucide-react';
import srmLogo from '../assets/srm_logo.png';
import UserMenu from '../components/UserMenu';
import styles from './AdvancedSearch.module.css';

interface Faculty {
  faculty_id: string;
  name: string;
  h_index: number;
  total_docs: number;
  docs_2024?: number;
  docs_2023?: number;
  docs_2022?: number;
}

interface SearchFilters {
  name: string;
  minHIndex: number;
  maxHIndex: number;
  startDate: string;
  endDate: string;
  sdg: string;
  domain: string;
}

const AdvancedSearch: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    name: '',
    minHIndex: 0,
    maxHIndex: 100,
    startDate: '',
    endDate: '',
    sdg: '',
    domain: '',
  });

  const [results, setResults] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sdgs, setSDGs] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Load filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [sdgRes, domainRes] = await Promise.all([
        axios.get('http://localhost:5001/api/sdg/list'),
        axios.get('http://localhost:5001/api/insights/domains'),
      ]);
      setSDGs(sdgRes.data || []);
      setDomains(domainRes.data || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: name.includes('Index') || name.includes('Date') ? value : value,
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.minHIndex > 0) params.append('minHIndex', filters.minHIndex.toString());
      if (filters.maxHIndex < 100) params.append('maxHIndex', filters.maxHIndex.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sdg) params.append('sdg', filters.sdg);
      if (filters.domain) params.append('domain', filters.domain);

      const response = await axios.get(
        `http://localhost:5001/api/search/advanced?${params.toString()}`
      );

      if (response.data.success) {
        setResults(response.data.results || []);
      } else {
        setError(response.data.message || 'Search failed');
      }
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      minHIndex: 0,
      maxHIndex: 100,
      startDate: '',
      endDate: '',
      sdg: '',
      domain: '',
    });
    setResults([]);
    setSearched(false);
    setError('');
  };

  return (
    <div>
      {/* Navbar */}
      <div className={styles.navbar}>
        <a className={styles.logo}>
          <img src={srmLogo} alt="SRM Logo" className={styles.navLogo} />
          <span>SRM SP</span>
        </a>
        <UserMenu />
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/dashboard" className={styles.backButton}>← Back to Dashboard</Link>
          <h1 className={styles.title}>Advanced Search</h1>
          <p className={styles.subtitle}>
            Find faculty members and research with advanced filtering options
          </p>
        </div>

        {/* Search Form */}
        <div className={styles.searchCard}>
          <div className={styles.searchHeader}>
            <Filter size={24} />
            <h2>Search Filters</h2>
          </div>

          <form onSubmit={handleSearch} className={styles.form}>
            <div className={styles.formGrid}>
              {/* Name Search */}
              <div className={styles.formGroup}>
                <label htmlFor="name">Faculty Name</label>
                <div className={styles.inputWrapper}>
                  <Search size={18} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    placeholder="Search by faculty name..."
                    className={styles.input}
                  />
                </div>
              </div>

              {/* H-Index Range */}
              <div className={styles.formGroup}>
                <label>H-Index Range</label>
                <div className={styles.rangeContainer}>
                  <div className={styles.rangeInputs}>
                    <input
                      type="number"
                      name="minHIndex"
                      min="0"
                      max="100"
                      value={filters.minHIndex}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className={styles.input}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      name="maxHIndex"
                      min="0"
                      max="100"
                      value={filters.maxHIndex}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.rangeSlider}>
                    <input
                      type="range"
                      name="minHIndex"
                      min="0"
                      max="100"
                      value={filters.minHIndex}
                      onChange={handleFilterChange}
                      className={styles.slider}
                    />
                    <input
                      type="range"
                      name="maxHIndex"
                      min="0"
                      max="100"
                      value={filters.maxHIndex}
                      onChange={handleFilterChange}
                      className={styles.slider}
                    />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className={styles.formGroup}>
                <label>Publication Date Range</label>
                <div className={styles.rangeInputs}>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className={styles.input}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* SDG Selection */}
              <div className={styles.formGroup}>
                <label htmlFor="sdg">Sustainable Development Goal</label>
                <select
                  id="sdg"
                  name="sdg"
                  value={filters.sdg}
                  onChange={handleFilterChange}
                  className={styles.select}
                >
                  <option value="">All SDGs</option>
                  {sdgs.map(sdg => (
                    <option key={sdg} value={sdg}>{sdg}</option>
                  ))}
                </select>
              </div>

              {/* Domain Selection */}
              <div className={styles.formGroup}>
                <label htmlFor="domain">Research Domain</label>
                <select
                  id="domain"
                  name="domain"
                  value={filters.domain}
                  onChange={handleFilterChange}
                  className={styles.select}
                >
                  <option value="">All Domains</option>
                  {domains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
              <button type="submit" disabled={loading} className={styles.searchButton}>
                {loading ? (
                  <>
                    <Loader size={20} className={styles.spinner} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className={styles.resetButton}
              >
                <X size={20} />
                Reset Filters
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        {/* Results Section */}
        {searched && (
          <div className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <h2>Search Results ({results.length})</h2>
              {results.length > 0 && (
                <div className={styles.resultStats}>
                  <div className={styles.stat}>
                    <Users size={18} />
                    <span>{results.length} faculty found</span>
                  </div>
                  <div className={styles.stat}>
                    <FileText size={18} />
                    <span>
                      {results.reduce((sum, f) => sum + (f.total_docs || 0), 0)} publications
                    </span>
                  </div>
                  <div className={styles.stat}>
                    <TrendingUp size={18} />
                    <span>
                      Avg H-Index: {(
                        results.reduce((sum, f) => sum + (f.h_index || 0), 0) / results.length
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <div className={styles.noResults}>
                <Search size={48} />
                <p>No results found matching your filters.</p>
                <p className={styles.noResultsHint}>Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className={styles.resultsTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Faculty Name</th>
                      <th>Faculty ID</th>
                      <th>H-Index</th>
                      <th>Total Publications</th>
                      <th>2024</th>
                      <th>2023</th>
                      <th>2022</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(faculty => (
                      <tr key={faculty.faculty_id}>
                        <td className={styles.nameCell}>
                          <strong>{faculty.name}</strong>
                        </td>
                        <td>{faculty.faculty_id}</td>
                        <td>
                          <span className={styles.hindexBadge}>
                            {faculty.h_index || 0}
                          </span>
                        </td>
                        <td>{faculty.total_docs || 0}</td>
                        <td>{faculty.docs_2024 || 0}</td>
                        <td>{faculty.docs_2023 || 0}</td>
                        <td>{faculty.docs_2022 || 0}</td>
                        <td>
                          <Link
                            to={`/faculty/${faculty.faculty_id}`}
                            className={styles.viewButton}
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Initial State Message */}
        {!searched && (
          <div className={styles.initialState}>
            <Search size={64} />
            <p>Use the filters above to search for faculty and research</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;
