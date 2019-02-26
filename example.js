const fMP4 = require("./index.js");
const fs = require("fs");

const TESTFILE = "./test/support/testassets/video.dash";
//const TESTFILE = "/Users/jobi/Downloads/Sunrise.mp4";

function printBox(box, indent) {
  let indstr = "";
  for (let j = 0; j < indent; j++) {
    indstr += "  ";
  }
  console.log(`${indstr}${box.hdr.type}[${box.hdr.size}]`);
  if (box[box.hdr.type] && !box[box.hdr.type].children) {
    console.log(indstr, box[box.hdr.type]);
  }

  if (box[box.hdr.type] && box[box.hdr.type].children) {
    let children = box[box.hdr.type].children;

    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      printBox(child, indent + 1);
    }
  }
}

fs.createReadStream(TESTFILE)
.pipe(fMP4.parse({ debug: false }))
.on("error", function(err) {
  console.error(err);
})
.on("finish", function() {
  let boxes = fMP4.boxes;
  for (let i = 0; i < boxes.length; i++) {
    let parsedBox = boxes[i].parse();
    printBox(parsedBox, 0);
  }
})