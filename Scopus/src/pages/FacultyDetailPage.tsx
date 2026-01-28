import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import srmLogo from '../assets/srmist-logo.png';
import UserMenu from '../components/UserMenu';
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
        queryParams.delete('end');
        setCriteriaEndFilter("");
        break;
      case 'end':
        setCriteriaEndFilter("");
        queryParams.delete('start');
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

        if (!criteriaStartFilter && !criteriaEndFilter) {
          try {
            const quartRes = await axios.get(`http://localhost:5001/api/faculty/${id}/quartile-summary`);
            const summaryData = quartRes.data || {};
            setQuartileSummaryAllYears(summaryData);

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

  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [fullHistory, setFullHistory] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const key = `faculty_${id}_full_history`;
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) setFullHistory(saved === 'true');
    } catch (e) {
      // ignore
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
      if (sdgFilter !== 'none' || domainFilter !== 'none' || yearFilter !== 'none' || selectedQuartile || criteriaStartFilter || criteriaEndFilter) {
        if (chartRef.current) chartRef.current.innerHTML = '';
        return;
      }

      setChartLoading(true);
      setChartError(null);

      try {
        if (!(window as any).Highcharts) {
          await loadScript('https://code.highcharts.com/highcharts.js');
          await loadScript('https://code.highcharts.com/modules/exporting.js');
          await loadScript('https://code.highcharts.com/modules/export-data.js');
          await loadScript('https://code.highcharts.com/modules/accessibility.js');
        }

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

        const maxLabels = 12;
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

        const Highcharts = (window as any).Highcharts;
        if (!Highcharts) {
          setChartError('Highcharts not available');
          return;
        }

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

        if (chartRef.current) {
          chartRef.current.innerHTML = '';
        }

        Highcharts.chart(chartRef.current as any, {
          chart: { zoomType: 'xy' },
          title: { text: `Document and Citation Trends${fullHistory ? ' (Full history)' : ''}` },
          xAxis: xAxisOptions,
          yAxis: [{
            title: { text: 'Documents' },
            labels: { style: { color: '#3679e0' } }
          }, {
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
    console.log('Generate PDF button clicked');

    if (!facultyData) {
      alert('No data to generate PDF');
      return;
    }

    try {
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
      yPos = margin + 20;

      doc.setFont('helvetica', 'bold');
      doc.text('Name:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const facultyName = String(faculty.name || 'N/A');
      doc.text(facultyName, margin + 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'bold');
      const hasScopusIds = (faculty as any).scopus_ids && Array.isArray((faculty as any).scopus_ids);
      const scopusLabel = hasScopusIds ? 'Scopus IDs:' : 'Scopus ID:';
      doc.text(scopusLabel, margin, yPos);
      doc.setFont('helvetica', 'normal');

      if (hasScopusIds) {
        const scopusIds = (faculty as any).scopus_ids.join(', ');
        const scopusIdLines = doc.splitTextToSize(scopusIds, pageWidth - margin * 2 - 30);
        let scopusYPos = yPos;
        scopusIdLines.forEach((line: string) => {
          doc.text(line, margin + 30, scopusYPos);
          scopusYPos += 5;
        });
        yPos = scopusYPos + 3;
      } else {
        doc.text(String(faculty.scopus_id || 'N/A'), margin + 30, yPos);
        yPos += 8;
      }

      if (faculty.faculty_id) {
        doc.setFont('helvetica', 'bold');
        doc.text('Faculty ID:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(String(faculty.faculty_id), margin + 30, yPos);
        yPos += 8;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Documents Published:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(String(faculty.docs_count || 0), margin + 60, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'bold');
      doc.text('Citations:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(String(faculty.citation_count || 0), margin + 30, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'bold');
      doc.text('H-Index:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(String(faculty.h_index ?? 'N/A'), margin + 25, yPos);
      yPos += 10;

      const filterLines: string[] = [];
      if (sdgFilter !== 'none') filterLines.push(`SDG: ${sdgFilter}`);
      if (domainFilter !== 'none') filterLines.push(`Domain: ${domainFilter}`);
      if (yearFilter !== 'none') filterLines.push(`Year: ${yearFilter}`);
      if (criteriaStartFilter && criteriaEndFilter) {
        filterLines.push(`Date Range: ${criteriaStartFilter} to ${criteriaEndFilter}`);
      }

      if (filterLines.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Filters Applied:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const filterText = filterLines.join(' | ');
        const filterTextLines = doc.splitTextToSize(filterText, pageWidth - margin * 2);
        filterTextLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 5;
        });
        doc.setFontSize(12);
        yPos += 2;
      }

      yPos += 6;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Publications', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      const cleanText = (text: string | null | undefined): string => {
        if (!text) return 'N/A';
        return String(text).replace(/[^\x20-\x7E]/g, '').trim() || 'N/A';
      };

      papers.forEach((paper, index) => {
        if (yPos + 50 > pageHeight - margin) {
          doc.addPage();
          yPos = margin + 10;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Publication ${index + 1}`, margin, yPos);
        yPos += 6;

        doc.setFontSize(10);

        doc.setFont('helvetica', 'bold');
        doc.text('Title:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        const titleText = cleanText(paper.title);
        const titleLines = doc.splitTextToSize(titleText, pageWidth - margin * 2 - 20);
        let titleYPos = yPos;
        titleLines.forEach((line: string) => {
          doc.text(line, margin + 20, titleYPos);
          titleYPos += 5;
        });
        yPos = titleYPos;

        if (yPos + 10 > pageHeight - margin) {
          doc.addPage();
          yPos = margin + 10;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('DOI:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(cleanText(paper.doi), margin + 20, yPos);
        yPos += 5;

        if (yPos + 10 > pageHeight - margin) {
          doc.addPage();
          yPos = margin + 10;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Type:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(cleanText(paper.type), margin + 20, yPos);
        yPos += 5;

        if (yPos + 10 > pageHeight - margin) {
          doc.addPage();
          yPos = margin + 10;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Publication:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        const pubNameText = cleanText(paper.publication_name);
        const pubNameLines = doc.splitTextToSize(pubNameText, pageWidth - margin * 2 - 35);
        let pubYPos = yPos;
        pubNameLines.forEach((line: string) => {
          doc.text(line, margin + 35, pubYPos);
          pubYPos += 5;
        });
        yPos = pubYPos;

        if (yPos + 10 > pageHeight - margin) {
          doc.addPage();
          yPos = margin + 10;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Date:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        const dateText = paper.date ? new Date(paper.date).toLocaleDateString() : 'N/A';
        doc.text(dateText, margin + 20, yPos);
        yPos += 5;

        if (paper.quartiles && Object.keys(paper.quartiles).length > 0) {
          if (yPos + 10 > pageHeight - margin) {
            doc.addPage();
            yPos = margin + 10;
          }
          const quartileText = Object.entries(paper.quartiles)
            .filter(([_, q]) => q && String(q).trim() !== '-')
            .map(([year, q]) => `${String(q).toUpperCase()} (${year})`)
            .join(', ');

          if (quartileText) {
            doc.setFont('helvetica', 'bold');
            doc.text('Quartile:', margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(quartileText, margin + 28, yPos);
            yPos += 5;
          }
        }

        yPos += 8;
      });

      if (sdgFilter === 'none' &&
        domainFilter === 'none' &&
        yearFilter === 'none' &&
        !criteriaStartFilter &&
        !criteriaEndFilter) {

        const iframe = document.querySelector('.highcharts-iframe') as HTMLIFrameElement;

        if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
          try {
            console.log('Attempting to capture iframe chart...');

            doc.addPage();
            yPos = margin + 10;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Document and Citation Trends', pageWidth / 2, yPos, { align: 'center' });
            yPos += 12;

            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(iframe.contentDocument.body, {
              scale: 2,
              logging: true,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              width: iframe.contentDocument.body.scrollWidth,
              height: iframe.contentDocument.body.scrollHeight
            });

            console.log('Chart canvas created:', canvas.width, 'x', canvas.height);

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const maxHeight = pageHeight - yPos - margin - 10;
            const finalHeight = Math.min(imgHeight, maxHeight);

            doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, finalHeight);
            console.log('Chart added to PDF successfully');
          } catch (err: any) {
            console.error('Failed to capture chart for PDF:', err);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text('Chart could not be captured', pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`Error: ${err.message}`, pageWidth / 2, yPos, { align: 'center' });
          }
        } else {
          console.warn('Iframe or iframe content not found');
        }
      }

      const fileName = `${facultyName.replace(/[^a-zA-Z0-9]/g, '_')}_Faculty_Report.pdf`;
      console.log('Saving PDF:', fileName);
      doc.save(fileName);
      console.log('PDF generated successfully!');

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) return <div className="loading">Loading faculty details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!facultyData) return <div className="no-records">No data found for this faculty member.</div>;

  const { faculty, papers: unsortedPapers } = facultyData;

  const allPapers = [...unsortedPapers].sort((a, b) => {
    const dateA = new Date(a.date || '').getTime();
    const dateB = new Date(b.date || '').getTime();
    return dateB - dateA;
  });

  const filteredPapers = selectedQuartile
    ? allPapers.filter(
      (p) =>
        p.quartiles?.[quartileYear] &&
        p.quartiles[quartileYear].toUpperCase() === selectedQuartile
    )
    : allPapers;

  const isCriteriaFilterActive = criteriaStartFilter && criteriaEndFilter;

  return (
    <div className="faculty-detail-page-wrapper">
      {/* Fixed Header - Outside Main Container */}
      <div className="faculty-detail-header">
        <div className="header-content">
          <div className="header-left">
            <a className="faculty-logo">
              <img src={srmLogo} alt="SRM Logo" className="faculty-navLogo" />
              <span>SRM SP</span>
            </a>
          </div>
          <div className="header-right">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="faculty-detail-container">
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
          <Link to="/faculty" className="back-button">&laquo; Back to Faculty List</Link>
        </div>
        
        <div className="faculty-card">
          <div className="faculty-card-layout">
            {/* Left Side - Faculty Info */}
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
              </div>
            </div>

            {/* Right Side - Quartile Summary Table */}
            {quartileSummaryAllYears && quartileSummaryAllYears[quartileYear] && !isCriteriaFilterActive && sdgFilter === 'none' && domainFilter === 'none' && yearFilter === 'none' && (
              <div className="quartile-summary-section">
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
                          .sort((a, b) => Number(b) - Number(a))
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
    </div>
  );
};

export default FacultyDetailPage;