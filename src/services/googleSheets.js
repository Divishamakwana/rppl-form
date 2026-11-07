/**
 * Service to handle Google Sheets integration & local offline queue
 */

const STORAGE_KEY = 'rppl_exhibition_leads_v1';
const WEBHOOK_URL_KEY = 'rppl_sheets_webhook_url';

// Default default webhook (can be configured in admin or .env)
const DEFAULT_WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

export const getStoredWebhookUrl = () => {
  return localStorage.getItem(WEBHOOK_URL_KEY) || DEFAULT_WEBHOOK_URL;
};

export const saveWebhookUrl = (url) => {
  localStorage.setItem(WEBHOOK_URL_KEY, url.trim());
};

export const getStoredLeads = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load leads from storage:', err);
    return [];
  }
};

export const saveLeadLocally = (lead) => {
  try {
    const existing = getStoredLeads();
    const updated = [lead, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save lead to storage:', err);
    return [];
  }
};

export const updateLeadStatus = (id, synced) => {
  try {
    const existing = getStoredLeads();
    const updated = existing.map((item) =>
      item.id === id ? { ...item, synced } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to update lead status:', err);
    return [];
  }
};

export const deleteLeadFromStorage = (id) => {
  try {
    const existing = getStoredLeads();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete lead:', err);
    return [];
  }
};

export const clearAllLeadsFromStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Send lead data to Google Apps Script Web App
 * Google Apps Script redirects with 302, so 'no-cors' mode is required
 * from standard browsers to prevent CORS blocking.
 */
export const postLeadToGoogleSheet = async (leadData, customUrl = null) => {
  const url = customUrl || getStoredWebhookUrl();
  
  if (!url) {
    return {
      success: false,
      isConfigured: false,
      message: 'Google Sheet Webhook URL not configured yet. Lead saved locally.'
    };
  }

  try {
    // Send payload formatted for Google Sheet
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Vital for Google Apps Script Web App handling
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        timestamp: leadData.timestamp || new Date().toISOString(),
        formattedDate: leadData.formattedDate || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        personName: leadData.personName || '',
        phoneNumber: leadData.phoneNumber || '',
        email: leadData.email || '',
        companyName: leadData.companyName || '',
        city: leadData.city || '',
        state: leadData.state || '',
        transformerType: leadData.transformerType || '',
        capacityRating: leadData.capacityRating || 'Not specified',
        timeline: leadData.timeline || 'Immediate',
        notes: leadData.notes || '',
        capturedBy: leadData.capturedBy || 'Booth Kiosk',
        source: 'Exhibition Kiosk'
      })
    });

    // In 'no-cors' mode, browser cannot read response body, but absence of throw means network transmission succeeded
    return {
      success: true,
      isConfigured: true,
      message: 'Data sent to Google Sheet successfully!'
    };
  } catch (error) {
    console.error('Error posting to Google Sheet:', error);
    return {
      success: false,
      isConfigured: true,
      error: error.message,
      message: 'Network issue. Data saved locally and can be synced later.'
    };
  }
};

