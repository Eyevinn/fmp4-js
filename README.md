A Javascript library to parse ISO Base Media File Format (MPEG-4 Part 12) ISO/IEC 14496-12

## Usage (Node JS)

```
npm install --save fmp4.js
```

The library implements the `Writable` stream interface and acts a a "sink". For example to download
and parse an MP4 fragment:

```
const request = require("request");
const fMP4 = require("fmp4.js");

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
     *   hdr: { size, type, hdrsize },
     *   $type: {
     *     key/value pairs,
     *     array of child boxes (if available)
     *   }
     * }
     */
    console.log(parsedBox);
  }
});
```

An example implementation of the library that parses and dump the contents of an ISOBMFF file is included:

```
node mp4dump.js test/support/testassets/cmaf_chunk.mp4
```

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community. 

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
