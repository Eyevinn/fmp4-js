const fMP4 = require("./index.js");
const fs = require("fs");

const TESTFILE = "./test/support/testassets/video.dash";

fs.createReadStream(TESTFILE)
.pipe(fMP4.parse({ debug: false }))
.on("error", function(err) {
  console.error(err);
})
.on("finish", function() {
  let boxes = fMP4.boxes;
  for (let i = 0; i < boxes.length; i++) {
    console.log(boxes[i].hdr); 
  }
})