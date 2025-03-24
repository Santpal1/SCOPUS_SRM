import axios from "axios";
import { useEffect, useState } from "react";
import style from "../components/ResearchDashboard.module.css";

interface PublicationData {
  month: string;
  count: number;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
  "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function ResearchDashboard() {
  const [timeframe, setTimeframe] = useState<string>("1y");
  const [publicationData, setPublicationData] = useState<PublicationData[]>([]);
  const [topAuthor, setTopAuthor] = useState<string>("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchTopAuthor = async (selectedTimeframe: string) => {
    let months = selectedTimeframe === "6m" ? 6 : selectedTimeframe === "1y" ? 12 : 36;
    try {
      const response = await axios.get(`http://localhost:5000/api/top-author?months=${months}`);
      if (response.data && response.data.author) {
        setTopAuthor(`${response.data.author} (${response.data.publication_count} publications)`);
      } else {
        setTopAuthor("No data available");
      }
    } catch (error) {
      console.error("Error fetching top author:", error);
      setTopAuthor("Error fetching data");
    }
  };

  useEffect(() => {
    fetchTopAuthor(timeframe);
  }, [timeframe]);

  const formatLabel = (dateString: string): string => {
    if (!dateString.includes("-")) return dateString;
    const [, month] = dateString.split("-");
    return month ? monthNames[parseInt(month, 10) - 1] : dateString;
  };

  const aggregateDataByYear = (data: PublicationData[]): PublicationData[] => {
    const yearlyData: { [key: string]: number } = {};
    data.forEach(({ month, count }) => {
      const year = month.split("-")[0];
      if (year !== "2022") {
        yearlyData[year] = (yearlyData[year] || 0) + count;
      }
    });
    return Object.entries(yearlyData).map(([year, count]) => ({ month: year, count }));
  };

  const fetchData = async (selectedTimeframe: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/publications?timeframe=${selectedTimeframe}`);
      let sortedData = response.data
        .sort((a: PublicationData, b: PublicationData) => a.month.localeCompare(b.month));

      if (selectedTimeframe === "3y") {
        sortedData = aggregateDataByYear(sortedData);
      }

      setPublicationData(sortedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData(timeframe);
  }, [timeframe]);

  const maxPublications = Math.max(...publicationData.map((d) => d.count), 1);
  const chartHeight = 300; // Reduced chart height

  const getBarWidth = () => {
    switch (timeframe) {
      case "6m":
        return 1.6 * 60;
      case "3y":
        return 3 * 60;
      case "1y":
      default:
        return 0.9 * 60;
    }
  };

  const getBarSpacing = () => {
    switch (timeframe) {
      case "6m":
        return 1.6 * 80;
      case "3y":
        return 3 * 80;
      case "1y":
      default:
        return 0.9 * 80;
    }
  };

  const barWidth = getBarWidth();
  const barSpacing = getBarSpacing();
  const xAxisOffset = 100;
  const yTicks = 5;
  const tickInterval = Math.ceil(maxPublications / yTicks);

  return (
    <div className={style.container}>
      <div className={style.navbar}>
        <h1 className={style.logo}>ResearchVault</h1>
        <div className={style.buttons}>
          <button className={style.contactBtn}>Contact us</button>
        </div>
      </div>

      <div className={style.dashboard}>
        <h2 className={style.title}>
          Documenting Knowledge and Driving Impact: SRM’s Annual Research Milestones
        </h2>

        <div className={style.dropdown}>
          <select className={style.select} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="3y">Last 3 Years</option>
          </select>
        </div>

        <div className={style.topAuthor}>
          <h3>
            Top Author ({timeframe === "6m" ? "Last 6 Months" : timeframe === "1y" ? "Last 1 Year" : "Last 3 Years"}
            ): {topAuthor}
          </h3>
        </div>

        <div className={style.chartContainer}>
          <h3 className={style.chartTitle}>Research Publications</h3>
          <div className={style.chartBox}>
            <svg width="100%" height={chartHeight + 50} viewBox={`0 0 1100 ${chartHeight + 100}`}>
              {/* Y-axis */}
              <line x1="80" y1="20" x2="80" y2={chartHeight} stroke="black" strokeWidth="2" />
              <text
                x="20"
                y={chartHeight / 2}
                transform={`rotate(-90, 20, ${chartHeight / 2})`}
                textAnchor="middle"
                fontSize="14"
                fill="black"
              >
                No of Publications
              </text>

              {/* Y-axis ticks and labels */}
              {Array.from({ length: yTicks + 1 }).map((_, i) => {
                const yValue = i * tickInterval;
                const yPosition = chartHeight - (yValue / maxPublications) * (chartHeight - 50);
                return (
                  <g key={i}>
                    <line x1="75" y1={yPosition} x2="80" y2={yPosition} stroke="black" strokeWidth="2" />
                    <text x="60" y={yPosition + 5} fontSize="12" fill="black" textAnchor="end">
                      {yValue}
                    </text>
                  </g>
                );
              })}

              {/* X-axis */}
              <line x1="80" y1={chartHeight} x2="1050" y2={chartHeight} stroke="black" strokeWidth="2" />

              {/* Bars and Line Graph */}
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
                    {/* Bar */}
                    <rect
                      x={barX}
                      y={yPosition}
                      width={barWidth}
                      height={barHeight}
                      className={style.bar}
                      fill={hoveredIndex === index ? "#4CAF50" : "#2196F3"}
                    />

                    {/* Show count above the bar on hover */}
                    {hoveredIndex === index && (
                      <text
                        x={barX + barWidth / 2}
                        y={yPosition - 10}
                        fontSize="18"
                        fill="black"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {data.count}
                      </text>
                    )}

                    {/* X-axis labels */}
                    <text
                      x={barX + barWidth / 2}
                      y={chartHeight + 20}
                      fontSize="14"
                      fill="black"
                      textAnchor="middle"
                    >
                      {formatLabel(data.month)}
                    </text>

                    {/* Line Graph Points */}
                    {index > 0 && (
                      <line
                        x1={xAxisOffset + (index - 1) * barSpacing + barWidth / 2}
                        y1={
                          chartHeight -
                          (publicationData[index - 1].count / maxPublications) * (chartHeight - 50)
                        }
                        x2={barX + barWidth / 2}
                        y2={yPosition}
                        stroke="blue"
                        strokeWidth="2"
                      />
                    )}
                    {/* Circle Points for Line Graph */}
                    <circle cx={barX + barWidth / 2} cy={yPosition} r="5" fill="blue" />
                  </g>
                );
              })}
            </svg>
          </div>

        </div>
        {/* Button to go to faculty list */}
        <button
            className={style.facultyBtn}
            onClick={() => window.location.href = "/faculty"}
          >
            Go to Faculty List
          </button>
      </div>
    </div>
  );
}