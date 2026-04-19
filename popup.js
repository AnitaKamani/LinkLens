'use strict';

// ── State ──────────────────────────────────────────────────────────────────

let currentProvider = 'claude';
let profileData = null;

// ── DOM refs ───────────────────────────────────────────────────────────────

const viewMain     = document.getElementById('view-main');
const viewSettings = document.getElementById('view-settings');

const profilePreview  = document.getElementById('profile-preview');
const previewName     = document.getElementById('preview-name');
const previewHeadline = document.getElementById('preview-headline');
const notLinkedin     = document.getElementById('not-linkedin');
const noSettings      = document.getElementById('no-settings');
const loadingBox      = document.getElementById('loading-box');
const errorBox        = document.getElementById('error-box');
const resultBox       = document.getElementById('result-box');
const verdictEl       = document.getElementById('verdict');
const reasonEl        = document.getElementById('reason');
const scanBtn         = document.getElementById('scan-btn');
const resetBtn        = document.getElementById('reset-btn');

const openSettingsBtn = document.getElementById('open-settings');
const backBtn         = document.getElementById('back-btn');
const providerBtns    = document.querySelectorAll('.provider-btn');
const apiKeyInput     = document.getElementById('api-key');
const toggleKeyBtn    = document.getElementById('toggle-key');
const myProfileInput  = document.getElementById('my-profile');
const filterInput     = document.getElementById('filter-criteria');
const saveBtn         = document.getElementById('save-btn');
const saveStatus      = document.getElementById('save-status');

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  const settings = await loadSettings();
  applySettingsToForm(settings);
  await checkPageAndRender(settings);
}

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(
      ['provider', 'apiKey', 'myProfile', 'filterCriteria'],
      resolve
    );
  });
}

function applySettingsToForm(s) {
  currentProvider = s.provider || 'claude';
  providerBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === currentProvider);
  });
  apiKeyInput.value      = s.apiKey        || '';
  myProfileInput.value   = s.myProfile     || '';
  filterInput.value      = s.filterCriteria || '';
}

async function checkPageAndRender(settings) {
  // Hide everything first
  profilePreview.style.display = 'none';
  notLinkedin.style.display    = 'none';
  noSettings.style.display     = 'none';
  scanBtn.style.display        = 'none';
  resultBox.style.display      = 'none';
  errorBox.style.display       = 'none';
  loadingBox.style.display     = 'none';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isLinkedIn = tab && tab.url && tab.url.includes('linkedin.com');

  if (!isLinkedIn) {
    notLinkedin.style.display = 'block';
    return;
  }

  if (!settings.apiKey) {
    noSettings.style.display = 'block';
    return;
  }

  // Try to get profile data from content script
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProfile' });
    if (response && response.name) {
      profileData = response;
      previewName.textContent     = response.name || '—';
      previewHeadline.textContent = response.headline || '';
      profilePreview.style.display = 'block';
    }
  } catch (_) {
    // Content script may not be injected yet (non-profile page) — that's fine
  }

  scanBtn.style.display = 'block';
}

// ── Navigation ─────────────────────────────────────────────────────────────

openSettingsBtn.addEventListener('click', () => {
  viewMain.classList.remove('active');
  viewSettings.classList.add('active');
});

backBtn.addEventListener('click', async () => {
  viewSettings.classList.remove('active');
  viewMain.classList.add('active');
  const settings = await loadSettings();
  await checkPageAndRender(settings);
});

// ── Settings interactions ──────────────────────────────────────────────────

providerBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentProvider = btn.dataset.provider;
    providerBtns.forEach(b => b.classList.toggle('active', b === btn));
  });
});

toggleKeyBtn.addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

saveBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    flashStatus('API key is required.', true);
    return;
  }

  await chrome.storage.local.set({
    provider:        currentProvider,
    apiKey:          key,
    myProfile:       myProfileInput.value.trim(),
    filterCriteria:  filterInput.value.trim(),
  });

  flashStatus('Saved ✓');
});

function flashStatus(msg, isError = false) {
  saveStatus.textContent  = msg;
  saveStatus.style.color  = isError ? 'var(--red)' : 'var(--green)';
  setTimeout(() => { saveStatus.textContent = ''; }, 2500);
}

// ── Scan ───────────────────────────────────────────────────────────────────

scanBtn.addEventListener('click', runScan);
resetBtn.addEventListener('click', async () => {
  resultBox.style.display = 'none';
  errorBox.style.display  = 'none';
  scanBtn.style.display   = 'block';
  if (profileData) profilePreview.style.display = 'block';
});

