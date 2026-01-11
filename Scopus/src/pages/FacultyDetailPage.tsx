import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import '../components/FacultyDetailPage.css';

interface Faculty {
  scopus_ids?: string[];
  scopus_id?: string;
  name: string;
  docs_count: number;
  faculty_id: string;
  citation_count: number;
  h_index: number;
}

interface Paper {
  scopus_id: string;
  doi: string;
  title: string;
  type: string;
  publication_name: string;
  date: string;
  quartile?: string;
  quartile_year?: string;
  quartiles?: Record<string, string>;
}

interface FacultyDetailResponse {
  faculty: Faculty;
  papers: Paper[];
}

const FacultyDetailPage: React.FC = () => {
  const { facultyId, scopusId } = useParams<{ facultyId?: string; scopusId?: string }>();
  const id = facultyId || scopusId;
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [facultyData, setFacultyData] = useState<FacultyDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [quartileYear, setQuartileYear] = useState<string>('');
  const [selectedQuartile, setSelectedQuartile] = useState<string | null>(null);
  const [quartileSummaryAllYears, setQuartileSummaryAllYears] = useState<Record<string, {
    q1_count: number;
    q2_count: number;
    q3_count: number;
    q4_count: number;
  }> | null>(null);

  const [sdgFilter, setSdgFilter] = useState<string>(
    new URLSearchParams(location.search).get("sdg") || "none"
  );
  const [domainFilter, setDomainFilter] = useState<string>(
    new URLSearchParams(location.search).get("domain") || "none"
  );
  const [yearFilter, setYearFilter] = useState<string>(
    new URLSearchParams(location.search).get("year") || "none"
  );
  const [criteriaStartFilter, setCriteriaStartFilter] = useState<string>(
    new URLSearchParams(location.search).get("start") || ""
  );
  const [criteriaEndFilter, setCriteriaEndFilter] = useState<string>(
    new URLSearchParams(location.search).get("end") || ""
  );

  const updateQuery = (key: string) => {
    const queryParams = new URLSearchParams(location.search);
    queryParams.delete(key);

    switch (key) {
      case 'sdg':
        setSdgFilter("none");
        break;
      case 'domain':
        setDomainFilter("none");
        break;
      case 'year':
        setYearFilter("none");
        break;
      case 'start':
        setCriteriaStartFilter("");
        queryParams.delete('end'); // Remove both start and end when clearing criteria
        setCriteriaEndFilter("");
        break;
      case 'end':
        setCriteriaEndFilter("");
        queryParams.delete('start'); // Remove both start and end when clearing criteria
        setCriteriaStartFilter("");
        break;
      default:
        break;
    }

    navigate({
      pathname: location.pathname,
      search: queryParams.toString()
    });
  };

  useEffect(() => {
    const fetchFacultyDetails = async () => {
      if (!id) {
        setError('No faculty id provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/api/faculty/${id}`, {
          params: {
            sdg: sdgFilter !== "none" ? sdgFilter : undefined,
            domain: domainFilter !== "none" ? domainFilter : undefined,
            year: yearFilter !== "none" ? yearFilter : undefined,
            start: criteriaStartFilter || undefined,
            end: criteriaEndFilter || undefined,
            quartileYear: quartileYear || undefined,
          },
        });
        setFacultyData(response.data);

        // Only fetch quartile summary if no criteria filter is applied
        if (!criteriaStartFilter && !criteriaEndFilter) {
          try {
            const quartRes = await axios.get(`http://localhost:5001/api/faculty/${id}/quartile-summary`);
            const summaryData = quartRes.data || {};
            setQuartileSummaryAllYears(summaryData);

            // Dynamically set default quartile year if not already set
            const allYears = Object.keys(summaryData);
            if (!quartileYear && allYears.length > 0) {
              const latestYear = allYears.sort((a, b) => Number(b) - Number(a))[0];
              setQuartileYear(latestYear);
            }
          } catch (e) {
            console.warn("Failed to load quartile summary:", e);
            setQuartileSummaryAllYears(null);
          }
        }

      } catch (err) {
        setError('Failed to fetch faculty details');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetails();
  }, [id, sdgFilter, domainFilter, yearFilter, criteriaStartFilter, criteriaEndFilter, quartileYear]);

  const yearSummary =
    quartileSummaryAllYears && quartileYear && quartileSummaryAllYears[quartileYear]
      ? quartileSummaryAllYears[quartileYear]
      : { q1_count: 0, q2_count: 0, q3_count: 0, q4_count: 0 };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  // Dynamic Highcharts rendering using backend `author-performance` data
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);
  // Toggle to request full history (min..max years) from backend
  const [fullHistory, setFullHistory] = useState<boolean>(false);

  // Persist the user's preference per faculty in localStorage
  useEffect(() => {
    if (!id) return;
    const key = `faculty_${id}_full_history`;
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) setFullHistory(saved === 'true');
    } catch (e) {
      // ignore (e.g., SSR or blocked storage)
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const key = `faculty_${id}_full_history`;
    try {
      localStorage.setItem(key, fullHistory ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [id, fullHistory]);

  const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.body.appendChild(s);
  });

  useEffect(() => {
    const renderChart = async () => {
      if (!id) return;
      // Only render when no filters applied and not filtering by quartile
      if (sdgFilter !== 'none' || domainFilter !== 'none' || yearFilter !== 'none' || selectedQuartile || criteriaStartFilter || criteriaEndFilter) {
        // Clear chart container when filters applied
        if (chartRef.current) chartRef.current.innerHTML = '';
        return;
      }

      setChartLoading(true);
      setChartError(null);

      try {
        // Load Highcharts (via CDN) if not already present
        if (!(window as any).Highcharts) {
          await loadScript('https://code.highcharts.com/highcharts.js');
          await loadScript('https://code.highcharts.com/modules/exporting.js');
          await loadScript('https://code.highcharts.com/modules/export-data.js');
          await loadScript('https://code.highcharts.com/modules/accessibility.js');
        }

        // Try faculty-level route first, fallback to scopus route
        let res;
        const facultyUrl = `http://localhost:5001/api/faculty/${id}/author-performance`;
        const scopusUrl = `http://localhost:5001/api/faculty/author-performance/${id}`;
        const requestOptions = fullHistory ? { params: { full: 'true' } } : {};
        try {
          try {
            res = await axios.get(facultyUrl, requestOptions);
          } catch (err) {
            res = await axios.get(scopusUrl, requestOptions);
          }
        } catch (err) {
          throw err;
        }

        const chartData = res.data?.chart_data || [];
        const categories = chartData.map((r: any) => r.year);
        const documents = chartData.map((r: any) => r.documents);
        const citations = chartData.map((r: any) => r.citations);

        // Compute xAxis label behavior for long ranges
        const maxLabels = 12; // desired maximum visible labels on x-axis
        const labelStep = categories.length > maxLabels ? Math.ceil(categories.length / maxLabels) : 1;
        const xAxisOptions: any = {
          categories,
          crosshair: true,
          labels: {
            rotation: categories.length > maxLabels ? -45 : 0,
            step: labelStep,
          },
          tickInterval: labelStep
        };

        // Render chart
        const Highcharts = (window as any).Highcharts;
        if (!Highcharts) {
          setChartError('Highcharts not available');
          return;
        }

        // Wait for chart container to be mounted (retry for up to 1s)
        const waitForContainer = async (timeoutMs = 1000, intervalMs = 50) => {
          const maxTries = Math.ceil(timeoutMs / intervalMs);
          for (let i = 0; i < maxTries; i++) {
            if (chartRef.current) return;
            await new Promise(r => setTimeout(r, intervalMs));
          }
          throw new Error('Chart container did not appear in time');
        };

        try {
          await waitForContainer();
        } catch (e: any) {
          console.warn('Chart container not available:', e);
          setChartError('Chart container element not available');
          return;
        }

        // Clear previous chart content (if any)
        if (chartRef.current) {
          chartRef.current.innerHTML = '';
        }

        Highcharts.chart(chartRef.current as any, {
          chart: { zoomType: 'xy' },
          title: { text: `Document and Citation Trends${fullHistory ? ' (Full history)' : ''}` },
          xAxis: xAxisOptions,
          yAxis: [{ // documents
            title: { text: 'Documents' },
            labels: { style: { color: '#3679e0' } }
          }, { // citations
            title: { text: 'Citations' },
            labels: { style: { color: '#000347' } },
            opposite: true
          }],
          tooltip: { shared: true, useHTML: true, headerFormat: '<b>Year: {point.key}</b><br>' },
          series: [
            { name: 'Documents', type: 'column', yAxis: 0, data: documents, color: '#3679e0', tooltip: { valueSuffix: ' documents' } },
            { name: 'Citations', type: 'line', yAxis: 1, data: citations, color: '#000347', marker: { symbol: 'circle' }, tooltip: { valueSuffix: ' citations' } }
          ],
          credits: { enabled: false },
          exporting: { enabled: true }
        });

        // Optionally set the iframeLoaded flag so other features can detect chart is ready
        setIframeLoaded(true);
      } catch (err: any) {
        console.error('Failed to render chart:', err);
        setChartError(err.message || 'Failed to load chart');
      } finally {
        setChartLoading(false);
      }
    };

    renderChart();
  }, [id, sdgFilter, domainFilter, yearFilter, selectedQuartile, criteriaStartFilter, criteriaEndFilter, fullHistory]);
  const generatePDF = async () => {
    if (!facultyData) {
      alert('No data to generate PDF');
      return;
    }

    const { faculty, papers } = facultyData;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let yPos = margin + 15;

    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('FACULTY REPORT', pageWidth / 2, margin + 5, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const nameLabelWidth = doc.getTextWidth('Name:');
    doc.text(faculty.name, margin + nameLabelWidth + 2, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    const scopusText = faculty.scopus_ids && faculty.scopus_ids.length ? faculty.scopus_ids.join(', ') : faculty.scopus_id || 'N/A';
    doc.text('Scopus ID(s):', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const idLabelWidth = doc.getTextWidth('Scopus ID(s):');
    doc.text(scopusText, margin + idLabelWidth + 2, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Documents Published:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const docsLabelWidth = doc.getTextWidth('Documents Published:');
    doc.text(faculty.docs_count.toString(), margin + docsLabelWidth + 4, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Citations:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const citeLabelWidth = doc.getTextWidth('Citations:');
    doc.text(faculty.citation_count.toString(), margin + citeLabelWidth + 2, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('H-Index:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const hindexLabelWidth = doc.getTextWidth('H-Index:');
    doc.text((faculty.h_index ?? 'N/A').toString(), margin + hindexLabelWidth + 2, yPos);

    const filterLines: string[] = [];
    if (sdgFilter !== 'none') filterLines.push(`SDG: ${sdgFilter}`);
    if (domainFilter !== 'none') filterLines.push(`Domain: ${domainFilter}`);
    if (yearFilter !== 'none') filterLines.push(`Year: ${yearFilter}`);
    if (criteriaStartFilter && criteriaEndFilter) filterLines.push(`Date Range: ${criteriaStartFilter} to ${criteriaEndFilter}`);

    if (filterLines.length > 0) {
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Filters Applied:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(filterLines.join(' | '), margin + doc.getTextWidth('Filters Applied:') + 4, yPos);
    }

    yPos += 12;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Publications', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    const cleanText = (text: string | null | undefined) => text?.replace(/[^ -~]+/g, '') || 'N/A';

    papers.forEach((paper, index) => {
      if (yPos + 40 > pageHeight - margin) {
        doc.addPage();
        yPos = margin + 10;
      }

      const pubHeader = `Publication ${index + 1}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(pubHeader, margin, yPos);
      doc.line(margin, yPos + 1, margin + doc.getTextWidth(pubHeader), yPos + 1);

      yPos += 5;
      doc.setFontSize(10);

      const writeLine = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + doc.getTextWidth(label) + 2, yPos);
        yPos += 5;
      };

      const title = cleanText(paper.title);
      const titleLines = doc.splitTextToSize(title, pageWidth - margin * 2 - 20);
      writeLine('Title:', titleLines[0]);
      for (let i = 1; i < titleLines.length; i++) {
        doc.text(titleLines[i], margin + 20, yPos);
        yPos += 5;
      }

      writeLine('DOI:', cleanText(paper.doi));
      writeLine('Type:', cleanText(paper.type));
      writeLine('Publication:', cleanText(paper.publication_name));
      writeLine('Date:', paper.date ? new Date(paper.date).toLocaleDateString() : 'N/A');
      yPos += 5;
    });

    if (sdgFilter === 'none' && domainFilter === 'none' && yearFilter === 'none' && !criteriaStartFilter && !criteriaEndFilter) {
      // If dynamic chart exists, capture it via html2canvas
      const chartElem = (document.getElementById('faculty-highcharts-container') || chartRef.current) as HTMLElement | null;

      if (chartElem) {
        try {
          const canvas = await html2canvas(chartElem);
          const imgData = canvas.toDataURL('image/png');

          if (yPos + 100 > pageHeight - margin) {
            doc.addPage();
            yPos = margin + 10;
          }

          doc.addImage(imgData, 'PNG', margin, yPos, pageWidth - margin * 2, 100);
        } catch (err: any) {
          console.warn('Failed to capture chart for PDF:', err);
          // fall back to skipping the chart rather than crashing
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('Chart not available for export', margin, yPos);
          yPos += 8;
        }
      } else {
        // No chart element — skip cleanly
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Chart not available for export', margin, yPos);
        yPos += 8;
      }
    }

    const fileName = `${faculty.name.replace(/\s+/g, "_")}_Report.pdf`;
    doc.save(fileName);
  };

  if (loading) return <div className="loading">Loading faculty details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!facultyData) return <div className="no-records">No data found for this faculty member.</div>;

  const { faculty, papers: unsortedPapers } = facultyData;

  const allPapers = [...unsortedPapers].sort((a, b) => {
    const dateA = new Date(a.date || '').getTime();
    const dateB = new Date(b.date || '').getTime();
    return dateB - dateA; // Sort from latest to oldest
  });

  const filteredPapers = selectedQuartile
    ? allPapers.filter(
      (p) =>
        p.quartiles?.[quartileYear] &&
        p.quartiles[quartileYear].toUpperCase() === selectedQuartile
    )
    : allPapers;

  // Check if criteria filter is active
  const isCriteriaFilterActive = criteriaStartFilter && criteriaEndFilter;

  return (
    <div className="faculty-detail-container">
      <Link to="/faculty" className="back-button">&laquo; Back to Faculty List</Link>

      <div className="faculty-card">
        <div className="faculty-info">
          {selectedQuartile && (
            <div className="filter-badges">
              <strong>Quartile Filter: </strong>
              <span className="filter-chip">
                {selectedQuartile} <button onClick={() => setSelectedQuartile(null)}>❌</button>
              </span>
            </div>
          )}

          <h2 className="faculty-name">{faculty.name}</h2>
          <p><strong>Scopus ID(s):</strong> {faculty.scopus_ids && faculty.scopus_ids.length ? faculty.scopus_ids.join(', ') : faculty.scopus_id || 'N/A'}</p>
          {faculty.faculty_id && (
            <p><strong>Faculty ID:</strong> {faculty.faculty_id}</p>
          )}
          <p><strong>Documents Published:</strong> {faculty.docs_count}</p>
          <p><strong>Citations:</strong> {faculty.citation_count}</p>
          <p><strong>H-Index:</strong> {faculty.h_index ?? 'N/A'}</p>

          <div className="filter-badges">
            <strong>Filters Applied: </strong>
            {sdgFilter === 'none' && domainFilter === 'none' && yearFilter === 'none' && !isCriteriaFilterActive ? (
              <span className="filter-chip">NA</span>
            ) : (
              <>
                {sdgFilter !== 'none' && (
                  <span className="filter-chip">
                    SDG: {sdgFilter} <button onClick={() => updateQuery('sdg')}>❌</button>
                  </span>
                )}
                {domainFilter !== 'none' && (
                  <span className="filter-chip">
                    Domain: {domainFilter} <button onClick={() => updateQuery('domain')}>❌</button>
                  </span>
                )}
                {yearFilter !== 'none' && (
                  <span className="filter-chip">
                    Year: {yearFilter} <button onClick={() => updateQuery('year')}>❌</button>
                  </span>
                )}
                {isCriteriaFilterActive && (
                  <span className="filter-chip">
                    Date Range: {criteriaStartFilter} to {criteriaEndFilter} <button onClick={() => updateQuery('start')}>❌</button>
                  </span>
                )}
              </>
            )}
          </div>

        </div>

        <div className="faculty-bottom">
          <a
            href={`https://www.scopus.com/authid/detail.uri?authorId=${(faculty.scopus_ids && faculty.scopus_ids[0]) || faculty.scopus_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="scopus-link-button"
          >
            View on Scopus
          </a>
        </div>

        <div className="faculty-actions">
          <button onClick={generatePDF} className="generate-pdf-button">
            📄 Generate Report
          </button>

          {quartileSummaryAllYears && quartileSummaryAllYears[quartileYear] && !isCriteriaFilterActive && sdgFilter === 'none' && domainFilter === 'none' && yearFilter === 'none' && (
            <div className="quartile-summary-table">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h4>Quartile Summary for {quartileYear}</h4>

                {quartileSummaryAllYears && (
                  <select
                    value={quartileYear}
                    onChange={(e) => setQuartileYear(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    {Object.keys(quartileSummaryAllYears)
                      .sort((a, b) => Number(b) - Number(a)) // optional: show latest year first
                      .map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                  </select>
                )}

              </div>

              <table>
                <tbody>
                  <tr
                    className={`q1 ${selectedQuartile === 'Q1' ? 'selected' : ''}`}
                    onClick={() => setSelectedQuartile('Q1')}
                  >
                    <td>Q1</td><td>{yearSummary.q1_count}</td>
                  </tr>
                  <tr
                    className={`q2 ${selectedQuartile === 'Q2' ? 'selected' : ''}`}
                    onClick={() => setSelectedQuartile('Q2')}
                  >
                    <td>Q2</td><td>{yearSummary.q2_count}</td>
                  </tr>
                  <tr
                    className={`q3 ${selectedQuartile === 'Q3' ? 'selected' : ''}`}
                    onClick={() => setSelectedQuartile('Q3')}
                  >
                    <td>Q3</td><td>{yearSummary.q3_count}</td>
                  </tr>
                  <tr
                    className={`q4 ${selectedQuartile === 'Q4' ? 'selected' : ''}`}
                    onClick={() => setSelectedQuartile('Q4')}
                  >
                    <td>Q4</td><td>{yearSummary.q4_count}</td>
                  </tr>

                </tbody>
              </table>

            </div>
          )}

        </div>
      </div>

      <h3 className="publications-title">Publications</h3>
      {filteredPapers.length > 0 ? (
        filteredPapers.map((paper, index) => (
          <Link
            to={`/paper/${encodeURIComponent(paper.doi)}`}
            key={paper.doi || `paper-${index}`}
            className="publication-card-link"
          >
            <div className="publication-card">
              <div className="publication-left">
                <h4>{paper.title}</h4>
                <p><strong>DOI:</strong> {paper.doi || 'N/A'}</p>
                <p><strong>Type:</strong> {paper.type || 'N/A'}</p>
                <p><strong>Publication:</strong> {paper.publication_name || 'N/A'}</p>
                <p><strong>Date:</strong> {paper.date ? new Date(paper.date).toLocaleDateString() : 'N/A'}</p>
              </div>
              {paper.quartiles && paper.type?.toLowerCase().includes("journal") && !isCriteriaFilterActive && (
                <div className="quartile-badge-container">
                  {selectedQuartile
                    ? (() => {
                      const q = paper.quartiles?.[quartileYear];
                      return q &&
                        q.trim() !== "-" &&
                        q.toUpperCase() === selectedQuartile ? (
                        <div
                          className={`quartile-badge ${q.toLowerCase()}`}
                          key={`${paper.doi}-${quartileYear}`}
                        >
                          <span className="quartile-text">
                            {q.toUpperCase()} {quartileYear}
                          </span>
                          <i className="badge-icon">★</i>
                        </div>
                      ) : null;
                    })()
                    : Object.entries(paper.quartiles).map(([year, quartile]) =>
                      quartile && quartile.trim() !== "-" ? (
                        <div
                          key={`${paper.doi}-${year}`}
                          className={`quartile-badge ${quartile.toLowerCase()}`}
                        >
                          <span className="quartile-text">
                            {quartile.toUpperCase()} {year}
                          </span>
                          <i className="badge-icon">★</i>
                        </div>
                      ) : null
                    )}
                </div>
              )}
            </div>
          </Link>
        ))
      ) : (
        <div className="no-records">No publications found for this faculty member.</div>
      )}

      {!isCriteriaFilterActive && (sdgFilter === 'none' && domainFilter === 'none' && yearFilter === 'none' && !selectedQuartile) && (
        <>
          <h3 className="publications-title">Interactive Scopus Dashboard</h3>
        <div className="full-history-control" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="full-history-toggle" role="switch" aria-checked={fullHistory}>
            <div className="switch">
              <input
                className="switch-input"
                type="checkbox"
                checked={fullHistory}
                onChange={(e) => setFullHistory(e.target.checked)}
              />
              <span className="slider" aria-hidden="true"></span>
            </div>
            <span className="switch-label">Show full history</span>
          </label>
          {fullHistory && <small style={{ color: '#666' }}>Displaying full data range (may be large)</small>}
        </div>
        <div className="highcharts-frame-container">
          <div id="faculty-highcharts-container" ref={chartRef} style={{ width: '100%', height: '420px' }}></div>

            {chartLoading && (
              <div style={{ marginTop: 8, color: '#666' }}>Loading chart...</div>
            )}

            {chartError && (
              <div style={{ marginTop: 8, color: 'red' }}>{chartError}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyDetailPage;