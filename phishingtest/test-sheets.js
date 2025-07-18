const { google } = require('googleapis');
const fs = require('fs');

// Configuration - UPDATE THESE VALUES
const SERVICE_ACCOUNT_FILE = '/Users/binal/Downloads/test-choreo-da53b1636109.json';
const SPREADSHEET_ID = '1yTncWRouFvhY4ISiBy6p6z5x7GfZF7YZ_D8nYRch05k'; // Replace with your actual spreadsheet ID

async function testGoogleSheetsConnection() {
    try {
        console.log('🔍 Testing Google Sheets connection...');
        console.log(`Service Account File: ${SERVICE_ACCOUNT_FILE}`);
        console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);
        
        // Check if service account file exists
        if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
            throw new Error(`Service account file not found: ${SERVICE_ACCOUNT_FILE}`);
        }
        console.log('✅ Service account file found');

        // Authenticate with Google Sheets API
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_FILE,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Authentication successful');

        // Try to get spreadsheet metadata
        console.log('🔍 Checking if spreadsheet exists and is accessible...');
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID
        });
        
        console.log('✅ Spreadsheet found!');
        console.log(`   Title: ${metadata.data.properties.title}`);
        console.log(`   Sheets: ${metadata.data.sheets.map(s => s.properties.title).join(', ')}`);
        
        // Try to read some data
        console.log('🔍 Testing read access...');
        const readResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A1:G1'
        });
        console.log('✅ Read access successful');
        
        // Try to write test data
        console.log('🔍 Testing write access...');
        const testData = [['Test', 'Data', 'From', 'Node.js', new Date().toISOString()]];
        const writeResponse = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: testData }
        });
        
        console.log('✅ Write access successful!');
        console.log(`   Updated ${writeResponse.data.updates.updatedCells} cells`);
        console.log('');
        console.log('🎉 All tests passed! Your Google Sheets integration is working correctly.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting steps:');
        
        if (error.message.includes('not found')) {
            console.log('1. Check that your SPREADSHEET_ID is correct');
            console.log('   - Go to your Google Sheet');
            console.log('   - Copy the ID from the URL: https://docs.google.com/spreadsheets/d/YOUR_ID/edit');
            console.log('   - Update the SPREADSHEET_ID variable in this script');
            console.log('');
            console.log('2. Make sure the sheet is shared with your service account');
            console.log('   - Open your service account JSON file');
            console.log('   - Find the "client_email" field');
            console.log('   - Share your Google Sheet with that email address');
            console.log('   - Give it "Editor" permissions');
        }
        
        if (error.message.includes('Service account file')) {
            console.log('1. Check that your service account file path is correct');
            console.log('2. Make sure the file exists and is readable');
        }
        
        if (error.message.includes('permission')) {
            console.log('1. Make sure your Google Sheet is shared with the service account email');
            console.log('2. Check that the service account has "Editor" permissions');
        }
    }
}

// Instructions
console.log('📋 SETUP INSTRUCTIONS:');
console.log('1. Update SPREADSHEET_ID with your actual Google Sheets ID');
console.log('2. Make sure your service account file path is correct');
console.log('3. Ensure your Google Sheet is shared with the service account email');
console.log('');

testGoogleSheetsConnection();
