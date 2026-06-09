# AvivaVirtual Website

**Live URL:** https://avivavirtual.com  
**Stack:** Pure HTML/CSS/JS — no build tools needed  
**Hosting:** GitHub Pages + Ionos custom domain

---


## Files in This Repo

| File | Purpose |
|------|---------|
| `index.html` | Main website (all-in-one) |
| `404.html` | Custom 404 error page |
| `CNAME` | Tells GitHub Pages to use avivavirtual.com |

---

## Deployment Steps

### Step 1 — Create GitHub Account
Go to https://github.com and sign up (free).

### Step 2 — Create a New Repository
1. Click the **+** icon → **New repository**
2. Name it exactly: `avivavirtual.github.io`
3. Set to **Public**
4. Do NOT initialize with README (upload files directly)
5. Click **Create repository**

### Step 3 — Upload Your Files
1. In the new empty repo, click **uploading an existing file**
2. Drag and drop all 3 files: `index.html`, `404.html`, `CNAME`
3. Scroll down, click **Commit changes**

### Step 4 — Enable GitHub Pages
1. Go to your repo → **Settings** tab
2. Scroll to **Pages** in the left sidebar
3. Under **Source** → Select **Deploy from a branch**
4. Branch: **main** | Folder: **/ (root)**
5. Click **Save**
6. GitHub will show: *"Your site is ready to be published at https://avivavirtual.github.io"*

### Step 5 — Add Custom Domain in GitHub
1. Still in **Settings → Pages**
2. Under **Custom domain**, type: `avivavirtual.com`
3. Click **Save**
4. Check **Enforce HTTPS** (after DNS propagates — may take up to 24 hrs)

---

## Ionos DNS Configuration

Log in to https://www.ionos.com → **Domains & SSL** → Click **avivavirtual.com** → **DNS**

### A Records (point root domain to GitHub)
Delete any existing A records for `@`, then add these 4:

| Type | Host | Points To | TTL |
|------|------|-----------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |

### CNAME Record (www subdomain)

| Type | Host | Points To | TTL |
|------|------|-----------|-----|
| CNAME | www | avivavirtual.github.io | 3600 |

> **Note:** Some Ionos plans only allow one A record. If that's the case, use just the first IP (185.199.108.153) or contact Ionos support to enable multiple A records.

### After Adding DNS Records
- DNS propagation takes **15 minutes to 24 hours**
- Check status at: https://dnschecker.org/#A/avivavirtual.com
- Once propagated, GitHub Pages will automatically issue your SSL certificate
- Your site will be live at https://avivavirtual.com

---

## Updating the Website

Whenever you want to update content:
1. Edit `index.html` on your computer
2. Go to your GitHub repo
3. Click `index.html` → click the **pencil (edit)** icon
4. Paste the updated code → **Commit changes**
5. GitHub automatically redeploys in ~60 seconds

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Site shows "404" after deploy | Wait 5 min, check Settings → Pages is enabled |
| Domain not working | Check DNS propagation at dnschecker.org |
| HTTPS not working | Wait 24 hrs after DNS propagates, then check "Enforce HTTPS" in GitHub Pages settings |
| www not redirecting | Make sure CNAME record points to `avivavirtual.github.io` (not `.com`) |
| Ionos won't let multiple A records | Use only `185.199.108.153` or upgrade Ionos plan |

---

## Support
Email: hello@avivavirtual.com
