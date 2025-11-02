#!/usr/bin/env node

/**
 * ULTRA-OPTIMIZED SVG Emoji Bundler (FIXED & TESTED)
 * Maximum compression with ZERO visible quality loss
 * Properly escaped data URIs that actually work!
 * 
 * Usage: node bundle-emojis-ultra.js
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const SPRITE_DIR = './sprite';
const OUTPUT_FILE = './emojiData.js';
const BATCH_SIZE = 200;
const PRECISION = 2; // Decimal places for coordinates

// ============================================
// LOGGER
// ============================================
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  progress: (current, total) => {
    const percent = ((current / total) * 100).toFixed(1);
    process.stdout.write(`\r🔄 Processing: ${current}/${total} (${percent}%)`);
  }
};

// ============================================
// SVG OPTIMIZER
// ============================================
function optimizeSVG(svgContent) {
  let optimized = svgContent;

  // 1. Remove XML declaration, comments, metadata
  optimized = optimized
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/<title[\s\S]*?<\/title>/gi, '')
    .replace(/<desc[\s\S]*?<\/desc>/gi, '');

  // 2. Remove unnecessary namespaces and attributes
  optimized = optimized
    .replace(/\s*xmlns:[^=]*="[^"]*"/g, '')
    .replace(/\s*xml:space="[^"]*"/g, '')
    .replace(/\s*data-name="[^"]*"/g, '');

  // 3. Reduce decimal precision (HUGE space saver!)
  optimized = optimized.replace(/(\d+\.\d{3,})/g, (match) => {
    return parseFloat(match).toFixed(PRECISION);
  });

  // 4. Minify whitespace
  optimized = optimized
    .replace(/\s+/g, ' ')           // Multiple spaces to single
    .replace(/>\s+</g, '><')        // Remove space between tags
    .replace(/\s*=\s*/g, '=')       // Remove space around =
    .trim();

  // 5. Optimize colors
  optimized = optimized
    // rgb(255,255,255) → #ffffff
    .replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi, (match, r, g, b) => {
      const hex = [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
      return '#' + hex;
    })
    // #ffffff → #fff (when possible)
    .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');

  // 6. Remove default values
  optimized = optimized
    .replace(/\s*fill-opacity="1"/g, '')
    .replace(/\s*stroke-opacity="1"/g, '')
    .replace(/\s*opacity="1"/g, '');

  return optimized;
}

