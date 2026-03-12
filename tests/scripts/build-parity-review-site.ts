/**
 * Build a read-only static Cloudflare Pages parity review site.
 *
 * Shows JS vs Python source code side-by-side for each story pair,
 * plus DOM diffs for parity failures.
 *
 * Output: tests/tmp/parity-review-site/
 * Deploy with:
 *   wrangler pages deploy tests/tmp/parity-review-site \
 *     --project-name=gofish-parity-review \
 *     --branch=<branch>
 *
 * Environment variables:
 *   REVIEW_REPO   - GitHub repo (e.g. "owner/repo")
 *   REVIEW_BRANCH - Branch name
 *   REVIEW_SHA    - Commit SHA
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "fs";
import { join, dirname } from "path";
import {
  collectParityDiffs,
  formatDomDiff,
  type DiffEntry,
} from "./diff-utils.js";
import { mapJsToPython } from "./check-python-sync.js";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SCRIPTS_DIR = import.meta.dirname;
const TESTS_DIR = dirname(SCRIPTS_DIR);
const ROOT_DIR = dirname(TESTS_DIR);
const OUT_DIR = join(TESTS_DIR, "tmp/parity-review-site");
const SYNC_RESULTS_FILE = join(TESTS_DIR, "tmp/sync-results.json");
const STORIES_DIR = join(ROOT_DIR, "packages/gofish-graphics/stories");
const PYTHON_STORIES_DIR = join(ROOT_DIR, "tests/python-stories");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function write(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function readOptional(p: string): string | null {
  try {
    return readFileSync(p, "utf-8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyncResult {
  jsFile: string;
  pythonFile: string;
  changeType: "added" | "deleted" | "modified";
  status: "ok" | "error" | "warning" | "exempt";
  message: string;
}

interface StoryPair {
  /** Slug used as key, e.g. "forwardsyntax/bar--basic" */
  id: string;
  jsFile: string;
  pythonFile: string;
  /** "coverage" | "sync" | "dom" */
  checkType: string;
  /** "pass" | "fail" | "warning" */
  status: string;
  message: string;
  hasDomDiff: boolean;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

console.log("Building parity review site...");

// Load sync results (may not exist if sync check was skipped)
let syncResults: SyncResult[] = [];
if (existsSync(SYNC_RESULTS_FILE)) {
  syncResults = JSON.parse(readFileSync(SYNC_RESULTS_FILE, "utf-8"));
  console.log(`  ${syncResults.length} sync result(s) from check-python-sync`);
} else {
  console.log("  No sync-results.json found, skipping coverage/sync data");
}

// Collect parity diffs
const parityDiffs: DiffEntry[] = collectParityDiffs();
console.log(`  ${parityDiffs.length} DOM parity diff(s) found`);

// ---------------------------------------------------------------------------
// Assemble story pairs
// ---------------------------------------------------------------------------

const pairs: StoryPair[] = [];
const seenIds = new Set<string>();