async function runScan() {
  const settings = await loadSettings();
  if (!settings.apiKey) {
    showError('No API key set. Open Settings to add one.');
    return;
  }

  // Fetch profile data if we don't have it yet
  if (!profileData) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProfile' });
      if (response && response.name) profileData = response;
    } catch (_) {}
  }

  if (!profileData || !profileData.name) {
    showError("Couldn't read profile data from this page. Make sure you're on a LinkedIn profile.");
    return;
  }

  setLoading(true);

  try {
    const result = await callAI(settings, profileData);
    setLoading(false);
    showResult(result);
  } catch (err) {
    setLoading(false);
    showError(err.message || 'Something went wrong. Check your API key and try again.');
  }
}

function setLoading(on) {
  loadingBox.style.display    = on ? 'flex'  : 'none';
  scanBtn.style.display       = on ? 'none'  : 'block';
  profilePreview.style.display = on ? 'none' : (profileData ? 'block' : 'none');
  scanBtn.disabled            = on;
}

function showResult({ verdict, reason }) {
  const v = verdict.toUpperCase();
  verdictEl.textContent = v;
  verdictEl.className   = 'verdict ' + v.toLowerCase();
  reasonEl.textContent  = reason || '';
  reasonEl.style.display = reason ? 'block' : 'none';

  profilePreview.style.display = 'none';
  scanBtn.style.display        = 'none';
  resultBox.style.display      = 'flex';
}

function showError(msg) {
  errorBox.textContent   = msg;
  errorBox.style.display = 'block';
  scanBtn.style.display  = 'block';
}

// ── AI call ────────────────────────────────────────────────────────────────

async function callAI(settings, profile) {
  const systemPrompt = buildSystemPrompt(settings);
  const userPrompt   = buildUserPrompt(profile);

  if (settings.provider === 'openai') {
    return callOpenAI(settings.apiKey, systemPrompt, userPrompt);
  } else {
    return callClaude(settings.apiKey, systemPrompt, userPrompt);
  }
}

function buildSystemPrompt(settings) {
  const myProfile  = settings.myProfile    || 'Not provided.';
  const criteria   = settings.filterCriteria || 'Keep people with professional overlap. Remove random or irrelevant connections.';
  const isInvitation = profileData && profileData.pageType === 'invitation';

  const verdictOptions = isInvitation
    ? 'ACCEPT or DECLINE'
    : 'KEEP or REMOVE';

  return `You are a professional LinkedIn connection evaluator.

MY PROFILE:
${myProfile}

MY FILTER CRITERIA:
${criteria}

Your job: Given a LinkedIn profile, decide whether I should ${verdictOptions} this connection.

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{"verdict":"${isInvitation ? 'ACCEPT' : 'KEEP'} or ${isInvitation ? 'DECLINE' : 'REMOVE'}","reason":"One sentence explanation (max 120 chars)."}

Be concise and decisive.`;
}

function buildUserPrompt(profile) {
  const parts = [`Name: ${profile.name || 'Unknown'}`];
  if (profile.headline)   parts.push(`Headline: ${profile.headline}`);
  if (profile.location)   parts.push(`Location: ${profile.location}`);
  if (profile.about)      parts.push(`About: ${profile.about}`);
  if (profile.experience) parts.push(`Experience:\n${profile.experience}`);
  if (profile.education)  parts.push(`Education:\n${profile.education}`);
  if (profile.skills)     parts.push(`Skills: ${profile.skills}`);
  if (profile.mutualConnections) parts.push(`Mutual connections: ${profile.mutualConnections}`);
  return parts.join('\n\n');
}

async function callClaude(apiKey, systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 200,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  return parseVerdict(text);
}

async function callOpenAI(apiKey, systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:      'gpt-4o',
      max_tokens: 200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseVerdict(text);
}

function parseVerdict(text) {
  try {
    // Strip markdown code fences if the model wrapped the JSON
    const clean = text.replace(/```(?:json)?/g, '').trim();
    const json  = JSON.parse(clean);
    const verdict = (json.verdict || '').toUpperCase();
    if (!['KEEP', 'REMOVE', 'ACCEPT', 'DECLINE'].includes(verdict)) {
      throw new Error('Unexpected verdict: ' + verdict);
    }
    return { verdict, reason: json.reason || '' };
  } catch (_) {
    throw new Error('Could not parse AI response. Try again.');
  }
}

// ── Boot ───────────────────────────────────────────────────────────────────

init();
