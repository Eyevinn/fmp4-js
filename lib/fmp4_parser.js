// Copyright 2019 Eyevinn Technology. All rights reserved
// Use of this source code is governed by a MIT License
// license that can be found in the LICENSE file.
// Author: Jonas Rydholm Birme (Eyevinn Technology)
const log = require("logplease").create("fMP4Parser", { useColors: false });

function _bytesToHex(data) {
  let s = '', h = '0123456789abcdef';

  data.forEach(v => { s += h[v >> 4] + h[v & 15]; })
  return s;
}

function _read4CC(bytes) {
  return String.fromCharCode(bytes[0]) + 
         String.fromCharCode(bytes[1]) + 
         String.fromCharCode(bytes[2]) +
         String.fromCharCode(bytes[3]);
}

function _readBit(byte, position) {
  let mask = 1 << (position - 1);
  return (byte & mask) === 0 ? 0 : 1;
}

function _readUint3(byte) {
  let mask = 0x70;
  return (byte & mask) >> 4;
}

function _readUint16(bytes) {
  return (bytes[0] << 8) +
         (bytes[1]);
}

function _readUint24(bytes) {
  return (bytes[0] << 16) +
         (bytes[1] << 8) + 
         (bytes[2]);
}

function _readUint28(bytes) {
  bytes[0] = bytes[0] & 0x0F;
  return _readUint32(bytes);
}

function _readUint31(bytes) {
  bytes[0] = bytes[0] & 0x7F;
  return _readUint32(bytes);
};

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
  let int = _readUint16(bytes.slice(0, 2));
  let dec = _readUint16(bytes.slice(2, 4));
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

function _parseChildBox(data) {
  let children = [];
  let pos = 0;
  while (pos < data.length - MP4BOX_HDR_SIZE) {
    let size = _readUint32(data.slice(pos, pos + 4));
    let type = _read4CC(data.slice(pos + 4, pos + 8));
    let box = new MP4Box(size, type);
    box.hdr.data = new Uint8Array(MP4BOX_HDR_SIZE);
    box.hdr.data.set(data.slice(pos, pos + MP4BOX_HDR_SIZE));
    box.data = new Uint8Array(box.hdr.size);
    box.data.set(data.slice(pos + MP4BOX_HDR_SIZE, pos + box.hdr.size));
    children.push(box.parse());
    pos += size;
  }
  return {
    children
  }  
}

const MP4BOX_HDR_SIZE = 8; // default
const HDR_SIZE_PER_TYPE = {
  'pdin': 12,
  'mvhd': 12,
  'tkhd': 12,
  'trgr': 12,
  'mdhd': 12,
  'nmhd': 12,
  'stsd': 12,
  'stts': 12,
  'cslg': 12,
  'stss': 12,
  'stsh': 12,
  'sdtp': 12,
  'elst': 12,
  'dref': 12,
  'stsz': 12,
  'stz2': 12,
  'stsc': 12,
  'stco': 12,
  'co64': 12,
  'padb': 12,
  'subs': 12,
  'saiz': 12,
  'saio': 12,
  'mehd': 12,
  'tfhd': 12,
  'trun': 12,
  'tfra': 12,
  'mfro': 12,
  'tfdt': 12,
  'leva': 12,
  'trep': 12,
  'assp': 12,
  'sbgp': 12,
  'sgpd': 12,
  'cprt': 12,
  'tsel': 12,
  'kind': 12,
  'meta': 12,
  'xml ': 12,
  'bxml': 12,
  'iloc': 12,
  'pitm': 12,
  'ipro': 12,
  'iinf': 12,
  'mere': 12,
  'iref': 12,
  'schm': 12,
  'fiin': 12,
  'fpar': 12,
  'fecr': 12,
  'gitn': 12,
  'fire': 12,
  'stri': 12,
  'stsg': 12,
  'stvi': 12,
  'trex': 12,
  'hdlr': 12,
  'sidx': 12,
  'ssix': 12,
  'prft': 12,
};

