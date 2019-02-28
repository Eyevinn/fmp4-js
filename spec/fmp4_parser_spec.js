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
    expect(box.compatible_brands.length).toEqual(2);
  });
});