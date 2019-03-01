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
  })
});