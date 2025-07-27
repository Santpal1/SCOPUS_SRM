import time
import os
import json
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.widgets import Cursor
import mpld3
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import re

def extract_chart_data_from_svg(driver):
    """Extract document and citation data directly from the SVG elements in the chart."""
    print("Extracting data from SVG elements...")
    
    data = {
        'years': [],
        'documents': [],
        'citations': []
    }
    
    try:
        # First try to find document data (the bar chart)
        document_points = driver.find_elements(By.CSS_SELECTOR, ".highcharts-series-0.highcharts-column-series .highcharts-point")
        
        if document_points:
            print(f"Found {len(document_points)} document data points")
            
            for point in document_points:
                # Extract the year and document count from the aria-label attribute
                aria_label = point.get_attribute("aria-label")
                if aria_label:
                    # The format is typically "YYYY, N. Documents."
                    match = re.search(r"(\d{4}), (\d+)\. Documents\.", aria_label)
                    if match:
                        year = match.group(1)
                        count = match.group(2)
                        data['years'].append(year)
                        data['documents'].append(int(count))
                        print(f"Year: {year}, Documents: {count}")
        
        # Then try to find citation data (the line chart with markers)
        citation_points = driver.find_elements(By.CSS_SELECTOR, ".highcharts-series-1.highcharts-line-series .highcharts-point")
        
        if citation_points:
            print(f"Found {len(citation_points)} citation data points")
            
            citations_by_year = {}
            
            for point in citation_points:
                # Extract the year and citation count from the aria-label attribute
                aria_label = point.get_attribute("aria-label")
                if aria_label:
                    # The format is typically "YYYY, N. Citations."
                    match = re.search(r"(\d{4}), (\d+)\. Citations\.", aria_label)
                    if match:
                        year = match.group(1)
                        count = match.group(2)
                        citations_by_year[year] = int(count)
                        print(f"Year: {year}, Citations: {count}")
        
        # Ensure all years are included in the final dataset
        if data['years']:
            # Sort years to ensure chronological order
            unique_years = sorted(set(data['years']) | set(citations_by_year.keys()))
            
            # Create a complete dataset with all years, filling in zeros for missing data
            complete_data = {
                'years': unique_years,
                'documents': [],
                'citations': []
            }
            
            # Create dictionaries for easy lookup
            doc_by_year = {year: doc for year, doc in zip(data['years'], data['documents'])}
            
            # Fill in data for all years
            for year in unique_years:
                complete_data['documents'].append(doc_by_year.get(year, 0))
                complete_data['citations'].append(citations_by_year.get(year, 0))
            
            return complete_data
        elif citations_by_year:
            # If we have no document data but have citation data
            sorted_years = sorted(citations_by_year.keys())
            data['years'] = sorted_years
            data['documents'] = [0] * len(sorted_years)  # Fill with zeros
            data['citations'] = [citations_by_year[year] for year in sorted_years]
            return data
        
        return data
    
    except Exception as e:
        print(f"Error extracting data from SVG: {str(e)}")
        return None

def take_chart_screenshot(driver, author_id):
    """Take a screenshot of the chart container."""
    try:
        # Try to find the chart container
        chart_container_selectors = [
            ".highcharts-container",
            "#documentResultsHighchart",
            "svg.highcharts-root"
        ]
        
        for selector in chart_container_selectors:
            try:
                chart_container = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                
                # Create output directory if it doesn't exist
                if not os.path.exists("scopus_charts"):
                    os.makedirs("scopus_charts")
                
                # Take screenshot of the chart
                filename = f"scopus_charts/{author_id}_metrics_chart.png"
                chart_container.screenshot(filename)
                print(f"Chart screenshot saved to: {filename}")
                return True
            except:
                continue
        
        print("Could not find chart container for screenshot")
        return False
    
    except Exception as e:
        print(f"Error taking chart screenshot: {str(e)}")
        return False

