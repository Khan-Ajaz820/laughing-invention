// svgo.config.js - Ultra-optimized for Emoji Mosaics
// Works perfectly in GitHub Actions (ESM syntax)

export default {
  multipass: true, // Run optimizations multiple times for maximum compression

  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // CRITICAL: Keep these for proper rendering
          removeViewBox: false, // Required for scaling
          cleanupIds: false, // Keep IDs for sprite usage

          // Override defaults for mosaic optimization
          convertPathData: {
            floatPrecision: 1, // Reduce decimal places (HUGE size savings)
            transformPrecision: 2,
            removeUseless: true,
            straightCurves: true, // Simplify curves invisible at small sizes
            lineShorthands: true,
            curveSmoothShorthands: true,
            makeArcs: {
              threshold: 2.5,
              tolerance: 0.5,
            },
          },

          cleanupNumericValues: {
            floatPrecision: 1, // Maximum compression for small sizes
          },

          convertTransform: {
            degPrecision: 1, // Angle precision
            floatPrecision: 2,
            transformPrecision: 3,
            matrixToTransform: true,
            shortTranslate: true,
            shortScale: true,
            shortRotate: true,
            removeUseless: true,
            collapseIntoOne: true, // Combine transforms
            leadingZero: true,
            negativeExtraSpace: false,
          },
        },
      },
    },

    // Remove ALL unnecessary metadata
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'removeTitle', // Not needed in mosaic
    'removeDesc', // Not needed in mosaic

    // Aggressive attribute cleanup
    'cleanupAttrs',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',

    // Style optimization
    {
      name: 'inlineStyles',
      params: { onlyMatchedOnce: false },
    },
    {
      name: 'minifyStyles',
      params: {
        usage: { force: true }, // Aggressive style minification
      },
    },
    'mergeStyles',

    // Color optimization
    {
      name: 'convertColors',
      params: {
        shorthex: true, // #ffffff -> #fff
        shortname: true, // Use color names when shorter
        currentColor: true,
      },
    },

    // Path optimization
    'convertShapeToPath',
    'convertEllipseToCircle',
    {
      name: 'mergePaths',
      params: { force: true, noSpaceAfterFlags: true },
    },
    'convertPathData', // Already configured above

    // Group and structure optimization
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    'sortDefsChildren',

    // Remove empty/useless elements
    'removeEmptyAttrs',
    'removeEmptyText',
    'removeEmptyContainers',
    'removeHiddenElems',
    'removeUselessDefs',
    'removeUnusedNS',

    // Cleanup
    'cleanupEnableBackground',
    'cleanupIds',
    'removeRasterImages',

    // Final optimization pass
    'removeXMLNS',
  ],

  // Additional options
  js2svg: {
    indent: 0,
    pretty: false,
  },
};
