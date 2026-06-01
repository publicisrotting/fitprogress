const fs = require('fs');
const path = require('path');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let bestIP = '127.0.0.1';
  let priority = 0; // 0: loopback, 1: internal, 2: vm/virtual, 3: ethernet, 4: wifi

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        let currentPriority = 1;
        const lowerName = name.toLowerCase();
        
        // Lower priority for virtual adapters
        if (lowerName.includes('virtual') || lowerName.includes('vmware') || lowerName.includes('hamachi') || lowerName.includes('wsl') || lowerName.includes('vbox')) {
            currentPriority = 2;
        } 
        // Higher priority for Wi-Fi (usually what we want for mobile dev)
        else if (lowerName.includes('wi-fi') || lowerName.includes('wireless')) {
            currentPriority = 4;
        } 
        // Standard Ethernet
        else {
            currentPriority = 3;
        }

        if (currentPriority > priority) {
            priority = currentPriority;
            bestIP = iface.address;
        }
      }
    }
  }
  return bestIP;
}

const localIP = getLocalIP();
console.log(`Detected Local IP: ${localIP}`);

const filesToUpdate = [
  {
    path: path.join(__dirname, '../src/config.ts'),
    regex: /export const API_URL = 'http:\/\/[0-9\.]+:[0-9]+';/,
    replacement: `export const API_URL = 'http://${localIP}:5001';`
  },
  {
    path: path.join(__dirname, '../mobile/App.js'),
    regex: /const WEB_APP_URL = 'http:\/\/[0-9\.]+:[0-9]+';/,
    replacement: `const WEB_APP_URL = 'http://${localIP}:3002';`
  }
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file.path)) {
    let content = fs.readFileSync(file.path, 'utf8');
    
    // First try the strict regex
    if (file.regex.test(content)) {
        content = content.replace(file.regex, file.replacement);
        fs.writeFileSync(file.path, content, 'utf8');
        console.log(`Updated ${file.path}`);
    } else {
        // Fallback: try to match any IP structure with the correct port
        console.log(`Strict pattern not found in ${file.path}, trying generic replacement...`);
        const port = file.path.includes('config.ts') ? '5001' : '3002';
        // Match http://(any ip):port
        const genericRegex = new RegExp(`http:\/\/[0-9\.]+:(${port})`, 'g');
        
        if (genericRegex.test(content)) {
            content = content.replace(genericRegex, `http://${localIP}:${port}`);
            fs.writeFileSync(file.path, content, 'utf8');
            console.log(`Updated ${file.path} using generic port match.`);
        } else {
             console.log(`Could not find suitable string to replace in ${file.path}`);
        }
    }
  } else {
    console.error(`File not found: ${file.path}`);
  }
});
