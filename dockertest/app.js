// Simple Express web application for nmap scanning
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

// API endpoint to run port scan
app.post('/port-scan', (req, res) => {
  const ipAddress = req.body.ipAddress;
  
  // Basic IP validation
  const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (!ipRegex.test(ipAddress)) {
    return res.status(400).json({ error: 'Invalid IP address format' });
  }
  
  // Execute port scan command
  const portScanCommand = `nmap --open ${ipAddress}`;
  console.log(`Running port scan: ${portScanCommand}`);
  
  exec(portScanCommand, { maxBuffer: 1024 * 1024 }, (portScanError, portScanStdout, portScanStderr) => {
    if (portScanError) {
      console.error(`Port scan error: ${portScanError}`);
      return res.status(500).json({ error: 'Port scan failed', details: portScanStderr });
    }
    
    // Parse the result to check for open ports
    const openPortsRegex = /(\d+)\/tcp\s+open\s+([^\n]*)/g;
    let match;
    const openPorts = [];
    while ((match = openPortsRegex.exec(portScanStdout)) !== null) {
      openPorts.push({
        port: match[1],
        service: match[2].trim() || 'unknown'
      });
    }
    
    // Return port scan results immediately
    res.json({
      openPorts: openPorts,
      openPortsCount: openPorts.length,
      rawOutput: portScanStdout,
      command: portScanCommand
    });
  });
});

// API endpoint to run OS detection
app.post('/os-detection', (req, res) => {
  const ipAddress = req.body.ipAddress;
  
  // Basic IP validation
  const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (!ipRegex.test(ipAddress)) {
    return res.status(400).json({ error: 'Invalid IP address format' });
  }
  
  // Execute OS detection command
  const osDetectionCommand = `nmap -A -T4 ${ipAddress}`;
  console.log(`Running OS detection: ${osDetectionCommand}`);
  
  exec(osDetectionCommand, { maxBuffer: 1024 * 1024 }, (osError, osStdout, osStderr) => {
    if (osError) {
      console.error(`OS detection error: ${osError}`);
      return res.status(500).json({ error: 'OS detection failed', details: osStderr });
    }
    
    // Extract OS detection details
    const osMatch = osStdout.match(/OS details: ([^\n]*)/);
    const osDetails = osMatch ? osMatch[1] : "Unknown";
    
    // Extract service versions
    const serviceVersions = {};
    const serviceVersionRegex = /(\d+)\/tcp\s+open\s+([^\s]+)\s+([^\n]*)/g;
    let serviceMatch;
    while ((serviceMatch = serviceVersionRegex.exec(osStdout)) !== null) {
      serviceVersions[serviceMatch[1]] = {
        service: serviceMatch[2],
        version: serviceMatch[3].trim()
      };
    }
    
    // Return OS detection results
    res.json({
      os: osDetails,
      serviceVersions: serviceVersions,
      rawOutput: osStdout,
      command: osDetectionCommand
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});