const MP4BoxParser = {
  // Container for all the meta-data
  'moov': function (data) {
    return _parseChildBox(data);
  },
  // Movie header, overall declarations
  'mvhd': function (data) {
    let version = data[0];
    let flags = _readUint24(data.slice(1, 4));
    return {
      version, flags,
      creation_time: (version === 0) ? _readUint32(data.slice(4, 8)) : _readUint64(data.slice(4, 12)), 
      modification_time: (version === 0) ? _readUint32(data.slice(8, 12)) : _readUint64(data.slice(12, 20)),
      timescale: (version === 0) ? _readUint32(data.slice(12, 16)) : _readUint32(data.slice(20, 24)),
      duration: (version === 0) ? _readUint32(data.slice(16, 20)) : _readUint64(data.slice(24, 32)),
      rate: (version === 0) ? _readFixedPoint1616(data.slice(20, 24)) : _readFixedPoint1616(data.slice(32, 36)),
      volume: (version === 0) ? _readFixedPoint88(data.slice(24, 26)) : _readFixedPoint88(data.slice(36, 40)),
      // reserved (2)
      // reserved (4+4)
      // matrix (4 * 9)
      // predefined (4 * 6)
      // == 70
      next_track_id: (version === 0) ? _readUint32(data.slice(96, 100)) : _readUint32(data.slice(110, 114))
    };
  },
  // Container for an individual track or stream
  'trak': function (data) {
    return _parseChildBox(data);
  },
  // Track header, overall information about the track
  'tkhd': function (data) {
    let version = data[0];
    let flags = _readUint24(data.slice(1, 4));
    return {
      version, flags,
      creation_time: (version === 0) ? _readUint32(data.slice(4, 8)) : _readUint64(data.slice(4, 12)), 
      modification_time: (version === 0) ? _readUint32(data.slice(8, 12)) : _readUint64(data.slice(12, 20)),
      track_id: (version === 0) ? _readUint32(data.slice(12, 16)) : _readUint32(data.slice(20, 24)),
      // reserved1: 0, // (version === 0) ? data.slice(16, 20) : data.slice(24, 28)
      duration: (version === 0) ? _readUint32(data.slice(20, 24)) : _readUint64(data.slice(28, 36)),
      // reserved2: 0, // (version === 0) ? data.slice(24, 32) : data.slice(36, 44)
      track_enabled: !!(flags & 0x000001),
      track_in_movie: !!(flags & 0x000002),
      track_in_preview: !!(flags & 0x000004),
      track_size_is_aspect_ratio: !!(flags & 0x000008),
      layer: (version === 0) ? _readUint16(data.slice(32, 34)) : _readUint16(data.slice(44, 46)),
      alternate_group: (version === 0) ? _readUint16(data.slice(34, 36)) : _readUint16(data.slice(46, 48)),
      volume: (version === 0) ? _readUint16(data.slice(36, 38)) : _readUint16(data.slice(48, 50)),
      // matrix 32*9 (36 bytes)
      width: (version === 0) ? _readUint32(data.slice(74, 78)) : _readUint32(data.slice(86, 90)),
      height: (version === 0) ? _readUint32(data.slice(78, 82)) : _readUint32(data.slice(90, 94))
    }
  },
  // Track reference container
  'tref': function (data) {
    return {};
  },
  // Edit list container
  'edts': function (data) {
    return {};
  },
  // An edit list
  'elst': function (data) {
    return {};
  },
  // Container for the media information in a track
  'mdia': function (data) {
    return _parseChildBox(data);
  },
  // Media header, overall information about the media
  'mdhd': function (data) {
    let version = data[0];
    let lang1;
    let lang2;
    let lang3;
    if (version === 0) {
      // 0xxx xxyy yyyz zzzz
      let byte1 = data.slice(20, 21);
      let byte2 = data.slice(21, 22);
      lang1 = (byte1 >> 2) & 0x1F;
      lang2 = ((byte1 & 0x3) << 3) | ((byte2 >> 5) & 0x7);
      lang3 = (byte2 & 0x1F);
    }
    return {
      version,
      creation_time: (version === 0) ? _readUint32(data.slice(4, 8)) : _readUint64(data.slice(4, 12)), 
      modification_time: (version === 1) ? _readUint32(data.slice(8, 12)) : _readUint64(data.slice(12, 20)),
      timescale: (version === 0) ? _readUint32(data.slice(12, 16)) : _readUint32(data.slice(20, 24)),
      duration: (version === 0) ? _readUint32(data.slice(16, 20)) : _readUint64(data.slice(24, 32)),
      language: '' + String.fromCharCode(lang1 + 0x60) + String.fromCharCode(lang2 + 0x60) + String.fromCharCode(lang3 + 0x60), 
    }
  },
  // Handler, at this level, the media (handler) type
  'hdlr': function (data) {
    let version = data[0];
    return {
      version,
      pre_defined: _readUint32(data.slice(4, 8)),
      handler_type: _read4CC(data.slice(8, 12)),
      handler_name: _readString(data.slice(24))
    }
  },
  // Media information container
  'minf': function (data) {
    return _parseChildBox(data);
  },
  // Video media header, overall information (video track only)
  'vmhd': function (data) {
    return {}
  },
  // Sound media header, overall information (sound track only)
  'smhd': function (data) {
    return {}
  },
  // Hint media header, overall information (hint track only)
  'hmhd': function (data) {
    return {}
  },
  // Null media header
  'nmhd': function (data) {
    let version = data[0];
    return {
      version
    };
  },
  // Data information atom, container
  'dinf': function (data) {
    return _parseChildBox(data);
  },
  // Data reference atom, declares source(s) of media in track
  'dref': function (data) {
    return _parseChildBox(data.slice(8));
  },
  'url ': function (data) {
    let flags = _readUint24(data.slice(1, 4));
    return {
      version: data[0], flags,
      location: (!!(flags & 0x01)) ? '[local to file]' : _readString(data.slice(4)),
    };
  },
  'urn ': function (data) {
    let flags = _readUint24(data.slice(1, 4));
    return {
      version: data[0], flags,
    };
  },
  // Sample table atom, container for time/space map
  'stbl': function (data) {
    return _parseChildBox(data);
  },
  // 'stts' (decoding) time-to-sample
  // 'ctts' composition time-to-sample table
  // 'stss' sync (key, I-frame) sample map
  // Sample descriptions
  'stsd': function (data) {
    let entry_count = _readUint32(data.slice(4, 8));
    let struct = _parseChildBox(data.slice(8));
    struct.entry_count = entry_count;
    return struct;
  },
  // 'stsz' sample sizes (framing)
  // 'stsc' sample-to-chunk, partial data-offset information
  // 'stco' chunk offset, partial data-offset information
  // 'co64' 64-bit chunk offset
  // 'stsh' shadow sync
  // 'stdp' degradation priority
  //
  // Media data container
  // 'mdat'
  //
  // 'free' Free space
  // 'skip' Free space
  //
  // File type and compatability
  'ftyp': function (data) {
    let brand = _read4CC(data.slice(0, 4));
    let version = _readUint32(data.slice(4, 8));
    let compat = [];
    let pos = 8;
    while (pos < data.length) {
      compat.push(_read4CC(data.slice(pos, pos + 4)));
      pos += 4;
    }
    return {
      major_brand: brand,
      minor_version: version,
      compatible_brands: compat
    };
  },
  // 'stz2' compact sample sizes (framing)
  // 'padb' sample padding bits
  //
  // Movie extends box
  'mvex': function (data) {
    return _parseChildBox(data);
  },
  // 'mehd' movie extends header box
  // Track extends defaults
  'trex': function (data) {
    return {
      version: data[0],
      track_ID: _readUint32(data.slice(4, 8)),
      default_sample_description_index: _readUint32(data.slice(8, 12)),
      default_sample_duration: _readUint32(data.slice(12, 16)),
      default_sample_size: _readUint32(data.slice(16, 20)),
      default_sample_flags: _readUint32(data.slice(20, 24)),
    }
  },
  // Movie fragment
  'moof': function (data) {
    return _parseChildBox(data);
  },
  // Movie fragment header
  'mfhd': function (data) {
    return {
      version: data[0],
      sequence_number: _readUint32(data.slice(4, 8))
    }
  },
  // Track fragment
  'traf': function (data) {
    return _parseChildBox(data);
  },
  // Track fragment header
  'tfhd': function (data) {
    let flags = _readUint24(data.slice(1, 4));
    let struct = {
      base_data_offset_present: !!(flags & 0x000001),
      sample_description_index_present: !!(flags & 0x000002),
      default_sample_duration_present: !!(flags & 0x000008),
      default_sample_size_present: !!(flags & 0x000010),
      default_sample_flags_present: !!(flags & 0x000020),
      duration_is_empty: !!(flags & 0x010000),
      default_base_is_moof: !!(flags & 0x020000),
      track_id: _readUint32(data.slice(4, 8)),
    };
    let pos = 8;
    if (struct.base_data_offset_present) {
      struct.base_data_offset = _readUint64(data.slice(pos, pos + 8));
      pos += 8;
    }
    if (struct.sample_description_index_present) {
      struct.sample_description_index = _readUint32(data.slice(pos, pos + 4));
      pos += 4;
    }
    if (struct.default_sample_duration_present) {
      struct.default_sample_duration = _readUint32(data.slice(pos, pos + 4));
      pos += 4;
    }
    if (struct.default_sample_size_present) {
      struct.default_sample_size = _readUint32(data.slice(pos, pos + 4));
      pos += 4;
    }
    if (struct.default_sample_flags_present) {
      struct.default_sample_flags = _readUint32(data.slice(pos, pos + 4));
      pos += 4;
    }
    return struct;
  },
  // Track fragment run
  'trun': function (data) {
    let version = data[0];
    let flags = _readUint24(data.slice(1, 4));
    let struct = {
      data_offset_present: !!(flags & 0x000001),
      first_sample_flags_present: !!(flags & 0x000004),
      sample_duration_present: !!(flags & 0x000100),
      sample_size_present: !!(flags & 0x000200),
      sample_flags_present: !!(flags & 0x000400),
      sample_composition_time_offsets_present: !!(flags & 0x000800),
    };
    struct.sample_count = _readUint32(data.slice(4, 8));
    let pos = 8;
    if (struct.data_offset_present) {
      struct.data_offset = _readUint32(data.slice(pos, pos + 4));
      pos += 4;
    }
    if (struct.first_sample_flags_present) {
      struct.first_sample_flags = _readUint32(data.slice(pos, pos + 4));
      pos += 4;
    }
    let samples = [];
    for (let i = 0; i < struct.sample_count; i++) {
      let sample = {};
      if (struct.sample_duration_present) {
        sample.duration = _readUint32(data.slice(pos, pos + 4));
        pos += 4;
      }
      if (struct.sample_size_present) {
        sample.size = _readUint32(data.slice(pos, pos + 4));
        pos += 4;
      }
      if (struct.sample_flags_present) {
        sample.flags = _readUint32(data.slice(pos, pos + 4));
        pos += 4;
      }
      if (struct.sample_composition_time_offsets_present) {
        sample.composition_time_offset = _readUint32(data.slice(pos, pos + 4));
        pos += 4;
      }
      samples.push(sample);
    }
    struct.samples = samples;
    return struct;
  },
  // ***********
  // iso6 brand
  // ***********
  // 'saiz' sample aux information sizes
  // 'saio' sample aux information offsets
  // Track fragment decode time
  'tfdt': function (data) {
    let version = data[0];
    return {
      version,
      base_media_decode_time: (version === 1) ? _readUint64(data.slice(4, 12)) : _readUint32(data.slice(4, 8))
    };
  },
  // Segment type
  'styp': function (data) {
    return MP4BoxParser['ftyp'](data);
  },
  // Segment index
  'sidx': function (data) {
    let flags; // 24-bit
    let struct = {
      version: data[0],
      reference_ID: _readUint32(data.slice(4, 8)),
      timescale: _readUint32(data.slice(8, 12)),
      earliest_presentation_time: _readUint32(data.slice(12, 16)),
      first_offset: _readUint32(data.slice(16, 20)),
      reference_count: _readUint16(data.slice(22, 24)),
    };
    let entries = [];
    let pos = 24;
    for (let i = 0; i < struct.reference_count; i++) {
      let reference_type = _readBit(data.slice(pos, pos + 1), 8);
      let reference_size = _readUint31(data.slice(pos, pos + 4));
      let subsegment_duration = _readUint32(data.slice(pos + 4, pos + 8));
      let starts_with_SAP = _readBit(data.slice(pos + 8, pos + 9), 8);
      let SAP_type = _readUint3(data.slice(pos + 8, pos + 9));
      let SAP_delta_time = _readUint28(data.slice(pos + 8, pos + 12));
      entries.push({
        reference_type,
        reference_size,
        subsegment_duration,
        starts_with_SAP,
        SAP_type,
        SAP_delta_time
      });
    }
    struct.entries = entries;
    return struct;
  },
  // 'sidx' segment index
  // 'ssix' subsegment index
  // 'prft' producer reference time
  //
  // ***********
  // iso9 brand
  // ***********
  'elng': function (data) {
    return {
      type: 'elng',
      extended_language: _readString(data.slice(4))
    };
  },
};

