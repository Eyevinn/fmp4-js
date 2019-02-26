const log = require("logplease").create("fMP4Parser", { useColors: false });

function _read4CC(bytes) {
  return String.fromCharCode(bytes[0]) + 
         String.fromCharCode(bytes[1]) + 
         String.fromCharCode(bytes[2]) +
         String.fromCharCode(bytes[3]);
}

function _readUint16(bytes) {
  return (bytes[0] << 8) +
         (bytes[1]);
}

function _readUint32(bytes) {
  return (bytes[0] << 32) +
         (bytes[1] << 16) +
         (bytes[2] << 8) + 
         (bytes[3]);
}

function _readUint64(bytes) {
  let val1 = _readUint32(bytes.slice(0, 4));
  let val2 = _readUint32(bytes.slice(4, 8));
  return (val1 * 65536) + val2;
}

function _readFixedPoint1616(bytes) {
  let val = _readUint32(bytes);
  let int = (val & 0xFFFF0000) >> 16;
  let dec = val & 0x0000FFFF;
  return parseFloat(`${int}.${dec}`);
}

function _readFixedPoint88(bytes) {
  let val = _readUint16(bytes);
  let int = (val & 0xFF00) >> 8;
  let dec = val & 0x00FF;
  return parseFloat(`${int}.${dec}`);
}

function _readString(bytes) {
  let s = "";
  let i = 0;
  while (bytes[i] !== 0) {
    s += String.fromCharCode(bytes[i]);
    i++;
  }
  return s;
}

function _parseChildBox(type, data) {
  let children = [];
  let pos = 0;
  while (pos < data.length - MP4BOX_HDR_SIZE) {
    let size = _readUint32(data.slice(pos, pos + 4));
    let type = _read4CC(data.slice(pos + 4, pos + 8));
    let box = new MP4Box(size, type);
    box.data = new Uint8Array(box.hdr.size);
    box.data.set(data.slice(pos + MP4BOX_HDR_SIZE, pos + MP4BOX_HDR_SIZE + box.hdr.size));
    children.push(box.parse());
    pos += size;
  }
  return {
    children
  }  
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
      major_brand: brand,
      minor_version: version,
      compatible_brands: compat
    };
  },
  'moov': function (data) {
    return _parseChildBox('moov', data);
  },
  'mvex': function (data) {
    return _parseChildBox('mvex', data);
  },
  'trex': function (data) {
    return {
      type: 'trex', version: data[0],
      track_ID: _readUint32(data.slice(4, 8)),
      default_sample_description_index: _readUint32(data.slice(8, 12)),
      default_sample_duration: _readUint32(data.slice(12, 16)),
      default_sample_size: _readUint32(data.slice(16, 20)),
      default_sample_flags: _readUint32(data.slice(20, 24)),
    }
  },
  'mvhd': function (data) {
    let version = data[0];
    let flags; // 24-bit
    return {
      type: 'mvhd', version,
      creation_time: (version !== 1) ? _readUint32(data.slice(4, 8)) : undefined, 
      modification_time: (version !== 1) ? _readUint32(data.slice(8, 12)) : undefined,
      timescale: (version !== 1) ? _readUint32(data.slice(12, 16)) : undefined,
      duration: (version !== 1) ? _readUint32(data.slice(16, 20)) : undefined,
      rate: _readFixedPoint1616(data.slice(20, 24)),
      volume: _readFixedPoint88(data.slice(24, 26)),
      next_track_id: _readUint32(data.slice(104, 108))
    };
  },
  'trak': function (data) {
    return _parseChildBox('trak', data);
  },
  'tkhd': function (data) {
    let version = data[0];
    let flags; // 24-bit
    return {
      type: 'tkhd', version,
      creation_time: (version !== 1) ? _readUint32(data.slice(4, 8)) : undefined, 
      modification_time: (version !== 1) ? _readUint32(data.slice(8, 12)) : undefined,
      track_id: _readUint32(data.slice(12, 16)),
      duration: (version !== 1) ? _readUint32(data.slice(20, 24)) : undefined,
      width: _readFixedPoint1616(data.slice(76, 80)),
      height: _readFixedPoint1616(data.slice(80, 84))
    }
  },
  'mdia': function (data) {
    return _parseChildBox('mdia', data);
  },
  'mdhd': function (data) {
    let version = data[0];
    return {
      type: 'mdhd', version,
      creation_time: (version !== 1) ? _readUint32(data.slice(4, 8)) : _readUint64(data.slice(4, 12)), 
      modification_time: (version !== 1) ? _readUint32(data.slice(8, 12)) : _readUint64(data.slice(12, 20)),
      timescale: (version !== 1) ? _readUint32(data.slice(12, 16)) : _readUint32(data.slice(20, 24)),
      duration: (version !== 1) ? _readUint32(data.slice(16, 20)) : _readUint64(data.slice(24, 32)),
    }
  },
  'hdlr': function (data) {
    let version = data[0];
    return {
      type: 'hdlr', version,
      pre_defined: 0,
      handler_type: _readUint32(data.slice(8, 12)),
      name: _readString(data.slice(24))
    }
  },
  'minf': function (data) {
    return _parseChildBox('minf', data);
  },
  'nmhd': function (data) {
    let version = data[0];
    return {
      type: 'nmhd', version
    };
  },
  'elng': function (data) {
    return {
      type: 'elng',
      extended_language: _readString(data.slice(4))
    };
  },
  'stbl': function (data) {
    return _parseChildBox('stbl', data);
  },
  'dinf': function (data) {
    return _parseChildBox('dinf', data);
  },
  'dref': function (data) {
    let version = data[0];
    let count = _readUint32(data.slice(4, 8));
    let entries = [];
    let pos = 8;
    for (let i = 0; i < count; i++) {
      let size = _readUint32(data.slice(pos, pos + 4));
      let type = _read4CC(data.slice(pos + 4, pos + 8));
      if (type === 'url ') {
        entries.push({
          location: _readString(data.slice(pos + 8 + 4)) 
        });
      }
      pos += size;
    }
    return {
      type: 'dref', version,
      entry_count: count,
      entries,
    };
  },
  'moof': function (data) {
    return _parseChildBox('moof', data);
  },
  'mfhd': function (data) {
    return {
      type: 'mfhd', version: data[0],
      sequence_number: _readUint32(data.slice(4, 8))
    }
  },
  'traf': function (data) {
    return _parseChildBox('traf', data);
  },
};

const MP4Box = function constructor(size, type) {
  return {
    hdr: {
      size,
      type,
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
    let size = _readUint32(chunk.slice(pos, pos + 4));
    let type = _read4CC(chunk.slice(pos + 4, pos + 8));
    let box = new MP4Box(size, type);

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