function jsFileToId(jsFile: string): string {
  return jsFile
    .replace(/^packages\/gofish-graphics\/stories\//, "")
    .replace(/\.stories\.tsx$/, "")
    .toLowerCase()
    .replace(/\//g, "/")
    .replace(/([a-z])([A-Z])/g, "$1-$2");
}

// From sync results
for (const r of syncResults) {
  const id = jsFileToId(r.jsFile);
  if (seenIds.has(id)) continue;
  seenIds.add(id);

  const checkType = r.changeType === "modified" ? "sync" : "coverage";
  const status =
    r.status === "error" ? "fail" : r.status === "warning" ? "warning" : "pass";

  pairs.push({
    id,
    jsFile: r.jsFile,
    pythonFile: r.pythonFile,
    checkType,
    status,
    message: r.message,
    hasDomDiff: false,
  });
}

// From DOM parity diffs
for (const diff of parityDiffs) {
  // Convert DOM path back to JS story path for display
  // DOM path: "forwardsyntax/bar--basic.html"
  const id = diff.path.replace(/\.html$/, "");

  if (seenIds.has(id)) {
    // Update existing pair to mark DOM failure
    const pair = pairs.find((p) => p.id === id);
    if (pair) {
      pair.hasDomDiff = true;
      if (pair.status !== "fail") pair.status = "fail";
    }
    continue;
  }
  seenIds.add(id);

  // Try to infer JS/Python file from DOM path
  // DOM path uses kebab-case; we do a best-effort mapping
  const jsFile = `packages/gofish-graphics/stories/${id}.stories.tsx`;
  const pythonFile = mapJsToPython(jsFile);

  const hasDomDiff = diff.beforeDom !== null;
  pairs.push({
    id,
    jsFile,
    pythonFile,
    checkType: "dom",
    status: "fail",
    message: hasDomDiff
      ? "DOM output does not match JS baseline"
      : "No JS baseline exists yet",
    hasDomDiff,
  });
}

console.log(`  ${pairs.length} story pair(s) total`);

// ---------------------------------------------------------------------------
// Write source files and DOM diffs
// ---------------------------------------------------------------------------

for (const pair of pairs) {
  // JS source
  const jsAbsPath = join(ROOT_DIR, pair.jsFile);
  const jsSource = readOptional(jsAbsPath);
  if (jsSource !== null) {
    write(
      join(OUT_DIR, "data/sources/js", `${pair.id}.tsx`),
      jsSource
    );
  }

  // Python source
  const pyAbsPath = join(ROOT_DIR, pair.pythonFile);
  const pySource = readOptional(pyAbsPath);
  if (pySource !== null) {
    write(
      join(OUT_DIR, "data/sources/python", `${pair.id}.py`),
      pySource
    );
  }
}

// DOM diffs
for (const diff of parityDiffs) {
  if (diff.beforeDom !== null && diff.afterDom !== null) {
    const html = formatDomDiff(diff.beforeDom, diff.afterDom);
    write(join(OUT_DIR, "data/dom-diffs", diff.path), html);
  }
}

// ---------------------------------------------------------------------------
// data/results.json
// ---------------------------------------------------------------------------

write(
  join(OUT_DIR, "data/results.json"),
  JSON.stringify(pairs, null, 2)
);

// ---------------------------------------------------------------------------
// data/meta.json
// ---------------------------------------------------------------------------

const meta = {
  repo: process.env.REVIEW_REPO ?? "unknown/repo",
  branch: process.env.REVIEW_BRANCH ?? "unknown",
  sha: process.env.REVIEW_SHA ?? "unknown",
};

write(join(OUT_DIR, "data/meta.json"), JSON.stringify(meta, null, 2));

console.log(
  `  Repo: ${meta.repo}, branch: ${meta.branch}, sha: ${meta.sha.slice(0, 8)}`
);

// ---------------------------------------------------------------------------
// index.html — Read-only SPA
// ---------------------------------------------------------------------------

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Python Parity Review</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; height: 100vh; overflow: hidden; color: #222; background: #f5f5f5; }

    /* Sidebar */
    #sidebar { width: 300px; min-width: 300px; background: #1e1e2e; color: #cdd6f4; display: flex; flex-direction: column; overflow: hidden; }
    #sidebar-header { padding: 12px 16px; border-bottom: 1px solid #313244; }
    #sidebar-header h2 { font-size: 14px; font-weight: 600; color: #cba6f7; margin-bottom: 4px; }
    #sidebar-meta { font-size: 11px; color: #6c7086; margin-bottom: 4px; font-family: monospace; }
    #sidebar-stats { font-size: 12px; color: #a6adc8; }
    #sidebar-filters { display: flex; gap: 6px; padding: 8px 16px; flex-wrap: wrap; border-bottom: 1px solid #313244; }
    .filter-btn { padding: 3px 10px; border-radius: 12px; border: 1px solid #45475a; background: transparent; color: #a6adc8; font-size: 11px; cursor: pointer; }
    .filter-btn.active { background: #cba6f7; color: #1e1e2e; border-color: #cba6f7; font-weight: 600; }
    #story-list { flex: 1; overflow-y: auto; }
    .story-item { padding: 10px 16px; cursor: pointer; border-bottom: 1px solid #181825; transition: background 0.1s; }
    .story-item:hover { background: #313244; }
    .story-item.active { background: #45475a; }
    .story-name { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; }
    .story-meta { font-size: 11px; margin-top: 2px; display: flex; gap: 8px; }
    .status-pass { color: #a6e3a1; }
    .status-fail { color: #f38ba8; }
    .status-warning { color: #fab387; }
    .check-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; padding: 1px 6px; border-radius: 8px; }
    .check-coverage { background: #313244; color: #89b4fa; }
    .check-sync { background: #313244; color: #cba6f7; }
    .check-dom { background: #313244; color: #fab387; }

    /* Main panel */
    #main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    #main-header { padding: 12px 20px; background: #fff; border-bottom: 1px solid #e0e0e0; }
    #main-title { font-size: 13px; font-weight: 600; font-family: monospace; margin-bottom: 4px; }
    #main-badges { display: flex; gap: 8px; align-items: center; }
    .badge { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; }

    #main-content { flex: 1; overflow-y: auto; padding: 16px; }

    /* Source comparison */
    #source-section { margin-bottom: 16px; }
    #source-section h3 { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 10px; }
    #source-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .source-panel { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
    .source-panel-header { padding: 8px 12px; background: #f8f8f8; border-bottom: 1px solid #e0e0e0; font-size: 12px; font-weight: 600; color: #555; }
    .source-panel-content { padding: 12px; overflow-x: auto; font-family: monospace; font-size: 12px; line-height: 1.6; white-space: pre; color: #333; max-height: 500px; overflow-y: auto; }
    .source-missing { color: #aaa; font-style: italic; padding: 32px; text-align: center; }

    /* DOM diff */
    #dom-diff-section { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    #dom-diff-toggle { padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; user-select: none; border-bottom: 1px solid transparent; }
    #dom-diff-toggle:hover { background: #f8f8f8; }
    #dom-diff-toggle.open { border-bottom-color: #e0e0e0; }
    #dom-diff-content { max-height: 500px; overflow: auto; display: none; }
    #dom-diff-content.open { display: block; }

    /* Empty state */
    #empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 15px; gap: 8px; }

    /* Read-only banner */
    #readonly-banner { background: #2d2d3f; color: #a6adc8; font-size: 12px; padding: 6px 16px; text-align: center; border-bottom: 1px solid #313244; }
  </style>
</head>
<body>

<!-- SIDEBAR -->
<div id="sidebar">
  <div id="sidebar-header">
    <h2>Python Parity Review</h2>
    <div id="readonly-banner">Read-only diagnostic view</div>
    <div id="sidebar-meta" style="margin-top:8px;"></div>
    <div id="sidebar-stats"></div>
  </div>
  <div id="sidebar-filters">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="fail">Failures</button>
    <button class="filter-btn" data-filter="warning">Warnings</button>
    <button class="filter-btn" data-filter="coverage">Coverage</button>
    <button class="filter-btn" data-filter="sync">Sync</button>
    <button class="filter-btn" data-filter="dom">DOM</button>
  </div>
  <div id="story-list"></div>
</div>

<!-- MAIN -->
<div id="main">
  <div id="main-header">
    <div id="main-title">Select a story pair</div>
    <div id="main-badges"></div>
  </div>

  <div id="main-content">
    <div id="empty-state">
      <div>No story selected</div>
      <div style="font-size:13px;">Use ↑/↓ or j/k to navigate</div>
    </div>

    <div id="story-content" style="display:none;">
      <!-- Source comparison -->
      <div id="source-section">
        <h3>Source Comparison</h3>
        <div id="source-grid">
          <div class="source-panel">
            <div class="source-panel-header">JS Story</div>
            <div class="source-panel-content" id="js-source">
              <div class="source-missing">Loading...</div>
            </div>
          </div>
          <div class="source-panel">
            <div class="source-panel-header">Python Story</div>
            <div class="source-panel-content" id="py-source">
              <div class="source-missing">Loading...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- DOM diff -->
      <div id="dom-diff-section" style="display:none;">
        <div id="dom-diff-toggle">
          <span id="dom-diff-arrow">▶</span> DOM Diff (Python vs JS Baseline)
        </div>
        <div id="dom-diff-content"></div>
      </div>
    </div>
  </div>
</div>

<script>
  let allPairs = [];
  let meta = { repo: '', branch: '', sha: '' };
  let currentId = null;
  let filter = 'all';

  const domDiffCache = {};
  const sourceCache = {};

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function init() {
    const [resultsRes, metaRes] = await Promise.all([
      fetch('/data/results.json'),
      fetch('/data/meta.json'),
    ]);
    allPairs = await resultsRes.json();
    meta = await metaRes.json();

    const metaEl = document.getElementById('sidebar-meta');
    const shortSha = meta.sha.slice(0, 8);
    metaEl.textContent = meta.branch + ' @ ' + shortSha;

    renderSidebar();
    if (allPairs.length > 0) selectPair(allPairs[0].id);
  }

  function filteredPairs() {
    if (filter === 'all') return allPairs;
    if (filter === 'fail') return allPairs.filter(p => p.status === 'fail');
    if (filter === 'warning') return allPairs.filter(p => p.status === 'warning');
    return allPairs.filter(p => p.checkType === filter);
  }

  function renderSidebar() {
    const fails = allPairs.filter(p => p.status === 'fail').length;
    const warns = allPairs.filter(p => p.status === 'warning').length;
    document.getElementById('sidebar-stats').textContent =
      fails + ' failure(s), ' + warns + ' warning(s) / ' + allPairs.length + ' total';

    const list = document.getElementById('story-list');
    list.innerHTML = '';
    const items = filteredPairs();
    if (items.length === 0) {
      list.innerHTML = '<div style="padding:16px;color:#585b70;font-size:13px;">No items</div>';
      return;
    }
    for (const p of items) {
      const el = document.createElement('div');
      el.className = 'story-item' + (p.id === currentId ? ' active' : '');
      el.dataset.id = p.id;
      el.innerHTML =
        '<div class="story-name">' + escHtml(p.id) + '</div>' +
        '<div class="story-meta">' +
          '<span class="check-badge check-' + p.checkType + '">' + p.checkType.toUpperCase() + '</span>' +
          '<span class="status-' + p.status + '">' + p.status + '</span>' +
        '</div>';
      el.addEventListener('click', () => selectPair(p.id));
      list.appendChild(el);
    }
  }

  async function selectPair(id) {
    currentId = id;

    document.querySelectorAll('.story-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    const pair = allPairs.find(p => p.id === id);
    if (!pair) return;

    document.getElementById('main-title').textContent = id;

    const statusColors = { pass: '#27ae60', fail: '#e74c3c', warning: '#e67e22' };
    const checkColors = { coverage: '#3498db', sync: '#9b59b6', dom: '#e67e22' };
    const sColor = statusColors[pair.status] || '#888';
    const cColor = checkColors[pair.checkType] || '#888';
    document.getElementById('main-badges').innerHTML =
      '<span class="badge" style="background:' + sColor + '22;color:' + sColor + ';border:1px solid ' + sColor + ';">' + pair.status.toUpperCase() + '</span>' +
      '<span class="badge" style="background:' + cColor + '22;color:' + cColor + ';border:1px solid ' + cColor + ';">' + pair.checkType.toUpperCase() + '</span>' +
      '<span style="font-size:12px;color:#666;">' + escHtml(pair.message) + '</span>';

    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('story-content').style.display = 'block';

    // Load sources
    await loadSources(pair);

    // DOM diff section
    const domSection = document.getElementById('dom-diff-section');
    if (pair.hasDomDiff) {
      domSection.style.display = 'block';
      await loadDomDiff(pair.id + '.html');
    } else {
      domSection.style.display = 'none';
    }
  }

  async function loadSources(pair) {
    const jsEl = document.getElementById('js-source');
    const pyEl = document.getElementById('py-source');

    // JS source
    const jsKey = 'js:' + pair.id;
    if (sourceCache[jsKey] === undefined) {
      try {
        const res = await fetch('/data/sources/js/' + pair.id + '.tsx');
        sourceCache[jsKey] = res.ok ? escHtml(await res.text()) : null;
      } catch { sourceCache[jsKey] = null; }
    }
    jsEl.innerHTML = sourceCache[jsKey] !== null
      ? sourceCache[jsKey]
      : '<div class="source-missing">Source not available</div>';

    // Python source
    const pyKey = 'py:' + pair.id;
    if (sourceCache[pyKey] === undefined) {
      try {
        const res = await fetch('/data/sources/python/' + pair.id + '.py');
        sourceCache[pyKey] = res.ok ? escHtml(await res.text()) : null;
      } catch { sourceCache[pyKey] = null; }
    }
    pyEl.innerHTML = sourceCache[pyKey] !== null
      ? sourceCache[pyKey]
      : '<div class="source-missing">No Python counterpart found</div>';
  }

  async function loadDomDiff(path) {
    const content = document.getElementById('dom-diff-content');
    if (domDiffCache[path] !== undefined) {
      content.innerHTML = domDiffCache[path];
      return;
    }
    content.innerHTML = '<div style="padding:12px;color:#888;font-size:13px;">Loading...</div>';
    try {
      const res = await fetch('/data/dom-diffs/' + path);
      const html = res.ok ? await res.text() : '<em style="color:#aaa;">DOM diff unavailable.</em>';
      domDiffCache[path] = html;
      content.innerHTML = html;
    } catch {
      content.innerHTML = '<em style="color:#aaa;">Failed to load DOM diff.</em>';
    }
  }

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSidebar();
    });
  });

  // DOM diff toggle
  document.getElementById('dom-diff-toggle').addEventListener('click', () => {
    const content = document.getElementById('dom-diff-content');
    const arrow = document.getElementById('dom-diff-arrow');
    const toggle = document.getElementById('dom-diff-toggle');
    const isOpen = content.classList.contains('open');
    content.classList.toggle('open', !isOpen);
    toggle.classList.toggle('open', !isOpen);
    arrow.textContent = isOpen ? '▶' : '▼';
  });

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const items = filteredPairs();
    const idx = items.findIndex(p => p.id === currentId);
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      const next = items[Math.min(idx + 1, items.length - 1)];
      if (next) selectPair(next.id);
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      const prev = items[Math.max(idx - 1, 0)];
      if (prev) selectPair(prev.id);
    }
  });

  init();
</script>
</body>
</html>`;

write(join(OUT_DIR, "index.html"), html);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nParity review site built at: ${OUT_DIR}`);
console.log(
  `  index.html, data/results.json, data/meta.json`
);
console.log(`  ${parityDiffs.length} dom-diffs, ${pairs.length} story pairs`);
console.log(
  `\nTo preview:\n  npx wrangler pages dev ${OUT_DIR}`
);
