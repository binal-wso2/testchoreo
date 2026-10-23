# Security Dashboard

## Intro

This script is designed to streamline and automate several key organizational monitoring tasks for WSO2, focusing on the findings from Digital Shadows(DS) threat intel platform and findings from Tenable Vulnerability Management Platform. It utilizes Google Sheets and data from DS and Tenable platforms, performing specific tasks at defined intervals to ensure accurate and timely monitoring. The script helps identify the findings from DS and Tenable, and populate a Google sheet so that it can be utilized to vizualize the alert trends and the statuses. Below is a summary of its core functionalities:

### **Core Functionalities of the Script**

1. **Daily Tasks:**
   - **Analyse the findings from Digital Shadows and Tenable** and update two Google sheets with the details that are required for the dashboards.
   - **Collect AWS Security Hub CSPM findings** from multiple AWS accounts, replace the `Findings` tab and append a per-account row to the `Summary` tab for trend analysis.
   - **Calculate the phishing score** for the impersonating domain alerts and update the google sheet

## Setting up

Add following keys as Google App Script properties [^1]

* Tenable related
  * `TENABLE_ACCESSKEY`: Tenable access key
  * `TENABLE_SECRETKEY`: Tenable secret key
  * `TENABLE_EXPORTURL`: tenable API for exporting vulnerability findings
  * `TENABLE_ASSET_EXPORTURL`: tenable API for exporting asset data (used to look up asset tags), e.g. `https://cloud.tenable.com/assets/export/`


* DigitalShadows related
  * `DS_USERNAME`: DS username
  * `DS_PASSWORD`: DS password
  * `SEARCHLIGHT_ACCOUNT_ID`: DS account ID

* AWS Security Hub CSPM related (see [AWS Security Hub CSPM setup](#aws-security-hub-cspm-setup))
  * `AWS_CSPM_ACCESS_KEY_ID`: access key of the IAM user that assumes the reader roles
  * `AWS_CSPM_SECRET_ACCESS_KEY`: secret key of that IAM user
  * `AWS_CSPM_ACCOUNTS`: JSON array of accounts to collect from, e.g.
    ```json
    [{"accountId":"111122223333","accountName":"prod","roleArn":"arn:aws:iam::111122223333:role/SecurityHubFindingsReader","externalId":"<random-string>","regions":["us-east-1"]}]
    ```

* Inputs and outputs of the script:
  * `TENABLE_VULN_SHEET_ID` : Sheet ID for Tenable vulnerabilities
  * `DS_OUTPUTS_SHEET_ID` : Sheet ID for DS alerts
  * `IMPERSONATION_DOMAIN_ALERTS_SHEET_ID` : Sheet ID for impersonating domain alerts from DS 
  * `DOMAIN_DATA_SHEET_ID` : Sheet ID for WSO2 owned domain data for cross reference 
  * `AWS_CSPM_SHEET_ID` : Sheet ID for AWS Security Hub CSPM findings. The `Findings`, `Suppressed`, `Summary` and `LatestSummary` tabs are created if missing.



Once the above script properties are set, set triggers for `runUpdateStateofAlerts`, `runGetAlertDetails`, `getTenableVulnerabilityList`, `analysefordomainimpersonation`, `getAwsCspmFindings` to run daily.

## AWS Security Hub CSPM setup

The script uses one IAM user that assumes a read-only `SecurityHubFindingsReader` role in every account listed in `AWS_CSPM_ACCOUNTS`. The user can only call `sts:AssumeRole` on those roles, and each role can only call `securityhub:GetFindings` in its own account.

Follow the [AWS Security Hub CSPM IAM Setup Guide](AWS-CSPM-IAM-Setup-Guide.md) to create the role, the policies and the External ID, turn on consolidated control findings, and fill in `AWS_CSPM_ACCOUNTS`. It also covers verification, troubleshooting and adding accounts later.

Output tabs:
* `Findings`: current FAILED control findings (ACTIVE, not SUPPRESSED) for all accounts. Replaced on every run.
* `Suppressed`: current FAILED control findings whose workflow status is SUPPRESSED (accepted risks), same columns as `Findings`. Replaced on every run.
* `Summary`: one row per account per day: severity counts, `Total` (failed), `PassedChecks`, `TotalChecks` (passed + failed), `FailedPercentage` (failed / total checks) and `Suppressed` (count of suppressed failed findings). Suppressed findings are excluded from every other column, matching Security Hub's control status and security score. Re-running on the same day replaces that day's rows.
* `LatestSummary`: latest stats only, one row per account per severity (`Date`, `AccountName`, `AccountId`, `Severity`, `Count`). Replaced on every run. If an account fails to collect, its rows from the previous run are kept, so check `Date` for staleness.

Rotate the IAM user's access key regularly and restrict access to the script project and the output sheet. Both expose vulnerability data and the key.

## References
[^1]: https://developers.google.com/apps-script/guides/properties#add_script_properties
