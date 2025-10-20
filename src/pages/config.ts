const iframeContent = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://registry.npmmirror.com/tailwindcss/2.2.19/files/dist/base.min.css" />
  <link rel="stylesheet"
    href="https://registry.npmmirror.com/@fortawesome/fontawesome-free/6.4.0/files/css/all.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
          
/* ==========================================
   IBM Design Language - Work Report CSS
   Version: 1.0
   Based on IBM Carbon Design System
   ========================================== */

/* ==========================================
   1. CSS Variables - IBM Design Tokens
   ========================================== */
:root {
  /* IBM Color Palette - Blues */
  --ibm-blue-60: #0f62fe;
  --ibm-blue-70: #0043ce;
  --ibm-blue-80: #002d9c;
  --ibm-blue-90: #001d6c;
  --ibm-blue-50: #4589ff;
  --ibm-blue-40: #78a9ff;
  --ibm-blue-30: #a6c8ff;
  --ibm-blue-20: #d0e2ff;
  --ibm-blue-10: #edf5ff;

  /* IBM Grays */
  --ibm-gray-100: #161616;
  --ibm-gray-90: #262626;
  --ibm-gray-80: #393939;
  --ibm-gray-70: #525252;
  --ibm-gray-60: #6f6f6f;
  --ibm-gray-50: #8d8d8d;
  --ibm-gray-40: #a8a8a8;
  --ibm-gray-30: #c6c6c6;
  --ibm-gray-20: #e0e0e0;
  --ibm-gray-10: #f4f4f4;

  /* IBM Functional Colors */
  --ibm-green-60: #24a148;
  --ibm-green-50: #42be65;
  --ibm-yellow-30: #f1c21b;
  --ibm-red-60: #da1e28;
  --ibm-purple-60: #8a3ffc;
  --ibm-teal-60: #009d9a;
  --ibm-magenta-60: #ee5396;

  /* Background Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f4f4f4;
  --bg-tertiary: #e0e0e0;
  --bg-dark: #161616;
  --bg-overlay: rgba(22, 22, 22, 0.5);

  /* Text Colors */
  --text-primary: #161616;
  --text-secondary: #525252;
  --text-tertiary: #8d8d8d;
  --text-inverse: #ffffff;
  --text-placeholder: #a8a8a8;
  --text-error: #da1e28;
  --text-success: #24a148;

  /* Border Colors */
  --border-subtle: #e0e0e0;
  --border-strong: #8d8d8d;
  --border-inverse: #161616;
  --border-interactive: #0f62fe;

  /* IBM Plex Font Family */
  --font-family-sans: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  --font-family-mono: 'IBM Plex Mono', 'Menlo', 'DejaVu Sans Mono', 'Courier New', monospace;

  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 450;
  --font-weight-semibold: 600;

  /* Type Scale (IBM Type Token) */
  --font-size-01: 12px;    /* Caption */
  --font-size-02: 14px;    /* Label, Helper */
  --font-size-03: 16px;    /* Body */
  --font-size-04: 18px;    /* Body large */
  --font-size-05: 20px;    /* Heading 06 */
  --font-size-06: 24px;    /* Heading 05 */
  --font-size-07: 28px;    /* Heading 04 */
  --font-size-08: 32px;    /* Heading 03 */
  --font-size-09: 42px;    /* Heading 02 */
  --font-size-10: 54px;    /* Heading 01 */
  --font-size-11: 60px;    /* Display 04 */
  --font-size-12: 68px;    /* Display 03 */
  --font-size-13: 76px;    /* Display 02 */
  --font-size-14: 84px;    /* Display 01 */

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-loose: 1.75;

  /* Spacing System (8px grid) */
  --spacing-01: 2px;
  --spacing-02: 4px;
  --spacing-03: 8px;
  --spacing-04: 12px;
  --spacing-05: 16px;
  --spacing-06: 24px;
  --spacing-07: 32px;
  --spacing-08: 40px;
  --spacing-09: 48px;
  --spacing-10: 64px;
  --spacing-11: 80px;
  --spacing-12: 96px;
  --spacing-13: 160px;

  /* Layout Sizes */
  --layout-01: 16px;
  --layout-02: 24px;
  --layout-03: 32px;
  --layout-04: 48px;
  --layout-05: 64px;
  --layout-06: 96px;
  --layout-07: 160px;

  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;

  /* Shadows (subtle) */
  --shadow-01: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  --shadow-02: 0 2px 6px 0 rgba(0, 0, 0, 0.15);
  --shadow-03: 0 4px 12px 0 rgba(0, 0, 0, 0.2);
  --shadow-04: 0 8px 24px 0 rgba(0, 0, 0, 0.25);

  /* Transitions (fast, functional) */
  --transition-fast: 70ms cubic-bezier(0, 0, 0.38, 0.9);
  --transition-moderate: 110ms cubic-bezier(0, 0, 0.38, 0.9);
  --transition-slow: 240ms cubic-bezier(0, 0, 0.38, 0.9);

  /* Z-index */
  --z-base: 0;
  --z-overlay: 1000;
  --z-dropdown: 2000;
  --z-modal: 3000;
  --z-tooltip: 4000;
}

