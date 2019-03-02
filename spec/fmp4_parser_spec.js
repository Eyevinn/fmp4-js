const PARSER = require('../lib/fmp4_parser.js');
const Logger = require("logplease");

function hexToBytes(hex) {
  let bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

describe("MP4 Box Parser", () => {
  let MP4Box;
  beforeAll(() => {
    Logger.setLogLevel("INFO");
    const parser = new PARSER();
    MP4Box = parser.MP4Box;
  });

  it("can parse an 'ftyp' box", () => {
    let byteArray = hexToBytes('000000186674797069736f360000000069736f3664617368');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'ftyp', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(8);
    expect(b.ftyp.major_brand).toEqual('iso6');
    expect(b.ftyp.minor_version).toEqual(0);
    expect(b.ftyp.compatible_brands).toEqual(['iso6', 'dash']);
  });

  it("can parse an 'styp' box", () => {
    let byteArray = hexToBytes('000000187374797069736f360000000069736f366d736468');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'styp', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(8);
    expect(b.styp.major_brand).toEqual('iso6');
    expect(b.styp.minor_version).toEqual(0);
    expect(b.styp.compatible_brands).toEqual(['iso6', 'msdh']);
  });

  it("can parse an 'sidx' box", () => {
    let byteArray = hexToBytes('0000002c73696478000000000000000100007530000000000000000000000001001003db0000e2ca90000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'sidx', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.sidx.version).toEqual(0);
    expect(b.sidx.timescale).toEqual(30000);
    expect(b.sidx.entries.length).toEqual(1);
    expect(b.sidx.entries[0].reference_type).toEqual(0);
    expect(b.sidx.entries[0].reference_size).toEqual(1049563);
    expect(b.sidx.entries[0].subsegment_duration).toEqual(58058);
    expect(b.sidx.entries[0].starts_with_SAP).toEqual(1);
  });

  it("can parse an 'mvhd' box", () => {
    let byteArray = hexToBytes('0000006c6d766864000000000000000000000000000000010000000000010000010000000000000000000000000100000000000000000000000000000001000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000020000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'mvhd', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.mvhd.timescale).toEqual(1);
    expect(b.mvhd.duration).toEqual(0);
  });

  it("can parse an 'tkhd' box", () => {
    let byteArray = hexToBytes('0000005c746b68640000000700000000000000000000000100000000000000000000000000000000000000000000000000010000000000000000000000000000000100000000000000000000000000004000000007800000043800000000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'tkhd', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.tkhd.flags).toEqual(7);
    expect(b.tkhd.track_enabled).toEqual(true);
    expect(b.tkhd.track_id).toEqual(1);
    expect(b.tkhd.duration).toEqual(0);
    expect(b.tkhd.width).toEqual(1920);
    expect(b.tkhd.height).toEqual(1080);
  });

  it("can parse an 'mdhd' box", () => {
    let byteArray = hexToBytes('000000206d646864000000000000000000000000000075300000000055c400000000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'mdhd', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.mdhd.timescale).toEqual(30000);
    expect(b.mdhd.duration).toEqual(0);
    expect(b.mdhd.language).toEqual('und');
  });

  it("can parse an 'hdlr' box", () => {
    let byteArray = hexToBytes('0000003268646c7200000000000000007669646500000000000000000000000055535020566964656f2048616e646c6572000000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'hdlr', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.hdlr.handler_type).toEqual('vide');
    expect(b.hdlr.handler_name).toEqual('USP Video Handler');
  });

  it("can parse an 'dinf' box", () => {
    let byteArray = hexToBytes('0000002464696e660000001c6472656600000000000000010000000c75726c20000000010000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'dinf', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(8);
  });

  it("can parse an 'dref' box", () => {
    let byteArray = hexToBytes('0000001c6472656600000000000000010000000c75726c20000000010000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'dref', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.dref.children[0].hdr.type).toEqual('url ');
    expect(b.dref.children[0]['url '].flags).toEqual(1);
  });

  it("can parse an 'stsd' box", () => {
    let byteArray = hexToBytes('000000ab7374736400000000000000010000009b617663310000000000000001000000000000000000000000000000000780043800480000004800000000000000010a41564320436f64696e670000000000000000000000000000000000000000000018ffff000000316176634301640032ffe1001967640032acd980780227e5c04400000fa40003a9823c60c66801000568e97b2c8b00000014627472740004e97b00b22a10004323800000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'stsd', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.stsd.entry_count).toEqual(1);
    expect(b.stsd.children[0].hdr.type).toEqual('avc1');
  });

  it("can parse an 'tfhd' box", () => {
    let byteArray = hexToBytes('0000001c746668640002002a0000000100000001000003e901010000000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'tfhd', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.tfhd.base_data_offset_present).toBeFalsy();
    expect(b.tfhd.sample_description_index_present).toBeTruthy();
    expect(b.tfhd.default_sample_duration_present).toBeTruthy();
    expect(b.tfhd.default_sample_flags_present).toBeTruthy();
    expect(b.tfhd.default_base_is_moof).toBeTruthy();
    expect(b.tfhd.default_sample_duration).toEqual(1001);
  });

  it("can parse an 'tfdt' box", () => {
    let byteArray = hexToBytes('00000014746664740100000000000000000000000000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'tfdt', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.tfdt.base_media_decode_time).toEqual(0);
  });

  it("can parse a 'trun' box", () => {
    let byteArray = hexToBytes('000001e87472756e01000a050000003a00000240020000000002dc9f0000000000003c9000000bbb000010eb0000000000000666fffff82e00000b9ffffffc17000055b000000bbb000015d50000000000001012fffff82e00000585fffffc17000039fa0000000000007e8c000007d200001cdcfffffc1700000ffdfffffc170000d0ea000003e9000010cafffffc170000cce400000bbb000018a20000000000000b01fffff82e00000a79fffffc1700006cdd000007d200000f42fffffc1700000d40fffffc170000e6d000000bbb00003c890000000000000db4fffff82e00001d54fffffc170000b50a000007d200002741fffffc170000120afffffc170000ce4f00000bbb00002b350000000000000df7fffff82e00000ef7fffffc170000ea5700000bbb000022400000000000000e1efffff82e00001381fffffc170000961400000bbb000027f30000000000001542fffff82e00001719fffffc1700009f8600000bbb000023b70000000000001485fffff82e000010a4fffffc1700009726000007d200001d65fffffc1700001052fffffc17000080b6000007d200001c00fffffc1700001132fffffc1700006e4e000003e90000146afffffc1700004c9f00000bbb000023250000000000000fcefffff82e00000e98fffffc1700002121000000000000000000000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'trun', data.slice(0, 8));
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.hdr.hdrsize).toEqual(12);
    expect(b.trun.sample_count).toEqual(58);
    expect(b.trun.data_offset).toEqual(576);
  });
});