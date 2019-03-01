const fMP4 = require("./index.js");
const fs = require("fs");

function printBox(b, indent) {
  let indstr = "";
  for (let j = 0; j < indent; j++) {
    indstr += "  ";
  }
  console.log(`${indstr}[${b.hdr.type}] size=${b.hdr.hdrsize}+${b.hdr.size - b.hdr.hdrsize}`);
  if(b[b.hdr.type]) {
    let keys = Object.keys(b[b.hdr.type]);
    keys.forEach((k, i) => {
      if (k !== 'children') {
        if (typeof b[b.hdr.type][k] === 'object') {
          b[b.hdr.type][k].forEach((v, j) => {
            console.log(`${indstr}  ${k} = ${v}`);
          });
        } else {
          console.log(`${indstr}  ${k} = ${b[b.hdr.type][k]}`);
        }
      } else {
        b[b.hdr.type].children.forEach(c => {
          printBox(c, indent + 2);
        });
      }
    });
  }
}

let fileName = process.argv[2];
if (fileName) {
  fs.createReadStream(fileName)
  .pipe(fMP4.parse({ debug: false }))
  .on("error", err => {
    console.error(err);
  })
  .on("finish", () => {
    fMP4.boxes.forEach((s, idx) => {
      let box = s.parse();
      printBox(box, 0);
    });
  });
}