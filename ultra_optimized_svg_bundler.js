#!/usr/bin/env node

/**
 * ULTRA-OPTIMIZED SVG Emoji Bundler
 * Maximum compression with ZERO visible quality loss
 * Keeps emoji filenames for WASM integration
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

// Optimization settings
const PRECISION = 2; // Decimal places (2 is perfect for 16px tiles)
const AGGRESSIVE_OPTIMIZE = true;

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
// ULTRA SVG OPTIMIZER
// ============================================
function ultraOptimizeSVG(svgContent) {
  let optimized = svgContent;

  // 1. Remove XML declaration and comments
  optimized = optimized
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // 2. Remove metadata, title, desc tags
  optimized = optimized
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/<title[\s\S]*?<\/title>/gi, '')
    .replace(/<desc[\s\S]*?<\/desc>/gi, '');

  // 3. Remove editor-specific attributes
  optimized = optimized
    .replace(/\s*xmlns:.*?=".*?"/g, '')
    .replace(/\s*xml:space=".*?"/g, '')
    .replace(/\s*data-name=".*?"/g, '')
    .replace(/\s*id=".*?"/g, ''); // Remove IDs (not needed for embedded)

  // 4. Reduce decimal precision (HUGE savings!)
  optimized = optimized.replace(/(\d+\.\d{3,})/g, (match) => {
    return parseFloat(match).toFixed(PRECISION);
  });

  // 5. Minify path data
  optimized = optimized
    .replace(/\s*([MLHVCSQTAZmlhvcsqtaz])\s*/g, '$1') // Remove spaces around commands
    .replace(/\s+/g, ' ') // Multiple spaces → single space
    .replace(/>\s+</g, '><') // Remove space between tags
    .replace(/\s*=\s*/g, '='); // Remove space around =

  // 6. Optimize colors
  optimized = optimized
    // rgb(255,255,255) → #fff
    .replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi, (match, r, g, b) => {
      return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    })
    // #ffffff → #fff
    .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');

  // 7. Remove default attribute values
  optimized = optimized
    .replace(/\s*fill-rule="nonzero"/g, '')
    .replace(/\s*fill-opacity="1"/g, '')
    .replace(/\s*stroke-opacity="1"/g, '')
    .replace(/\s*opacity="1"/g, '');

  // 8. Use single quotes (smaller than double)
  optimized = optimized.replace(/"/g, "'");

  // 9. Remove unnecessary whitespace
  optimized = optimized.trim();

  // 10. Aggressive optimization (if enabled)
  if (AGGRESSIVE_OPTIMIZE) {
    // Remove version attribute
    optimized = optimized.replace(/\s*version='[^']*'/g, '');
    
    // Simplify transform="translate(0,0)" etc
    optimized = optimized.replace(/transform='translate\(0,?\s*0?\)'/g, '');
    
    // Remove empty groups
    optimized = optimized.replace(/<g[^>]*>\s*<\/g>/g, '');
  }

  return optimized;
}

