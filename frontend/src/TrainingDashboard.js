// AI-Trainer Frontend - React Dashboard
// Frontend web interface per gestione training dataset

// No imports needed - using global React from CDN
// CSS will be loaded via <link> tag in HTML

// API Configuration
const API_BASE_URL = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production' 
  ? 'https://ai-trainer-production-8fd9.up.railway.app'
  : 'http://localhost:4000';

const API_KEY = 'your-api-key-here';

// Utility function for API calls
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}/training${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
};

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

const TrainingDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome />;
      case 'samples':
        return <SamplesList />;
      case 'collect':
        return <DataCollection />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="training-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🤖 AI-Trainer Dashboard</h1>
          <div className="header-status">
            <span className="status-indicator online"></span>
            <span>Sistema Operativo</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button 
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => setCurrentView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={currentView === 'samples' ? 'active' : ''}
          onClick={() => setCurrentView('samples')}
        >
          📚 Training Samples
        </button>
        <button 
          className={currentView === 'collect' ? 'active' : ''}
          onClick={() => setCurrentView('collect')}
        >
          🚀 Collect Data
        </button>
        <button 
          className={currentView === 'analytics' ? 'active' : ''}
          onClick={() => setCurrentView('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={currentView === 'settings' ? 'active' : ''}
          onClick={() => setCurrentView('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && (
          <div className="error-banner">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">⟳</div>
            <p>Loading...</p>
          </div>
        )}
        
        {renderView()}
      </main>
    </div>
  );
};

// =============================================================================
// DASHBOARD HOME
// =============================================================================