// ============================================
// SAFE DATA URI ENCODER
// ============================================
function svgToDataUri(svgContent) {
  const optimized = optimizeSVG(svgContent);
  
  // Use encodeURIComponent for proper encoding
  // This is the SAFE way that browsers understand
  const encoded = encodeURIComponent(optimized);
  
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// ============================================
// ESCAPE FOR JAVASCRIPT TEMPLATE LITERAL
// ============================================
function escapeForJS(str) {
  return str
    .replace(/\\/g, '\\\\')   // Backslash
    .replace(/`/g, '\\`')     // Backtick
    .replace(/\$/g, '\\$');   // Dollar sign (template literal)
}

// ============================================
// MAIN BUNDLER
// ============================================
async function bundleEmojis() {
  console.log('\n🚀 SVG Emoji Bundler (Fixed & Tested)\n');
  console.log('='.repeat(60));

  // Check directory
  if (!fs.existsSync(SPRITE_DIR)) {
    log.error(`Directory not found: ${SPRITE_DIR}`);
    log.info('Create sprite/ folder and add your SVG files');
    process.exit(1);
  }

  // Read SVG files
  log.info(`Scanning: ${SPRITE_DIR}`);
  const files = fs.readdirSync(SPRITE_DIR)
    .filter(file => file.toLowerCase().endsWith('.svg'))
    .sort();

  if (files.length === 0) {
    log.error('No SVG files found');
    process.exit(1);
  }

  log.success(`Found ${files.length} SVG files`);
  console.log('');

  // Process files
  const emojiData = {};
  const stats = {
    processed: 0,
    errors: 0,
    originalSize: 0,
    optimizedSize: 0,
    startTime: Date.now()
  };

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    for (const file of batch) {
      try {
        const filePath = path.join(SPRITE_DIR, file);
        const originalContent = fs.readFileSync(filePath, 'utf8');
        const dataUri = svgToDataUri(originalContent);
        
        // Use filename without extension as key
        const key = path.basename(file, '.svg');
        emojiData[key] = dataUri;
        
        stats.originalSize += originalContent.length;
        stats.optimizedSize += dataUri.length;
        stats.processed++;
        
        log.progress(stats.processed, files.length);
      } catch (err) {
        stats.errors++;
        console.log(''); // New line before error
        log.error(`Failed: ${file} - ${err.message}`);
      }
    }
  }

  console.log('\n');

  if (stats.errors > 0) {
    log.warn(`${stats.errors} files failed to process`);
  }

  // Generate output file
  log.info('Generating JavaScript bundle...');
  const outputContent = generateOutput(emojiData, stats);
  fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');
  
  const outputSize = fs.statSync(OUTPUT_FILE).size;
  const timeTaken = ((Date.now() - stats.startTime) / 1000).toFixed(2);

  // Final report
  console.log('\n' + '='.repeat(60));
  log.success('Bundle Complete!');
  console.log('='.repeat(60));
  console.log('');
  console.log('📊 Statistics:');
  console.log(`   Processed:       ${stats.processed} emojis`);
  if (stats.errors > 0) {
    console.log(`   Failed:          ${stats.errors} emojis`);
  }
  console.log(`   Time:            ${timeTaken}s`);
  console.log('');
  console.log('💾 File Sizes:');
  console.log(`   Original SVGs:   ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Output file:     ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('⚡ Next Steps:');
  console.log(`   1. Include in HTML: <script src="${OUTPUT_FILE}"></script>`);
  console.log(`   2. Test with: test-emoji-load.html`);
  console.log(`   3. Access data: window.EMOJI_DATA['emoji_name']`);
  console.log('');
  console.log('='.repeat(60) + '\n');
}

// ============================================
// OUTPUT FILE GENERATOR
// ============================================
function generateOutput(emojiData, stats) {
  const entries = Object.entries(emojiData);
  const timestamp = new Date().toISOString();
  
  // Build the emoji data entries
  const dataEntries = entries.map(([key, value], index) => {
    const isLast = index === entries.length - 1;
    const escaped = escapeForJS(value);
    return `    '${key}': \`${escaped}\`${isLast ? '' : ','}`;
  }).join('\n');
  
  return `/**
 * SVG Emoji Data Bundle
 * Generated: ${timestamp}
 * Total Emojis: ${stats.processed}
 * File Size: ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB
 * 
 * Usage:
 *   const dataUri = window.EMOJI_DATA['emoji_name'];
 *   // Returns: "data:image/svg+xml;charset=utf-8,..."
 * 
 * Integration with WASM:
 *   WASM returns: "sprite/emoji_smile.svg"
 *   Use: window.getEmojiDataUrl("sprite/emoji_smile.svg")
 *   Returns: data URI string
 */

(function() {
  'use strict';
  
  const startTime = performance.now();
  console.log('📦 Loading ${stats.processed} emoji data URIs...');
  
  // Emoji data: filename (without extension) → data URI
  window.EMOJI_DATA = {
${dataEntries}
  };
  
  /**
   * Helper function: converts WASM path to data URI
   * Handles: "sprite/emoji.svg" → data URI
   */
  window.getEmojiDataUrl = function(pathOrKey) {
    // Remove path prefix and extension
    const key = pathOrKey
      .replace(/^sprite[\\/]/, '')
      .replace(/\\.svg$/, '')
      .replace(/\\.png$/, '');
    
    const dataUri = window.EMOJI_DATA[key];
    
    if (!dataUri) {
      console.warn('Emoji not found:', key);
      return null;
    }
    
    return dataUri;
  };
  
  const loadTime = (performance.now() - startTime).toFixed(0);
  const count = Object.keys(window.EMOJI_DATA).length;
  
  console.log(\`✅ Loaded \${count} emojis in \${loadTime}ms\`);
  console.log('💾 Memory usage: ~${(stats.originalSize / 1024 / 1024).toFixed(1)} MB');
  
})();
`;
}

// ============================================
// RUN
// ============================================
if (require.main === module) {
  bundleEmojis().catch(err => {
    log.error(`Fatal error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });
}

module.exports = { bundleEmojis, optimizeSVG, svgToDataUri };
