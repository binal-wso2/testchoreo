const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Google Sheets configuration
const SERVICE_ACCOUNT_FILE = process.env.SERVICE_ACCOUNT_FILE || '/Users/binal/Downloads/test-choreo-da53b1636109.json';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1yTncWRouFvhY4ISiBy6p6z5x7GfZF7YZ_D8nYRch05k';

// Validate configuration on startup
if (SPREADSHEET_ID === 'your-spreadsheet-id') {
    console.error('⚠️  WARNING: SPREADSHEET_ID is not set! Please set the environment variable or update the code.');
    console.error('   Example: export SPREADSHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"');
}

// Function to write data to Google Sheets
async function writeToGoogleSheet(data) {
    try {
        // Validate configuration
        if (SPREADSHEET_ID === 'your-spreadsheet-id') {
            throw new Error('SPREADSHEET_ID is not configured. Please set the environment variable.');
        }

        // Check if service account file exists
        if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
            throw new Error('Service account file not found. Please set SERVICE_ACCOUNT_FILE environment variable.');
        }

        console.log(`Using Spreadsheet ID: ${SPREADSHEET_ID}`);
        console.log(`Using Service Account File: ${SERVICE_ACCOUNT_FILE}`);

        // Load service account credentials
        //const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));

        // Authenticate with Google Sheets API
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_FILE,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Get current timestamp
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

        // Prepare data for the sheet (customize based on your form fields)
        const values = [[
            timestamp,
            data.name || '',
            data.email || '',
            data.company || '',
            data.phone || '',
            data.category || '',
            data.message || ''
        ]];
        console.log(`Writing data to Google Sheets: ${JSON.stringify(values)}`);
        
        // Append data to the sheet - specify exact starting column
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:Z', // Start from column A, row 1
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values },
        });

        console.log(`Successfully wrote ${response.data.updates.updatedCells} cells to Google Sheets`);
        return { success: true, message: 'Data saved successfully!' };

    } catch (error) {
        console.error('Error writing to Google Sheets:', error.message);
        return { success: false, message: 'Failed to save data: ' + error.message };
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit', async (req, res) => {
    try {
        const result = await writeToGoogleSheet(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Make sure to set environment variables:`);
    console.log(`- SERVICE_ACCOUNT_FILE: path to your Google service account JSON file`);
    console.log(`- SPREADSHEET_ID: your Google Sheets ID`);
});
