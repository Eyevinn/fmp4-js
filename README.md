A Javascript library to parse ISO Base Media File Format (MPEG-4 Part 12) ISO/IEC 14496-12

## Usage (Node JS)

```
npm install --save fmp4
```

The library implements the `Writable` stream interface and acts a a "sink". For example to download
and parse an MP4 fragment:

```
const request = require("request");
const fMP4 = require("fmp4");

request.get("http://example.com/video.dash")
.pipe(fMP4.parse())
.on("finish", function() {

  // Obtain all boxes found in the fragment
  const boxes = fMP4.boxes;

  // Parse each box
  for (let i = 0; i < boxes.length; i++) {
    let parsedBox = boxes[i].parse(); // MP4Box

    /**
     *
     * MP4Box {
     *   hdr: { size, type },
     *   data // unparsed payload
     * }
     */
    console.log(parsedBox);
  }
});
```