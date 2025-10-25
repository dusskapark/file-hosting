# MSI File Hosting Server

Temporary server for hosting 250MB MSI files with HTTPS for MS Store verification.

## Requirements Met

- ✅ HTTPS (via ngrok)
- ✅ `/1.1.0/file.msi` path structure
- ✅ Port 443 (automatic via ngrok)
- ✅ No redirects
- ✅ Public download access
- ✅ 250MB large file support
- ✅ Completely free

## Quick Start

### 1️⃣ Navigate to Directory (direnv auto-load)
```bash
cd ~/Sites/msi-file-hosting
# direnv automatically activates Node.js v22.21.0
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Place MSI File
```bash
# Copy your file to the 1.1.0 folder
cp /path/to/your/installer.msi ./1.1.0/file.msi
```

### 4️⃣ Start Server with ngrok (One Command!)
```bash
npm start
```

That's it! The server will automatically:
- ✅ Start Express server on port 8080
- ✅ Start ngrok tunnel with HTTPS
- ✅ Display your public URL in the console

**Example Output:**
```
╔═══════════════════════════════════════════════════════╗
║   🌐 Public URL (HTTPS)                               ║
╚═══════════════════════════════════════════════════════╝

Public URL: https://xxxx.ngrok-free.app
MSI Download: https://xxxx.ngrok-free.app/1.1.0/KleverDesktop-1.1.0.msi
```

### Optional: Run Without ngrok
```bash
USE_NGROK=false npm start
```

## Tech Stack

- **Node.js** v22.21.0 (managed by NVM)
- **direnv** - Auto environment loading
- **Express** v4.19.2 - Web framework
- **Compression** v1.7.4 - Gzip compression
- **@ngrok/ngrok** v1.4.1 - Integrated HTTPS tunneling

## direnv Setup

The project includes `.envrc` file that automatically:
- Activates Node.js version (v22.21.0)
- Sets environment variables (PORT=8080)
- Adds node_modules/.bin to PATH

**First time use:**
```bash
direnv allow
```

## Directory Structure

```
msi-file-hosting/
├── .envrc              # direnv config
├── .nvmrc              # Node version (v22.21.0)
├── package.json        # NPM config
├── server.js           # Express server
├── README.md           # This file
├── .gitignore          # Git ignore rules
└── 1.1.0/              # File directory
    └── file.msi        # Place your MSI file here
```

## Useful Commands

### NVM Related:
```bash
# Check current Node version
nvm current

# Switch to project version
nvm use
```

### Server Related:
```bash
# Development mode (watch file changes)
npm run dev

# Health check
curl http://localhost:8080/health
```

### Debugging:
```bash
# Kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

## ngrok Notes

### Integrated ngrok:
- 🚀 Automatically starts with `npm start`
- 🔗 No separate terminal needed
- 📋 URL displayed in console automatically
- ⚙️ Optional: Set `NGROK_AUTHTOKEN` env var for authenticated sessions

### Free Plan:
- ⏱️ Session: 8 hours (can restart)
- 🔗 URL: Changes on restart (use authtoken for static domains)
- 📊 Bandwidth/File size: Unlimited
- ⚠️ Warning page on first visit (click "Visit Site")

### Optional: ngrok Authentication (for static URLs)
```bash
# Get free authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
export NGROK_AUTHTOKEN="your_token_here"
npm start
```

### Alternative Tunneling Services:
- **localtunnel**: `npx localtunnel --port 8080`
- **Cloudflare Tunnel**: `cloudflared tunnel`
- **Tailscale Funnel**: `tailscale funnel`

## Troubleshooting

### direnv not found:
```bash
brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
source ~/.zshrc
```

### Port 8080 already in use:
```bash
lsof -ti:8080 | xargs kill -9
```

### Node version mismatch:
```bash
nvm install
nvm use
```

### ngrok connection issues:
1. ✅ Check local server: `curl http://localhost:8080/health`
2. ✅ Check console output: ngrok URL should be displayed
3. ✅ Run without ngrok to test: `USE_NGROK=false npm start`
4. ✅ Check firewall settings

### MS Store upload failures:
- Verify file path accuracy: `/1.1.0/file.msi`
- Ensure HTTPS is used (HTTP will be rejected)
- Verify no redirects occur
- Test file accessibility: Direct download in browser

## Production Alternatives (For Repeated Use)

| Service | Price | Capacity | Suitability |
|---------|-------|----------|-------------|
| **GitHub Releases** | Free | 2GB | ⭐⭐⭐⭐ |
| **Cloudflare R2** | Free | 10GB | ⭐⭐⭐⭐⭐ |
| **DigitalOcean Spaces** | $5/mo | 250GB | ⭐⭐⭐⭐ |

## License

MIT - Use freely!
