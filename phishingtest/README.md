# Web Form to Google Sheets Integration

This Node.js web application allows users to fill out a form and automatically saves the data to a Google Sheets document.

## Features

- Modern, responsive web form
- Real-time form validation
- Google Sheets integration
- Error handling and user feedback
- Mobile-friendly design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Google Sheets Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google Sheets API:**
   - In the Google Cloud Console, enable the Google Sheets API

3. **Create Service Account:**
   - Go to IAM & Admin > Service Accounts
   - Create a new service account
   - Download the JSON key file

4. **Share Google Sheet:**
   - Create a Google Sheet or use existing one
   - Share the sheet with the service account email (found in the JSON file)
   - Give "Editor" permissions

### 3. Environment Variables

Set the following environment variables:

```bash
export SERVICE_ACCOUNT_FILE="/path/to/your/service-account.json"
export SPREADSHEET_ID="your-google-sheet-id"
```

Or create a `.env` file:

```
SERVICE_ACCOUNT_FILE=/path/to/your/service-account.json
SPREADSHEET_ID=your-google-sheet-id
```

### 4. Google Sheet Structure

The application expects the following columns in your Google Sheet:
- Column A: Timestamp
- Column B: Full Name
- Column C: Email
- Column D: Company
- Column E: Phone
- Column F: Category
- Column G: Message

### 5. Run the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Customization

### Adding More Form Fields

1. **Update the HTML form** in `public/index.html`
2. **Modify the server logic** in `server.js` (updatethe `writeToGoogleSheet` function)
3. **Adjust the Google Sheets range** in the API call

### Styling

The CSS is embedded in the HTML file. You can:
- Extract it to a separate CSS file
- Use a CSS framework like Bootstrap or Tailwind
- Customize the existing styles

## Security Considerations

- Never commit your service account JSON file to version control
- Use environment variables for sensitive configuration
- Consider adding rate limiting for production use
- Validate and sanitize user inputs

## Troubleshooting

### Common Issues

1. **"Service account file not found"**
   - Check the SERVICE_ACCOUNT_FILE path
   - Ensure the file exists and is readable

2. **"Permission denied" errors**
   - Verify the Google Sheet is shared with the service account email
   - Check that the service account has "Editor" permissions

3. **"Spreadsheet not found"**
   - Verify the SPREADSHEET_ID is correct
   - Check that the sheet exists and is accessible

## Production Deployment

For production deployment, consider:
- Using a process manager like PM2
- Setting up proper logging
- Implementing SSL/HTTPS
- Adding input validation and rate limiting
- Using a database for backup/redundancy
