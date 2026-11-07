# RPPL Transformers — Exhibition Visitor Inquiry & Admin Portal

A mobile-responsive, production-ready React application built for **RPPL Transformers** ([rppltransformers.com](https://rppltransformers.com) — *Rajkot Powertrans Pvt. Ltd.*) to capture visitor inquiries and technical requirements at trade shows, expos, and exhibitions (e.g., ELECRAMA, Tech Expos).

All captured visitor data is saved **directly into your Google Sheet in real time** via a free Google Apps Script webhook, with an offline-resilient cache and a separate Admin Dashboard for lead management.

---

## 🌟 Key Features

1. **Visitor Inquiry Form (`/` or `/#form`)**:
   - **Fields**:
     - Person Name *
     - Phone / WhatsApp Number *
     - Email Address
     - Company / Organization Name *
     - City * & State (with pre-filled Indian state selector)
     - Type of Transformer Required * (Power, Distribution, Solar Inverter Duty, Wind, Furnace, Dry Type, Compact Substation, Oil Filtration, etc.)
     - Capacity / Rating (kVA / MVA quick chips: 250 kVA to 10 MVA)
     - Project Urgency / Timeline
     - Specific Technical Notes / Voltage Class
     - Booth Staff Representative tag
   - Touch-friendly 48px+ targets optimized for **iPads, Android tablets, and mobile phones**.
   - Celebration confetti and one-click **"Submit Next Visitor Inquiry"** reset for fast kiosk turnaround.

2. **Admin & Inquiry Portal (`/#admin`)**:
   - **PIN-protected** (Default PIN: `1234` or `admin`) so casual visitors cannot snoop on competitors' data.
   - **Live Metrics**: Total leads, leads captured today, sync health, top transformer demand category.
   - **Search & Filter**: Search by name, company, phone, city, or filter by transformer category.
   - **Click-to-Call & Click-to-Email**: Instant outreach for booth managers.
   - **1-Click Export to CSV / Excel**: Download all leads anytime for CRM import.
   - **Bulk Sync**: Sync all pending offline leads to your Google Sheet with a single click.

3. **Google Sheets Real-time Integration**:
   - 100% free serverless webhook via Google Apps Script.
   - Zero third-party fees, no quota limitations.
   - Offline fallback: If expo WiFi drops, leads are queued in local browser storage and can be synced anytime.

---

## 🚀 Quick Start (Running Locally)

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production deployment
npm run build
```

The app will be accessible at:
- **Visitor Form**: `http://localhost:3000/#form`
- **Admin Dashboard**: `http://localhost:3000/#admin`

---

## 📊 How to Connect to Google Sheets (Step-by-Step)

You can connect any Google Sheet in **under 2 minutes**:

### Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a new sheet (e.g., *RPPL Exhibition Inquiries 2026*).
2. Click **Extensions** in the top menu &gt; **Apps Script**.

### Step 2: Paste the Script Code
1. Erase any code inside `Code.gs`.
2. Open the file [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) from this repository, copy its entire contents, and paste it into the Apps Script editor.
3. Click the **Save** (disk) icon.

### Step 3: Deploy as a Web App
1. In the top right, click **Deploy** &gt; **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: `RPPL Form Webhook`
   - **Execute as**: `Me (your email)`
   - **Who has access**: **`Anyone`** *(Crucial: must be set to Anyone so the form can send data without login restrictions)*.
4. Click **Deploy**.
5. Grant Google permissions when prompted.
6. Copy the generated **Web app URL** (ends in `/exec`).

### Step 4: Link in the React App
1. In the React app, navigate to **Admin Data** (`/#admin`) or click **Google Sheets Setup** in the footer.
2. Paste your Web App URL into the box.
3. Click **Save URL** and test by clicking **Send Test Lead to Sheet**.
4. Check your Google Sheet — a test row with formatted navy headers will instantly appear!

---

## 📁 Project Structure

```
d:/form/
├── google-apps-script/
│   └── Code.gs               # Production-ready Google Apps Script webhook
├── src/
│   ├── components/
│   │   ├── Navbar.jsx        # RPPL branded header with navigation
│   │   ├── ExhibitionForm.jsx# Mobile-responsive kiosk visitor form
│   │   ├── AdminDashboard.jsx# PIN-protected lead management & CSV export
│   │   └── GoogleSheetsGuideModal.jsx # In-app setup wizard & test tool
│   ├── services/
│   │   └── googleSheets.js   # Local storage queue & Apps Script API caller
│   ├── styles/
│   │   └── index.css         # Responsive styling with RPPL brand colors
│   ├── App.jsx               # Page router & layout
│   └── main.jsx              # React 18 bootstrap
├── index.html                # HTML template with mobile viewport
├── vite.config.js            # Vite bundler configuration
└── package.json
```

---

## 🔒 Security & Privacy

- **Admin Protection**: Admin dashboard is guarded with a PIN code (Default `1234`) to prevent visitors at the kiosk from seeing previously submitted visitor contacts.
- **Offline Data Resiliency**: If network connectivity drops at exhibition centers, records remain stored in browser `localStorage` and display a clear sync button once connection is restored.

