import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  Zap, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  saveLeadLocally, 
  postLeadToGoogleSheet, 
  getStoredWebhookUrl,
  updateLeadStatus 
} from '../services/googleSheets';

const INDIAN_STATES = [
  'Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi NCR', 
  'Karnataka', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Haryana', 
  'Punjab', 'West Bengal', 'Andhra Pradesh', 'Chhattisgarh', 'Odisha', 
  'Jharkhand', 'Kerala', 'Goa', 'Uttarakhand', 'Himachal Pradesh', 
  'Assam', 'Bihar', 'Other / International'
];

const TRANSFORMER_TYPES = [
  'Power Transformers (Up to 10 MVA, 66 kV)',
  'Distribution Transformers (IS 1180 / IS 2026)',
  'Solar Inverter Duty Transformers',
  'Wind Energy Transformers',
  'Furnace Transformers (Induction / Arc)',
  'Dry Type Transformers (Resin / VPI)',
  'Compact Sub-Stations (CSS)',
  'Isolation & Special Purpose Transformers',
  'Transformer Oil Filtration & O&M Services',
  'Other / Custom Specification'
];

const CAPACITY_PRESETS = [
  '250 kVA', '500 kVA', '1 MVA', '2 MVA', '3.15 MVA', '5 MVA', '8 MVA', '10 MVA'
];

