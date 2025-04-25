// Simple Express web application for network scanning
const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Main page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API endpoint to run automatic network scan
app.get('/auto-scan', (req, res) => {
  // Get local network range (assuming 192.168.1.0/24)
  const networkRange = '192.168.1.0/24';
  
  // Execute host discovery command
  const hostDiscoveryCommand = `nmap -sn ${networkRange}`;
  console.log(`Running host discovery: ${hostDiscoveryCommand}`);
  
  exec(hostDiscoveryCommand, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Host discovery error: ${error}`);
      return res.status(500).json({ error: 'Host discovery failed', details: stderr });
    }
    
    // Parse the result to extract discovered hosts
    const hostsRegex = /Nmap scan report for ([^\s]+)(?: \(([^\)]+)\))?/g;
    let match;
    const hosts = [];
    const pendingScans = [];
    
    // Extract all hosts
    while ((match = hostsRegex.exec(stdout)) !== null) {
      const ipAddress = match[2] || match[1];  // Use IP if available, otherwise use the hostname
      const hostname = match[2] ? match[1] : null;  // If we have both, the first match is hostname
      
      const hostData = {
        ip: ipAddress,
        hostname: hostname,
        status: 'Pending scan',
        os: 'Unknown',
        openPorts: [],
        osDetectionOutput: '',
        portScanOutput: ''
      };
      
      hosts.push(hostData);
      
      // Create promise for each host scan
      const scanPromise = new Promise((resolve) => {
        // Run OS and port detection command
        const scanCommand = `nmap -A -T4 ${ipAddress}`;
        console.log(`Running scan for ${ipAddress}: ${scanCommand}`);
        
        exec(scanCommand, { maxBuffer: 1024 * 1024 }, (scanError, scanStdout, scanStderr) => {
          if (scanError) {
            console.error(`Scan error for ${ipAddress}: ${scanError}`);
            hostData.status = 'Error';
            hostData.osDetectionOutput = scanStderr;
          } else {
            // Extract OS information
            const osMatch = scanStdout.match(/OS details: ([^\n]*)/);
            hostData.os = osMatch ? osMatch[1] : 'Unknown';
            
            // Extract open ports
            const portRegex = /(\d+)\/tcp\s+open\s+([^\n]*)/g;
            let portMatch;
            while ((portMatch = portRegex.exec(scanStdout)) !== null) {
              hostData.openPorts.push({
                port: portMatch[1],
                service: portMatch[2].trim()
              });
            }
            
            hostData.status = 'Complete';
            hostData.osDetectionOutput = scanStdout;
          }
          resolve();
        });
      });
      
      pendingScans.push(scanPromise);
    }
    
    // Send initial host list immediately
    res.json({
      hostDiscovery: {
        hosts: hosts,
        hostCount: hosts.length,
        rawOutput: stdout,
        command: hostDiscoveryCommand
      }
    });
  });
});

// Get current scan status
app.get('/scan-status', (req, res) => {
  // Get local network range
  const networkRange = '192.168.1.0/24';
  
  // Run a quick command to get the current scan status
  const statusCommand = `ps aux | grep nmap`;
  
  exec(statusCommand, (error, stdout, stderr) => {
    let scanInProgress = false;
    
    // Check if nmap is running excluding the grep process itself
    if (stdout.includes('nmap -A')) {
      scanInProgress = true;
    }
    
    res.json({
      scanInProgress: scanInProgress,
      networkRange: networkRange
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});