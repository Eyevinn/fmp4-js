const fMP4 = require("./index.js");
const fs = require("fs");

const TESTFILE = "./test/support/testassets/video.dash";
//const TESTFILE = "/Users/jobi/Downloads/Sunrise.mp4";

fs.createReadStream(TESTFILE)
.pipe(fMP4.parse({ debug: false }))
.on("error", function(err) {
  console.error(err);
})
.on("finish", function() {
  let boxes = fMP4.boxes;
  for (let i = 0; i < boxes.length; i++) {
    let parsedBox = boxes[i].parse();
    if (parsedBox.moov) {
      console.log(parsedBox);
      for(let j = 0; j < parsedBox.moov.children.length; j++) {
        console.log(parsedBox.moov.children[j]);
      }
    } else {
      console.log(parsedBox);
    }
  }
})