/* ==========================================
   2. Reset & Base Styles
   ========================================== */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-03);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
  background: var(--bg-primary);
  letter-spacing: 0;
}

/* ==========================================
   3. Typography System
   ========================================== */

/* Headings */
.ibm-display-01, .display-01 {
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-light);
  line-height: var(--line-height-tight);
  letter-spacing: -0.5px;
}

.ibm-display-02, .display-02 {
  font-size: var(--font-size-13);
  font-weight: var(--font-weight-light);
  line-height: var(--line-height-tight);
  letter-spacing: -0.5px;
}

.ibm-display-03, .display-03 {
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-light);
  line-height: var(--line-height-tight);
  letter-spacing: -0.5px;
}

.ibm-display-04, .display-04 {
  font-size: var(--font-size-11);
  font-weight: var(--font-weight-light);
  line-height: var(--line-height-tight);
  letter-spacing: -0.5px;
}

h1, .ibm-heading-01, .heading-01 {
  font-size: var(--font-size-10);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

h2, .ibm-heading-02, .heading-02 {
  font-size: var(--font-size-09);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

h3, .ibm-heading-03, .heading-03 {
  font-size: var(--font-size-08);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

h4, .ibm-heading-04, .heading-04 {
  font-size: var(--font-size-07);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

h5, .ibm-heading-05, .heading-05 {
  font-size: var(--font-size-06);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

h6, .ibm-heading-06, .heading-06 {
  font-size: var(--font-size-05);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

/* Body Text */
p, .ibm-body, .body-long {
  font-size: var(--font-size-03);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  letter-spacing: 0;
}

.body-short {
  font-size: var(--font-size-03);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

.body-compact {
  font-size: var(--font-size-02);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: 0.16px;
}

.label {
  font-size: var(--font-size-02);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: 0.16px;
}

.caption {
  font-size: var(--font-size-01);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: 0.32px;
}

.helper-text {
  font-size: var(--font-size-02);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: 0.16px;
  color: var(--text-secondary);
}

/* Code/Mono Text */
.code, code {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-02);
  line-height: var(--line-height-normal);
}

/* Text Utilities */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-tertiary { color: var(--text-tertiary); }
.text-inverse { color: var(--text-inverse); }
.text-error { color: var(--text-error); }
.text-success { color: var(--text-success); }

.font-light { font-weight: var(--font-weight-light); }
.font-regular { font-weight: var(--font-weight-regular); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* ==========================================
   4. Layout System - Report Specific
   ========================================== */

/* Report Page Container */
.report-page {
  width: 100%;
  max-width: 1584px; /* IBM 16-column grid max width */
  margin: 0 auto;
  padding: var(--spacing-06);  /* 减少默认 padding: 48px → 24px */
  background: var(--bg-primary);
}

/* Report Header */
.report-header {
  padding: var(--spacing-06) 0;  /* 减少: 40px → 24px */
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--spacing-06);  /* 减少: 48px → 24px */
}

.report-title {
  font-size: var(--font-size-10);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
  margin-bottom: var(--spacing-05);
}

.report-meta {
  display: flex;
  gap: var(--spacing-07);
  flex-wrap: wrap;
}

.report-meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-02);
}

.report-meta-label {
  font-size: var(--font-size-01);
  font-weight: var(--font-weight-regular);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.32px;
}

.report-meta-value {
  font-size: var(--font-size-04);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* Report Section */
.report-section {
  margin-bottom: var(--spacing-10);
}

.section-header {
  margin-bottom: var(--spacing-07);
  padding-bottom: var(--spacing-05);
  border-bottom: 1px solid var(--border-subtle);
}

.section-title {
  font-size: var(--font-size-08);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
  margin-bottom: var(--spacing-03);
}

.section-subtitle {
  font-size: var(--font-size-03);
  font-weight: var(--font-weight-regular);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-07);
}

.content-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-07);
}

.content-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-07);
}

