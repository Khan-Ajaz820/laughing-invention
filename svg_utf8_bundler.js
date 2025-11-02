#!/usr/bin/env node

/**
 * SVG Emoji Bundler (UTF-8 Data URI)
 * Converts all SVG files to UTF-8 encoded data URIs (much smaller than base64!)
 * 
 * Usage: node bundle-svg-emojis.js
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const SPRITE_DIR = './sprite';           // Directory containing SVG files
const OUTPUT_FILE = './emojiData.js';    // Output JavaScript file
const BATCH_SIZE = 100;                  // Process in batches

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
// UTF-8 ENCODER FOR SVG
// ============================================
function svgToDataUri(svgContent) {
  // Clean and optimize SVG
  let optimized = svgContent
    .trim()
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .replace(/<!--.*?-->/g, '')         // Remove comments
    .replace(/>\s+</g, '><');           // Remove whitespace between tags
  
  // URL encode special characters for UTF-8 data URI
  const encoded = optimized
    .replace(/#/g, '%23')
    .replace(/"/g, "'")                 // Use single quotes (smaller)
    .replace(/\n/g, '%0A')
    .replace(/\r/g, '%0D')
    .replace(/%/g, '%25');              // Encode % first
  
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// Alternative: More aggressive encoding (if needed)
function svgToDataUriEncoded(svgContent) {
  const optimized = svgContent
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/<!--.*?-->/g, '')
    .replace(/>\s+</g, '><');
  
  // Full URI encoding
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(optimized)}`;
}

// ============================================
// MAIN BUNDLER
// ============================================
async function bundleSVGEmojis() {
  console.log('\n🚀 SVG Emoji Bundler (UTF-8) Started\n');
  console.log('='.repeat(50));
  
  // Check if sprite directory exists
  if (!fs.existsSync(SPRITE_DIR)) {
    log.error(`Directory not found: ${SPRITE_DIR}`);
    log.info('Please create the sprite/ folder and add your SVG files');
    process.exit(1);
  }

  // Read all SVG files
  log.info(`Reading SVG files from: ${SPRITE_DIR}`);
  const files = fs.readdirSync(SPRITE_DIR)
    .filter(file => file.toLowerCase().endsWith('.svg'))
    .sort();

  if (files.length === 0) {
    log.error('No SVG files found in sprite/ directory');
    process.exit(1);
  }

  log.success(`Found ${files.length} SVG files`);
  console.log('');

  // Process files
  const emojiData = {};
  let processed = 0;
  let totalOriginalSize = 0;
  let totalEncodedSize = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    for (const file of batch) {
      try {
        const filePath = path.join(SPRITE_DIR, file);
        const svgContent = fs.readFileSync(filePath, 'utf8');
        
        // Convert to UTF-8 data URI
        const dataUri = svgToDataUri(svgContent);
        
        // Use filename without extension as key
        const key = path.basename(file, '.svg');
        emojiData[key] = dataUri;
        
        totalOriginalSize += svgContent.length;
        totalEncodedSize += dataUri.length;
        processed++;
        
        log.progress(processed, files.length);
      } catch (err) {
        errors++;
        log.error(`Failed to process ${file}: ${err.message}`);
      }
    }
  }

  console.log('\n');
  
  if (errors > 0) {
    log.warn(`${errors} file(s) failed to process`);
  }

  // Generate output file
  log.info('Generating JavaScript output...');
  
  const outputContent = generateOutputFile(emojiData, {
    totalFiles: files.length,
    processedFiles: processed,
    originalSize: totalOriginalSize,
    encodedSize: totalEncodedSize,
    timestamp: new Date().toISOString()
  });

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');
  
  const outputSize = fs.statSync(OUTPUT_FILE).size;
  const outputSizeMB = (outputSize / 1024 / 1024).toFixed(2);
  const originalSizeMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
  const savingsPercent = ((1 - outputSize / (totalOriginalSize * 1.33)) * 100).toFixed(1);

  console.log('\n' + '='.repeat(50));
  log.success('Bundle complete!');
  console.log('');
  log.info(`Input files:      ${processed} SVGs`);
  log.info(`Original size:    ${originalSizeMB} MB`);
  log.info(`Output file:      ${OUTPUT_FILE}`);
  log.info(`Output size:      ${outputSizeMB} MB`);
  log.info(`Savings vs base64: ~${savingsPercent}% smaller!`);
  console.log('');
  log.success('Ready to use! Include emojiData.js in your HTML');
  console.log('='.repeat(50) + '\n');
  
  // Performance estimate
  console.log('📊 Estimated Performance:');
  console.log(`   Initial load: ~${(outputSize / 1024 / 200).toFixed(1)}s (on 200KB/s connection)`);
  console.log(`   Mosaic render: <2s (after data loaded)`);
  console.log('');
}

// ============================================
// OUTPUT FILE GENERATOR
// ============================================
function generateOutputFile(emojiData, metadata) {
  const entries = Object.entries(emojiData);
  
  return `/**
 * SVG Emoji Data Bundle (UTF-8 Encoded)
 * Auto-generated by bundle-svg-emojis.js
 * 
 * Generated: ${metadata.timestamp}
 * Total Emojis: ${metadata.processedFiles}
 * Original Size: ${(metadata.originalSize / 1024 / 1024).toFixed(2)} MB
 * Encoded Size: ${(metadata.encodedSize / 1024 / 1024).toFixed(2)} MB
 * 
 * Format: data:image/svg+xml;charset=utf-8,...
 * Much smaller than base64 encoding!
 * 
 * Usage:
 *   const dataUrl = window.EMOJI_DATA['emoji_name'];
 *   const img = new Image();
 *   img.src = dataUrl;
 */

(function() {
  'use strict';
  
  console.time('⏱️  Emoji data parse time');
  console.log('📦 Loading ${metadata.processedFiles} embedded SVG emojis (UTF-8)...');
  
  // Emoji data object
  window.EMOJI_DATA = {
${entries.map(([key, value], index) => {
    const isLast = index === entries.length - 1;
    // Escape single quotes in data URI
    const escaped = value.replace(/'/g, "\\'");
    return `    '${key}': '${escaped}'${isLast ? '' : ','}`;
  }).join('\n')}
  };
  
  // Helper function to get emoji data URL (backwards compatible)
  window.getEmojiDataUrl = function(pathOrKey) {
    // Handle both 'sprite/emoji.svg' and 'emoji' formats
    const key = pathOrKey.replace('sprite/', '').replace('.svg', '').replace('.png', '');
    return window.EMOJI_DATA[key] || null;
  };
  
  console.timeEnd('⏱️  Emoji data parse time');
  console.log('✅ SVG emoji data ready: ' + Object.keys(window.EMOJI_DATA).length + ' emojis');
  console.log('💾 Estimated memory: ~${(metadata.encodedSize / 1024 / 1024).toFixed(2)} MB');
  console.log('🎨 Emojis are UTF-8 encoded (${((1 - metadata.encodedSize / (metadata.originalSize * 1.33)) * 100).toFixed(0)}% smaller than base64!)');
  
})();
`;
}

// ============================================
// RUN
// ============================================
if (require.main === module) {
  bundleSVGEmojis()
    .catch(err => {
      log.error(`Fatal error: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { bundleSVGEmojis, svgToDataUri };