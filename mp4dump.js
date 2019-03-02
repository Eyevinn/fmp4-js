// Copyright 2019 Eyevinn Technology. All rights reserved
// Use of this source code is governed by a MIT License
// license that can be found in the LICENSE file.
// Author: Jonas Rydholm Birme (Eyevinn Technology)
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
        if (k === 'samples') {
          if (b.hdr.type === 'trun') {
            if (b['trun'].sample_duration_present) {
              console.log(`${indstr}  sample_durations = [${b['trun'].samples.map(s => s.duration).join(",")}]`);
            }
            if (b['trun'].sample_size_present) {
              console.log(`${indstr}  sample_sizes = [${b['trun'].samples.map(s => s.size).join(",")}]`);
            }
            if (b['trun'].sample_flags_present) {
              console.log(`${indstr}  sample_flags = [${b['trun'].samples.map(s => s.flags).join(",")}]`);
            }
            if (b['trun'].sample_composition_time_offsets_present) {
              console.log(`${indstr}  sample_composition_time_offsets = [${b['trun'].samples.map(s => s.composition_time_offset).join(",")}]`);
            }
          }
        } else if (typeof b[b.hdr.type][k] === 'object') {
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