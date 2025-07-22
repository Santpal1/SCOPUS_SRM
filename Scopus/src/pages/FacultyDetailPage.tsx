import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import '../components/FacultyDetailPage.css';

interface Faculty {
  scopus_id: string;
  name: string;
  docs_count: number;
  faculty_id?: string;
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
}

interface FacultyDetailResponse {
  faculty: Faculty;
  papers: Paper[];
}

const FacultyDetailPage: React.FC = () => {
  const { scopusId } = useParams<{ scopusId: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const sdgFilter = queryParams.get("sdg") || "none";
  const domainFilter = queryParams.get("domain") || "none";
  const yearFilter = queryParams.get("year") || "none";

  const [loading, setLoading] = useState<boolean>(true);
  const [facultyData, setFacultyData] = useState<FacultyDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  useEffect(() => {
    const fetchFacultyDetails = async () => {
      if (!scopusId) {
        setError('No Scopus ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5001/api/faculty/${scopusId}`, {
          params: {
            sdg: sdgFilter !== "none" ? sdgFilter : undefined,
            domain: domainFilter !== "none" ? domainFilter : undefined,
            year: yearFilter !== "none" ? yearFilter : undefined,
          },
        });
        setFacultyData(response.data);
      } catch (err) {
        setError('Failed to fetch faculty details');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetails();
  }, [scopusId, sdgFilter, domainFilter, yearFilter]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

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

    // Title
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('FACULTY REPORT', pageWidth / 2, margin + 5, { align: 'center' });

    // Faculty Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const nameLabelWidth = doc.getTextWidth('Name:');
    doc.text(faculty.name, margin + nameLabelWidth + 2, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Scopus ID:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const idLabelWidth = doc.getTextWidth('Scopus ID:');
    doc.text(faculty.scopus_id, margin + idLabelWidth + 2, yPos);

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


    // Show filters if any are selected
    const sdg = new URLSearchParams(window.location.search).get("sdg");
    const domain = new URLSearchParams(window.location.search).get("domain");
    const year = new URLSearchParams(window.location.search).get("year");

    const filterLines: string[] = [];
    if (sdg && sdg !== 'none') filterLines.push(`SDG: ${sdg}`);
    if (domain && domain !== 'none') filterLines.push(`Domain: ${domain}`);
    if (year && year !== 'none') filterLines.push(`Year: ${year}`);

    if (filterLines.length > 0) {
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Filters Applied:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(filterLines.join(' | '), margin + doc.getTextWidth('Filters Applied:') + 4, yPos);
    }

    yPos += 12;

    // Publications Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Publications', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Publications
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

    // Only include chart if NO filters are applied
    if ((!sdg || sdg === 'none') && (!domain || domain === 'none') && (!year || year === 'none')) {
      const iframe = document.querySelector('.highcharts-iframe') as HTMLIFrameElement;
      const iframeDoc = iframe?.contentDocument;

      if (iframeDoc) {
        const canvas = await html2canvas(iframeDoc.body);
        const imgData = canvas.toDataURL('image/png');

        if (yPos + 100 > pageHeight - margin) {
          doc.addPage();
          yPos = margin + 10;
        }

        doc.addImage(imgData, 'PNG', margin, yPos, pageWidth - margin * 2, 100);
      }
    }

    // Save the file
    const fileName = `${faculty.name.replace(/\s+/g, "_")}_Report.pdf`;
    doc.save(fileName);
  };


  if (loading) return <div className="loading">Loading faculty details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!facultyData) return <div className="no-records">No data found for this faculty member.</div>;

  const { faculty, papers } = facultyData;

  return (
    <div className="faculty-detail-container">
      <Link to="/faculty" className="back-button">&laquo; Back to Faculty List</Link>

      <div className="faculty-card">
        <h2 className="faculty-name">{faculty.name}</h2>
        <p><strong>Scopus ID:</strong> {faculty.scopus_id}</p>
        {faculty.faculty_id && <p><strong>Faculty ID:</strong> {faculty.faculty_id}</p>}
        <p><strong>Documents Published:</strong> {faculty.docs_count}</p>
        <p><strong>Citations:</strong> {faculty.citation_count}</p>
        <p><strong>H-Index:</strong> {faculty.h_index ?? 'N/A'}</p>

        {(sdgFilter !== 'none' || domainFilter !== 'none' || yearFilter !== 'none') && (
          <p><strong>Filters Applied:</strong>
            {sdgFilter !== 'none' && ` SDG: ${sdgFilter}`}
            {domainFilter !== 'none' && ` | Domain: ${domainFilter}`}
            {yearFilter !== 'none' && ` | Year: ${yearFilter}`}
          </p>
        )}

        <a
          href={`https://www.scopus.com/authid/detail.uri?authorId=${faculty.scopus_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="scopus-link-button"
        >
          View on Scopus
        </a>

        <button onClick={generatePDF} className="generate-pdf-button">
          📄 Generate Report
        </button>
      </div>

      <h3 className="publications-title">Publications</h3>
      {papers.length > 0 ? (
        papers.map((paper, index) => (
          <Link
            to={`/paper/${encodeURIComponent(paper.doi)}`}
            key={paper.doi || `paper-${index}`}
            className="publication-card-link"
          >
            <div className="publication-card">
              <h4>{paper.title}</h4>
              <p><strong>DOI:</strong> {paper.doi || 'N/A'}</p>
              <p><strong>Type:</strong> {paper.type || 'N/A'}</p>
              <p><strong>Publication:</strong> {paper.publication_name || 'N/A'}</p>
              <p><strong>Date:</strong> {paper.date ? new Date(paper.date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </Link>
        ))
      ) : (
        <div className="no-records">No publications found for this faculty member.</div>
      )}

      {(sdgFilter === 'none' && domainFilter === 'none' && yearFilter === 'none') && (
        <>
          <h3 className="publications-title">Interactive Scopus Dashboard</h3>
          <div className="highcharts-frame-container">
            <iframe
              src={`/highcharts_dashboards/${faculty.scopus_id}_highcharts_dashboard.html`}
              title="Highcharts Dashboard"
              className="highcharts-iframe"
              onLoad={handleIframeLoad}
            ></iframe>
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyDetailPage;
