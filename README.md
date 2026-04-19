# LinkLens

AI-powered Chrome extension that evaluates LinkedIn connection relevance. Open it on any LinkedIn profile and get an instant **KEEP** or **REMOVE** verdict — powered by Claude or OpenAI.

---

## Features

- One-click verdict: **KEEP / REMOVE** for connections, **ACCEPT / DECLINE** for invitations
- Supports Claude (`claude-sonnet-4-20250514`) and OpenAI (`gpt-4o`)
- Fully local — your API key is stored only in `chrome.storage.local`
- No data stored or sent anywhere except your chosen AI provider
- Customisable: describe yourself and set your own filter criteria
- Dark, minimal UI with monospace verdict display

## Setup

**1. Clone the repo**
```sh
git clone https://github.com/AnitaKamani/linklens.git
cd linklens
```

**2. Load in Chrome**
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder

**3. Configure**
Click the LinkLens icon → Settings gear → enter your API key, your profile summary, and your filter criteria.

## Usage

1. Navigate to any LinkedIn profile page
2. Click the **LinkLens** extension icon
3. Hit **SCAN**
4. Read the verdict

The extension reads only the profile data visible on your screen. It takes no action on LinkedIn.

## Settings

| Setting | Description |
|---|---|
| **API Provider** | Claude or OpenAI |
| **API Key** | Your key — stored locally, never logged |
| **My Profile** | Who you are, your role, interests, goals |
| **Filter Criteria** | What makes a connection worth keeping |

## Tech Stack

- Chrome Extension, Manifest V3
- Vanilla HTML / CSS / JS — zero dependencies
- Anthropic API · OpenAI API

## Privacy

- No backend, no analytics, no data collection
- API key lives in `chrome.storage.local` on your machine only
- Profile data is sent only to your chosen AI provider for a single inference call and is not stored

## License

MIT
