const log = require("logplease").create("fMP4Parser", { useColors: false });

function _read4CC(bytes) {
  return String.fromCharCode(bytes[0]) + 
         String.fromCharCode(bytes[1]) + 
         String.fromCharCode(bytes[2]) +
         String.fromCharCode(bytes[3]);
}

function _readUint32(bytes) {
  return (bytes[0] << 32) +
         (bytes[1] << 16) +
         (bytes[2] << 8) + 
         (bytes[3]);
}

const MP4BoxParser = {
  'ftyp': function (data) {
    let brand = _read4CC(data.slice(0, 4));
    let version = _readUint32(data.slice(4, 8));
    let compat = [];
    let pos = 8;
    while (pos < data.length - MP4BOX_HDR_SIZE) {
      compat.push(_read4CC(data.slice(pos, pos + 4)));
      pos += 4;
    }
    return {
      brand,
      version,
      compat
    };
  },
  'moov': function (data) {
    let children = [];
    let pos = 0;
    while (pos < data.length - MP4BOX_HDR_SIZE) {
      let size = _readUint32(data.slice(pos, pos + 4));
      let type = _read4CC(data.slice(pos + 4, pos + 8));
      if (MP4BoxParser[type]) {
        children.push(MP4BoxParser[type](data.slice(pos + 8, pos + 8 + size)));
      } else {
        children.push({ size, type });
      }
      pos += size;
    }
    return {
      children
    };
  },
  'mvhd': function (data) {
    let version = data[0];
    let flags; // 24-bit
    let create;
    let modified;
    if (version !== 1) {
      create = _readUint32(data.slice(4, 8));
      modified = _readUint32(data.slice(8, 12));  
    }
    return {
      size: data.length,
      type: 'mvhd',
      version,
      create, 
      modified
    };
  },
  'trak': function (data) {
    return {
      size: data.length,
      type: 'trak',
    }
  }
};

const MP4Box = function constructor() {
  return {
    hdr: {
      size: undefined,
      type: undefined
    },
    data: undefined,
    parse: function() {
      let payload = {
        hdr: this.hdr,
      };
      if (MP4BoxParser[this.hdr.type]) {
        payload[this.hdr.type] = MP4BoxParser[this.hdr.type](this.data);
      }
      return payload;
    }
  };
}

const MP4BOX_HDR_SIZE = 8;

const fMP4Parser = function constructor() {
  this.size = 0;
  this.bufferedData = undefined;
  this.boxes = [];
}

fMP4Parser.prototype.getBoxes = function getBoxes() {
  return this.boxes;
};

fMP4Parser.prototype.push = function push(chunk, lastChunk) {
  this.size += chunk.length;
  let chunkToParse = chunk;

  if (this.bufferedData && this.bufferedData.length > 0) {
    chunkToParse = new Uint8Array(this.bufferedData.length + chunk.length);
    chunkToParse.set(this.bufferedData);
    chunkToParse.set(chunk, this.bufferedData.length);
    this.bufferedData = undefined;
  }
  const remainBytes = this._parseBoxes(chunkToParse);
  if (remainBytes > 0) {
    this.bufferedData = chunkToParse.slice(-remainBytes);
  }
};

fMP4Parser.prototype._parseBoxes = function _parseBoxes(chunk) {
  let len = chunk.length;
  let pos = 0;

  while (pos < len) {
    log.debug(`pos=${pos}, len=${len}`);
    let box = new MP4Box();
    box.hdr.size = _readUint32(chunk.slice(pos, pos + 4));
    box.hdr.type = _read4CC(chunk.slice(pos + 4, pos + 8));

    if (pos + box.hdr.size > len) {
      // We need more data
      return len - pos;
    } else {
      box.data = new Uint8Array(box.hdr.size);
      box.data.set(chunk.slice(pos + MP4BOX_HDR_SIZE, pos + MP4BOX_HDR_SIZE + box.hdr.size));
      this.boxes.push(box);
    }
    pos += box.hdr.size;
  }
};

module.exports = fMP4Parser;