const express = require('express');
const cors = require('cors');
const axios = require('axios');
const os = require('os');

const app = express();
app.use(cors());

app.get('/', async (req, res) => {
  const target = req.query.target;
  if (!target) return res.status(400).send('Missing target');

  try {
    const response = await axios.get(target, {
      headers: req.headers
    });
    res.set(response.headers);
    res.status(response.status).send(response.data);
  } catch (e) {
    res.status(500).send(e.message || 'Proxy error');
  }
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const port = 10010;
const ip = getLocalIP();

app.listen(port, () => {
  console.log(`Proxy server listening on:`);
  console.log(`→ Local:   http://localhost:${port}`);
  console.log(`→ Network: http://${ip}:${port}`);
});
