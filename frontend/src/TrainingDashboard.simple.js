// AI-Trainer Frontend - Simplified React Dashboard for Testing
// Versione semplificata per risolvere problemi di caricamento

console.log('📱 Loading TrainingDashboard.simple.js...');

// Use React hooks from global React
const { useState, useEffect } = React;

// Simple Training Dashboard Component
const TrainingDashboard = () => {
  console.log('🎯 TrainingDashboard component rendering...');
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [status, setStatus] = useState('Connecting...');
  
  useEffect(() => {
    console.log('⚡ TrainingDashboard useEffect running...');
    setStatus('✅ Dashboard Loaded Successfully!');
  }, []);

  return React.createElement('div', {
    style: {
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }
  }, 
    React.createElement('header', {
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }
    },
      React.createElement('h1', { style: { margin: 0, fontSize: '2.5rem' } }, '🤖 AI-Trainer Dashboard'),
      React.createElement('p', { style: { margin: '0.5rem 0 0 0', opacity: 0.9 } }, 'Template Intelligence Engine - Training Interface')
    ),
    
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }
    },
      // Status Card
      React.createElement('div', {
        style: {
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      },
        React.createElement('h3', { style: { margin: '0 0 1rem 0', color: '#333' } }, '📊 System Status'),
        React.createElement('p', { style: { fontSize: '1.2rem', margin: 0, color: '#28a745' } }, status)
      ),
      
      // Quick Actions Card
      React.createElement('div', {
        style: {
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      },
        React.createElement('h3', { style: { margin: '0 0 1rem 0', color: '#333' } }, '🚀 Quick Actions'),
        React.createElement('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } },
          React.createElement('button', {
            style: {
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            },
            onClick: () => alert('🎯 Training interface will be implemented here!')
          }, '📚 View Samples'),
          React.createElement('button', {
            style: {
              padding: '0.5rem 1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            },
            onClick: () => {
              if (window.aiTrainerDebug) {
                window.aiTrainerDebug.getServerStatus().then(r => alert(JSON.stringify(r, null, 2)));
              } else {
                alert('Debug tools not available');
              }
            }
          }, '🔧 Test API')
        )
      )
    ),
    
    // Navigation
    React.createElement('nav', {
      style: {
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem'
      }
    },
      React.createElement('h4', { style: { margin: '0 0 1rem 0', color: '#333' } }, '🧭 Navigation'),
      React.createElement('div', { style: { display: 'flex', gap: '1rem', flexWrap: 'wrap' } },
        ['Dashboard', 'Samples', 'Collection', 'Analytics', 'Settings'].map(view => 
          React.createElement('button', {
            key: view,
            style: {
              padding: '0.5rem 1rem',
              background: currentView === view.toLowerCase() ? '#667eea' : '#f8f9fa',
              color: currentView === view.toLowerCase() ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            },
            onClick: () => {
              setCurrentView(view.toLowerCase());
              alert(`🎯 Switching to ${view} view (to be implemented)`);
            }
          }, view)
        )
      )
    ),
    
    // Content Area
    React.createElement('div', {
      style: {
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '2rem',
        minHeight: '400px'
      }
    },
      React.createElement('h2', { style: { color: '#333', marginTop: 0 } }, `📱 ${currentView.charAt(0).toUpperCase() + currentView.slice(1)} View`),
      React.createElement('p', { style: { color: '#666' } }, 'This is a simplified version of the AI-Trainer dashboard for testing purposes.'),
      React.createElement('div', {
        style: {
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '1rem',
          marginTop: '1rem'
        }
      },
        React.createElement('h4', { style: { margin: '0 0 0.5rem 0', color: '#495057' } }, '🔍 Current Status:'),
        React.createElement('ul', { style: { margin: 0, paddingLeft: '1.5rem', color: '#6c757d' } },
          React.createElement('li', null, '✅ React components loading correctly'),
          React.createElement('li', null, '✅ Service Worker temporarily disabled'),
          React.createElement('li', null, '✅ CDN resources accessible'),
          React.createElement('li', null, '🔄 Full dashboard features: Coming soon...')
        )
      )
    )
  );
};

// Make component available globally
window.TrainingDashboard = TrainingDashboard;

console.log('✅ TrainingDashboard.simple.js loaded successfully!');
console.log('🎯 TrainingDashboard component available globally');
