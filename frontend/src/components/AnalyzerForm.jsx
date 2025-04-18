import React, { useState, useEffect } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { FiAlertTriangle, FiCheckCircle, FiLink, FiLoader, FiMoon, FiSun } from "react-icons/fi";
import "../styles.css";

Chart.register(...registerables);

const AnalyzerForm = () => {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

 

  const analyzeWebsite = async () => {
    setLoading(true);
    setError("");
    setReport(null); // Clear previous results
  
    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
  
      const result = await response.json();
      console.log("API Response:", result); // ✅ Debugging Step
  
      if (response.ok) {
        setReport({
          scores: {
            performance: result.scores.performance ?? 0,
            seo: result.scores.seo ?? 0,
            accessibility: result.scores.accessibility ?? 0, // Optional if your API supports it
            security: result.security_issues.length > 0 ? 50 : 100, // Mock logic (adjust based on real data)
          },
          issues: {
            critical: Object.keys(result.issues.critical).filter(issue => result.issues.critical[issue]), 
            warnings: result.issues.warnings ?? []
          },
          resources: {
            loadTimes: result.load_times ?? { html: 0, css: 0, js: 0, images: 0 }
          },
          recommendations: result.description ? [result.description] : []
        });
      } else {
        setError(result.error || "Failed to analyze website.");
      }
    } catch (error) {
      setError("Error connecting to the server.");
    }
  
    setLoading(false);
  };
  

  // Chart configurations with dark mode colors
  const loadTimeData = {
    labels: ["HTML", "CSS", "JS", "Images"],
    datasets: [{
      label: "Load Time (ms)",
      data: Object.values(report?.resources.loadTimes || {}),
      backgroundColor: darkMode ? 
        ["#6366f1", "#10b981", "#f59e0b", "#ef4444"] :
        ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"]
    }]
  };

  const seoData = {
    labels: ["Optimized", "Issues"],
    datasets: [{
      data: [report?.scores.seo || 0, 100 - (report?.scores.seo || 0)],
      backgroundColor: darkMode ? 
        ["#34d399", "#fbbf24"] : 
        ["#10B981", "#F59E0B"]
    }]
  };

  return (
    <div className="analyzer-container">
      <button 
        className="theme-toggle"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? <FiSun /> : <FiMoon />}
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div className="main-wrapper">
        <div className="analyzer-header">
          <h1 className="main-heading">Website Health Analyzer</h1>
          <p className="sub-heading">
            Get detailed insights about your website's performance, SEO, 
            and accessibility in seconds
          </p>
          
          <div className="input-group">
            <input
              type="url"
              className="url-input"
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              className="analyze-btn"
              onClick={analyzeWebsite}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiLoader className="loading-spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FiLink />
                  Analyze
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="error-message">
              <FiAlertTriangle />
              {error}
            </div>
          )}
        </div>

        {report && (
          <div className="results-grid">
            <div className="score-cards">
              {Object.entries(report.scores).map(([category, score]) => (
                <div key={category} className="score-card">
                  <h3 className="score-title">{category}</h3>
                  <div className="score-value">
                    {score}<span className="score-max">/100</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="chart-container">
              <h3>Resource Load Times</h3>
              <Bar
                data={loadTimeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: darkMode ? '#f8fafc' : '#1e293b'
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        color: darkMode ? '#94a3b8' : '#64748b'
                      },
                      grid: {
                        color: darkMode ? '#334155' : '#e2e8f0'
                      }
                    },
                    x: {
                      ticks: {
                        color: darkMode ? '#94a3b8' : '#64748b'
                      }
                    }
                  }
                }}
              />
            </div>

            <div className="analysis-section">
              <div className="chart-container">
                <h3>SEO Health</h3>
                <Doughnut
                  data={seoData}
                  options={{
                    cutout: '70%',
                    plugins: { 
                      legend: { 
                        position: 'bottom',
                        labels: {
                          color: darkMode ? '#f8fafc' : '#1e293b'
                        }
                      } 
                    }
                  }}
                />
              </div>

              <div className="issue-list">
                <h3>Key Issues</h3>
                <div className="issues-container">
                  {report.issues.critical.map((issue, i) => (
                    <div key={i} className="issue-item critical">
                      <FiAlertTriangle />
                      <p>{issue}</p>
                    </div>
                  ))}
                  {report.issues.warnings.map((issue, i) => (
                    <div key={i} className="issue-item warning">
                      <FiAlertTriangle />
                      <p>{issue}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="recommendations">
              <h3>Optimization Recommendations</h3>
              <div className="recommendations-grid">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="recommendation-card">
                    <FiCheckCircle />
                    <p>{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzerForm;