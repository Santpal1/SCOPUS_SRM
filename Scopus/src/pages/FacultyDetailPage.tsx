import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../components/FacultyDetailPage.css';

interface Faculty {
  scopus_id: string;
  name: string;
  docs_count: number;
  faculty_id?: string;
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
        setError(`Failed to fetch faculty details`);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetails();
  }, [scopusId]);

  if (loading) return <div className="loading">Loading faculty details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!facultyData) return <div className="no-records">No data found for this faculty member.</div>;

  const { faculty, papers } = facultyData;

  // Prepare data for the graph - Publications in the past 3 years
  const currentYear = new Date().getFullYear();
  const publicationCounts = [
    { year: currentYear - 2, count: 0 },
    { year: currentYear - 1, count: 0 },
    { year: currentYear, count: 0 },
  ];

  papers.forEach((paper) => {
    const paperDate = new Date(paper.date);
    const paperYear = paperDate.getFullYear();

    publicationCounts.forEach((entry) => {
      if (entry.year === paperYear) {
        if (paperYear === currentYear) {
          const currentMonth = new Date().getMonth();
          if (paperDate.getMonth() <= currentMonth) {
            entry.count += 1;
          }
        } else {
          entry.count += 1;
        }
      }
    });
  });

  // 🎯 Generate PDF

  const generatePDF = async() => {
    if (!facultyData) {
      alert('No data to generate PDF');
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
      doc.text(titleLines, nameLabelWidtha+12, yPos, { align: 'left' });
      yPos += titleLines.length*3.5 + 2;
  
      doc.setFont('helvetica', 'bold');
      doc.text('DOI:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidthc = doc.getTextWidth('DOI:');
      doc.text(doi, nameLabelWidthc+11, yPos);
  
      yPos += 5;
  
      doc.setFont('helvetica', 'bold');
      doc.text('Type:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidthd = doc.getTextWidth('Type:');
      doc.text(type, nameLabelWidthd+12, yPos);
  
      yPos += 5;
  
      doc.setFont('helvetica', 'bold');
      doc.text('Publication:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidthb = doc.getTextWidth('Publication:');
      const publicationLines = doc.splitTextToSize(publicationName, pageWidth - margin * 2 - 20);
      doc.text(publicationLines, nameLabelWidthb+13, yPos, { align: 'left' });
  
      yPos += publicationLines.length*3.5 + 1.5;
  
      doc.setFont('helvetica', 'bold');
      doc.text('Date:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const nameLabelWidthe = doc.getTextWidth('Date:');
      doc.text(date, nameLabelWidthe+11, yPos);
  
      yPos += 12;
    });
    
     // 🔥 Fix: Capture the chart only when it's rendered
  const waitForChartToRender = () => {
    return new Promise<void>((resolve) => {
      const checkChart = () => {
        const chartElement = document.getElementById("publication-bar-chart");
        if (chartElement) {
          resolve();
        } else {
          requestAnimationFrame(checkChart);
        }
      };
      checkChart();
    });
  };

  await waitForChartToRender();

  const chartElement = document.getElementById("publication-bar-chart");
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, {
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      if (yPos + 80 > pageHeight - margin) {
        doc.addPage();
        yPos = margin + 10;
      }

      doc.setFontSize(14);
      doc.setFont("Georgia", "bold");
      doc.text("Publications in the Last 3 Years", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      doc.addImage(imgData, "PNG", margin, yPos, pageWidth - margin * 2, 60);
    } catch (error) {
      console.error("Error capturing chart:", error);
    }
  }
  const pdfUrl = doc.output('bloburl');
  window.open(pdfUrl, '_blank');
};
  
  
  


return (
  <div className="faculty-detail-container">
    <Link to="/faculty" className="back-button">&laquo; Back to Faculty List</Link>

    <div className="faculty-card">
      <h2 className="faculty-name">{faculty.name}</h2>
      <p><strong>Scopus ID:</strong> {faculty.scopus_id}</p>
      {faculty.faculty_id && <p><strong>Faculty ID:</strong> {faculty.faculty_id}</p>}
      <p><strong>Documents Published:</strong> {faculty.docs_count}</p>
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
        <div key={paper.doi || `paper-${index}`} className="publication-card">
          <h4>{paper.title}</h4>
          <p><strong>DOI:</strong> {paper.doi || 'N/A'}</p>
          <p><strong>Type:</strong> {paper.type || 'N/A'}</p>
          <p><strong>Publication:</strong> {paper.publication_name || 'N/A'}</p>
          <p><strong>Date:</strong> {paper.date ? new Date(paper.date).toLocaleDateString() : 'N/A'}</p>
        </div>
      ))
    ) : (
      <div className="no-records">No publications found for this faculty member.</div>
    )}

    {/* 🔥 Embedded Highcharts Dashboard */}
    <h3 className="publications-title">Interactive Scopus Dashboard</h3>
    <div className="highcharts-frame-container">
      <iframe
        src={`/highcharts_dashboards/${faculty.scopus_id}_highcharts_dashboard.html`}
        title="Highcharts Dashboard"
        className="highcharts-iframe"
        loading="lazy"
      ></iframe>
    </div>
  </div>
);

};

export default FacultyDetailPage;