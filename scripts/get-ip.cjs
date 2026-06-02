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
        
        if (lowerName.includes('virtual') || lowerName.includes('vmware') || lowerName.includes('hamachi') || lowerName.includes('wsl') || lowerName.includes('vbox')) {
            currentPriority = 2;
        } else if (lowerName.includes('wi-fi') || lowerName.includes('wireless')) {
            currentPriority = 4;
        } else {
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

console.log(getLocalIP());
