'use strict';

// ── Helpers ────────────────────────────────────────────────────────────────

function text(selector, root = document) {
  const el = root.querySelector(selector);
  return el ? el.innerText.trim() : '';
}

function textAll(selector, root = document) {
  return [...root.querySelectorAll(selector)]
    .map(el => el.innerText.trim())
    .filter(Boolean);
}

// ── Page type detection ────────────────────────────────────────────────────

function detectPageType() {
  const url = window.location.href;
  if (url.includes('/mynetwork/invitation-manager')) return 'invitation';
  if (url.includes('/in/'))  return 'profile';
  if (url.includes('/search/results/people')) return 'search';
  return 'other';
}

// ── Profile extraction ─────────────────────────────────────────────────────

function extractProfile() {
  const pageType = detectPageType();

  const name     = extractName();
  const headline = extractHeadline();
  const location = extractLocation();
  const about    = extractAbout();
  const experience = extractExperience();
  const education  = extractEducation();
  const skills     = extractSkills();
  const mutualConnections = extractMutualConnections();

  return { pageType, name, headline, location, about, experience, education, skills, mutualConnections };
}

function extractName() {
  // Profile page
  const selectors = [
    'h1.text-heading-xlarge',
    'h1[class*="inline"]',
    '.pv-text-details__left-panel h1',
    'h1',
  ];
  for (const sel of selectors) {
    const val = text(sel);
    if (val && val.length > 1 && val.length < 80) return val;
  }
  return '';
}

function extractHeadline() {
  const selectors = [
    '.text-body-medium.break-words',
    '[data-generated-suggestion-target] .text-body-medium',
    '.pv-text-details__left-panel .text-body-medium',
  ];
  for (const sel of selectors) {
    const val = text(sel);
    if (val && val.length > 2) return val;
  }
  return '';
}

function extractLocation() {
  const selectors = [
    '.pv-text-details__left-panel span.text-body-small:not(.visually-hidden)',
    '.text-body-small.inline.t-black--light.break-words',
  ];
  for (const sel of selectors) {
    const val = text(sel);
    if (val && val.length > 2 && !val.includes('connection')) return val;
  }
  return '';
}

function extractAbout() {
  const selectors = [
    '#about ~ .pvs-list__outer-container .visually-hidden',
    'section[data-section="summary"] .pv-shared-text-with-see-more',
    '.pv-about-section .pv-about__summary-text',
  ];
  for (const sel of selectors) {
    const val = text(sel);
    if (val && val.length > 20) return val.slice(0, 600);
  }

  // Fallback: find the About section by heading
  const headings = [...document.querySelectorAll('h2, .pvs-header__title')];
  for (const h of headings) {
    if (h.innerText.trim().toLowerCase() === 'about') {
      const section = h.closest('section');
      if (section) {
        const content = text('.visually-hidden', section) || section.innerText.replace('About', '').trim();
        if (content.length > 20) return content.slice(0, 600);
      }
    }
  }
  return '';
}

function extractExperience() {
  const items = [];

  // LinkedIn renders experience as list items in a section with id="experience"
  const expSection = document.querySelector('#experience')?.closest('section');
  if (expSection) {
    const entries = expSection.querySelectorAll('li.artdeco-list__item');
    for (const entry of [...entries].slice(0, 5)) {
      const title   = text('.t-bold span[aria-hidden]', entry) || text('.mr1.t-bold', entry);
      const company = text('.t-14.t-normal span[aria-hidden]', entry);
      const dates   = text('.t-14.t-normal.t-black--light span[aria-hidden]', entry);
      if (title || company) {
        items.push([title, company, dates].filter(Boolean).join(' · '));
      }
    }
  }

  if (items.length === 0) {
    // Generic fallback: grab visible experience text
    const expHeadings = [...document.querySelectorAll('h2, .pvs-header__title span[aria-hidden]')];
    for (const h of expHeadings) {
      if (h.innerText.trim().toLowerCase() === 'experience') {
        const section = h.closest('section');
        if (section) {
          const rawItems = textAll('li .t-bold span[aria-hidden]', section);
          return rawItems.slice(0, 6).join('\n');
        }
      }
    }
  }

  return items.join('\n');
}

function extractEducation() {
  const eduSection = document.querySelector('#education')?.closest('section');
  if (!eduSection) return '';

  const items = [];
  const entries = eduSection.querySelectorAll('li.artdeco-list__item');
  for (const entry of [...entries].slice(0, 4)) {
    const school = text('.t-bold span[aria-hidden]', entry);
    const degree = text('.t-14.t-normal span[aria-hidden]', entry);
    if (school) items.push([school, degree].filter(Boolean).join(' — '));
  }
  return items.join('\n');
}

function extractSkills() {
  const skillSection = document.querySelector('#skills')?.closest('section');
  if (!skillSection) return '';

  const skills = textAll('.t-bold span[aria-hidden]', skillSection).slice(0, 10);
  return skills.join(', ');
}

function extractMutualConnections() {
  const selectors = [
    '[data-test-shared-connections-count]',
    '.member-insights span',
    '.pv-member-badge__insigh span',
  ];
  for (const sel of selectors) {
    const val = text(sel);
    if (val && val.match(/\d/)) return val;
  }

  // Look for text containing "mutual connection"
  const all = [...document.querySelectorAll('span, a')];
  for (const el of all) {
    const t = el.innerText.trim();
    if (t.toLowerCase().includes('mutual connection') && t.length < 60) return t;
  }
  return '';
}

// ── Message listener ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'getProfile') {
    try {
      sendResponse(extractProfile());
    } catch (e) {
      sendResponse({ error: e.message });
    }
  }
  return true;
});
