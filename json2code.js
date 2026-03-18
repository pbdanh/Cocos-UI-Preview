#!/usr/bin/env node
/**
 * json2code.js — Convert layout JSON to UIBuilder code
 *
 * Usage:
 *   node json2code.js --input endgame-preview.json
 *   node json2code.js --input endgame-preview.json --output EndGameLayer.js --resources res_endgame --layer EndGameLayer
 *   node json2code.js --input endgame-preview.json --width 873 --height 643 --no-wrap
 *
 * Options:
 *   --input, -i      Input JSON file path (required)
 *   --output, -o     Output JS file path (default: stdout)
 *   --resources, -r  Resource map variable name (e.g., "res_endgame")
 *   --layer, -l      Layer class name (default: "GeneratedLayer")
 *   --width, -w      Design width (default: 873)
 *   --height, -h     Design height (default: 643)
 *   --no-wrap        Don't wrap in Layer.extend
 *   --no-anims       Skip animations
 *   --no-comments    Skip comments
 *   --raw            Use raw cc.* export instead of UIBuilder
 */

var fs = require('fs');
var path = require('path');

// Load LayoutEngine (single source of truth)
var enginePath = path.join(__dirname, 'ui-builder', '_layout_engine.js');
var LayoutEngine = require(enginePath);

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
    anims: true,
    comments: true,
    raw: false
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
        case '--no-anims': opts.anims = false; break;
        case '--no-comments': opts.comments = false; break;
        case '--raw': opts.raw = true; break;
        case '--help':
            console.log('Usage: node json2code.js --input <file.json> [options]');
            console.log('');
            console.log('Options:');
            console.log('  --input, -i      Input JSON file (required)');
            console.log('  --output, -o     Output JS file (default: stdout)');
            console.log('  --resources, -r  Resource map variable (e.g., "res_endgame")');
            console.log('  --layer, -l      Layer class name (default: "GeneratedLayer")');
            console.log('  --width, -w      Design width (default: 873)');
            console.log('  --height, -h     Design height (default: 643)');
            console.log('  --no-wrap        Don\'t wrap in Layer.extend');
            console.log('  --no-anims       Skip animations');
            console.log('  --no-comments    Skip comments');
            console.log('  --raw            Use raw cc.* export');
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

// Export code
var code;
if (opts.raw) {
    code = engine.exportCocosCode({
        includeAnimations: opts.anims
    });
} else {
    code = engine.exportUIBuilderCode({
        resourceMapVar: opts.resources,
        layerName: opts.layer,
        wrapInLayer: opts.wrap,
        includeAnimations: opts.anims,
        includeComments: opts.comments
    });
}

// Output
if (opts.output) {
    var outputPath = path.resolve(opts.output);
    fs.writeFileSync(outputPath, code, 'utf8');
    console.log('✅ Generated ' + code.split('\n').length + ' lines → ' + outputPath);
} else {
    console.log(code);
}