def extract_metrics_data(driver):
    """Try to extract h-index, document count, and citation count."""
    metrics_data = {}
    
    try:
        # Look for metrics in different ways
        metric_patterns = {
            "h_index": [
                r"h-index: (\d+)",
                r"H-index: (\d+)"
            ],
            "documents": [
                r"Documents: (\d+)",
                r"Total documents: (\d+)"
            ],
            "citations": [
                r"Citations: (\d+)",
                r"Total citations: (\d+)"
            ]
        }
        
        # Get all text from the page
        page_text = driver.find_element(By.TAG_NAME, "body").text
        
        # Try to find metrics using regex patterns
        for metric_name, patterns in metric_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, page_text)
                if match:
                    metrics_data[metric_name] = match.group(1)
                    print(f"Found {metric_name}: {match.group(1)}")
                    break
        
        return metrics_data
    
    except Exception as e:
        print(f"Error extracting metrics data: {str(e)}")
        return {}

def create_highcharts_dashboard(data, author_name, author_id, metrics=None):
    """Create a high-quality interactive dashboard using HighCharts-like HTML/JS."""
    try:
        if not data or not data.get('years'):
            print("No data available to create Highcharts dashboard")
            return False
        
        # Create output directory if it doesn't exist
        if not os.path.exists("scopus_charts"):
            os.makedirs("scopus_charts")
        
        # Convert data for JavaScript format
        years_js = json.dumps(data['years'])
        documents_js = json.dumps(data['documents'])
        citations_js = json.dumps(data['citations'])
        
        # Create metrics HTML if available
        metrics_html = ""
        if metrics:
            metrics_html = """
            <div class="metrics-container">
                <div class="metric-box">
                    <div class="metric-value">{}</div>
                    <div class="metric-label">H-index</div>
                </div>
                <div class="metric-box">
                    <div class="metric-value">{}</div>
                    <div class="metric-label">Documents</div>
                </div>
                <div class="metric-box">
                    <div class="metric-value">{}</div>
                    <div class="metric-label">Citations</div>
                </div>
            </div>
            """.format(
                metrics.get('h_index', 'N/A'),
                metrics.get('documents', 'N/A'),
                metrics.get('citations', 'N/A')
            )
        
        # Create HTML with embedded Highcharts
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{author_name} - Scopus Metrics</title>
            <script src="https://code.highcharts.com/highcharts.js"></script>
            <script src="https://code.highcharts.com/modules/exporting.js"></script>
            <script src="https://code.highcharts.com/modules/export-data.js"></script>
            <script src="https://code.highcharts.com/modules/accessibility.js"></script>
            <style>
                body {{
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f7f7f7;
                }}
                .dashboard-container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                }}
                h1 {{
                    color: #333;
                    margin-top: 0;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }}
                .chart-container {{
                    height: 400px;
                    margin-bottom: 20px;
                }}
                .metrics-container {{
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 20px;
                }}
                .metric-box {{
                    text-align: center;
                    background-color: #f9f9f9;
                    border-radius: 8px;
                    padding: 15px;
                    width: 30%;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }}
                .metric-value {{
                    font-size: 36px;
                    font-weight: bold;
                    color: #3679e0;
                }}
                .metric-label {{
                    font-size: 14px;
                    color: #777;
                    margin-top: 5px;
                }}
                .data-table {{
                    width: 100%;
                    border-collapse: collapse;
                }}
                .data-table th, .data-table td {{
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: center;
                }}
                .data-table th {{
                    background-color: #f2f2f2;
                }}
                .data-table tr:nth-child(even) {{
                    background-color: #f9f9f9;
                }}
                .data-table tr:hover {{
                    background-color: #f5f5f5;
                }}
                .export-buttons {{
                    margin-top: 20px;
                    text-align: right;
                }}
                .export-button {{
                    background-color: #3679e0;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 10px;
                    font-size: 14px;
                }}
                .export-button:hover {{
                    background-color: #2a5cb8;
                }}
                @media (max-width: 768px) {{
                    .metrics-container {{
                        flex-direction: column;
                    }}
                    .metric-box {{
                        width: auto;
                        margin-bottom: 10px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="dashboard-container">
                <h1>{author_name} - Scopus Metrics</h1>
                
                {metrics_html}
                
                <div id="chart-container" class="chart-container"></div>
            </div>
            
            <script>
                // Initialize the chart
                document.addEventListener('DOMContentLoaded', function() {{
                    Highcharts.chart('chart-container', {{
                        chart: {{
                            zoomType: 'xy',
                            style: {{
                                fontFamily: "'Helvetica Neue', Arial, sans-serif"
                            }}
                        }},
                        title: {{
                            text: 'Document and Citation Trends',
                            style: {{
                                fontSize: '18px'
                            }}
                        }},
                        xAxis: {{
                            categories: {years_js},
                            crosshair: true
                        }},
                        yAxis: [{{
                            // Primary yAxis (documents)
                            title: {{
                                text: 'Documents',
                                style: {{
                                    color: '#3679e0'
                                }}
                            }},
                            labels: {{
                                style: {{
                                    color: '#3679e0'
                                }}
                            }}
                        }}, {{
                            // Secondary yAxis (citations)
                            title: {{
                                text: 'Citations',
                                style: {{
                                    color: '#000347'
                                }}
                            }},
                            labels: {{
                                style: {{
                                    color: '#000347'
                                }}
                            }},
                            opposite: true
                        }}],
                        tooltip: {{
                            shared: true,
                            useHTML: true,
                            headerFormat: '<b>Year: {{point.key}}</b><br>'
                        }},
                        plotOptions: {{
                            column: {{
                                pointPadding: 0.2,
                                borderWidth: 0
                            }}
                        }},
                        series: [{{
                            name: 'Documents',
                            type: 'column',
                            yAxis: 0,
                            data: {documents_js},
                            color: '#3679e0',
                            tooltip: {{
                                valueSuffix: ' documents'
                            }}
                        }}, {{
                            name: 'Citations',
                            type: 'line',
                            yAxis: 1,
                            data: {citations_js},
                            color: '#000347',
                            marker: {{
                                symbol: 'circle'
                            }},
                            tooltip: {{
                                valueSuffix: ' citations'
                            }}
                        }}],
                        credits: {{
                            enabled: false
                        }},
                        exporting: {{
                            enabled: true,
                            buttons: {{
                                contextButton: {{
                                    menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG']
                                }}
                            }}
                        }}
                    }});
                }});
                
                // Function to export table data to CSV
                function exportCSV() {{
                    const table = document.querySelector('.data-table');
                    let csv = [];
                    const rows = table.querySelectorAll('tr');
                    
                    for (let i = 0; i < rows.length; i++) {{
                        const row = [];
                        const cols = rows[i].querySelectorAll('td, th');
                        
                        for (let j = 0; j < cols.length; j++) {{
                            row.push(cols[j].textContent);
                        }}
                        
                        csv.push(row.join(','));
                    }}
                    
                    const csvContent = "data:text/csv;charset=utf-8," + csv.join('\\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', "{author_id}_scopus_data.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }}
            </script>
        </body>
        </html>
        """
        
        # Save the HTML file
        highcharts_filename = f"Scopus/public/highcharts_dashboards/{author_id}_highcharts_dashboard.html"
        with open(highcharts_filename, 'w') as f:
            f.write(html_content)
        
        print(f"Highcharts dashboard saved to: {highcharts_filename}")
        return True
        
    except Exception as e:
        print(f"Error creating Highcharts dashboard: {str(e)}")
        return False

def scrape_scopus_author_metrics(author_id):
    """Scrape publication and citation metrics for a Scopus author ID."""
    url = f"https://www.scopus.com/authid/detail.uri?authorId={author_id}"
    
    # Set up Chrome options
    chrome_options = Options()
    # Comment out headless for debugging - keep it visible when troubleshooting
    # chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Add User-Agent to make the request look more like a real browser
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    # Initialize the Chrome driver
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    
    try:
        # Load the page
        print(f"Accessing Scopus profile: {url}")
        driver.get(url)
        
        # Wait for the page to load
        print("Waiting for page to load...")
        time.sleep(10)  # Give it more time to load
        
        # Try to get author name
        try:
            author_name_element = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "h1, .author-profile-name"))
            )
            author_name = author_name_element.text
            print(f"Processing data for: {author_name}")
        except:
            author_name = f"Author_{author_id}"
            print("Could not retrieve author name, using ID instead")
        
        # Extract chart data from SVG elements
        chart_data = extract_chart_data_from_svg(driver)
        
        # Take a screenshot of the chart as backup
        take_chart_screenshot(driver, author_id)
        
        # Extract metrics data
        metrics_data = extract_metrics_data(driver)
        
        # Save the data we extracted
        if chart_data and (chart_data.get('documents') or chart_data.get('citations')):
            # Create output directory if it doesn't exist
            if not os.path.exists("scopus_data"):
                os.makedirs("scopus_data")
            
            # Create a DataFrame
            # Create a DataFrame
            df_data = {'Year': chart_data['years']}
            
            if chart_data.get('documents'):
                df_data['Documents'] = chart_data['documents']
            
            if chart_data.get('citations'):
                df_data['Citations'] = chart_data['citations']
            
            df = pd.DataFrame(df_data)
            
            # Save to CSV
            filename = f"scopus_data/{author_id}_chart_data.csv"
            df.to_csv(filename, index=False)
            print(f"Chart data saved to: {filename}")
            
            # Create multiple visualizations
            create_highcharts_dashboard(chart_data, author_name, author_id, metrics_data)
        
        # Save metrics data
        if metrics_data:
            # Create output directory if it doesn't exist
            if not os.path.exists("scopus_data"):
                os.makedirs("scopus_data")
            
            # Create a DataFrame
            metrics_df = pd.DataFrame({
                "Metric": [k.replace('_', ' ').title() for k in metrics_data.keys()],
                "Value": list(metrics_data.values())
            })
            
            # Save to CSV
            filename = f"scopus_data/{author_id}_summary_metrics.csv"
            metrics_df.to_csv(filename, index=False)
            print(f"Summary metrics saved to: {filename}")
        
        return {
            "author_name": author_name,
            "chart_data": chart_data,
            "metrics": metrics_data
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
    
    finally:
        # Close the browser
        driver.quit()

def process_faculty_list(file_path=None, author_ids=None):
    """Process a list of Scopus author IDs."""
    # If a file is provided, read author IDs from it
    if file_path and os.path.exists(file_path):
        with open(file_path, 'r') as f:
            author_ids = [line.strip() for line in f if line.strip()]
    
    # If author_ids were provided directly or read from a file
    if author_ids:
        all_results = []
        
        for author_id in author_ids:
            print(f"\n{'='*50}")
            print(f"Processing Author ID: {author_id}")
            print(f"{'='*50}\n")
            
            result = scrape_scopus_author_metrics(author_id)
            if result:
                all_results.append(result)
            
            # Add a delay between requests to avoid being blocked
            time.sleep(5)
        
        # Create a summary of all authors processed
        if all_results:
            # Create output directory if it doesn't exist
            if not os.path.exists("scopus_data"):
                os.makedirs("scopus_data")
            
            # Create a summary DataFrame
            summary_data = []
            for result in all_results:
                author_data = {
                    "Author Name": result.get("author_name", "Unknown"),
                    "Author ID": author_ids[all_results.index(result)],
                    "H-index": result.get("metrics", {}).get("h_index", "N/A"),
                    "Total Documents": result.get("metrics", {}).get("documents", "N/A"),
                    "Total Citations": result.get("metrics", {}).get("citations", "N/A")
                }
                summary_data.append(author_data)
            
            summary_df = pd.DataFrame(summary_data)
            
            # Save to CSV
            filename = "scopus_data/faculty_summary.csv"
            summary_df.to_csv(filename, index=False)
            print(f"\nFaculty summary saved to: {filename}")
    else:
        print("No author IDs provided. Please specify either a file path or a list of author IDs.")

# Example usage
if __name__ == "__main__":
    
    scopus_ids = [
        "35146619400", "57226266325", "57216474980", "36148240300", "26639006000", "26639841900", 
        "24776839900", "56962827900", "55445341200", "56635856200", "26326397200", "56901450600", 
        "57209822555", "35070109700", "57192177838", "57225400932", "57191663448", "57223054981", 
        "12767780000", "24605697100", "25626737800", "57216357144", "55787221000", "57193133229", 
        "57224691110", "55356546000", "57188588453", "57191840929", "57216770442", "57215845190", 
        "53866078700", "37077724000", "55441125500", "55315128400", "56437414100", "57216477082", 
        "57193068294", "57191962994", "57201993520", "16023990700", "57193082825", "55787336700", 
        "57217860062", "56728784600", "23985792700", "57191625915", "84939519267", "56002285900", 
        "57224737974", "57192392105", "57201879134", "55236532400", "57194773637", "57191223373", 
        "57215283908", "57119668200", "57194585718", "23569177000", "57216767092", "57216546834", 
        "57211389122", "57208852312", "57209062963", "57193094668", "57190127799", "57224941876", 
        "57202677096", "56034676900", "58167027800", "57197087263", "57211492056", "57216551952", 
        "57200795786", "57210193056", "57216656961", "57203312738", "57216786127", "57195978363", 
        "57208140416", "57192553778", "57213313655", "57222598188", "57044262600", "57685997700", 
        "57222423930", "57204053224", "57189062128", "55206524500", "56636159000", "56841346000", 
        "57057765800", "57211392718", "56009847600", "56492967600", "57191293517", "56041905600", 
        "56878749800", "56085804500", "57221083703", "57192676397", "57219652863", "57703224500", 
        "58525523100", "57328868900", "58617671800", "57463101900", "57772929400", "57394680400", 
        "58293015300", "58070643900", "56879094600", "57387771900", "57216463728", "57197032967", 
        "57263113200", "57191847013", "57189870674", "57192706302", "56006608600", "57765963700", 
        "57192696331", "57209472555", "57556518200", "543784062700", "57193692207", "55780773500", 
        "57214048538", "57209681241", "57221133130", "57213092807", "56419876900", "56047134300", 
        "58836164900", "57939576200", "57511431500", "57394680400", "57539488300", "57212285315", 
        "57193124489", "57206497663", "57214434805", "55314675700", "55603012200", "55314915400", 
        "57213057349", "57188703143", "56483236600", "57213699624", "57203866544", "35102012400", 
        "57203218678", "57219417857", "56373282800", "57215654953", "57877692100", "57214154317", 
        "57211668492", "56962879100", "56809436800", "57540810700", "56595132800", "57192095137", 
        "56695408500", "57197595490", "57212309621", "57238675600", "57192697670", "57759217900", 
        "56644902000", "36700328900", "57193997795", "57216789624", "57197311163", "57210766676", 
        "57217184428", "57192398597", "57211291356", "57212108129", "37077147900", "57211294691", 
        "57191952791", "57192654144", "57193490360", "58119097400", "57216799569", "57193603659", 
        "57189762692", "57170383600", "56734537800", "57203026440", "8608189700", "57204862284", 
        "57196074175", "57475640300", "57205416227", "57208861799", "39361573900", "57203196510", 
        "56891019000", "57192704832", "53981353000", "57222521426", "54788582100", "57215196082", 
        "57191960194", "6602875353", "57213089519", "57211160113", "56578438800", "57210343217", 
        "56911467900", "57214415472", "57222616675", "57204562624", "55436730800"
    ]
    # print(len(final_ids))
    for id in scopus_ids:
        # print(id)
        scrape_scopus_author_metrics(id)
   