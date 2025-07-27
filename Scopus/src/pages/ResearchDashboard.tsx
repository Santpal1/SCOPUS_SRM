import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import style from "../components/ResearchDashboard.module.css";
import srmLogo from "../assets/srmist-logo.png";

interface PublicationData {
  month: string;
  count: number;
}

interface TopAuthor {
  scopus_id: string;
  name: string;
  total_docs: number;
  timeframe_docs: number;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
  "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ResearchDashboard() {
  const [timeframe, setTimeframe] = useState<string>("1y");
  const [publicationData, setPublicationData] = useState<PublicationData[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animatedPublications, setAnimatedPublications] = useState(0);
  const [animatedAuthors, setAnimatedAuthors] = useState(0);
  const navigate = useNavigate();

  const fetchTopAuthors = async (selectedTimeframe: string) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/top-author?timeframe=${selectedTimeframe}`);
      const data = response.data;
      setTopAuthors(Array.isArray(data) && data.length > 0 ? data : []);
    } catch (error) {
      console.error("Error fetching top authors:", error);
      setTopAuthors([]);
    }
  };

  const fetchData = async (selectedTimeframe: string) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/publications?timeframe=${selectedTimeframe}`);
      let sortedData = response.data.sort((a: PublicationData, b: PublicationData) =>
        a.month.localeCompare(b.month)
      );
      if (selectedTimeframe === "2y") sortedData = aggregateDataByYear(sortedData);
      setPublicationData(sortedData);
    } catch (error) {
      console.error("Error fetching publication data:", error);
    }
  };

  useEffect(() => {
    fetchTopAuthors(timeframe);
    fetchData(timeframe);
  }, [timeframe]);

  const aggregateDataByYear = (data: PublicationData[]): PublicationData[] => {
    const yearlyData: { [key: string]: number } = {};
    data.forEach(({ month, count }) => {
      const year = month.split("-")[0];
      yearlyData[year] = (yearlyData[year] || 0) + count;
    });
    return Object.entries(yearlyData).map(([year, count]) => ({ month: year, count }));
  };

  const formatLabel = (dateString: string): string => {
    if (!dateString.includes("-")) return dateString;
    const [, month] = dateString.split("-");
    return month ? monthNames[parseInt(month, 10) - 1] : dateString;
  };

  const maxPublications = Math.max(...publicationData.map((d) => d.count), 1);
  const chartHeight = 300;
  const xAxisOffset = 100;
  const yTicks = 5;
  const tickInterval = Math.ceil(maxPublications / yTicks);
  const getBarWidth = () => (timeframe === "6m" ? 96 : timeframe === "2y" ? 180 : 54);
  const getBarSpacing = () => (timeframe === "6m" ? 128 : timeframe === "2y" ? 240 : 72);
  const barWidth = getBarWidth();
  const barSpacing = getBarSpacing();

  const totalPublications = publicationData.reduce((sum, d) => sum + d.count, 0);
  const authorNames = topAuthors.map(author => author.name).join(", ");
  const publicationCount = topAuthors.length > 0 ? topAuthors[0].timeframe_docs : null;

  // Counter animation function
  const animateCounter = (target: number, setter: (val: number) => void, duration: number = 800) => {
    let start = 0;
    const increment = target / (duration / 16); // 60fps
    const step = () => {
      start += increment;
      if (start < target) {
        setter(Math.ceil(start));
        requestAnimationFrame(step);
      } else {
        setter(target);
      }
    };
    requestAnimationFrame(step);
  };

  // Trigger counters when data changes
  useEffect(() => {
    animateCounter(totalPublications, setAnimatedPublications);
    animateCounter(topAuthors.length, setAnimatedAuthors);
  }, [totalPublications, topAuthors]);

  return (
    <div className={style.pageWrapper}>
      {/* Full-width Navbar */}
      <div className={style.navbar}>
        <a className={style.logo}>
          <img src={srmLogo} alt="SRM Logo" className={style.navLogo} />
          <span>SPM SP</span>
        </a>
      </div>

      <div className={style.container}>
        {/* Heading */}
        <h2 className={style.title}>Turning Research Into Impactful Insights</h2>

        {/* KPI Counters */}
        <div className={style.kpiContainer}>
          <div className={style.kpiCard}>
            <h3>Total Publications</h3>
            <p className={style.counter}>{animatedPublications}</p>
          </div>
          <div className={style.kpiCard}>
            <h3>Top Authors</h3>
            <p className={style.counter}>{animatedAuthors}</p>
          </div>
        </div>

        {/* Timeframe Dropdown */}
        <div className={style.dropdown}>
          <select className={style.select} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="2y">Last 2 Years</option>
          </select>
        </div>

        {/* Top Authors */}
        <div className={style.topAuthor}>
          <h3>
            Top {topAuthors.length > 1 ? "Authors" : "Author"} ({{
              "6m": "Last 6 Months",
              "1y": "Last 1 Year",
              "2y": "Last 2 Years"
            }[timeframe]})
          </h3>
          <div className={style.authorList}>
            {topAuthors.length > 0 ? (
              topAuthors.map((author, index) => (
                <div
                  key={`${author.scopus_id}-${timeframe}-${index}`}
                  className={style.authorChip}
                >
                  {author.name}
                  <span className={style.authorBadge}>{author.timeframe_docs}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#777" }}>No data available</p>
            )}
          </div>
        </div>


        {/* Chart Container */}
        <div className={style.chartContainer}>
          <h3 className={style.chartTitle}>Research Publications Overview</h3>
          <div className={style.chartBox}>
            {/* Fixed tooltip in the top-right of chart box */}
            {hoveredIndex !== null && (
              <div className={`${style.tooltip} ${style.showTooltip}`}>
                <strong>{formatLabel(publicationData[hoveredIndex].month)}</strong><br />
                {publicationData[hoveredIndex].count} publications
              </div>
            )}

            <svg width="100%" height={chartHeight + 80} viewBox={`0 0 1200 ${chartHeight + 120}`}>
              {/* Y-axis */}
              <line x1="80" y1="20" x2="80" y2={chartHeight} stroke="black" strokeWidth="3" />
              <text x="5" y={chartHeight / 2} transform="rotate(-90, 15, 150)" fontSize="18" textAnchor="middle" fontWeight="bold">
                No. of Publications
              </text>

              {/* X-axis */}
              <line x1="80" y1={chartHeight} x2="1150" y2={chartHeight} stroke="black" strokeWidth="3" />
              <text x="600" y={chartHeight + 60} fontSize="18" textAnchor="middle" fontWeight="bold">
                Observation Period
              </text>

              {/* Y-axis Labels */}
              {Array.from({ length: yTicks + 1 }).map((_, i) => {
                const yValue = i * tickInterval;
                const yPosition = chartHeight - (yValue / maxPublications) * (chartHeight - 50);
                return (
                  <g key={i}>
                    <line x1="75" y1={yPosition} x2="80" y2={yPosition} stroke="black" strokeWidth="3" />
                    <text x="60" y={yPosition + 5} fontSize="16" textAnchor="end">{yValue}</text>
                  </g>
                );
              })}

              {/* Bars */}
              {publicationData.map((data, index) => {
                const barX = index * barSpacing + xAxisOffset;
                const barHeight = (data.count / maxPublications) * (chartHeight - 50);
                const yPosition = chartHeight - barHeight;
                return (
                  <g
                    key={data.month}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <rect
                      className={style.bar}
                      x={barX}
                      y={chartHeight}
                      width={barWidth}
                      height={0}
                      fill="url(#barGradient)"
                    >
                      <animate attributeName="y" from={chartHeight} to={yPosition} dur="0.8s" begin={`${index * 0.1}s`} fill="freeze" />
                      <animate attributeName="height" from="0" to={barHeight} dur="0.8s" begin={`${index * 0.1}s`} fill="freeze" />
                    </rect>
                    <text x={barX + barWidth / 2} y={chartHeight + 20} fontSize="16" textAnchor="middle">{formatLabel(data.month)}</text>
                  </g>
                );
              })}

              {/* Line Graph Path */}
              <path
                d={publicationData.map((data, index) => {
                  const x = index * barSpacing + xAxisOffset + barWidth / 2;
                  const y = chartHeight - (data.count / maxPublications) * (chartHeight - 50);
                  return `${index === 0 ? "M" : "L"} ${x},${y}`;
                }).join(" ")}
                stroke="url(#lineGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray="1500"
                strokeDashoffset="1500"
              >
                <animate attributeName="stroke-dashoffset" from="1500" to="0" dur="1.5s" fill="freeze" />
              </path>

              {/* Data Points */}
              {publicationData.map((data, index) => {
                const x = index * barSpacing + xAxisOffset + barWidth / 2;
                const y = chartHeight - (data.count / maxPublications) * (chartHeight - 50);
                return <circle key={index} cx={x} cy={y} r="5" fill="#ff4a22ff" style={{ cursor: "pointer" }} />;
              })}

              {/* Gradients */}
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#42a5f5" />
                  <stop offset="100%" stopColor="#1e88e5" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4caf50" />
                  <stop offset="100%" stopColor="#2e7d32" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className={style.buttonContainer}>
          <button className={style.facultyBtn} onClick={() => navigate("/faculty")}>
            Go to Faculty List
          </button>
          <button className={style.analyticsBtn} onClick={() => navigate("/analytics")}>
            Go to Analytics Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
