const minimist = require('minimist');
const Qjsc = require('qjsc');
const argv = minimist(process.argv.slice(2));
const path = require('path');
const fs = require('fs');

const qjsc = new Qjsc();

if (argv.help) {
  process.stdout.write(`Convert Javascript Code into Cpp source code
Usage: node js_to_c.js -s /path/to/source.js -o /path/to/dist.cc -n polyfill\n`);
  process.exit(0);
}

function strEncodeUTF16(str) {
  let buf = new ArrayBuffer(str.length*2);
  let bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

function strEncodeUTF8(str) {
  let bufView = new Uint8Array(Buffer.from(str));
  return bufView;
}

const getPolyFillHeader = (outputName) => `/*
 * Copyright (C) 2022-present The WebF authors. All rights reserved.
 */
#ifndef ${outputName.toUpperCase()}_H
#define ${outputName.toUpperCase()}_H

#include "core/executing_context.h"

void initMercury${outputName}(mercury::ExecutingContext *context);

#endif // ${outputName.toUpperCase()}_H
`;

const getPolyFillJavaScriptSource = (source) => {
  let byteBuffer = qjsc.compile(source, {
    sourceURL: 'vm://polyfill.js'
  });
  let uint8Array = Uint8Array.from(byteBuffer);
  return `namespace {size_t byteLength = ${uint8Array.length};
uint8_t bytes[${uint8Array.length}] = {${uint8Array.join(',')}}; }`;
};

const getPolyfillEvalCall = () => {
  return 'context->EvaluateByteCode(bytes, byteLength);';
}

const getPolyFillSource = (source, outputName) => `/*
* Copyright (C) 2019-2022 The Kraken authors. All rights reserved.
* Copyright (C) 2022-present The WebF authors. All rights reserved.
*/

#include "${outputName.toLowerCase()}.h"

${getPolyFillJavaScriptSource(source)}

void initMercury${outputName}(mercury::ExecutingContext *context) {
  ${getPolyfillEvalCall()}
}
  `;

  function convertJSToCpp(code, outputName) {
    return getPolyFillSource(code, outputName);
  }

let source = argv.s;
let output = argv.o;
let outputName = argv.n || 'PolyFill';

if (!source || !output) {
  console.error('-s and -o params are required');
  process.exit(1);
}

function getAbsolutePath(p) {
  if (path.isAbsolute(p)) {
    return p;
  } else {
    return path.join(__dirname, p);
  }
}

let sourcePath = getAbsolutePath(source);
let outputPath = getAbsolutePath(output);

let jsCode = fs.readFileSync(sourcePath, {encoding: 'utf-8'});

let headerSource = getPolyFillHeader(outputName);
let ccSource = convertJSToCpp(jsCode, outputName);

fs.writeFileSync(path.join(outputPath, outputName.toLowerCase() + '.h'), headerSource);
fs.writeFileSync(path.join(outputPath, outputName.toLowerCase() + '.cc'), ccSource);