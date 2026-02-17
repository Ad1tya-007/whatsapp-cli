# Deployment Guide - WhatsApp CLI

This guide explains how to deploy your WhatsApp CLI tool so anyone can install it globally with a simple command.

## 🚀 Deployment Options

### Option 1: Publish to npm (Recommended)

This allows users to install with: `npm install -g whatsapp-cli`

#### Step 1: Create npm Account

1. Go to https://www.npmjs.com/signup
2. Create a free account
3. Verify your email

#### Step 2: Login to npm

```bash
npm login
```

Enter your npm username, password, and email.

#### Step 3: Choose a Unique Package Name

The name `whatsapp-cli` might be taken. Check availability:

```bash
npm view whatsapp-cli
```

If taken, update `package.json` with a unique name like:
- `@your-username/whatsapp-cli`
- `wacli-tool`
- `whatsapp-terminal`

#### Step 4: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

#### Step 5: Test Locally

Before publishing, test the installation locally:

```bash
npm link
```

Now you can use `wacli` from anywhere. Test it:

```bash
wacli --help
wacli list
```

If it works, unlink:

```bash
npm unlink -g whatsapp-cli
```

#### Step 6: Publish to npm

```bash
npm publish
```

If using a scoped package (`@username/package`):

```bash
npm publish --access public
```

#### Step 7: Users Can Now Install

Anyone can now install your CLI globally:

```bash
npm install -g whatsapp-cli
```

Or with your custom name:

```bash
npm install -g @your-username/whatsapp-cli
```

---

### Option 2: Install from GitHub

Users can install directly from your GitHub repository without publishing to npm.

#### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `whatsapp-cli`
3. Don't initialize with README (we already have files)

#### Step 2: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit - WhatsApp CLI tool"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-cli.git

# Push
git push -u origin main
```

If you get an error about branch name, use:

```bash
git branch -M main
git push -u origin main
```

#### Step 3: Build Before Pushing

Make sure to build first:

```bash
npm run build
git add dist/
git commit -m "Add built files"
git push
```

#### Step 4: Users Can Install from GitHub

Anyone can now install directly from GitHub:

```bash
npm install -g git+https://github.com/YOUR_USERNAME/whatsapp-cli.git
```

Or using a specific branch/tag:

```bash
npm install -g git+https://github.com/YOUR_USERNAME/whatsapp-cli.git#main
```

---

### Option 3: Local Installation Script

Create an installation script users can run.

#### Create install.sh

```bash
#!/bin/bash

echo "Installing WhatsApp CLI..."

# Clone the repository
git clone https://github.com/YOUR_USERNAME/whatsapp-cli.git
cd whatsapp-cli

# Install dependencies
npm install

# Build
npm run build

# Install globally
npm link

echo "✅ Installation complete!"
echo "Run 'wacli --help' to get started"
```

Users run:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/whatsapp-cli/main/install.sh | bash
```

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] Code is tested and working
- [ ] `npm run build` completes successfully
- [ ] `dist/` folder contains compiled JavaScript
- [ ] `package.json` has correct name and version
- [ ] `README.md` is up to date
- [ ] `LICENSE` file exists
- [ ] `.gitignore` excludes `node_modules/` and `.wwebjs_auth/`
- [ ] All dependencies are in `package.json`

## 🔄 Updating Your Package

### Update Version

Follow semantic versioning (semver):
- `1.0.0` → `1.0.1` (bug fixes)
- `1.0.0` → `1.1.0` (new features)
- `1.0.0` → `2.0.0` (breaking changes)

Update version:

```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

### Publish Update

```bash
npm run build
npm publish
```

### Push to GitHub

```bash
git push
git push --tags
```

## 👥 User Installation Instructions

After deployment, users can install with:

### From npm:

```bash
npm install -g whatsapp-cli
```

### From GitHub:

```bash
npm install -g git+https://github.com/YOUR_USERNAME/whatsapp-cli.git
```

### Usage:

```bash
# First time - authenticate
wacli list

# Send message
wacli send -n 14165551234 -m "Hello!"

# Send to contact
wacli send -c "Mom" -m "Hi!"

# View help
wacli --help
```

## 🔧 Troubleshooting

### "Command not found: wacli"

The global npm bin directory might not be in PATH. Find it:

```bash
npm config get prefix
```

Add to PATH in `~/.bashrc` or `~/.zshrc`:

```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Permission Errors on Linux/Mac

Use `sudo`:

```bash
sudo npm install -g whatsapp-cli
```

Or fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Update Not Working

Uninstall and reinstall:

```bash
npm uninstall -g whatsapp-cli
npm install -g whatsapp-cli
```

## 📊 Package Statistics

After publishing to npm, you can track:

- Downloads: https://www.npmjs.com/package/whatsapp-cli
- GitHub stars and forks
- Issues and pull requests

## 🎯 Best Practices

1. **Version Control**: Always commit before publishing
2. **Testing**: Test with `npm link` before publishing
3. **Changelog**: Keep a CHANGELOG.md for version history
4. **Documentation**: Keep README.md updated
5. **Security**: Never commit `.wwebjs_auth/` or sensitive data
6. **Dependencies**: Keep dependencies updated

## 🌟 Making it Popular

1. Add badges to README.md:
   - npm version
   - downloads
   - license
   - build status

2. Create good documentation with examples

3. Share on:
   - Reddit (r/node, r/javascript)
   - Twitter
   - Dev.to
   - Product Hunt

4. Add topics to GitHub repository:
   - whatsapp
   - cli
   - nodejs
   - typescript

---

## Quick Start for Deployment

```bash
# 1. Build
npm run build

# 2. Test locally
npm link
wacli --help

# 3. Publish to npm
npm login
npm publish

# Done! Users can now install with:
# npm install -g whatsapp-cli
```

---

**Need help?** Check the troubleshooting section or open an issue on GitHub.
