const express = require('express');
const compression = require('compression');
const path = require('path');
const ngrok = require('@ngrok/ngrok');

const app = express();
const PORT = process.env.PORT || 8080;
const USE_NGROK = process.env.USE_NGROK !== 'false'; // Enable ngrok by default

// Enable Gzip compression for large file transfer optimization
app.use(compression());

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.ip;
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${ip}`);
  next();
});

// Serve static files from root directory
app.use(express.static(__dirname, {
  setHeaders: (res, filepath) => {
    // Configure .msi file download headers
    if (filepath.endsWith('.msi')) {
      const filename = path.basename(filepath);
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
      res.set('X-Content-Type-Options', 'nosniff');
    }
    // Cache control (1 hour)
    res.set('Cache-Control', 'public, max-age=3600');
    // Allow CORS
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'File not found',
    path: req.url,
    availableEndpoints: [
      '/1.1.0/file.msi',
      '/health'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   MSI File Hosting Server Running                    ║
╚═══════════════════════════════════════════════════════╝

Local URL: http://localhost:${PORT}
Serving Directory: ${__dirname}
Node.js: ${process.version}
  `);

  if (USE_NGROK) {
    try {
      console.log('\nStarting ngrok tunnel...\n');
      
      // Start ngrok tunnel
      const listener = await ngrok.connect({
        addr: PORT,
        authtoken_from_env: true, // Optional: Use NGROK_AUTHTOKEN env var for auth
      });
      
      const publicUrl = listener.url();
      const msiUrl = `${publicUrl}/1.1.0/KleverDesktop-1.1.0.msi`;
      
      console.log(`
╔═══════════════════════════════════════════════════════╗
║   🌐 Public URL (HTTPS)                               ║
╚═══════════════════════════════════════════════════════╝

Public URL: ${publicUrl}
MSI Download: ${msiUrl}

✅ Server is ready!
⚠️  First-time visitors may see ngrok warning page (click "Visit Site")

Stop Server: Ctrl+C
      `);
    } catch (error) {
      console.error('\n❌ Failed to start ngrok:', error.message);
      console.log(`
⚠️  Ngrok failed, but server is still running locally.

Local URL: http://localhost:${PORT}
MSI File: http://localhost:${PORT}/1.1.0/KleverDesktop-1.1.0.msi

To disable ngrok: USE_NGROK=false npm start
      `);
    }
  } else {
    console.log(`
Local Mode (ngrok disabled)

Local URL: http://localhost:${PORT}
MSI File: http://localhost:${PORT}/1.1.0/KleverDesktop-1.1.0.msi

To enable ngrok: npm start (or USE_NGROK=true npm start)
    `);
  }
});
