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

// API endpoint to run nmap scan
app.post('/scan', (req, res) => {
  const ipAddress = req.body.ipAddress;
  
  // Basic IP validation
  const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (!ipRegex.test(ipAddress)) {
    return res.status(400).json({ error: 'Invalid IP address format' });
  }
  
  // Execute nmap command - scan all ports
  const command = `nmap --open ${ipAddress}`;
  console.log(`Running command: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return res.status(500).json({ error: 'Scan failed', details: stderr });
    }
    
    // Parse the result to check for open ports
    const openPortsRegex = /(\d+)\/tcp\s+open/g;
    let match;
    const openPorts = [];
    while ((match = openPortsRegex.exec(stdout)) !== null) {
      openPorts.push(match[1]);
    }
    
    res.json({ 
      openPorts: openPorts,
      openPortsCount: openPorts.length,
      message: `Found ${openPorts.length} open port(s) on ${ipAddress}`,
      rawOutput: stdout,
      command: command
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});