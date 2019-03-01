const PARSER = require('../lib/fmp4_parser.js');

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
    const parser = new PARSER();
    MP4Box = parser.MP4Box;
  });

  it("can parse an 'ftyp' box", () => {
    let byteArray = hexToBytes('000000186674797069736f360000000069736f3664617368');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'ftyp');
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.ftyp.major_brand).toEqual('iso6');
    expect(b.ftyp.minor_version).toEqual(0);
    expect(b.ftyp.compatible_brands).toEqual(['iso6', 'dash']);
  });

  it("can parse an 'styp' box", () => {
    let byteArray = hexToBytes('000000187374797069736f360000000069736f366d736468');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'styp');
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.styp.major_brand).toEqual('iso6');
    expect(b.styp.minor_version).toEqual(0);
    expect(b.styp.compatible_brands).toEqual(['iso6', 'msdh']);
  });

  it("can parse an 'sidx' box", () => {
    let byteArray = hexToBytes('0000002c73696478000000000000000100007530000000000000000000000001001003db0000e2ca90000000');
    let data = new Uint8Array(byteArray);
    let box = new MP4Box(data.length, 'sidx');
    box.data = data.slice(8);
    let b = box.parse();
    expect(b.sidx.version).toEqual(0);
    expect(b.sidx.timescale).toEqual(30000);
    expect(b.sidx.entries.length).toEqual(1);
    expect(b.sidx.entries[0].reference_type).toEqual(0);
    expect(b.sidx.entries[0].reference_size).toEqual(1049563);
    expect(b.sidx.entries[0].subsegment_duration).toEqual(58058);
    expect(b.sidx.entries[0].starts_with_SAP).toEqual(1);
  });
});