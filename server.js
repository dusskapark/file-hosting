// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const readline = require('readline');
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

// Serve CSS from public directory
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

// API endpoint for files data
app.get('/api/files', (req, res) => {
  const availableFiles = getAvailableFiles();
  res.json({
    files: availableFiles,
    nodeVersion: process.version,
    port: PORT,
    hasNgrok: !!global.ngrokPublicUrl
  });
});

// Root route - Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files from root directory
app.use(express.static(__dirname, {
  setHeaders: (res, filepath) => {
    // Configure binary file download headers
    const binaryExtensions = ['.msi', '.exe', '.dmg', '.pkg', '.deb', '.rpm'];
    const isBinary = binaryExtensions.some(ext => filepath.endsWith(ext));
    
    if (isBinary) {
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
  const availableFiles = getAvailableFiles();
  res.status(404).json({ 
    error: 'File not found',
    path: req.url,
    availableEndpoints: availableFiles.length > 0 
      ? [...availableFiles, '/health']
      : ['/health', '(Add files to version directories like 1.1.0/)']
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

// Helper function to scan for available files recursively
function getAvailableFiles() {
  const files = [];
  
  // Directories to exclude from scanning
  const excludeDirs = ['node_modules', 'public', '.git', '.vscode', '.idea'];
  
  // Only include downloadable binary/installer files
  const downloadableExtensions = ['.msi', '.exe', '.dmg', '.pkg', '.deb', '.rpm', '.zip', '.tar.gz', '.appimage'];
  
  // Files to exclude (project meta files)
  const excludeFiles = ['package.json', 'package-lock.json', 'README.md', 'server.js', '.env', '.gitignore'];
  
  function scanDirectory(dirPath, relativePath = '') {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden files/folders and excluded directories
        if (entry.name.startsWith('.') || excludeDirs.includes(entry.name)) {
          continue;
        }
        
        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          scanDirectory(fullPath, relPath);
        } else if (entry.isFile()) {
          // Only include downloadable files and exclude project meta files
          const isDownloadable = downloadableExtensions.some(ext => entry.name.toLowerCase().endsWith(ext));
          const isExcluded = excludeFiles.includes(entry.name);
          
          // Include file if it's in a subdirectory and is downloadable, or skip if it's a root project file
          if (!isExcluded && (relativePath !== '' || isDownloadable)) {
            // Only add if it's a downloadable file
            if (isDownloadable) {
              files.push(`/${relPath}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }
  
  scanDirectory(__dirname);
  return files;
}

// Helper function to check if port is in use and handle it
function checkAndHandlePortConflict(port) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: Use Get-NetTCPConnection
      const command = `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error || !stdout.trim()) {
          // Port is free
          resolve(true);
          return;
        }
        
        const pid = stdout.trim();
        console.log(`\n⚠️  Port ${port} is already in use by process (PID: ${pid})`);
        
        // Ask user what to do
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question('Do you want to kill the process and continue? (y/N): ', (answer) => {
          rl.close();
          
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            console.log(`\n🔄 Killing process ${pid}...`);
            exec(`taskkill /PID ${pid} /F`, (killError) => {
              if (killError) {
                console.error(`❌ Failed to kill process: ${killError.message}`);
                reject(new Error('Failed to kill process'));
              } else {
                console.log('✅ Process killed successfully');
                // Wait a bit for the port to be released
                setTimeout(() => resolve(true), 1000);
              }
            });
          } else {
            console.log('\n❌ Server startup cancelled by user');
            reject(new Error('Port conflict - user chose not to kill process'));
          }
        });
      });
    } else {
      // macOS/Linux: Use lsof
      const command = `lsof -ti:${port}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error || !stdout.trim()) {
          // Port is free
          resolve(true);
          return;
        }
        
        const pid = stdout.trim();
        console.log(`\n⚠️  Port ${port} is already in use by process (PID: ${pid})`);
        
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question('Do you want to kill the process and continue? (y/N): ', (answer) => {
          rl.close();
          
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            console.log(`\n🔄 Killing process ${pid}...`);
            exec(`kill -9 ${pid}`, (killError) => {
              if (killError) {
                console.error(`❌ Failed to kill process: ${killError.message}`);
                reject(new Error('Failed to kill process'));
              } else {
                console.log('✅ Process killed successfully');
                setTimeout(() => resolve(true), 1000);
              }
            });
          } else {
            console.log('\n❌ Server startup cancelled by user');
            reject(new Error('Port conflict - user chose not to kill process'));
          }
        });
      });
    }
  });
}

// Start server with port conflict handling
async function startServer() {
  try {
    // Check for port conflict before starting
    await checkAndHandlePortConflict(PORT);
    
    app.listen(PORT, '0.0.0.0', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║   File Hosting Server Running                        ║
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
      global.ngrokPublicUrl = publicUrl; // Store for web UI
      const availableFiles = getAvailableFiles();
      
      console.log(`
╔═══════════════════════════════════════════════════════╗
║   🌐 Public URL (HTTPS)                               ║
╚═══════════════════════════════════════════════════════╝

Public URL: ${publicUrl}
`);

      if (availableFiles.length > 0) {
        console.log('📦 Available Files:');
        availableFiles.forEach(file => {
          console.log(`   ${publicUrl}${file}`);
        });
      } else {
        console.log('⚠️  No files found. Add files to version directories (e.g., 1.1.0/)');
      }

      console.log(`
✅ Server is ready!
⚠️  First-time visitors may see ngrok warning page (click "Visit Site")

Stop Server: Ctrl+C
      `);
    } catch (error) {
      console.error('\n❌ Failed to start ngrok:', error.message);
      const availableFiles = getAvailableFiles();
      
      console.log(`
⚠️  Ngrok failed, but server is still running locally.

Local URL: http://localhost:${PORT}
`);

      if (availableFiles.length > 0) {
        console.log('📦 Available Files:');
        availableFiles.forEach(file => {
          console.log(`   http://localhost:${PORT}${file}`);
        });
      }

      console.log(`
To disable ngrok: USE_NGROK=false npm start
      `);
    }
  } else {
    const availableFiles = getAvailableFiles();
    
    console.log(`
Local Mode (ngrok disabled)

Local URL: http://localhost:${PORT}
`);

    if (availableFiles.length > 0) {
      console.log('📦 Available Files:');
      availableFiles.forEach(file => {
        console.log(`   http://localhost:${PORT}${file}`);
      });
    } else {
      console.log('⚠️  No files found. Add files to version directories (e.g., 1.1.0/)');
    }

    console.log(`
To enable ngrok: npm start (or USE_NGROK=true npm start)
    `);
  }
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle server errors
app.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use`);
    console.log('Please close the other application or change the PORT in .env file');
  } else {
    console.error('\n❌ Server error:', error);
  }
  process.exit(1);
});

// Start the server
startServer();