.content-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-06);
}

/* ==========================================
   5. IBM Card System
   ========================================== */

/* Base Card */
.ibm-card, .card {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 0; /* IBM uses no border radius */
  padding: var(--spacing-07);
  transition: all var(--transition-moderate);
}

.ibm-card:hover, .card:hover {
  box-shadow: var(--shadow-02);
  border-color: var(--border-strong);
}

/* Card with Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-06);
  padding-bottom: var(--spacing-05);
  border-bottom: 1px solid var(--border-subtle);
}

.card-title {
  font-size: var(--font-size-05);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.card-action {
  font-size: var(--font-size-02);
  color: var(--ibm-blue-60);
  cursor: pointer;
  text-decoration: none;
}

.card-action:hover {
  text-decoration: underline;
}

.card-body {
  font-size: var(--font-size-03);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
}

.card-footer {
  margin-top: var(--spacing-06);
  padding-top: var(--spacing-05);
  border-top: 1px solid var(--border-subtle);
  font-size: var(--font-size-02);
  color: var(--text-secondary);
}

/* Clickable Card */
.card-clickable {
  cursor: pointer;
  position: relative;
}

.card-clickable::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  transition: border-color var(--transition-fast);
  pointer-events: none;
}

.card-clickable:hover::before {
  border-color: var(--ibm-blue-60);
}

.card-clickable:focus {
  outline: 2px solid var(--ibm-blue-60);
  outline-offset: 2px;
}

/* Status Cards */
.card-success {
  border-left: 4px solid var(--ibm-green-60);
}

.card-warning {
  border-left: 4px solid var(--ibm-yellow-30);
}

.card-error {
  border-left: 4px solid var(--ibm-red-60);
}

.card-info {
  border-left: 4px solid var(--ibm-blue-60);
}

/* ==========================================
   6. Data Display Components
   ========================================== */

/* Metrics/KPI Display */
.metric-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-07);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-05);
}

.metric-label {
  font-size: var(--font-size-02);
  font-weight: var(--font-weight-regular);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.32px;
}

.metric-value {
  font-size: var(--font-size-10);
  font-weight: var(--font-weight-light);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
}

.metric-change {
  display: flex;
  align-items: center;
  gap: var(--spacing-03);
  font-size: var(--font-size-02);
  font-weight: var(--font-weight-medium);
}

.metric-change.positive {
  color: var(--ibm-green-60);
}

.metric-change.negative {
  color: var(--ibm-red-60);
}

.metric-change.neutral {
  color: var(--text-secondary);
}

