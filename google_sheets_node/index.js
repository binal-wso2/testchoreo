const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Define constants
const SERVICE_ACCOUNT_FILE = '/home/binal/Downloads/test-choreo-5d1a58ee88cc.json';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Function to write the current date and time to the Google Sheet
async function writeDatetimeToSheet() {
    try {
        // Load service account credentials
        const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));

        // Authenticate with the Google Sheets API
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Get the current date and time
        const now = new Date();
        const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);

        // Define the data to append
        const values = [[formattedDate]];
        const resource = { values };

        // Append data to the sheet
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:A',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values },
        });

        console.log(
            `Appended ${response.data.updates.updatedCells} cell(s) with date and time: ${formattedDate}`
        );
    } catch (error) {
        console.error('Error writing to the Google Sheet:', error.message);
    }
}

// Run the function
writeDatetimeToSheet();
