Install SVGO

npm install -g svgo

Optimize all SVGs with aggressive settings

svgo -f ./sprite -o ./output-folder --config=svgo-config.js
Create a svgo-config.js file:
module.exports = {
multipass: true,
plugins: [
'preset-default',
'removeDoctype',
'removeXMLProcInst',
'removeComments',
'removeMetadata',
'removeEditorsNSData',
'cleanupAttrs',
'mergeStyles',
'inlineStyles',
'minifyStyles',
'cleanupIds',
'removeUselessDefs',
'cleanupNumericValues',
'convertColors',
'removeUnknownsAndDefaults',
'removeNonInheritableGroupAttrs',
'removeUselessStrokeAndFill',
'removeViewBox',
'cleanupEnableBackground',
'removeHiddenElems',
'removeEmptyText',
'convertShapeToPath',
'convertEllipseToCircle',
'moveElemsAttrsToGroup',
'moveGroupAttrsToElems',
'collapseGroups',
'convertPathData',
'convertTransform',
'removeEmptyAttrs',
'removeEmptyContainers',
'mergePaths',
'removeUnusedNS',
'sortDefsChildren',
'removeTitle',
'removeDesc'
]
};