/* Progress Indicator */
.progress-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-04);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-02);
  color: var(--text-primary);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-secondary);
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--ibm-blue-60);
  transition: width var(--transition-slow);
}

.progress-fill.success { background: var(--ibm-green-60); }
.progress-fill.warning { background: var(--ibm-yellow-30); }
.progress-fill.error { background: var(--ibm-red-60); }

/* ==========================================
   7. Table System
   ========================================== */

.ibm-table, table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  background: var(--bg-primary);
  font-size: var(--font-size-02);
}

.ibm-table thead, table thead {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-strong);
}

.ibm-table th, table th {
  padding: var(--spacing-05);
  text-align: left;
  font-size: var(--font-size-02);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: 0.16px;
  border-bottom: 1px solid var(--border-subtle);
}

.ibm-table td, table td {
  padding: var(--spacing-05);
  font-size: var(--font-size-02);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}

.ibm-table tbody tr:hover, table tbody tr:hover {
  background: var(--bg-secondary);
}

.ibm-table tbody tr:last-child td {
  border-bottom: none;
}

/* Zebra Striping */
.ibm-table.striped tbody tr:nth-child(even),
table.striped tbody tr:nth-child(even) {
  background: var(--bg-secondary);
}

/* Compact Table */
.ibm-table.compact th,
.ibm-table.compact td {
  padding: var(--spacing-03) var(--spacing-05);
}

/* ==========================================
   8. List System
   ========================================== */

.ibm-list, .list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ibm-list-item, .list-item {
  padding: var(--spacing-05) 0;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-05);
}

.ibm-list-item:last-child {
  border-bottom: none;
}

/* Ordered List */
.list-ordered {
  counter-reset: list-counter;
}

.list-ordered .list-item::before {
  content: counter(list-counter) ".";
  counter-increment: list-counter;
  font-weight: var(--font-weight-semibold);
  color: var(--ibm-blue-60);
  min-width: 2em;
}

/* Unordered List */
.list-unordered .list-item::before {
  content: "•";
  color: var(--ibm-blue-60);
  font-weight: var(--font-weight-semibold);
  min-width: 1.5em;
}

/* Checklist */
.list-check .list-item::before {
  content: "✓";
  color: var(--ibm-green-60);
  font-weight: var(--font-weight-semibold);
  min-width: 1.5em;
}

/* ==========================================
   9. Button System
   ========================================== */

.ibm-btn, .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-04) var(--spacing-05);
  border: 1px solid transparent;
  border-radius: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-02);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
  letter-spacing: 0.16px;
  cursor: pointer;
  transition: background var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
}

/* Primary Button */
.btn-primary {
  background: var(--ibm-blue-60);
  color: var(--text-inverse);
}

.btn-primary:hover {
  background: var(--ibm-blue-70);
}

.btn-primary:active {
  background: var(--ibm-blue-80);
}

.btn-primary:focus {
  outline: 2px solid var(--ibm-blue-60);
  outline-offset: 2px;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--ibm-blue-60);
}

.btn-secondary:hover {
  background: var(--ibm-blue-60);
  color: var(--text-inverse);
}

/* Tertiary Button */
.btn-tertiary {
  background: transparent;
  color: var(--ibm-blue-60);
  border-color: transparent;
}

.btn-tertiary:hover {
  background: var(--bg-secondary);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--ibm-blue-60);
  border: none;
  padding: var(--spacing-04);
}

.btn-ghost:hover {
  background: var(--bg-secondary);
}

/* Danger Button */
.btn-danger {
  background: var(--ibm-red-60);
  color: var(--text-inverse);
}

.btn-danger:hover {
  background: #ba1b23;
}

/* Button Sizes */
.btn-small {
  padding: var(--spacing-03) var(--spacing-04);
  font-size: var(--font-size-01);
}

.btn-large {
  padding: var(--spacing-05) var(--spacing-07);
  font-size: var(--font-size-03);
}

