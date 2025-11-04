// svgo.config.js - Ultra-optimized for Emoji Mosaics (no warnings)

export default {
  multipass: true, // Multiple optimization passes for maximum compression

  plugins: [
    // Base optimization preset
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false, // Keep IDs for sprite references

          // Optimize path data
          convertPathData: {
            floatPrecision: 1,
            transformPrecision: 2,
            removeUseless: true,
            straightCurves: true,
            lineShorthands: true,
            curveSmoothShorthands: true,
            makeArcs: {
              threshold: 2.5,
              tolerance: 0.5,
            },
          },

          // Numeric cleanup
          cleanupNumericValues: {
            floatPrecision: 1,
          },

          // Transform cleanup
          convertTransform: {
            degPrecision: 1,
            floatPrecision: 2,
            transformPrecision: 3,
            matrixToTransform: true,
            shortTranslate: true,
            shortScale: true,
            shortRotate: true,
            removeUseless: true,
            collapseIntoOne: true,
            leadingZero: true,
            negativeExtraSpace: false,
          },
        },
      },
    },

    // Important: keep viewBox intact (placed separately, no warnings now)
    { name: 'removeViewBox', active: false },

    // Remove unnecessary metadata
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'removeTitle',
    'removeDesc',

    // Aggressive attribute cleanup
    'cleanupAttrs',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',

    // Style optimization
    { name: 'inlineStyles', params: { onlyMatchedOnce: false } },
    { name: 'minifyStyles', params: { usage: { force: true } } },
    'mergeStyles',

    // Color optimization
    {
      name: 'convertColors',
      params: {
        shorthex: true,
        shortname: true,
        currentColor: true,
      },
    },

    // Path and shape optimizations
    'convertShapeToPath',
    'convertEllipseToCircle',
    { name: 'mergePaths', params: { force: true, noSpaceAfterFlags: true } },
    'convertPathData',

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
    'removeXMLNS',
  ],

  js2svg: {
    indent: 0,
    pretty: false,
  },
};
