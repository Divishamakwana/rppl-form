import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, HelpCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { getStoredWebhookUrl, saveWebhookUrl, postLeadToGoogleSheet } from '../services/googleSheets';

export default function GoogleSheetsGuideModal({ isOpen, onClose, onSaveUrl }) {
  const [currentUrl, setCurrentUrl] = useState(getStoredWebhookUrl());
  const [copiedCode, setCopiedCode] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const scriptSnippet = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.setName("Exhibition Inquiries");
      var headers = ["Date & Time", "Person Name", "Phone Number", "Email", "Company Name", "City", "State", "Type of Transformer Required", "Capacity / Rating", "Timeline", "Notes", "Captured By", "Timestamp"];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0d2b5c").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.formattedDate || new Date().toLocaleString(),
      data.personName || "",
      "'" + (data.phoneNumber || ""),
      data.email || "",
      data.companyName || "",
      data.city || "",
      data.state || "",
      data.transformerType || "",
      data.capacityRating || "",
      data.timeline || "",
      data.notes || "",
      data.capturedBy || "Kiosk",
      data.timestamp || new Date().toISOString()
    ]);
    return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSave = () => {
    saveWebhookUrl(currentUrl);
    if (onSaveUrl) onSaveUrl(currentUrl);
    alert('Google Sheet Webhook URL saved successfully!');
  };

  const handleTestConnection = async () => {
    if (!currentUrl.trim()) {
      alert('Please enter a Google Apps Script Web App URL first.');
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await postLeadToGoogleSheet({
        personName: 'Test Visitor (Verification)',
        phoneNumber: '9876543210',
        email: 'test@rppltransformers.com',
        companyName: 'RPPL Verification Inc.',
        city: 'Rajkot',
        state: 'Gujarat',
        transformerType: 'Power Transformer (Test)',
        capacityRating: '5 MVA',
        timeline: 'Immediate',
        notes: 'Test ping from RPPL Exhibition App setup wizard',
        capturedBy: 'System Test'
      }, currentUrl.trim());

      setTestStatus({
        success: true,
        message: 'Connected! A test row was sent. Please check your Google Sheet.'
      });
      saveWebhookUrl(currentUrl);
      if (onSaveUrl) onSaveUrl(currentUrl);
    } catch (err) {
      setTestStatus({
        success: false,
        message: 'Could not send test row: ' + err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet className="text-green-600" size={24} color="#15803d" />
            <h3>Google Sheet Integration Guide</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem' }}>
            Follow these 4 simple steps to connect your form directly to your Google Sheet without any monthly subscription or server costs:
          </p>

          {/* Step 1 */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-badge">1</span>
              <span>Create Google Sheet & Open Apps Script</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Create a new Google Sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>sheets.new</a>, then click <strong>Extensions &gt; Apps Script</strong> from the top menu.
            </p>
          </div>

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-badge">2</span>
              <span>Paste Apps Script Code</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Replace whatever code is in <code>Code.gs</code> with this script:
            </p>
            <div style={{ position: 'relative' }}>
              <pre className="code-snippet" style={{ maxHeight: '140px' }}>
                <code>{scriptSnippet}</code>
              </pre>
              <button 
                type="button" 
                onClick={handleCopyCode}
                className="btn-admin"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '0.72rem',
                  padding: '0.35rem 0.65rem'
                }}
              >
                {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-badge">3</span>
              <span>Deploy as Web App</span>
            </div>
            <ul style={{ fontSize: '0.82rem', color: '#64748b', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li>Click <strong>Deploy &gt; New deployment</strong> (top-right blue button).</li>
              <li>Under "Select type", choose <strong>Web app</strong> (gear icon).</li>
              <li>Set <strong>Execute as:</strong> "Me (your email)".</li>
              <li>Set <strong>Who has access:</strong> <strong>"Anyone"</strong> (crucial for form submissions).</li>
              <li>Click <strong>Deploy</strong> and copy the <strong>Web App URL</strong> (ends in <code>/exec</code>).</li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="step-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
            <div className="step-header">
              <span className="step-badge" style={{ background: '#2563eb' }}>4</span>
              <span>Paste Your Web App URL Here</span>
            </div>
            <div style={{ marginTop: '0.6rem' }}>
              <input 
                type="url" 
                placeholder="https://script.google.com/macros/s/.../exec"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid #93c5fd',
                  fontSize: '0.85rem',
                  marginBottom: '0.6rem'
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-admin primary"
                  onClick={handleSave}
                >
                  Save URL
                </button>
                <button
                  type="button"
                  className="btn-admin success"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? 'Sending test row...' : 'Send Test Lead to Sheet'}
                </button>
              </div>

              {testStatus && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  background: testStatus.success ? '#dcfce7' : '#fee2e2',
                  color: testStatus.success ? '#15803d' : '#b91c1c',
                  border: `1px solid ${testStatus.success ? '#86efac' : '#fca5a5'}`
                }}>
                  {testStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