/* Disabled State */
.btn:disabled,
.btn.disabled {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  border-color: var(--bg-tertiary);
  cursor: not-allowed;
}

/* ==========================================
   10. Tag/Badge System
   ========================================== */

.ibm-tag, .tag {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-02) var(--spacing-04);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-01);
  font-weight: var(--font-weight-regular);
  letter-spacing: 0.32px;
  line-height: var(--line-height-tight);
}

.tag-gray {
  background: var(--ibm-gray-20);
  color: var(--ibm-gray-100);
}

.tag-blue {
  background: var(--ibm-blue-20);
  color: var(--ibm-blue-70);
}

.tag-green {
  background: #defbe6;
  color: #0e6027;
}

.tag-red {
  background: #fff1f1;
  color: #750e13;
}

.tag-purple {
  background: #f6f2ff;
  color: #6929c4;
}

.tag-teal {
  background: #d9fbfb;
  color: #005d5d;
}

/* ==========================================
   11. Divider & Separator
   ========================================== */

.divider {
  width: 100%;
  height: 1px;
  background: var(--border-subtle);
  margin: var(--spacing-07) 0;
}

.divider-strong {
  background: var(--border-strong);
}

.divider-vertical {
  width: 1px;
  height: 100%;
  background: var(--border-subtle);
  margin: 0 var(--spacing-05);
}

/* ==========================================
   12. Spacing Utilities
   ========================================== */

/* Margin */
.m-0 { margin: 0; }
.m-1 { margin: var(--spacing-03); }
.m-2 { margin: var(--spacing-05); }
.m-3 { margin: var(--spacing-06); }
.m-4 { margin: var(--spacing-07); }
.m-5 { margin: var(--spacing-09); }

.mt-0 { margin-top: 0; }
.mt-1 { margin-top: var(--spacing-03); }
.mt-2 { margin-top: var(--spacing-05); }
.mt-3 { margin-top: var(--spacing-06); }
.mt-4 { margin-top: var(--spacing-07); }
.mt-5 { margin-top: var(--spacing-09); }

.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: var(--spacing-03); }
.mb-2 { margin-bottom: var(--spacing-05); }
.mb-3 { margin-bottom: var(--spacing-06); }
.mb-4 { margin-bottom: var(--spacing-07); }
.mb-5 { margin-bottom: var(--spacing-09); }

