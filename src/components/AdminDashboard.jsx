import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Zap, 
  Clock, 
  Eye, 
  Lock, 
  Unlock,
  Settings,
  ChevronRight,
  X,
  ExternalLink
} from 'lucide-react';
import { 
  getStoredLeads, 
  deleteLeadFromStorage, 
  clearAllLeadsFromStorage, 
  postLeadToGoogleSheet, 
  updateLeadStatus,
  getStoredWebhookUrl 
} from '../services/googleSheets';

export default function AdminDashboard({ onOpenGuide }) {
  const [leads, setLeads] = useState(getStoredLeads());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  
  // Quick security PIN (booth protection)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('rppl_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const webhookUrl = getStoredWebhookUrl();

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === 'admin') {
      setIsAuthenticated(true);
      localStorage.setItem('rppl_admin_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('rppl_admin_auth');
  };

  const reloadLeads = () => {
    setLeads(getStoredLeads());
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch = 
        (lead.personName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phoneNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.transformerType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || lead.transformerType === typeFilter;
      const matchStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'SYNCED' ? lead.synced : !lead.synced;

      return matchSearch && matchType && matchStatus;
    });
  }, [leads, searchTerm, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = leads.length;
    const synced = leads.filter(l => l.synced).length;
    const pending = total - synced;

    // Count today's leads
    const todayStr = new Date().toLocaleDateString();
    const todayCount = leads.filter(l => {
      try {
        return new Date(l.timestamp).toLocaleDateString() === todayStr;
      } catch {
        return false;
      }
    }).length;

    // Most requested transformer
    const typeCounts = {};
    leads.forEach(l => {
      if (l.transformerType) {
        typeCounts[l.transformerType] = (typeCounts[l.transformerType] || 0) + 1;
      }
    });
    let topType = 'None';
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topType = type.split('(')[0].trim();
      }
    });

    return { total, synced, pending, todayCount, topType };
  }, [leads]);

  // Sync all pending to Google Sheet
  const handleSyncAllPending = async () => {
    if (!webhookUrl) {
      alert('Please configure your Google Sheet Webhook URL first in the setup guide!');
      onOpenGuide();
      return;
    }

    const pendingLeads = leads.filter(l => !l.synced);
    if (pendingLeads.length === 0) {
      alert('All leads are already synced to your Google Sheet!');
      return;
    }

    setIsSyncingAll(true);
    setSyncFeedback(`Syncing ${pendingLeads.length} leads to Google Sheet...`);

    let successCount = 0;
    for (const lead of pendingLeads) {
      try {
        const res = await postLeadToGoogleSheet(lead);
        if (res.success) {
          updateLeadStatus(lead.id, true);
          successCount++;
        }
      } catch (err) {
        console.error('Failed to sync lead:', lead.id, err);
      }
    }

    reloadLeads();
    setIsSyncingAll(false);
    setSyncFeedback(`Successfully synced ${successCount} of ${pendingLeads.length} leads!`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Sync single lead
  const handleSyncSingle = async (lead) => {
    if (!webhookUrl) {
      onOpenGuide();
      return;
    }
    const res = await postLeadToGoogleSheet(lead);
    if (res.success) {
      updateLeadStatus(lead.id, true);
      reloadLeads();
    } else {
      alert('Sync failed: ' + res.message);
    }
  };

  // Delete single lead
  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete inquiry for "${name}"?`)) {
      deleteLeadFromStorage(id);
      reloadLeads();
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead(null);
      }
    }
  };

  // Clear all leads
  const handleClearAll = () => {
    if (leads.length === 0) return;
    if (window.confirm('WARNING: Are you sure you want to clear ALL leads from local storage? Make sure you have exported to CSV or synced to Google Sheet first!')) {
      clearAllLeadsFromStorage();
      reloadLeads();
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('No leads available to export.');
      return;
    }

    const headers = [
      'Date & Time',
      'Person Name',
      'Phone Number',
      'Email',
      'Company Name',
      'City',
      'State',
      'Transformer Type Required',
      'Capacity / Rating',
      'Project Timeline',
      'Specific Notes',
      'Captured By',
      'Synced to Sheet'
    ];

    const rows = leads.map(l => [
      `"${l.formattedDate || l.timestamp}"`,
      `"${(l.personName || '').replace(/"/g, '""')}"`,
      `"${(l.phoneNumber || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.companyName || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.state || '').replace(/"/g, '""')}"`,
      `"${(l.transformerType || '').replace(/"/g, '""')}"`,
      `"${(l.capacityRating || '').replace(/"/g, '""')}"`,
      `"${(l.timeline || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${(l.capturedBy || '').replace(/"/g, '""')}"`,
      `"${l.synced ? 'YES' : 'NO'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `RPPL_Exhibition_Leads_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PIN Protection Gate for Booth security
  if (!isAuthenticated) {
    return (
      <div className="form-card" style={{ maxWidth: '440px', marginTop: '2rem' }}>
        <div className="form-header" style={{ textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto'
          }}>
            <Lock size={26} color="white" />
          </div>
          <h2>Admin Access</h2>
          <p>Protected exhibition booth database. Please enter PIN to access.</p>
        </div>

        <div className="form-body">
          <form onSubmit={handlePinSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="pin">
                <span>Enter Admin PIN (Default: 1234)</span>
              </label>
              <input
                id="pin"
                type="password"
                placeholder="Enter 4-digit PIN"
                className={`form-input no-icon ${pinError ? 'has-error' : ''}`}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                autoFocus
                style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem' }}
              />
              {pinError && <span className="error-text">Incorrect PIN. Try 1234</span>}
            </div>

            <button type="submit" className="btn-submit">
              <Unlock size={18} />
              <span>Unlock Admin Dashboard</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Top Header */}
      <div className="admin-header">
        <div className="admin-title-wrap">
          <h2>Exhibition Leads & Admin Portal</h2>
          <p>Real-time inquiry capture & Google Sheets integration</p>
        </div>

        <div className="admin-actions">
          <button 
            type="button" 
            className="btn-admin" 
            onClick={onOpenGuide}
            title="Google Sheets Configuration"
          >
            <Settings size={15} />
            <span>Google Sheet Setup</span>
            {webhookUrl ? (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            ) : (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
            )}
          </button>

          {stats.pending > 0 && (
            <button 
              type="button" 
              className="btn-admin primary" 
              onClick={handleSyncAllPending}
              disabled={isSyncingAll}
            >
              <RefreshCw size={15} className={isSyncingAll ? 'animate-spin' : ''} />
              <span>Sync All ({stats.pending}) to Sheet</span>
            </button>
          )}

          <button 
            type="button" 
            className="btn-admin success" 
            onClick={handleExportCSV}
            title="Download CSV for Excel"
          >
            <Download size={15} />
            <span>Export to CSV / Excel</span>
          </button>

          <button
            type="button"
            className="btn-admin"
            onClick={handleLogout}
            title="Lock Dashboard"
          >
            <Lock size={15} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#dcfce7',
          color: '#15803d',
          borderRadius: '10px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.88rem'
        }}>
          <CheckCircle size={16} />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Inquiries</div>
          </div>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#1e40af' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{stats.todayCount}</div>
            <div className="stat-label">Inquiries Today</div>
          </div>
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: stats.pending > 0 ? '#b45309' : '#15803d' }}>
              {stats.synced} / {stats.total}
            </div>
            <div className="stat-label">Synced to Google Sheet</div>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FileSpreadsheet size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={stats.topType}>
              {stats.topType}
            </div>
            <div className="stat-label">Top Demand Category</div>
          </div>
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
            <Zap size={24} />
          </div>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="table-card">
        {/* Search & Filter Bar */}
        <div className="table-controls">
          <div className="search-input-box">
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search name, company, phone, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="SYNCED">Synced Only</option>
              <option value="PENDING">Pending Sync</option>
            </select>

            <button 
              type="button" 
              className="btn-admin" 
              onClick={reloadLeads}
              title="Refresh list"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Responsive Leads Table */}
        <div className="table-responsive">
          {filteredLeads.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <Users size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>No inquiries found</div>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search query or filters' 
                  : 'Submitted forms will appear here in real time.'}
              </p>
            </div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Visitor & Company</th>
                  <th>Contact Info</th>
                  <th>Location</th>
                  <th>Transformer Required</th>
                  <th>Rating</th>
                  <th>Google Sheet</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{lead.personName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{lead.companyName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{lead.formattedDate}</div>
                    </td>

                    <td>
                      <a 
                        href={`tel:${lead.phoneNumber}`} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#1e40af', textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem' }}
                      >
                        <Phone size={13} />
                        <span>{lead.phoneNumber}</span>
                      </a>
                      {lead.email && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          <a href={`mailto:${lead.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {lead.email}
                          </a>
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{lead.city}</span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lead.state}</div>
                    </td>

                    <td>
                      <span className="badge-tag badge-blue" title={lead.transformerType}>
                        {lead.transformerType.length > 25 ? lead.transformerType.substring(0, 25) + '...' : lead.transformerType}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{lead.capacityRating || '-'}</span>
                    </td>

                    <td>
                      {lead.synced ? (
                        <span className="badge-tag badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Synced
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSyncSingle(lead)}
                          className="badge-tag badge-yellow"
                          style={{ cursor: 'pointer', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Click to sync now"
                        >
                          <RefreshCw size={11} /> Sync Now
                        </button>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-admin"
                          onClick={() => setSelectedLead(lead)}
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-admin"
                          onClick={() => handleDelete(lead.id, lead.personName)}
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: '#dc2626' }}
                          title="Delete Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer actions */}
        {leads.length > 0 && (
          <div style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#64748b',
            background: '#fafafa',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div>Showing {filteredLeads.length} of {leads.length} total inquiries</div>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              Clear All Local Records
            </button>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Visitor Inquiry Details</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {selectedLead.id}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedLead(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Person Name</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{selectedLead.personName}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Company</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{selectedLead.companyName}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Phone Number</div>
                  <a href={`tel:${selectedLead.phoneNumber}`} style={{ fontWeight: 600, color: '#1e40af', textDecoration: 'none' }}>
                    {selectedLead.phoneNumber}
                  </a>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Email</div>
                  <div style={{ fontWeight: 500 }}>{selectedLead.email || 'Not provided'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>City & State</div>
                  <div style={{ fontWeight: 600 }}>{selectedLead.city}, {selectedLead.state}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Submission Date</div>
                  <div style={{ fontWeight: 500 }}>{selectedLead.formattedDate}</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Requirement Details</div>
                <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '1rem' }}>{selectedLead.transformerType}</div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
                  <strong>Capacity/Rating:</strong> {selectedLead.capacityRating || 'Not specified'}
                </div>
                <div style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
                  <strong>Timeline:</strong> {selectedLead.timeline || 'Immediate'}
                </div>
                {selectedLead.notes && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#334155', background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <strong>Specific Notes:</strong> {selectedLead.notes}
                  </div>
                )}
                {selectedLead.capturedBy && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                    Logged by representative: <strong>{selectedLead.capturedBy}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {selectedLead.synced ? (
                    <span className="badge-tag badge-green">Synced to Google Sheet</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-admin primary"
                      onClick={() => handleSyncSingle(selectedLead)}
                    >
                      <RefreshCw size={14} />
                      <span>Sync to Google Sheet Now</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-admin"
                  onClick={() => setSelectedLead(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

