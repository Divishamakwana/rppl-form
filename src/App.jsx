import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ExhibitionForm from './components/ExhibitionForm';
import AdminDashboard from './components/AdminDashboard';
import GoogleSheetsGuideModal from './components/GoogleSheetsGuideModal';
import { getStoredLeads, getStoredWebhookUrl } from './services/googleSheets';

export default function App() {
  // Sync tab with URL hash if present
  const getInitialTab = () => {
    if (window.location.hash === '#admin') return 'admin';
    return 'form';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [unSyncedCount, setUnSyncedCount] = useState(0);

  const calculateUnsynced = () => {
    const leads = getStoredLeads();
    const pending = leads.filter(l => !l.synced).length;
    setUnSyncedCount(pending);
  };

  useEffect(() => {
    calculateUnsynced();

    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setActiveTab('admin');
      } else if (window.location.hash === '#form') {
        setActiveTab('form');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab === 'admin' ? '#admin' : '#form';
  };

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange}
        onOpenGuide={() => setIsGuideOpen(true)}
        unSyncedCount={unSyncedCount}
      />

      <main className="content-wrapper">
        {activeTab === 'form' ? (
          <ExhibitionForm 
            onLeadAdded={calculateUnsynced}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        ) : (
          <AdminDashboard 
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}
      </main>

      <GoogleSheetsGuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSaveUrl={() => calculateUnsynced()}
      />

      <footer className="app-footer">
        <div>
          <strong>Rajkot Powertrans Private Limited (RPPL)</strong> • High-Performance Transformers & Sub-station Solutions
        </div>
        <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="https://rppltransformers.com" target="_blank" rel="noreferrer">
            Official Website: rppltransformers.com
          </a>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: 'inherit',
              padding: 0
            }}
          >
            Google Sheets Setup Guide
          </button>
        </div>
      </footer>
    </div>
  );
}