.ml-auto { margin-left: auto; }
.mr-auto { margin-right: auto; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Padding */
.p-0 { padding: 0; }
.p-1 { padding: var(--spacing-03); }
.p-2 { padding: var(--spacing-05); }
.p-3 { padding: var(--spacing-06); }
.p-4 { padding: var(--spacing-07); }
.p-5 { padding: var(--spacing-09); }

.pt-0 { padding-top: 0; }
.pt-1 { padding-top: var(--spacing-03); }
.pt-2 { padding-top: var(--spacing-05); }
.pt-3 { padding-top: var(--spacing-06); }
.pt-4 { padding-top: var(--spacing-07); }

.pb-0 { padding-bottom: 0; }
.pb-1 { padding-bottom: var(--spacing-03); }
.pb-2 { padding-bottom: var(--spacing-05); }
.pb-3 { padding-bottom: var(--spacing-06); }
.pb-4 { padding-bottom: var(--spacing-07); }

/* ==========================================
   13. Utility Classes
   ========================================== */

/* Display */
.d-none { display: none; }
.d-block { display: block; }
.d-inline { display: inline; }
.d-inline-block { display: inline-block; }
.d-flex { display: flex; }
.d-grid { display: grid; }

/* Flex */
.flex-row { flex-direction: row; }
.flex-column { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.align-start { align-items: flex-start; }
.align-center { align-items: center; }
.align-end { align-items: flex-end; }
.align-stretch { align-items: stretch; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }

.gap-1 { gap: var(--spacing-03); }
.gap-2 { gap: var(--spacing-05); }
.gap-3 { gap: var(--spacing-06); }
.gap-4 { gap: var(--spacing-07); }
.gap-5 { gap: var(--spacing-09); }

/* Width */
.w-100 { width: 100%; }
.w-auto { width: auto; }
.w-50 { width: 50%; }
.w-33 { width: 33.333%; }
.w-25 { width: 25%; }

/* Height */
.h-100 { height: 100%; }
.h-auto { height: auto; }

/* Position */
.position-relative { position: relative; }
.position-absolute { position: absolute; }
.position-fixed { position: fixed; }
.position-sticky { position: sticky; }

/* Border */
.border { border: 1px solid var(--border-subtle); }
.border-top { border-top: 1px solid var(--border-subtle); }
.border-bottom { border-bottom: 1px solid var(--border-subtle); }
.border-left { border-left: 1px solid var(--border-subtle); }
.border-right { border-right: 1px solid var(--border-subtle); }

/* Background */
.bg-primary { background: var(--bg-primary); }
.bg-secondary { background: var(--bg-secondary); }
.bg-tertiary { background: var(--bg-tertiary); }
.bg-dark { background: var(--bg-dark); }

.bg-blue { background: var(--ibm-blue-10); }
.bg-green { background: #defbe6; }
.bg-red { background: #fff1f1; }
.bg-yellow { background: #fcf4d6; }

/* ==========================================
   14. Responsive Design
   ========================================== */

/* IBM Breakpoints */
@media (max-width: 1584px) {
  .report-page {
    padding: var(--spacing-08);
  }
}

@media (max-width: 1312px) {
  .content-grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1056px) {
  .report-page {
    padding: var(--spacing-07);
  }

  .content-grid-2,
  .content-grid-3,
  .content-grid-4 {
    grid-template-columns: 1fr;
  }

  .report-title {
    font-size: var(--font-size-09);
  }
}

@media (max-width: 672px) {
  .report-page {
    padding: var(--spacing-05);
  }

  .report-header {
    padding: var(--spacing-06) 0;
  }

  .report-title {
    font-size: var(--font-size-07);
  }

  .section-title {
    font-size: var(--font-size-06);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .ibm-card, .card {
    padding: var(--spacing-05);
  }
}

/* ==========================================
   15. Print Styles
   ========================================== */

@media print {
  body {
    background: white;
    color: black;
  }

  .report-page {
    max-width: 100%;
    padding: 0;
  }

  .ibm-card, .card {
    border: 1px solid #ccc;
    box-shadow: none;
    page-break-inside: avoid;
  }

  .btn {
    display: none;
  }

  .no-print {
    display: none;
  }
}

/* ==========================================
   16. Accessibility
   ========================================== */

/* Focus States */
*:focus {
  outline: 2px solid var(--ibm-blue-60);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid var(--ibm-blue-60);
  outline-offset: 2px;
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ==========================================
   END
   ========================================== */

    
  </style>
</head>

<body>
<style>
  /* Slide-specific overrides */
  .slide {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-07);
    /* 减少 padding: 48px → 32px */
    background: var(--bg-primary);
    scroll-snap-align: start;
  }

  .slide-container {
    width: 100%;
    max-width: 1584px;
    margin: 0 auto;
  }

  /* 16:9 高度约束 - 确保内容不溢出 */
  .report-page {
    max-height: calc(100vh - 2 * var(--spacing-07));
    /* 减去 slide 的 padding */
    overflow: hidden;
    /* 防止内容溢出 */
    display: flex;
    flex-direction: column;
  }

  /* 确保内容区域可以滚动（如果确实超出） */
  .layout-content,
  .content-area {
    overflow-y: auto;
    flex: 1;
  }

  /* Smooth scroll */
  html {
    scroll-behavior: smooth;
    scroll-snap-type: y mandatory;
  }

  body {
    overflow-x: hidden;
    overflow-y: auto;
  }

  /* Navigation dots */
  .nav-dots {
    position: fixed;
    right: var(--spacing-07);
    top: 50%;
    transform: translateY(-50%);
    z-index: var(--z-overlay);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-04);
  }

  .nav-dot {
    width: 8px;
    height: 8px;
    border-radius: 0;
    background: var(--ibm-gray-30);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .nav-dot.active {
    background: var(--ibm-blue-60);
    width: 24px;
  }

  .nav-dot:hover {
    background: var(--ibm-blue-70);
  }

  /* Print styles */
  @media print {
    .nav-dots {
      display: none;
    }

    .slide {
      page-break-after: always;
      min-height: auto;
    }
  }
</style>

<section class="slide" id="three-column">
  <div class="slide-container">
    <div class="report-page">

      <div class="report-header">
        <h2 class="heading-03">三支柱模型</h2>
        
        <p class="body-short text-secondary">项目成功的关键因素</p>
        
      </div>

      <div class="content-grid-3">

        
        <div class="ibm-card">
          <div class="card-header">
            <i class="fa-microchip" style="color: #0f62fe; font-size: 32px;"></i>
            <h4 class="heading-05" style="margin-top: var(--spacing-05);">技术创新</h4>
          </div>
          <div class="card-body">
            <div class="ibm-list list-unordered">
              <div class="ibm-list-item">
                <span class="body-compact">微服务架构设计</span>
              </div>
              <div class="ibm-list-item">
                <span class="body-compact">AI算法优化</span>
              </div>
              <div class="ibm-list-item">
                <span class="body-compact">实时数据处理</span>
              </div>
            </div>
          </div>
          <div style="margin-top: var(--spacing-06);">
            <img src="https://images.unsplash.com/photo-1558365849-6ebd8b02e1f1?w=1200" alt="技术创新"
              style="width: 100%; height: 150px; object-fit: cover; border: 1px solid var(--border-subtle);">
          </div>
        </div>
        <div class="ibm-card">
          <div class="card-header">
            <i class="fa-users" style="color: #009d9a; font-size: 32px;"></i>
            <h4 class="heading-05" style="margin-top: var(--spacing-05);">团队协作</h4>
          </div>
          <div class="card-body">
            <div class="ibm-list list-unordered">
              <div class="ibm-list-item">
                <span class="body-compact">敏捷开发流程</span>
              </div>
              <div class="ibm-list-item">
                <span class="body-compact">跨部门沟通机制</span>
              </div>
              <div class="ibm-list-item">
                <span class="body-compact">持续集成部署</span>
              </div>
            </div>
          </div>
          <div style="margin-top: var(--spacing-06);">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200" alt="团队协作"
              style="width: 100%; height: 150px; object-fit: cover; border: 1px solid var(--border-subtle);">
          </div>
        </div>
        <div class="ibm-card">
          <div class="card-header">
            <i class="fa-check-circle" style="color: #24a148; font-size: 32px;"></i>
            <h4 class="heading-05" style="margin-top: var(--spacing-05);">质量管理</h4>
          </div>
          <div class="card-body">
            <div class="ibm-list list-unordered">
              <div class="ibm-list-item">
                <span class="body-compact">自动化测试覆盖</span>
              </div>
              <div class="ibm-list-item">
                <span class="body-compact">代码审查机制</span>
              </div>
              <div class="ibm-list-item">
                <span class="body-compact">性能监控体系</span>
              </div>
            </div>
          </div>
          <div style="margin-top: var(--spacing-06);">
            <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200" alt="质量管理"
              style="width: 100%; height: 150px; object-fit: cover; border: 1px solid var(--border-subtle);">
          </div>
        </div>
            </div>
          </div>
          
        </div>
        

      </div>

    </div>
  </div>
</section>
</body>

</html>`

export {
  iframeContent
}