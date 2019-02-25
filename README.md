A Javascript library to parse MP4 fragments (ISO 14496-1 Media Format)

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
});
```