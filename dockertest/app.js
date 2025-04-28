// Simple Express web application for network scanning
const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');

// Initialize express app
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
  // Get IPs from arp cache using arp -a command
  const arpCommand = `arp -a`;
  console.log(`Running ARP discovery: ${arpCommand}`);
  
  exec(arpCommand, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`ARP discovery error: ${error}`);
      return res.status(500).json({ error: 'ARP discovery failed', details: stderr });
    }
    
    // Parse the result to extract IP addresses from arp output
    // The regex pattern matches IP addresses in the arp -a output
    const ipRegex = /\(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\)/g;
    let match;
    const hosts = [];
    const pendingScans = [];
    const ipAddresses = new Set(); // Use Set to avoid duplicate IPs
    
    // Extract all IP addresses
    while ((match = ipRegex.exec(stdout)) !== null) {
      ipAddresses.add(match[1]);
    }
    
    console.log(`Found ${ipAddresses.size} unique IP addresses in ARP cache`);
    
    // Create host data structure for each unique IP
    ipAddresses.forEach(ipAddress => {
      const hostData = {
        ip: ipAddress,
        hostname: null,
        status: 'Pending scan',
        os: 'Unknown',
        openPorts: [],
        osDetectionOutput: '',
        portScanOutput: ''
      };
      
      hosts.push(hostData);
    });
    
    // Send initial host list immediately
    res.json({
      hostDiscovery: {
        hosts: hosts,
        hostCount: hosts.length,
        rawOutput: stdout,
        command: arpCommand
      }
    });
  });
});

// Get current scan status
app.get('/scan-status', (req, res) => {
  // First, check if we need to start scanning hosts
  const checkHostsCommand = `cat /tmp/arp_hosts_scanned 2>/dev/null || echo "0"`;
  
  exec(checkHostsCommand, (checkError, checkOutput) => {
    const hostsScanned = parseInt(checkOutput.trim());
    
    // If no hosts have been scanned yet, get the list and start scanning
    if (hostsScanned === 0) {
      exec('arp -a', (arpError, arpStdout) => {
        if (arpError) {
          return res.json({
            scanInProgress: false,
            error: 'Failed to get ARP table'
          });
        }
        
        // Parse IPs from ARP output
        const ipRegex = /\(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\)/g;
        const ipAddresses = new Set();
        let match;
        
        while ((match = ipRegex.exec(arpStdout)) !== null) {
          ipAddresses.add(match[1]);
        }
        
        const ipList = Array.from(ipAddresses);
        
        // Save IP list to a temporary file for tracking
        exec(`echo '${JSON.stringify(ipList)}' > /tmp/arp_hosts_list`, () => {
          // Start scanning the first IP
          if (ipList.length > 0) {
            const scanCommand = `nmap --open ${ipList[0]} > /tmp/scan_${ipList[0]}.txt 2>&1 &`;
            exec(scanCommand);
            exec('echo "1" > /tmp/arp_hosts_scanned');
            
            return res.json({
              scanInProgress: true,
              totalHosts: ipList.length,
              hostsScanned: 1,
              currentScan: ipList[0]
            });
          } else {
            return res.json({
              scanInProgress: false,
              totalHosts: 0
            });
          }
        });
      });
    } else {
      // Get the list of IPs
      exec('cat /tmp/arp_hosts_list', (listError, listOutput) => {
        if (listError) {
          return res.json({
            scanInProgress: false,
            error: 'Failed to read host list'
          });
        }
        
        try {
          const ipList = JSON.parse(listOutput);
          const totalHosts = ipList.length;
          
          // Check if current scan is still running
          const psCommand = `ps aux | grep "nmap -A" | grep -v grep`;
          
          exec(psCommand, (psError, psOutput) => {
            const scanRunning = psOutput.trim() !== '';
            
            if (scanRunning) {
              // A scan is currently running
              return res.json({
                scanInProgress: true,
                totalHosts: totalHosts,
                hostsScanned: hostsScanned,
                currentScan: ipList[hostsScanned-1]
              });
            } else {
              // Current scan finished, check if we need to start the next one
              if (hostsScanned < totalHosts) {
                // Start the next scan
                const nextIP = ipList[hostsScanned];
                const scanCommand = `nmap -A -T4 ${nextIP} > /tmp/scan_${nextIP}.txt 2>&1 &`;
                exec(scanCommand);
                exec(`echo "${hostsScanned+1}" > /tmp/arp_hosts_scanned`);
                
                return res.json({
                  scanInProgress: true,
                  totalHosts: totalHosts,
                  hostsScanned: hostsScanned+1,
                  currentScan: nextIP
                });
              } else {
                // All scans complete
                return res.json({
                  scanInProgress: false,
                  totalHosts: totalHosts,
                  hostsScanned: hostsScanned,
                  complete: true
                });
              }
            }
          });
        } catch (e) {
          return res.json({
            scanInProgress: false,
            error: 'Failed to parse host list'
          });
        }
      });
    }
  });
});

// API endpoint to get scan results
app.get('/scan-results', (req, res) => {
  // First get the list of IPs
  exec('cat /tmp/arp_hosts_list 2>/dev/null || echo "[]"', (listError, listOutput) => {
    if (listError) {
      return res.status(500).json({ error: 'Failed to read host list' });
    }
    
    try {
      const ipList = JSON.parse(listOutput);
      const hosts = [];
      
      // Get the original ARP output for hostname info
      exec('arp -a', (arpError, arpStdout) => {
        const arpEntries = arpStdout.split('\n');
        const hostnameMap = {};
        
        // Extract hostname info from ARP output
        arpEntries.forEach(entry => {
          const match = entry.match(/([^\s]+) \(([0-9.]+)\)/);
          if (match) {
            const hostname = match[1];
            const ip = match[2];
            hostnameMap[ip] = hostname;
          }
        });
        
        // Process each IP and read its scan results
        const readPromises = ipList.map(ip => {
          return new Promise(resolve => {
            const scanFile = `/tmp/scan_${ip}.txt`;
            
            // Check if the scan file exists
            exec(`test -f ${scanFile} && cat ${scanFile} || echo "Scan not completed"`, (scanError, scanOutput) => {
              const hostData = {
                ip: ip,
                hostname: hostnameMap[ip] || null,
                status: scanOutput === "Scan not completed" ? 'Pending' : 'Complete',
                os: 'Unknown',
                openPorts: [],
                osDetectionOutput: '',
                portScanOutput: scanOutput
              };
              
              if (hostData.status === 'Complete') {
                // Extract OS information
                const osMatch = scanOutput.match(/OS details: ([^\n]*)/);
                hostData.os = osMatch ? osMatch[1] : 'Unknown';
                
                // Extract open ports
                const portRegex = /(\d+)\/tcp\s+open\s+([^\n]*)/g;
                let portMatch;
                while ((portMatch = portRegex.exec(scanOutput)) !== null) {
                  hostData.openPorts.push({
                    port: portMatch[1],
                    service: portMatch[2].trim()
                  });
                }
                
                hostData.osDetectionOutput = scanOutput;
              }
              
              hosts.push(hostData);
              resolve();
            });
          });
        });
        
        // When all scans are processed, return the results
        Promise.all(readPromises).then(() => {
          res.json({
            hosts: hosts,
            hostCount: hosts.length
          });
        });
      });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse host list' });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});