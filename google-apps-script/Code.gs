/**
 * RPPL TRANSFORMERS - EXHIBITION VISITOR INQUIRY WEBHOOK
 * 
 * INSTRUCTIONS TO DEPLOY:
 * 1. Open Google Sheets (create a new sheet e.g. "RPPL Exhibition Leads 2026").
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete any default code and paste this entire file.
 * 4. Click "Deploy" (top right button) -> "New deployment".
 * 5. Select type: "Web app" (click gear icon next to Select type).
 * 6. Set Description: "RPPL Exhibition Leads Receiver".
 * 7. Set Execute as: "Me (your email)".
 * 8. Set Who has access: "Anyone" (IMPORTANT: Must be "Anyone" so the React form can post data).
 * 9. Click "Deploy", authorize permissions when prompted.
 * 10. Copy the "Web app URL" (it ends with /exec) and paste it into the React Admin settings.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent requests
  lock.tryLock(30000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();

    // If active sheet is empty, rename and initialize headers
    if (sheet.getLastRow() === 0) {
      sheet.setName("Exhibition Inquiries");
      var headers = [
        "Date & Time",
        "Person Name",
        "Phone Number",
        "Email",
        "Company Name",
        "City",
        "State",
        "Type of Transformer Required",
        "Capacity / Rating",
        "Timeline / Urgency",
        "Requirement Notes",
        "Captured By",
        "Raw Timestamp"
      ];
      
      sheet.appendRow(headers);
      
      // Style headers: Navy background, White text, Bold, Freeze top row
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0d2b5c");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Arial");
      sheet.setFrozenRows(1);
      
      // Auto resize columns
      for (var i = 1; i <= headers.length; i++) {
        sheet.setColumnWidth(i, 160);
      }
    }

    // Parse incoming data
    var rawData = e.postData.contents;
    var data = {};
    
    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = e.parameter;
    }

    var formattedDate = data.formattedDate || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MMM-yyyy hh:mm a");
    var personName = data.personName || "";
    var phoneNumber = data.phoneNumber || "";
    var email = data.email || "";
    var companyName = data.companyName || "";
    var city = data.city || "";
    var state = data.state || "";
    var transformerType = data.transformerType || "";
    var capacityRating = data.capacityRating || "";
    var timeline = data.timeline || "";
    var notes = data.notes || "";
    var capturedBy = data.capturedBy || "Kiosk";
    var timestamp = data.timestamp || new Date().toISOString();

    // Append inquiry row
    var nextRow = sheet.getLastRow() + 1;
    sheet.appendRow([
      formattedDate,
      personName,
      "'" + phoneNumber, // Prepended apostrophe prevents Excel/Sheets from dropping leading zeros
      email,
      companyName,
      city,
      state,
      transformerType,
      capacityRating,
      timeline,
      notes,
      capturedBy,
      timestamp
    ]);

    // Optional: Alternating row colors for clean look
    var dataRange = sheet.getRange(nextRow, 1, 1, 13);
    dataRange.setFontFamily("Arial");
    if (nextRow % 2 === 0) {
      dataRange.setBackground("#f8fafc");
    }

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": nextRow, "message": "Lead saved successfully" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      "status": "online",
      "service": "RPPL Transformers Exhibition Form Webhook",
      "instructions": "Send POST requests with JSON payload containing visitor inquiry details."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

