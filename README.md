# LinkLens

AI-powered Chrome extension that evaluates LinkedIn connection relevance. Open it on any LinkedIn profile and get an instant **KEEP** or **REMOVE** verdict — powered by Claude or OpenAI.

---

## Features

- One-click verdict: **KEEP / REMOVE** for connections, **ACCEPT / DECLINE** for invitations
- Supports Claude (`claude-sonnet-4-20250514`) and OpenAI (`gpt-4o-mini`)
- Fully local — your API key is stored only in `chrome.storage.local`
- No data stored or sent anywhere except your chosen AI provider
- Customisable: describe yourself and set your own filter criteria
- Dark, minimal UI with monospace verdict display

---

## Setup

### 1. Clone the repo
```sh
git clone https://github.com/AnitaKamani/linklens.git
cd linklens
```

### 2. Load in Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select this folder
4. The LinkLens icon appears in your toolbar

### 3. Get an API key

**Claude (Anthropic)**
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Go to **Billing** → add a payment method
3. Go to **API Keys** → **Create Key**
4. Note: this is separate from a claude.ai subscription

**OpenAI**
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to **Billing** → add credits ($5 minimum)
3. Go to **API Keys** → **Create new secret key**

> Both are pay-as-you-go. Each profile scan costs ~$0.003–0.005, so $5 covers roughly 1,000 scans.

### 4. Configure
Click the LinkLens icon → ⚙ Settings → enter your API key, your profile summary, and your filter criteria → **Save**.

---

## Usage

1. Navigate to any LinkedIn profile page
2. Click the **LinkLens** extension icon
3. Hit **SCAN**
4. Read the verdict

The extension reads only the profile data visible on your screen. It takes no action on LinkedIn.

---

## Settings

| Setting | Description |
|---|---|
| **API Provider** | Claude or OpenAI |
| **API Key** | Your key — stored locally, never logged |
| **My Profile** | Who you are, your role, interests, goals |
| **Filter Criteria** | What makes a connection worth keeping |

---

## Development

No build step, no dependencies — just edit files and reload.

```
linklens/
├── manifest.json       Chrome MV3 config
├── popup.html          Extension popup UI
├── popup.js            Popup logic + API calls
├── scripts/
│   └── content.js      LinkedIn DOM extraction
├── icons/              16 / 48 / 128 px PNGs
├── LICENSE
└── README.md
```

**After code changes:** go to `chrome://extensions` → click the refresh icon on the LinkLens card.

**Debug popup:** right-click the popup → **Inspect**

**Debug content script:** open DevTools (F12) on the LinkedIn page → Console tab

---

## Tech Stack

- Chrome Extension, Manifest V3
- Vanilla HTML / CSS / JS — zero dependencies
- [Anthropic API](https://docs.anthropic.com) · [OpenAI API](https://platform.openai.com/docs)

---

## Privacy

- No backend, no analytics, no data collection
- API key lives in `chrome.storage.local` on your machine only
- Profile data is sent only to your chosen AI provider for a single inference call and is not stored

---

## License

MIT
