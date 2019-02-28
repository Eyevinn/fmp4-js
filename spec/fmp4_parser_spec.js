const PARSER = require('../lib/fmp4_parser.js');

function hexToBytes(hex) {
  let bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

describe("MP4 Box Parser", () => {
  let boxParser;
  beforeAll(() => {
    const parser = new PARSER();
    boxParser = parser._boxParser;
  });

  it("can parse an 'ftyp' box", () => {
    let byteArray = hexToBytes('000000186674797069736f360000000069736f3664617368');
    let data = new Uint8Array(byteArray.slice(8));
    let box = boxParser['ftyp'](data);
    expect(box.major_brand).toEqual('iso6');
    expect(box.minor_version).toEqual(0);
    expect(box.compatible_brands).toEqual(['iso6', 'dash']);
  });

  it("can parse an 'styp' box", () => {
    let byteArray = hexToBytes('000000187374797069736f360000000069736f366d736468');
    let data = new Uint8Array(byteArray.slice(8));
    let box = boxParser['styp'](data);
    expect(box.major_brand).toEqual('iso6');
    expect(box.minor_version).toEqual(0);
    expect(box.compatible_brands).toEqual(['iso6', 'msdh']);
  });

  it("can parse an 'sidx' box", () => {
    let byteArray = hexToBytes('0000002c73696478000000000000000100007530000000000000000000000001001003db0000e2ca90000000');
    let data = new Uint8Array(byteArray.slice(8));
    let box = boxParser['sidx'](data); 
    expect(box.timescale).toEqual(30000);
    expect(box.entries.length).toEqual(1);
    expect(box.entries[0].reference_type).toEqual(0);
    expect(box.entries[0].reference_size).toEqual(1049563);
    expect(box.entries[0].subsegment_duration).toEqual(58058);
    expect(box.entries[0].starts_with_SAP).toEqual(1);
  });
});