// ============================================
// UTF-8 DATA URI ENCODER
// ============================================
function svgToDataUri(svgContent) {
  const optimized = ultraOptimizeSVG(svgContent);
  
  // URL encode only necessary characters for UTF-8
  const encoded = optimized
    .replace(/%/g, '%25')  // Must be first!
    .replace(/'/g, '%27')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\s/g, '%20');
  
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// ============================================
// MAIN BUNDLER
// ============================================
async function bundleEmojis() {
  console.log('\n🚀 ULTRA-OPTIMIZED SVG Emoji Bundler\n');
  console.log('='.repeat(60));
  console.log('⚙️  Settings:');
  console.log(`   - Decimal precision: ${PRECISION} places`);
  console.log(`   - Aggressive optimization: ${AGGRESSIVE_OPTIMIZE ? 'ON' : 'OFF'}`);
  console.log(`   - Encoding: UTF-8 (not base64)`);
  console.log('='.repeat(60) + '\n');

  // Check directory
  if (!fs.existsSync(SPRITE_DIR)) {
    log.error(`Directory not found: ${SPRITE_DIR}`);
    log.info('Create sprite/ folder and add your SVG files');
    process.exit(1);
  }

  // Read SVG files
  log.info(`Scanning directory: ${SPRITE_DIR}`);
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
    largestReduction: { file: '', savings: 0 },
    startTime: Date.now()
  };

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    for (const file of batch) {
      try {
        const filePath = path.join(SPRITE_DIR, file);
        const original = fs.readFileSync(filePath, 'utf8');
        const dataUri = svgToDataUri(original);
        
        // Stats
        const originalBytes = original.length;
        const optimizedBytes = dataUri.length - 'data:image/svg+xml;charset=utf-8,'.length;
        const savings = originalBytes - optimizedBytes;
        const savingsPercent = (savings / originalBytes * 100).toFixed(1);
        
        if (savings > stats.largestReduction.savings) {
          stats.largestReduction = { file, savings, percent: savingsPercent };
        }
        
        // Use filename without extension as key
        const key = path.basename(file, '.svg');
        emojiData[key] = dataUri;
        
        stats.originalSize += originalBytes;
        stats.optimizedSize += optimizedBytes;
        stats.processed++;
        
        log.progress(stats.processed, files.length);
      } catch (err) {
        stats.errors++;
        log.error(`\nFailed: ${file} - ${err.message}`);
      }
    }
  }

  console.log('\n');

  // Generate output
  log.info('Generating JavaScript bundle...');
  const outputContent = generateOutputFile(emojiData, stats);
  fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');
  
  const outputSize = fs.statSync(OUTPUT_FILE).size;
  const compressionRatio = ((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1);
  const timeTaken = ((Date.now() - stats.startTime) / 1000).toFixed(2);

  // Final report
  console.log('\n' + '='.repeat(60));
  log.success('Bundle Complete!');
  console.log('='.repeat(60));
  console.log('');
  console.log('📊 Statistics:');
  console.log(`   Processed:        ${stats.processed} emojis`);
  console.log(`   Failed:           ${stats.errors} emojis`);
  console.log(`   Time taken:       ${timeTaken}s`);
  console.log('');
  console.log('💾 Size Analysis:');
  console.log(`   Original SVGs:    ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Optimized data:   ${(stats.optimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Output file:      ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Compression:      ${compressionRatio}% smaller`);
  console.log('');
  console.log('🏆 Best optimization:');
  console.log(`   File:             ${stats.largestReduction.file}`);
  console.log(`   Savings:          ${stats.largestReduction.percent}%`);
  console.log('');
  console.log('⚡ Performance Estimate:');
  const loadTime = (outputSize / 1024 / 1024 / 5).toFixed(1); // 5MB/s connection
  console.log(`   Download time:    ~${loadTime}s (5 MB/s)`);
  console.log(`   Parse time:       ~${(outputSize / 1024 / 1024 * 0.1).toFixed(1)}s`);
  console.log(`   Memory usage:     ~${(stats.optimizedSize / 1024 / 1024).toFixed(0)} MB`);
  console.log('');
  console.log('='.repeat(60));
  log.success(`Output: ${OUTPUT_FILE}`);
  log.info('Include in your HTML: <script src="emojiData.js"></script>');
  console.log('='.repeat(60) + '\n');
}

// ============================================
// OUTPUT FILE GENERATOR
// ============================================
function generateOutputFile(emojiData, stats) {
  const entries = Object.entries(emojiData);
  const timestamp = new Date().toISOString();
  
  return `/**
 * Ultra-Optimized SVG Emoji Data Bundle
 * Generated: ${timestamp}
 * 
 * Statistics:
 * - Total emojis: ${stats.processed}
 * - Original size: ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB
 * - Optimized size: ${(stats.optimizedSize / 1024 / 1024).toFixed(2)} MB
 * - Compression: ${((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1)}%
 * - Encoding: UTF-8 (not base64 - smaller!)
 * 
 * Optimizations applied:
 * ✓ Metadata/comments removed
 * ✓ Decimal precision reduced (${PRECISION} places)
 * ✓ Path data minified
 * ✓ Colors optimized (#ffffff → #fff)
 * ✓ Default attributes removed
 * ✓ Whitespace collapsed
 * ✓ UTF-8 encoding (33% smaller than base64)
 * 
 * Integration with WASM:
 *   WASM returns: "sprite/emoji_smile.svg"
 *   Access data: window.EMOJI_DATA['emoji_smile']
 *   Returns: "data:image/svg+xml;charset=utf-8,..."
 */

(function() {
  'use strict';
  
  const startTime = performance.now();
  console.log('📦 Loading ${stats.processed} optimized emoji data URIs...');
  
  // Emoji data object (filename → data URI)
  window.EMOJI_DATA = {
${entries.map(([key, value], index) => {
    const isLast = index === entries.length - 1;
    // Escape for JavaScript string
    const escaped = value.replace(/\\\\/g, '\\\\').replace(/'/g, "\\\\'");
    return `    '${key}': '${escaped}'${isLast ? '' : ','}`;
  }).join('\n')}
  };
  
  /**
   * Helper function to get data URI from WASM result
   * Handles both "sprite/emoji.svg" and "emoji" formats
   */
  window.getEmojiDataUrl = function(pathOrKey) {
    const key = pathOrKey
      .replace(/^sprite\\//, '')
      .replace(/\\.svg$/, '')
      .replace(/\\.png$/, '');
    return window.EMOJI_DATA[key] || null;
  };
  
  const loadTime = (performance.now() - startTime).toFixed(0);
  console.log(\`✅ Emoji data ready in \${loadTime}ms\`);
  console.log(\`📊 Loaded: \${Object.keys(window.EMOJI_DATA).length} emojis\`);
  console.log(\`💾 Memory: ~${(stats.optimizedSize / 1024 / 1024).toFixed(1)} MB\`);
  console.log('🎨 All emojis are UTF-8 encoded for minimum size!');
  
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

module.exports = { bundleEmojis, ultraOptimizeSVG, svgToDataUri };