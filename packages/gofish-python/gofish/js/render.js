#!/usr/bin/env node

/**
 * Node.js bridge script for rendering GoFish charts.
 * 
 * This script:
 * 1. Reads chart spec and Arrow data from stdin (JSON)
 * 2. Deserializes Arrow data
 * 3. Executes GoFish chart rendering
 * 4. Returns HTML string to stdout
 */

import { JSDOM } from 'jsdom';
import * as Arrow from 'apache-arrow';
import * as GoFish from 'gofish-graphics';

// Read input from stdin
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);
    const { spec, arrowData, options } = input;

    // Create virtual DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="chart-container"></div></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable',
    });

    const window = dom.window;
    const document = window.document;
    global.window = window;
    global.document = document;
    global.HTMLElement = window.HTMLElement;

    // Deserialize Arrow data
    let data;
    if (arrowData) {
      const arrowBuffer = Buffer.from(arrowData, 'base64');
      const table = Arrow.tableFromIPC(arrowBuffer);
      // Convert Arrow table to array of objects
      const numRows = table.numRows;
      const numCols = table.numCols;
      const columns = table.schema.fields.map((field, i) => {
        const column = table.getChildAt(i);
        const values = column.toArray();
        return {
          name: field.name,
          type: field.type,
          values: values,
        };
      });

      data = [];
      for (let i = 0; i < numRows; i++) {
        const row = {};
        columns.forEach((col) => {
          let value = col.values[i];
          // Convert BigInt to Number if needed
          // Arrow can return BigInt for large integers, but JS Math functions need regular numbers
          if (typeof value === 'bigint') {
            value = Number(value);
          } else if (value !== null && value !== undefined) {
            // Check if it's a numeric Arrow type that might need conversion
            const typeStr = col.type ? col.type.toString() : '';
            if (typeStr.includes('Int64') || typeStr.includes('UInt64') || 
                typeStr.includes('Int32') || typeStr.includes('UInt32')) {
              // Ensure it's a regular number, not BigInt
              value = Number(value);
            }
          }
          row[col.name] = value;
        });
        data.push(row);
      }
    } else {
      data = spec.data || [];
    }

    // Reconstruct chart from spec
    const container = document.getElementById('chart-container');
    
    // Build operators from spec
    const operators = spec.operators || [];
    
    // Build mark from spec
    const markSpec = spec.mark || {};
    
    // Import GoFish functions
    const { chart, spread, stack, derive, group, scatter, rect, circle, line, area, scaffold } = GoFish;

    // Reconstruct operators
    // Note: derive operators are executed in Python, so we skip them here
    const reconstructedOps = operators
      .filter((op) => op.type !== 'derive') // Skip derive - data already transformed
      .map((op) => {
        if (op.type === 'spread') {
          const { field, ...opts } = op;
          if (field) {
            return spread(field, opts);
          } else {
            return spread(opts);
          }
        } else if (op.type === 'stack') {
          const { field, dir, ...opts } = op;
          return stack(field, { dir, ...opts });
        } else if (op.type === 'group') {
          return group(op.field);
        } else if (op.type === 'scatter') {
          const { field, x, y, ...opts } = op;
          return scatter(field, { x, y, ...opts });
        }
        return null;
      })
      .filter(Boolean);

    // Reconstruct mark
    let reconstructedMark;
    if (markSpec.type === 'rect') {
      reconstructedMark = rect(markSpec);
    } else if (markSpec.type === 'circle') {
      reconstructedMark = circle(markSpec);
    } else if (markSpec.type === 'line') {
      reconstructedMark = line(markSpec);
    } else if (markSpec.type === 'area') {
      reconstructedMark = area(markSpec);
    } else if (markSpec.type === 'scaffold') {
      reconstructedMark = scaffold(markSpec);
    } else {
      throw new Error(`Unknown mark type: ${markSpec.type}`);
    }

    // Build and render chart
    const chartBuilder = chart(data, spec.options || {});
    const node = chartBuilder.flow(...reconstructedOps).mark(reconstructedMark);

    // Render to container
    const renderOptions = {
      w: options.w || 800,
      h: options.h || 600,
      axes: options.axes || false,
      debug: options.debug || false,
    };

    node.render(container, renderOptions);

    // Wait a bit for SolidJS to render (hacky but necessary)
    setTimeout(() => {
      const html = container.innerHTML;
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 20px; font-family: sans-serif; }
    svg { display: block; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
      
      process.stdout.write(JSON.stringify({ success: true, html: fullHtml }));
      process.exit(0);
    }, 100);
  } catch (error) {
    process.stderr.write(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }));
    process.exit(1);
  }
});

