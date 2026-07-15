#!/usr/bin/env node
// Lightweight syntax check for Google Apps Script files.
// Google Apps Script uses a mostly-standard JS syntax (V8 runtime),
// so a Node.js syntax check catches typos and structural errors
// without needing a full Apps Script environment.
const fs = require('fs');
const { execSync } = require('child_process');

const files = fs.readdirSync('.').filter(f => f.endsWith('.gs'));

if (files.length === 0) {
  console.error('No .gs files found.');
  process.exit(1);
}

let failed = false;

for (const file of files) {
  try {
    execSync(`node --check "${file}"`, { stdio: 'inherit' });
    console.log(`OK: ${file}`);
  } catch (err) {
    failed = true;
    console.error(`FAILED: ${file}`);
  }
}

process.exit(failed ? 1 : 0);
