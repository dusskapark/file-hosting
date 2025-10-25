# File Hosting Server Study Project

A study project for learning how to host and serve large files over HTTPS using Node.js and tunneling services.

## Features

- ✅ HTTPS support (via ngrok)
- ✅ Static file serving with custom headers
- ✅ Gzip compression for optimization
- ✅ Directory-based URL structure
- ✅ CORS enabled
- ✅ No redirects
- ✅ Public download access
- ✅ Large file support (tested with 250MB+)
- ✅ Completely free setup

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

### 3️⃣ Place Your Files
```bash
# Create version directories and add your files
mkdir -p 1.1.0
cp /path/to/your/file.exe ./1.1.0/
cp /path/to/your/file.dmg ./1.1.0/
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
File Download: https://xxxx.ngrok-free.app/1.1.0/your-file.exe
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

## Project Structure

```
msi-file-hosting/
├── .envrc              # direnv config (git ignored - contains secrets)
├── .envrc.example      # Template for environment setup
├── .nvmrc              # Node version (v22.21.0)
├── .gitignore          # Git ignore rules
├── package.json        # NPM config
├── server.js           # Express server
├── README.md           # This file
└── 1.1.0/              # Example version directory
    └── your-files      # Place your files here
```

## direnv Setup

The project includes `.envrc` file that automatically:
- Activates Node.js version (v22.21.0)
- Sets environment variables (PORT=8080, NGROK_AUTHTOKEN)
- Adds node_modules/.bin to PATH

**First time setup:**
```bash
# 1. Copy the example file
cp .envrc.example .envrc

# 2. Add your ngrok authtoken
# Get it from: https://dashboard.ngrok.com/get-started/your-authtoken
# Edit .envrc and replace "your_token_here" with your actual token

# 3. Allow direnv to load it
direnv allow
```

## File Serving Configuration

The server automatically sets appropriate headers for different file types:

### Binary Files (`.msi`, `.exe`, `.dmg`, `.pkg`)
- Content-Type: `application/octet-stream`
- Content-Disposition: `attachment` (triggers download)
- X-Content-Type-Options: `nosniff`

### All Files
- Cache-Control: `public, max-age=3600` (1 hour)
- Access-Control-Allow-Origin: `*` (CORS enabled)
- Gzip compression enabled

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
- ⚙️ Requires `NGROK_AUTHTOKEN` env var (free)

### Free Plan:
- ⏱️ Session: 8 hours (can restart)
- 🔗 URL: Changes on restart (use authtoken for static domains)
- 📊 Bandwidth/File size: Unlimited
- ⚠️ Warning page on first visit (click "Visit Site")

### Optional: ngrok Authentication Setup
```bash
# 1. Sign up for free: https://dashboard.ngrok.com/signup
# 2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
# 3. Add to .envrc:
export NGROK_AUTHTOKEN="your_token_here"

# 4. Reload environment
direnv allow

# 5. Start server
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
4. ✅ Verify NGROK_AUTHTOKEN is set: `echo $NGROK_AUTHTOKEN`
5. ✅ Check firewall settings

### ngrok authtoken error:
```
Error: Usage of ngrok requires a verified account and authtoken
```

**Solution:**
1. Get free authtoken from https://dashboard.ngrok.com/signup
2. Add to `.envrc`: `export NGROK_AUTHTOKEN="your_token"`
3. Run: `direnv allow`
4. Restart server

## Production Alternatives

For production use or repeated hosting needs:

| Service | Price | Capacity | Notes |
|---------|-------|----------|-------|
| **GitHub Releases** | Free | 2GB | Great for versioned releases |
| **Cloudflare R2** | Free | 10GB | S3-compatible, no egress fees |
| **DigitalOcean Spaces** | $5/mo | 250GB | Simple CDN integration |
| **AWS S3** | Pay-as-you-go | Unlimited | Industry standard |
| **Backblaze B2** | Free/Cheap | 10GB free | Very affordable storage |

## Learning Resources

This project demonstrates:

1. **Static File Serving**: Using Express.js static middleware
2. **Custom Headers**: Setting Content-Type, Cache-Control, CORS
3. **Compression**: Gzip middleware for performance
4. **HTTPS Tunneling**: Ngrok integration for local development
5. **Environment Management**: direnv and NVM
6. **Error Handling**: 404 and 500 error handlers
7. **Health Checks**: Basic monitoring endpoint
8. **Request Logging**: Custom logging middleware

## License

MIT - Use freely for learning and projects!

## Contributing

This is a study project. Feel free to fork and experiment!