export default function ExhibitionForm({ onLeadAdded, onOpenGuide }) {
  const [formData, setFormData] = useState({
    personName: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    city: '',
    state: 'Gujarat',
    transformerType: '',
    capacityRating: '',
    timeline: 'Immediate (1-3 weeks)',
    notes: '',
    capturedBy: localStorage.getItem('rppl_booth_staff') || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);
  const [isSheetLinked, setIsSheetLinked] = useState(Boolean(getStoredWebhookUrl()));

  useEffect(() => {
    setIsSheetLinked(Boolean(getStoredWebhookUrl()));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (name === 'capturedBy') {
      localStorage.setItem('rppl_booth_staff', value);
    }
  };

  const selectTransformerType = (type) => {
    setFormData((prev) => ({ ...prev, transformerType: type }));
    if (errors.transformerType) {
      setErrors((prev) => ({ ...prev, transformerType: null }));
    }
  };

  const selectCapacity = (cap) => {
    setFormData((prev) => ({ ...prev, capacityRating: cap }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.personName.trim()) {
      newErrors.personName = 'Person name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9+\s-]{8,15}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.transformerType.trim()) {
      newErrors.transformerType = 'Please select the type of transformer required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      // Scroll to first error
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const newLead = {
      id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }),
      ...formData,
      synced: false
    };

    // 1. Immediately save locally to prevent data loss
    saveLeadLocally(newLead);
    if (onLeadAdded) onLeadAdded(newLead);

    // 2. Post to Google Sheet webhook
    let syncSuccess = false;
    try {
      const result = await postLeadToGoogleSheet(newLead);
      if (result.success) {
        syncSuccess = true;
        updateLeadStatus(newLead.id, true);
        newLead.synced = true;
      }
    } catch (err) {
      console.warn('Google Sheet sync deferred:', err);
    }

    setIsSubmitting(false);
    setSubmittedLead(newLead);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // confetti fallback
    }
  };

  const handleResetForNext = () => {
    setFormData({
      personName: '',
      phoneNumber: '',
      email: '',
      companyName: '',
      city: '',
      state: formData.state || 'Gujarat',
      transformerType: '',
      capacityRating: '',
      timeline: 'Immediate (1-3 weeks)',
      notes: '',
      capturedBy: formData.capturedBy
    });
    setErrors({});
    setSubmittedLead(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedLead) {
    return (
      <div className="form-card">
        <div className="success-card">
          <div className="success-icon-wrap">
            <CheckCircle size={44} />
          </div>

          <h3>Inquiry Recorded Successfully!</h3>
          <p>
            Thank you, <strong>{submittedLead.personName}</strong>. Your requirement has been registered with the RPPL Transformers technical sales desk.
          </p>

          <div className="success-summary-box">
            <div className="summary-row">
              <span className="summary-label">Company</span>
              <span className="summary-value">{submittedLead.companyName}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Contact</span>
              <span className="summary-value">{submittedLead.phoneNumber}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Location</span>
              <span className="summary-value">{submittedLead.city}, {submittedLead.state}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Requirement</span>
              <span className="summary-value" style={{ color: '#1d4ed8' }}>{submittedLead.transformerType}</span>
            </div>
            {submittedLead.capacityRating && (
              <div className="summary-row">
                <span className="summary-label">Capacity / Rating</span>
                <span className="summary-value">{submittedLead.capacityRating}</span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-label">Google Sheet Sync</span>
              <span className="summary-value">
                {submittedLead.synced ? (
                  <span style={{ color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> Synced to Sheet
                  </span>
                ) : (
                  <span style={{ color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={14} /> Saved in local cache
                  </span>
                )}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              type="button" 
              onClick={handleResetForNext}
              className="btn-new-form"
            >
              <RotateCcw size={18} />
              <span>Submit Next Visitor Inquiry</span>
            </button>

            <a 
              href="https://rppltransformers.com" 
              target="_blank" 
              rel="noreferrer"
              style={{
                fontSize: '0.85rem',
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginTop: '0.5rem',
                textDecoration: 'none'
              }}
            >
              <span>Visit RPPL Official Website</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card">
      <div className="form-header">
        <div className="form-header-badge">
          <Sparkles size={13} />
          <span>Exhibition Inquiry Form</span>
        </div>
        <h2>Visitor Requirement Form</h2>
        <p>
          Welcome to the RPPL Transformers booth. Please share your project or equipment requirements below.
        </p>
      </div>

      <div className="form-body">
        {!isSheetLinked && (
          <div className="offline-notice">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong>Google Sheet Not Linked Yet:</strong> Inquiries are safely stored on this device. 
              <button 
                type="button" 
                onClick={onOpenGuide}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#b45309',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginLeft: '0.35rem'
                }}
              >
                Connect your Google Sheet here
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Person Name & Phone Number */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="personName">
                <User size={15} />
                <span>Person Name</span>
                <span className="required-star">*</span>
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <User size={17} />
                </div>
                <input
                  id="personName"
                  name="personName"
                  type="text"
                  placeholder="e.g. Rajesh Patel"
                  className={`form-input ${errors.personName ? 'has-error' : ''}`}
                  value={formData.personName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
              {errors.personName && <span className="error-text">{errors.personName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phoneNumber">
                <Phone size={15} />
                <span>Phone / WhatsApp Number</span>
                <span className="required-star">*</span>
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <Phone size={17} />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  className={`form-input ${errors.phoneNumber ? 'has-error' : ''}`}
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>
              {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
            </div>
          </div>

          {/* Row 2: Company Name & Email */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="companyName">
                <Building2 size={15} />
                <span>Company / Organization Name</span>
                <span className="required-star">*</span>
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <Building2 size={17} />
                </div>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="e.g. Gujarat Solar Infrastructure Ltd."
                  className={`form-input ${errors.companyName ? 'has-error' : ''}`}
                  value={formData.companyName}
                  onChange={handleChange}
                  autoComplete="organization"
                />
              </div>
              {errors.companyName && <span className="error-text">{errors.companyName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <Mail size={15} />
                <span>Email Address</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <Mail size={17} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. rajesh@company.com"
                  className={`form-input ${errors.email ? 'has-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>

          {/* Row 3: City and State */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="city">
                <MapPin size={15} />
                <span>City</span>
                <span className="required-star">*</span>
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <MapPin size={17} />
                </div>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="e.g. Rajkot, Ahmedabad, Mumbai"
                  className={`form-input ${errors.city ? 'has-error' : ''}`}
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="state">
                <span>State</span>
                <span className="required-star">*</span>
              </label>
              <select
                id="state"
                name="state"
                className="form-select no-icon"
                value={formData.state}
                onChange={handleChange}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Type of Transformer Required */}
          <div className="form-group">
            <label className="form-label" htmlFor="transformerType">
              <Zap size={15} />
              <span>Type of Transformer Required</span>
              <span className="required-star">*</span>
            </label>
            <select
              id="transformerType"
              name="transformerType"
              className={`form-select no-icon ${errors.transformerType ? 'has-error' : ''}`}
              value={formData.transformerType}
              onChange={handleChange}
            >
              <option value="">-- Select Transformer Type --</option>
              {TRANSFORMER_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.transformerType && <span className="error-text">{errors.transformerType}</span>}

            {/* Quick-select chips for mobile/kiosk speed */}
            <div className="chips-container">
              {['Power Transformers', 'Distribution Transformers', 'Solar Inverter Duty', 'Furnace Transformers', 'Dry Type'].map((quick) => {
                const fullMatch = TRANSFORMER_TYPES.find(t => t.toLowerCase().includes(quick.toLowerCase()));
                const isSelected = formData.transformerType === fullMatch;
                return (
                  <button
                    key={quick}
                    type="button"
                    className={`chip-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectTransformerType(fullMatch || quick)}
                  >
                    <Zap size={12} />
                    <span>{quick}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Capacity / Rating & Timeline */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="capacityRating">
                <span>Capacity / Rating (kVA / MVA)</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                id="capacityRating"
                name="capacityRating"
                type="text"
                placeholder="e.g. 5 MVA / 33 kV or 1000 kVA"
                className="form-input no-icon"
                value={formData.capacityRating}
                onChange={handleChange}
              />
              <div className="chips-container" style={{ marginTop: '0.4rem' }}>
                {CAPACITY_PRESETS.map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    className={`chip-btn ${formData.capacityRating === cap ? 'selected' : ''}`}
                    onClick={() => selectCapacity(cap)}
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="timeline">
                <Clock size={15} />
                <span>Project Timeline / Urgency</span>
              </label>
              <select
                id="timeline"
                name="timeline"
                className="form-select no-icon"
                value={formData.timeline}
                onChange={handleChange}
              >
                <option value="Immediate (1-3 weeks)">Immediate Requirement (1-3 weeks)</option>
                <option value="1 to 3 Months">1 to 3 Months</option>
                <option value="3 to 6 Months">3 to 6 Months</option>
                <option value="Tender / Budgetary Stage">Tender / Budgetary Stage</option>
                <option value="General Exploration">General Exploration</option>
              </select>
            </div>
          </div>

          {/* Row 6: Additional Requirement Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="notes">
              <FileText size={15} />
              <span>Specific Requirements / Specifications</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Voltage class, cooling, standards)</span>
            </label>
            <div className="input-container">
              <div className="input-icon" style={{ top: '0.9rem' }}>
                <FileText size={17} />
              </div>
              <textarea
                id="notes"
                name="notes"
                placeholder="e.g. 11kV/433V, ONAN cooling, Copper winding, IS 1180 Level 2 compliant..."
                className="form-textarea"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Booth Staff tag (saved per session) */}
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '0.85rem 1rem', 
            background: '#f8fafc', 
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              <strong>Booth Staff Tag:</strong> Logged by representative
            </div>
            <input
              type="text"
              name="capturedBy"
              placeholder="Staff Name / Booth #4"
              value={formData.capturedBy}
              onChange={handleChange}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                maxWidth: '180px'
              }}
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <span>Submitting to Google Sheet...</span>
              </>
            ) : (
              <>
                <span>Submit Visitor Inquiry</span>
                <Send size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