const DashboardHome = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await apiCall('/');
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!dashboardData) return <div className="error">Failed to load dashboard</div>;

  const { stats, recentSamples, systemStatus } = dashboardData;

  return (
    <div className="dashboard-home">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalSamples}</h3>
            <p>Training Samples</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.businessTypes}</h3>
            <p>Business Types</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.avgQualityScore}</h3>
            <p>Avg Quality Score</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🕒</div>
          <div className="stat-content">
            <h3>{stats.lastCollection ? new Date(stats.lastCollection).toLocaleDateString() : 'Never'}</h3>
            <p>Last Collection</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="system-status">
        <h2>🔧 System Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <span className={`status-dot ${systemStatus.dataCollector === 'operational' ? 'green' : 'red'}`}></span>
            <span>Data Collector: {systemStatus.dataCollector}</span>
          </div>
          <div className="status-item">
            <span className={`status-dot ${systemStatus.aiAnalysis === 'configured' ? 'green' : 'yellow'}`}></span>
            <span>AI Analysis: {systemStatus.aiAnalysis}</span>
          </div>
          <div className="status-item">
            <span className={`status-dot ${systemStatus.storage === 'available' ? 'green' : 'red'}`}></span>
            <span>Storage: {systemStatus.storage}</span>
          </div>
        </div>
      </div>

      {/* Recent Samples */}
      <div className="recent-samples">
        <h2>📚 Recent Training Samples</h2>
        {recentSamples.length > 0 ? (
          <div className="samples-list">
            {recentSamples.map(sample => (
              <div key={sample.id} className="sample-card">
                <div className="sample-info">
                  <h4>{sample.url}</h4>
                  <p>Business Type: {sample.businessType}</p>
                  <p>Collected: {new Date(sample.collectionDate).toLocaleDateString()}</p>
                </div>
                <div className="sample-score">
                  <span className="score">{sample.qualityScore || 'N/A'}</span>
                  <small>Quality Score</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-samples">
            <p>No training samples collected yet.</p>
            <button onClick={() => window.location.hash = '#collect'}>
              🚀 Start Collecting Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// SAMPLES LIST
// =============================================================================

const SamplesList = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    businessType: 'all',
    sortBy: 'collectionDate',
    page: 1
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadSamples();
  }, [filters]);

  const loadSamples = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page,
        businessType: filters.businessType,
        sortBy: filters.sortBy
      });
      
      const data = await apiCall(`/samples?${params}`);
      setSamples(data.samples);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSample = async (sampleId) => {
    if (!confirm('Are you sure you want to delete this sample?')) return;
    
    try {
      await apiCall(`/sample/${sampleId}`, { method: 'DELETE' });
      loadSamples(); // Reload list
    } catch (error) {
      console.error('Failed to delete sample:', error);
    }
  };

  const analyzeSample = async (sampleId) => {
    try {
      setLoading(true);
      await apiCall(`/analyze/${sampleId}`, { method: 'POST' });
      loadSamples(); // Reload to see updated analysis
    } catch (error) {
      console.error('Failed to analyze sample:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="samples-list">
      <div className="samples-header">
        <h2>📚 Training Samples</h2>
        
        {/* Filters */}
        <div className="filters">
          <select 
            value={filters.businessType}
            onChange={(e) => setFilters({...filters, businessType: e.target.value, page: 1})}
          >
            <option value="all">All Business Types</option>
            <option value="restaurant">Restaurant</option>
            <option value="ecommerce">E-commerce</option>
            <option value="portfolio">Portfolio</option>
            <option value="tech-startup">Tech Startup</option>
            <option value="consulting">Consulting</option>
          </select>
          
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value, page: 1})}
          >
            <option value="collectionDate">Sort by Date</option>
            <option value="qualityScore">Sort by Quality</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading samples...</div>
      ) : (
        <>
          {/* Samples Grid */}
          <div className="samples-grid">
            {samples.map(sample => (
              <div key={sample.id} className="sample-card">
                <div className="sample-header">
                  <h3>{sample.url}</h3>
                  <div className="sample-score">
                    <span className={`score ${getScoreClass(sample.qualityScore)}`}>
                      {sample.qualityScore || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="sample-meta">
                  <p><strong>Type:</strong> {sample.businessType}</p>
                  <p><strong>Collected:</strong> {new Date(sample.collectionDate).toLocaleDateString()}</p>
                  <p><strong>Method:</strong> {sample.collectionMethod || 'automated'}</p>
                </div>
                
                {sample.aiAnalysis && (
                  <div className="analysis-preview">
                    <h4>🤖 AI Analysis</h4>
                    <div className="analysis-scores">
                      <span>Business: {sample.aiAnalysis.businessAlignment?.score}</span>
                      <span>Performance: {sample.aiAnalysis.technicalMetrics?.performanceScore}</span>
                      <span>Creativity: {sample.aiAnalysis.creativityFactors?.originality}</span>
                    </div>
                  </div>
                )}
                
                <div className="sample-actions">
                  <button onClick={() => viewSample(sample.id)} className="btn-primary">
                    👁️ View
                  </button>
                  {!sample.aiAnalysis && (
                    <button onClick={() => analyzeSample(sample.id)} className="btn-secondary">
                      🤖 Analyze
                    </button>
                  )}
                  <button onClick={() => deleteSample(sample.id)} className="btn-danger">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="pagination">
              <button 
                disabled={!pagination.hasPrev}
                onClick={() => setFilters({...filters, page: filters.page - 1})}
              >
                ← Previous
              </button>
              
              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
                ({pagination.totalSamples} total samples)
              </span>
              
              <button 
                disabled={!pagination.hasNext}
                onClick={() => setFilters({...filters, page: filters.page + 1})}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// =============================================================================
// DATA COLLECTION
// =============================================================================

const DataCollection = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const CollectSingle = () => {
    const [formData, setFormData] = useState({
      url: '',
      businessType: 'restaurant',
      options: {
        screenshots: true,
        aiAnalysis: true,
        perfectTemplate: true
      }
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setResult(null);

      try {
        const data = await apiCall('/collect/website', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        
        setResult({
          success: true,
          message: data.message,
          sample: data.sample
        });
        
        // Reset form
        setFormData({
          url: '',
          businessType: 'restaurant',
          options: {
            screenshots: true,
            aiAnalysis: true,
            perfectTemplate: true
          }
        });
      } catch (error) {
        setResult({
          success: false,
          message: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="collection-form">
        <div className="form-group">
          <label>Website URL</label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({...formData, url: e.target.value})}
            placeholder="https://example.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Business Type</label>
          <select
            value={formData.businessType}
            onChange={(e) => setFormData({...formData, businessType: e.target.value})}
          >
            <option value="restaurant">Restaurant</option>
            <option value="ecommerce">E-commerce</option>
            <option value="portfolio">Portfolio</option>
            <option value="tech-startup">Tech Startup</option>
            <option value="consulting">Consulting</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="real-estate">Real Estate</option>
          </select>
        </div>

        <div className="form-group">
          <label>Collection Options</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.options.screenshots}
                onChange={(e) => setFormData({
                  ...formData, 
                  options: {...formData.options, screenshots: e.target.checked}
                })}
              />
              Collect Screenshots
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.options.aiAnalysis}
                onChange={(e) => setFormData({
                  ...formData, 
                  options: {...formData.options, aiAnalysis: e.target.checked}
                })}
              />
              AI Analysis
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.options.perfectTemplate}
                onChange={(e) => setFormData({
                  ...formData, 
                  options: {...formData.options, perfectTemplate: e.target.checked}
                })}
              />
              Generate Perfect Template
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '🔄 Collecting...' : '🚀 Collect Training Data'}
        </button>
      </form>
    );
  };

  const CollectBatch = () => {
    const [formData, setFormData] = useState({
      urls: '',
      businessType: 'restaurant'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setResult(null);

      try {
        const urls = formData.urls
          .split('\n')
          .map(url => url.trim())
          .filter(url => url);

        const data = await apiCall('/collect/batch', {
          method: 'POST',
          body: JSON.stringify({
            urls,
            businessType: formData.businessType
          })
        });
        
        setResult({
          success: true,
          message: data.message,
          summary: data.summary,
          results: data.results,
          errors: data.errors
        });
        
        // Reset form
        setFormData({
          urls: '',
          businessType: 'restaurant'
        });
      } catch (error) {
        setResult({
          success: false,
          message: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="collection-form">
        <div className="form-group">
          <label>Website URLs (one per line, max 10)</label>
          <textarea
            value={formData.urls}
            onChange={(e) => setFormData({...formData, urls: e.target.value})}
            placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
            rows="8"
            required
          />
        </div>

        <div className="form-group">
          <label>Business Type</label>
          <select
            value={formData.businessType}
            onChange={(e) => setFormData({...formData, businessType: e.target.value})}
          >
            <option value="restaurant">Restaurant</option>
            <option value="ecommerce">E-commerce</option>
            <option value="portfolio">Portfolio</option>
            <option value="tech-startup">Tech Startup</option>
            <option value="consulting">Consulting</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '🔄 Batch Collecting...' : '🚀 Start Batch Collection'}
        </button>
      </form>
    );
  };

  return (
    <div className="data-collection">
      <div className="collection-header">
        <h2>🚀 Data Collection</h2>
        <p>Collect training data from high-quality websites</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'single' ? 'active' : ''}
          onClick={() => setActiveTab('single')}
        >
          Single Website
        </button>
        <button 
          className={activeTab === 'batch' ? 'active' : ''}
          onClick={() => setActiveTab('batch')}
        >
          Batch Collection
        </button>
        <button 
          className={activeTab === 'manual' ? 'active' : ''}
          onClick={() => setActiveTab('manual')}
        >
          Manual Upload
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'single' && <CollectSingle />}
        {activeTab === 'batch' && <CollectBatch />}
        {activeTab === 'manual' && <ManualUpload />}
      </div>

      {/* Results */}
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          <h3>{result.success ? '✅ Success' : '❌ Error'}</h3>
          <p>{result.message}</p>
          
          {result.sample && (
            <div className="result-details">
              <p><strong>Sample ID:</strong> {result.sample.id}</p>
              <p><strong>Quality Score:</strong> {result.sample.qualityScore}</p>
            </div>
          )}
          
          {result.summary && (
            <div className="batch-summary">
              <h4>Batch Summary</h4>
              <p>Total: {result.summary.total} | Success: {result.summary.successful} | Failed: {result.summary.failed}</p>
              <p>Average Quality Score: {result.summary.avgQualityScore}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MANUAL UPLOAD
// =============================================================================

const ManualUpload = () => {
  const [formData, setFormData] = useState({
    businessType: 'restaurant',
    websiteUrl: '',
    description: ''
  });
  const [files, setFiles] = useState({
    screenshots: [],
    html: null
  });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles({...files, [type]: type === 'html' ? selectedFiles[0] : selectedFiles});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('businessType', formData.businessType);
      submitData.append('websiteUrl', formData.websiteUrl);
      submitData.append('description', formData.description);

      files.screenshots.forEach(file => {
        submitData.append('screenshot', file);
      });

      if (files.html) {
        submitData.append('html', files.html);
      }

      const response = await fetch(`${API_BASE_URL}/training/upload/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        body: submitData
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Manual training data uploaded successfully!');
        // Reset form
        setFormData({ businessType: 'restaurant', websiteUrl: '', description: '' });
        setFiles({ screenshots: [], html: null });
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="manual-upload-form">
      <div className="form-group">
        <label>Business Type</label>
        <select
          value={formData.businessType}
          onChange={(e) => setFormData({...formData, businessType: e.target.value})}
        >
          <option value="restaurant">Restaurant</option>
          <option value="ecommerce">E-commerce</option>
          <option value="portfolio">Portfolio</option>
          <option value="tech-startup">Tech Startup</option>
          <option value="consulting">Consulting</option>
        </select>
      </div>

      <div className="form-group">
        <label>Website URL (optional)</label>
        <input
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
          placeholder="https://example.com"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe this training sample..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Screenshots (max 5)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'screenshots')}
        />
        {files.screenshots.length > 0 && (
          <p>{files.screenshots.length} screenshot(s) selected</p>
        )}
      </div>

      <div className="form-group">
        <label>HTML Source (optional)</label>
        <input
          type="file"
          accept=".html"
          onChange={(e) => handleFileChange(e, 'html')}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? '📤 Uploading...' : '📤 Upload Training Data'}
      </button>
    </form>
  );
};

// =============================================================================
// ANALYTICS
// =============================================================================

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await apiCall('/analytics');
        setAnalytics(data.analytics);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!analytics) return <div className="error">Failed to load analytics</div>;

  return (
    <div className="analytics">
      <h2>📈 Training Analytics</h2>

      {/* Overview */}
      <div className="analytics-section">
        <h3>📊 Overview</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Total Samples</h4>
            <div className="big-number">{analytics.overview.totalSamples}</div>
          </div>
          <div className="analytics-card">
            <h4>Analyzed Samples</h4>
            <div className="big-number">{analytics.overview.analyzedSamples}</div>
          </div>
          <div className="analytics-card">
            <h4>Avg Quality Score</h4>
            <div className="big-number">{analytics.overview.avgQualityScore}</div>
          </div>
          <div className="analytics-card">
            <h4>AI Coverage</h4>
            <div className="big-number">{analytics.aiAnalysis.coverage}%</div>
          </div>
        </div>
      </div>

      {/* Business Types Distribution */}
      <div className="analytics-section">
        <h3>🏢 Business Types</h3>
        <div className="distribution-chart">
          {Object.entries(analytics.distributions.businessTypes).map(([type, count]) => (
            <div key={type} className="distribution-item">
              <span className="type-name">{type}</span>
              <div className="type-bar">
                <div 
                  className="bar-fill" 
                  style={{width: `${(count / analytics.overview.totalSamples) * 100}%`}}
                ></div>
              </div>
              <span className="type-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Distribution */}
      <div className="analytics-section">
        <h3>⭐ Quality Distribution</h3>
        <div className="quality-distribution">
          <div className="quality-item excellent">
            <span>Excellent (90+)</span>
            <span>{analytics.distributions.qualityScores.excellent}</span>
          </div>
          <div className="quality-item good">
            <span>Good (75-89)</span>
            <span>{analytics.distributions.qualityScores.good}</span>
          </div>
          <div className="quality-item average">
            <span>Average (60-74)</span>
            <span>{analytics.distributions.qualityScores.average}</span>
          </div>
          <div className="quality-item poor">
            <span>Poor (&lt;60)</span>
            <span>{analytics.distributions.qualityScores.poor}</span>
          </div>
        </div>
      </div>

      {/* AI Analysis Scores */}
      {analytics.aiAnalysis.averageScores && (
        <div className="analytics-section">
          <h3>🤖 AI Analysis Scores</h3>
          <div className="score-cards">
            <div className="score-card">
              <h4>Business Alignment</h4>
              <div className="score">{analytics.aiAnalysis.averageScores.businessAlignment}</div>
            </div>
            <div className="score-card">
              <h4>Performance</h4>
              <div className="score">{analytics.aiAnalysis.averageScores.performance}</div>
            </div>
            <div className="score-card">
              <h4>Creativity</h4>
              <div className="score">{analytics.aiAnalysis.averageScores.creativity}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SETTINGS
// =============================================================================

const Settings = () => {
  const [settings, setSettings] = useState({
    aiAnalysis: true,
    autoScreenshots: true,
    batchSize: 10,
    qualityThreshold: 70
  });

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('aiTrainerSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('aiTrainerSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  return (
    <div className="settings">
      <h2>⚙️ Settings</h2>

      <div className="settings-section">
        <h3>🤖 AI Configuration</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.aiAnalysis}
              onChange={(e) => setSettings({...settings, aiAnalysis: e.target.checked})}
            />
            Enable AI Analysis by Default
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>📸 Collection Settings</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoScreenshots}
              onChange={(e) => setSettings({...settings, autoScreenshots: e.target.checked})}
            />
            Auto-capture Screenshots
          </label>
        </div>
        <div className="setting-item">
          <label>
            Batch Collection Size:
            <input
              type="number"
              min="1"
              max="20"
              value={settings.batchSize}
              onChange={(e) => setSettings({...settings, batchSize: parseInt(e.target.value)})}
            />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>📊 Quality Control</h3>
        <div className="setting-item">
          <label>
            Minimum Quality Threshold:
            <input
              type="range"
              min="0"
              max="100"
              value={settings.qualityThreshold}
              onChange={(e) => setSettings({...settings, qualityThreshold: parseInt(e.target.value)})}
            />
            <span>{settings.qualityThreshold}</span>
          </label>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary">
        💾 Save Settings
      </button>
    </div>
  );
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const getScoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'average';
  return 'poor';
};

const viewSample = (sampleId) => {
  // Open sample in new window/modal
  window.open(`/sample/${sampleId}`, '_blank');
};

// Make TrainingDashboard available globally for browser use
window.TrainingDashboard = TrainingDashboard;

// Make React hooks available (they are already global from CDN)
const { useState, useEffect } = React;

console.log('📱 TrainingDashboard component defined and available globally');