const MP4Box = function constructor(size, type, hdrdata) {
  return {
    hdr: {
      size,
      type,
      data: hdrdata,
      hdrsize: HDR_SIZE_PER_TYPE[type] || 8,
    },
    data: undefined,
    parse: function() {
      let payload = {
        hdr: this.hdr,
      };
      if (MP4BoxParser[this.hdr.type]) {
        log.debug(`${this.hdr.type}[${this.hdr.size}]: ${_bytesToHex(this.hdr.data)}${_bytesToHex(this.data)}`);
        payload[this.hdr.type] = MP4BoxParser[this.hdr.type](this.data);
      }
      return payload;
    }
  };
}

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
    //log.debug(`pos=${pos}, len=${len}`);
    let size = _readUint32(chunk.slice(pos, pos + 4));
    let type = _read4CC(chunk.slice(pos + 4, pos + 8));
    let box = new MP4Box(size, type, chunk.slice(pos, pos + 8));

    if (pos + box.hdr.size > len) {
      // We need more data
      return len - pos;
    } else {
      box.data = new Uint8Array(box.hdr.size - MP4BOX_HDR_SIZE);
      box.data.set(chunk.slice(pos + MP4BOX_HDR_SIZE, pos + box.hdr.size));
      this.boxes.push(box);
    }
    pos += box.hdr.size;
  }
};

fMP4Parser.prototype.MP4Box = MP4Box;

module.exports = fMP4Parser;