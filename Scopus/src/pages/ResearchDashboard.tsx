import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import style from "../components/ResearchDashboard.module.css";
import srmLogo from "../assets/srmist-logo.png"; // optional logo import

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

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
  "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function ResearchDashboard() {
  const [timeframe, setTimeframe] = useState<string>("1y");
  const [publicationData, setPublicationData] = useState<PublicationData[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  useEffect(() => {
    fetchTopAuthors(timeframe);
  }, [timeframe]);

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

  const authorNames = topAuthors.map(author => author.name).join(", ");
  const publicationCount = topAuthors.length > 0 ? topAuthors[0].timeframe_docs : null;

  return (
    <div>
      {/* Full-width Navbar */}
      <div className={style.navbar}>
        <a className={style.logo}>
          <img src={srmLogo} alt="SRM Logo" className={style.navLogo} />
          <span>SPM SP</span>
        </a>
      </div>

      {/* Main Content */}
      <div className={style.container}>
        <div className={style.dashboard}>
          <h2 className={style.title}>
            Documenting Knowledge and Driving Impact: SRM’s Annual Research Milestones
          </h2>

          {/* Timeframe Dropdown */}
          <div className={style.dropdown}>
            <select className={style.select} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
              <option value="2y">Last 2 Years</option>
            </select>
          </div>

          {/* Top Authors Section */}
          <div className={style.topAuthor}>
            <h3>
              Top {topAuthors.length > 1 ? "Authors" : "Author"} (
              {{
                "6m": "Last 6 Months",
                "1y": "Last 1 Year",
                "2y": "Last 2 Years"
              }[timeframe]}
              ): {authorNames || "No data available"}{" "}
              {publicationCount ? `(${publicationCount} publications)` : ""}
            </h3>
          </div>

          {/* Chart Container */}
          <div className={style.chartContainer}>
            <h3 className={style.chartTitle}>Research Publications Overview</h3>
            <div className={style.chartBox}>
              <svg width="100%" height={chartHeight + 50} viewBox={`0 0 1100 ${chartHeight + 100}`}>
                {/* Y-axis */}
                <line x1="80" y1="20" x2="80" y2={chartHeight} stroke="black" strokeWidth="3" />
                <text x="20" y={chartHeight / 2} transform="rotate(-90, 15, 150)" fontSize="16" textAnchor="middle" fontWeight="bold">
                  No. of Publications
                </text>

                {/* X-axis */}
                <line x1="80" y1={chartHeight} x2="1100" y2={chartHeight} stroke="black" strokeWidth="3" />
                <text x="550" y={chartHeight + 60} fontSize="16" textAnchor="middle" fontWeight="bold">
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
                    <g key={data.month} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}>
                      <rect x={barX} y={yPosition} width={barWidth} height={barHeight} fill={hoveredIndex === index ? "#4CAF50" : "#2196F3"} />
                      {hoveredIndex === index && (
                        <text x={barX + barWidth / 2} y={yPosition - 10} fontSize="22" textAnchor="middle">{data.count}</text>
                      )}
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
                  stroke="blue"
                  strokeWidth="3"
                  fill="none"
                />

                {/* Data Points */}
                {publicationData.map((data, index) => {
                  const x = index * barSpacing + xAxisOffset + barWidth / 2;
                  const y = chartHeight - (data.count / maxPublications) * (chartHeight - 50);
                  return <circle key={index} cx={x} cy={y} r="5" fill="blue" />;
                })}
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
    </div>
  );
}
