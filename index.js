const Logger = require("logplease");
const ParseStream = require("./lib/parse_stream.js");

const fMP4 = {
  streamParser: undefined,
  parse: function(opts) {
    if (opts && opts.debug === true) {
      Logger.setLogLevel("DEBUG");
    } else {
      Logger.setLogLevel("INFO");
    }
    this.streamParser = new ParseStream(opts);
    return this.streamParser;
  },
  get boxes() {
    if (!this.streamParser) {
      throw new Error("Nothing parsed yet");
    }
    return this.streamParser.getBoxes();
  }
}

module.exports = fMP4;