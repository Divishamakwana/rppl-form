import React from 'react';
import { Zap, ShieldCheck, Database, FileSpreadsheet, Lock } from 'lucide-react';
import { getStoredWebhookUrl } from '../services/googleSheets';

export default function Navbar({ activeTab, setActiveTab, onOpenGuide, unSyncedCount = 0 }) {
  const isSheetConfigured = Boolean(getStoredWebhookUrl());

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div 
          className="brand-section" 
          onClick={() => setActiveTab('form')}
          title="RPPL Transformers - Click to go to form"
        >
          <div className="brand-logo-badge">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <div className="brand-info">
            <h1>RPPL <span>Transformers</span></h1>
            <div className="brand-subtitle">Rajkot Powertrans Pvt. Ltd. • ISO 9001:2015</div>
          </div>
        </div>

        <div className="nav-controls">
          <div className="badge-expo">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Exhibition Kiosk Mode</span>
          </div>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Visitor Form
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            title="Admin & Inquiry Management"
          >
            <Lock size={14} />
            <span>Admin Data</span>
            {unSyncedCount > 0 && (
              <span 
                style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  fontWeight: 'bold',
                  marginLeft: '0.2rem'
                }}
                title={`${unSyncedCount} leads waiting to sync`}
              >
                {unSyncedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

