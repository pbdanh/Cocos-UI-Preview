#!/usr/bin/env node
/**
 * json2code.js — Convert layout JSON to UIBuilder adaptive code
 *
 * Usage:
 *   node json2code.js --input preview.json
 *   node json2code.js --input preview.json --output PreviewLayer.js --resources res_preview --layer PreviewLayer
 *   node json2code.js --input preview.json --width 873 --height 643 --no-wrap
 *
 * Options:
 *   --input, -i      Input JSON file path (required)
 *   --output, -o     Output JS file path (default: stdout)
 *   --resources, -r  Resource map variable name (e.g., "res_preview")
 *   --layer, -l      Layer class name (default: "GeneratedLayer")
 *   --width, -w      Design width (default: 873)
 *   --height, -h     Design height (default: 643)
 *   --no-wrap        Don't wrap in Layer.extend
 *   --no-comments    Skip comments
 */

var fs = require('fs');
var path = require('path');

// Load LayoutEngine (core + export)
var enginePath = path.join(__dirname, 'layout-engine', '_layout_engine.js');
var LayoutEngine = require(enginePath);

// Load export module (adds exportAdaptiveCode to prototype)
require(path.join(__dirname, 'layout-engine', '_layout_engine_export.js'));

// Parse CLI arguments
var args = process.argv.slice(2);
var opts = {
    input: null,
    output: null,
    resources: '',
    layer: 'GeneratedLayer',
    width: 873,
    height: 643,
    wrap: true,
    comments: true
};

for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    switch (arg) {
        case '--input': case '-i': opts.input = args[++i]; break;
        case '--output': case '-o': opts.output = args[++i]; break;
        case '--resources': case '-r': opts.resources = args[++i]; break;
        case '--layer': case '-l': opts.layer = args[++i]; break;
        case '--width': case '-w': opts.width = parseInt(args[++i], 10); break;
        case '--height': case '-h': opts.height = parseInt(args[++i], 10); break;
        case '--no-wrap': opts.wrap = false; break;
        case '--no-comments': opts.comments = false; break;
        case '--help':
            console.log('Usage: node json2code.js --input <file.json> [options]');
            console.log('');
            console.log('Options:');
            console.log('  --input, -i      Input JSON file (required)');
            console.log('  --output, -o     Output JS file (default: stdout)');
            console.log('  --resources, -r  Resource map variable (e.g., "res_preview")');
            console.log('  --layer, -l      Layer class name (default: "GeneratedLayer")');
            console.log('  --width, -w      Design width (default: 873)');
            console.log('  --height, -h     Design height (default: 643)');
            console.log('  --no-wrap        Don\'t wrap in Layer.extend');
            console.log('  --no-comments    Skip comments');
            process.exit(0);
            break;
        default:
            // If no flag, treat as input file
            if (!arg.startsWith('-') && !opts.input) {
                opts.input = arg;
            }
    }
}

if (!opts.input) {
    console.error('Error: --input <file.json> is required');
    console.error('Run with --help for usage');
    process.exit(1);
}

// Read and parse JSON
var inputPath = path.resolve(opts.input);
if (!fs.existsSync(inputPath)) {
    console.error('Error: File not found: ' + inputPath);
    process.exit(1);
}

var jsonStr = fs.readFileSync(inputPath, 'utf8');
var jsonData;
try {
    jsonData = JSON.parse(jsonStr);
} catch (e) {
    console.error('Error: Invalid JSON: ' + e.message);
    process.exit(1);
}

// Process through LayoutEngine
var engine = new LayoutEngine();
engine.buildTree(jsonData);
engine.computeLayout(opts.width, opts.height);

// Export adaptive code
var code = engine.exportAdaptiveCode({
    resourceMapVar: opts.resources,
    layerName: opts.layer,
    wrapInLayer: opts.wrap,
    includeComments: opts.comments
});

// Output
if (opts.output) {
    var outputPath = path.resolve(opts.output);
    fs.writeFileSync(outputPath, code, 'utf8');
    console.log('✅ Generated ' + code.split('\n').length + ' lines → ' + outputPath);
} else {
    console.log(code);
}
