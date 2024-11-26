from googleapiclient.discovery import build
from google.oauth2 import service_account
from datetime import datetime
import config 

#SERVICE_ACCOUNT_FILE = '/home/binal/Downloads/test-choreo-fe63423e6d06.json'
#SPREADSHEET_ID = '1h_scq5Y5DWWqhlfUVmEjFOritg5QK0flcqEGvN4DBnQ'

def write_datetime_to_sheet():
    credentials = service_account.Credentials.from_service_account_file(
        config.SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    service = build('sheets', 'v4', credentials=credentials)
    sheet = service.spreadsheets()

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    values = [[now]]
    body = {'values': values}

    result = sheet.values().append(
        spreadsheetId=config.SPREADSHEET_ID,
        range='Sheet1!A:A',
        valueInputOption='RAW',
        insertDataOption='INSERT_ROWS',
        body=body
    ).execute()

    print(f"Appended {result.get('updates').get('updatedCells')} cell(s) with date and time: {now}")

if __name__ == "__main__":
    write_datetime_to_sheet()
