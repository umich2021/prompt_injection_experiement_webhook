// backend server for logging prompts + simple dashboard
// use on Render: it will detect Node automatically
// folder structure:
//   server.js
//   logs.json (auto-created if missing)
//   package.json

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const LOG_FILE = path.join(__dirname, 'logs.json');

if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '[]');

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// webhook endpoint
app.post('/log', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).send('missing prompt');

  const logs = JSON.parse(fs.readFileSync(LOG_FILE));
  logs.push({ prompt, ts: Date.now() });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

  res.send('ok');
});

// dashboard
app.get('/dashboard', (req, res) => {
  const logs = JSON.parse(fs.readFileSync(LOG_FILE));
  const rows = logs
    .map(l => `<tr><td>${new Date(l.ts).toISOString()}</td><td>${l.prompt}</td></tr>`)
    .join('');

  const html = `
  <html>
  <head>
    <title>Prompt Logs Dashboard</title>
    <style>
      body { font-family: sans-serif; padding: 2rem; }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #ccc; padding: 8px; }
    </style>
  </head>
  <body>
    <h1>Prompt Logs</h1>
    <table>
      <tr><th>Timestamp</th><th>Prompt</th></tr>
      ${rows}
    </table>
  </body>
  </html>`;

  res.send(html);
});

// root
app.get('/', (req, res) => {
  res.send('webhook running');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`server on ${port}`));
