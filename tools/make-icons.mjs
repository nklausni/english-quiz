import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
// Self-drawn icon rasterizer. No external image assets or dependencies.
const colors = { dark: [24,63,57], gold: [247,216,128], leaf: [74,158,119], coral: [233,111,86], white: [251,246,232] };
const circle = (x,y,cx,cy,r) => (x-cx)**2+(y-cy)**2<r*r;
function pixel(x,y) {
  let c = colors.dark;
  if (circle(x,y,.5,.5,.38)) c = colors.gold;
  if (x>.483 && x<.517 && y>.46 && y<.78) c = colors.dark;
  if (x>.495 && x<.51 && y>.46 && y<.77) c = colors.leaf;
  if (circle(x,y,.38,.53,.085) || circle(x,y,.62,.53,.085)) c = colors.dark;
  if (circle(x,y,.37,.52,.075) || circle(x,y,.63,.52,.075)) c = colors.leaf;
  for (let i=0;i<6;i++) {
    const a=i*Math.PI/3;
    if (circle(x,y,.5+Math.cos(a)*.135,.35+Math.sin(a)*.135,.07)) c = colors.coral;
  }
  if (circle(x,y,.5,.35,.072)) c = colors.dark;
  if (circle(x,y,.5,.35,.055)) c = colors.white;
  return c;
}
function crc(buf) {
  let n=0xffffffff;
  for (const b of buf) { n^=b; for (let k=0;k<8;k++) n=n&1?(n>>>1)^0xedb88320:n>>>1; }
  return (n^0xffffffff)>>>0;
}
function chunk(type, data) {
  const name=Buffer.from(type);
  const len=Buffer.alloc(4); len.writeUInt32BE(data.length);
  const sum=Buffer.alloc(4); sum.writeUInt32BE(crc(Buffer.concat([name,data])));
  return Buffer.concat([len,name,data,sum]);
}
for (const size of [192,512]) {
  const raw=Buffer.alloc((size*4+1)*size);
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    const offset=y*(size*4+1)+1+x*4;
    const sums=[0,0,0];
    for (const dx of [.25,.75]) for (const dy of [.25,.75]) {
      const rgb=pixel((x+dx)/size,(y+dy)/size);
      for (let i=0;i<3;i++) sums[i]+=rgb[i];
    }
    for (let i=0;i<3;i++) raw[offset+i]=Math.round(sums[i]/4);
    raw[offset+3]=255;
  }
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4); ihdr[8]=8; ihdr[9]=6;
  writeFileSync(new URL(`../icons/icon-${size}.png`,import.meta.url), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw)),chunk("IEND",Buffer.alloc(0))]));
}
