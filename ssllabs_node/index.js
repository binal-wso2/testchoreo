// Import necessary modules
const { google } = require('googleapis');
const axios = require('axios');
const fs = require("fs");


// Google Sheets API setup
const sheets = google.sheets('v4');
const auth = new google.auth.GoogleAuth({
  keyFile: '/home/binal/Downloads/test-choreo-5d1a58ee88cc.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Google Sheets IDs
const INPUT_SHEET_ID = '1h_scq5Y5DWWqhlfUVmEjFOritg5QK0flcqEGvN4DBnQ';
const OUTPUT_SHEET_ID = '1cjzUi_mvNqPmHsXaZtwCyUOWljk2pYhRLw_Fsj3BiIg';
const INPUT_RANGE = 'Sheet1!A:A'; // Assuming domains are in column A
const OUTPUT_RANGE = 'Sheet1!A:D'; // Update results in columns A to D

// Function to read domains from Google Sheet
async function readDomains() {
  const client = await auth.getClient();
  const response = await sheets.spreadsheets.values.get({
    auth: client,
    spreadsheetId: INPUT_SHEET_ID,
    range: INPUT_RANGE,
  });
  return response.data.values.flat();
}

// Function to run SSLlabs scan and wait for status READY
async function runSslScan(domain) {
  const API_URL = `https://api.ssllabs.com/api/v3/analyze?host=${domain}`;
  try {
    let data;
    do {
      const response = await axios.get(API_URL);
      data = response.data;

      if (data.status !== 'READY') {
        console.log(`Domain ${domain} status: ${data.status}. Retrying in 30 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } while (data.status !== 'READY');
    console.log(`Scan in progress`);
    return data;
  } catch (error) {
    console.error(`Error scanning domain ${domain}:`, error.message);
    return { error: error.message };
  }
}

// Function to extract grades from endpoints
function extractGrades(domain, data) {
  if (data.endpoints) {
    return data.endpoints.map(endpoint => ({
      domain,
      ipAddress: endpoint.ipAddress || 'N/A',
      grade: endpoint.grade || 'N/A',
      statusMessage: endpoint.statusMessage || 'N/A',
    }));
  } else {
    return [{ domain, ipAddress: 'N/A', grade: 'N/A', statusMessage: 'No endpoints found' }];
  }
}

// Function to update Google Sheet with results
async function updateResults(results) {
  const client = await auth.getClient();
  const values = results.map(result => [result.domain, result.ipAddress, result.grade, result.statusMessage]);
  await sheets.spreadsheets.values.update({
    auth: client,
    spreadsheetId: OUTPUT_SHEET_ID,
    range: OUTPUT_RANGE,
    valueInputOption: 'RAW',
    resource: { values },
  });
}

// Main function
async function main() {

  // Example Usage
  const spreadsheetId = "1cjzUi_mvNqPmHsXaZtwCyUOWljk2pYhRLw_Fsj3BiIg";
  const sheetName = "Sheet1"; // Update with your sheet name
  const jsonData = [
    { Name: "Alice", Age: 25, Country: "USA" },
    { Name: "Bob", Age: 30, Country: "Canada" },
  ];
  console.log('Trying the test write Google Sheet...');

  writeToGoogleSheet(spreadsheetId, sheetName, jsonData);

  try {
    console.log('Reading domains from Google Sheet...');
    const domains = await readDomains();
    console.log(`Found ${domains.length} domains.`);

    const results = [];

    for (const domain of domains) {
      console.log(`Scanning domain: ${domain}`);
      const data = await runSslScan(domain);
      const grades = extractGrades(domain, data);
      results.push(...grades);
    }

    console.log('Updating results in Google Sheet...');
    await updateResults(results);
    console.log('Process completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}


async function writeToGoogleSheet(spreadsheetId, sheetName, jsonData) {
  const sheets = google.sheets({ version: "v4", auth });

  // Convert JSON array to a 2D array (Google Sheets format)
  const headers = Object.keys(jsonData[0]); // Extract column names
  const values = jsonData.map(obj => headers.map(key => obj[key])); // Extract values
  
  // Add headers to the first row
  const sheetData = [headers, ...values];

  const request = {
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    resource: {
      values: sheetData,
    },
  };

  try {
    await sheets.spreadsheets.values.update(request);
    console.log("✅ Data written to Google Sheets successfully!");
  } catch (error) {
    console.error("❌ Error writing to Google Sheets:", error);
  }
}






main();

