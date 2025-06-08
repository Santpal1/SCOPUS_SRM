import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../components/FacultyDetailPage.css';

interface Faculty {
  scopus_id: string;
  name: string;
  docs_count: number;
  faculty_id?: string;
  citation_count: number;
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
        const response = await axios.get(`http://localhost:5000/api/faculty/${scopusId}`);
        if (response.data) {
          setFacultyData(response.data);
        } else {
          setError('No data returned from API');
        }
      } catch (err) {
        setError('Failed to fetch faculty details');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetails();
  }, [scopusId]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  if (loading) return <div className="loading">Loading faculty details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!facultyData) return <div className="no-records">No data found for this faculty member.</div>;

  const { faculty, papers } = facultyData;

  //  Generate PDF
  const generatePDF = async () => {
    if (!facultyData) {
      alert('No data to generate PDF');
      return;
    }

    // Wait until the iframe is loaded
    if (!iframeLoaded) {
      alert('Chart is not ready yet. Please wait until the chart is loaded.');
      return;
    }

    const { faculty, papers } = facultyData;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Corrected margin for content width
    let yPos = margin + 15;

    // Title
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('REPORT', pageWidth / 2, margin + 5, { align: 'center' });

    // Faculty Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Name:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const nameLabelWidth = doc.getTextWidth('Name:');
    doc.text(faculty.name, margin + nameLabelWidth + 2, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`Scopus ID:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const nameLabelWidth1 = doc.getTextWidth('Scopus ID:');
    doc.text(faculty.scopus_id, margin + nameLabelWidth1 + 2.5, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`Documents Published:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const nameLabelWidth2 = doc.getTextWidth('Documents Published:');
    doc.text(faculty.docs_count.toString(), margin + nameLabelWidth2 + 5, yPos);

    yPos+=8;
    doc.setFont('helvetica', 'bold');
    doc.text(`Citations:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const nameLabelWidth3 = doc.getTextWidth('Citations:');
    doc.text(faculty.citation_count.toString(), margin + nameLabelWidth3 + 3, yPos);

    yPos += 12;

    // Add "Publications" header
    doc.setFontSize(14);
    doc.addFont('Georgia.ttf', 'Georgia', 'normal');
    doc.setFont('Georgia', 'bold');
    doc.text('Publications', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;

    // Publications
    papers.forEach((paper, index) => {
      // Set publication header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const publicationHeader = `Publication ${index + 1}`;

      // Clean and sanitize text
      const cleanText = (text: string | null | undefined): string => {
        return text ? text.replace(/[^ -~]+/g, '') : 'N/A';
      };

      const title = cleanText(paper.title);
      const doi = cleanText(paper.doi) || 'N/A';
      const type = cleanText(paper.type) || 'N/A';
      const publicationName = cleanText(paper.publication_name) || 'N/A';
      const date = paper.date ? new Date(paper.date).toLocaleDateString() : 'N/A';

      // Check if content fits, otherwise add a new page
      if (yPos + 30 > pageHeight - margin) {
        doc.addPage();
        yPos = margin + 10; // Reset yPos for new page
      }

      // Add publication header
      doc.setFont('helvetica', 'bold');
      doc.text(publicationHeader, margin, yPos);

      // Get text width to determine underline length
      const textWidth = doc.getTextWidth(publicationHeader);
      const lineY = yPos + 1; // Slightly below the text

      // Draw the underline
      doc.line(margin, lineY, margin + textWidth, lineY);
      yPos += 5; // Adjust for the next line of content

      doc.setFontSize(10);

      // Inline printing (same line)
      doc.setFont('helvetica', 'bold');
      doc.text('Title:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidtha = doc.getTextWidth('Title:');
      const titleLines = doc.splitTextToSize(title, pageWidth - margin * 2 - 20);
      doc.text(titleLines, nameLabelWidtha + 12, yPos, { align: 'left' });
      yPos += titleLines.length * 3.5 + 2;

      doc.setFont('helvetica', 'bold');
      doc.text('DOI:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidthc = doc.getTextWidth('DOI:');
      doc.text(doi, nameLabelWidthc + 11, yPos);

      yPos += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Type:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidthd = doc.getTextWidth('Type:');
      doc.text(type, nameLabelWidthd + 12, yPos);

      yPos += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Publication:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidthb = doc.getTextWidth('Publication:');
      const publicationLines = doc.splitTextToSize(publicationName, pageWidth - margin * 2 - 20);
      doc.text(publicationLines, nameLabelWidthb + 13, yPos, { align: 'left' });

      yPos += publicationLines.length * 3.5 + 1.5;

      doc.setFont('helvetica', 'bold');
      doc.text('Date:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidthe = doc.getTextWidth('Date:');
      doc.text(date, nameLabelWidthe + 11, yPos);

      yPos += 12;
    });

    // Capture iframe content using html2canvas
    const iframe = document.querySelector('.highcharts-iframe') as HTMLIFrameElement;
    const iframeDoc = iframe.contentDocument;

    if (iframeDoc) {
      html2canvas(iframeDoc.body).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');

        // Check if content fits, otherwise add a new page
        if (yPos + 100 > pageHeight - margin) {
          doc.addPage();
          yPos = margin + 10;
        }

        // Add the image of the chart
        doc.addImage(imgData, 'PNG', margin, yPos, pageWidth - margin * 2, 100);
        yPos += 100; // Adjust position for next content

        // const pdfUrl = doc.output('bloburl');
        // window.open(pdfUrl, '_blank');
        // ✅ Download the PDF
        doc.save(`${faculty.name.replace(/\s+/g, "_")}_Report.pdf`);
      });
    } else {
      // const pdfUrl = doc.output('bloburl');
      // window.open(pdfUrl, '_blank');
      // ✅ Fallback: Download without chart
      doc.save(`${faculty.name.replace(/\s+/g, "_")}_Report.pdf`);
    }
  };

  return (
    <div className="faculty-detail-container">
      <Link to="/faculty" className="back-button">&laquo; Back to Faculty List</Link>

      <div className="faculty-card">
        <h2 className="faculty-name">{faculty.name}</h2>
        <p><strong>Scopus ID:</strong> {faculty.scopus_id}</p>
        {faculty.faculty_id && <p><strong>Faculty ID:</strong> {faculty.faculty_id}</p>}
        <p><strong>Documents Published:</strong> {faculty.docs_count}</p>
        <p><strong>Citations:</strong> {faculty.citation_count}</p>
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
      {papers && papers.length > 0 ? (
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

      {/*  Embedded Highcharts Dashboard */}
      <h3 className="publications-title">Interactive Scopus Dashboard</h3>
      <div className="highcharts-frame-container">
        <iframe
          src={`/highcharts_dashboards/${faculty.scopus_id}_highcharts_dashboard.html`}
          title="Highcharts Dashboard"
          className="highcharts-iframe"
          //loading="lazy"
          onLoad={handleIframeLoad}
        ></iframe>
      </div>
    </div>
  );
};

export default FacultyDetailPage;