// Copyright 2019 Eyevinn Technology. All rights reserved
// Use of this source code is governed by a MIT License
// license that can be found in the LICENSE file.
// Author: Jonas Birme (Eyevinn Technology)

const Writable = require("stream").Writable;
const fMP4Parser = require("./fmp4_parser.js");

class ParseStream extends Writable {
  constructor(opts) {
    super(opts);
    this.parser = new fMP4Parser();
  }
}

ParseStream.prototype._write = function(chunk, encoding, next) {
  //console.log("_write:" + chunk.length);
  let err;

  try {
    this.parser.push(chunk, false);
  } catch (parserError) {
    err = new Error(`Failed to parse chunk: ${parserError}`);
  }
  next(err);
};

ParseStream.prototype.getBoxes = function getBoxes() {
  return this.parser.getBoxes();
};

module.exports = ParseStream;