// Renders the three Kredo banner images from the real app captures in public/app-screens.
// Run from the repo root: node mobile/marketing/make-banners.mjs   (needs the playwright dev dependency)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const shot = (n) => "file://" + path.join(root, "public/app-screens", n + ".png");
// the logotype with the white blossom used on the banners
const logoSvg = fs.readFileSync(path.join(root, "public/brand/kredo-logotype-on-light.svg"), "utf8").replace('<g fill="#151514">', '<g fill="#FFFFFF">');
const logo = "data:image/svg+xml;base64," + Buffer.from(logoSvg).toString("base64");

const phone = ({ name, x, y, w, r = 0, z = 1 }) => `
  <div class="phone" style="left:${x}px;top:${y}px;width:${w}px;height:${w * 2.14}px;padding:${w * 0.026}px ${w * 0.036}px;transform:rotate(${r}deg);z-index:${z}">
    <div class="glass"><img src="${shot(name)}"><i class="island"></i></div>
  </div>`;

const base = (w, h, bg, body) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${bg};font-family:Inter,system-ui,sans-serif;position:relative}
.phone{position:absolute;background:#0d0d10;border-radius:15%/7%;box-shadow:0 40px 70px -30px rgba(0,0,0,.45),0 0 0 1.5px #2a2a30 inset;transform-origin:50% 50%}
.phone:before,.phone:after{content:"";position:absolute;width:1.6%;background:#1b1b20}
.phone:before{left:-1.4%;top:19%;height:12%;border-radius:3px 0 0 3px}
.phone:after{right:-1.4%;top:22%;height:11%;border-radius:0 3px 3px 0}
.glass{position:relative;width:100%;height:100%;overflow:hidden;border-radius:12.5%/5.8%;background:#fff}
.glass img{width:100%;height:100%;display:block;object-fit:fill}
.island{position:absolute;left:50%;top:1.6%;width:31%;height:3.4%;transform:translateX(-50%);border-radius:99px;background:#000}
.tag{font-weight:500;color:#6b6b70;white-space:nowrap}.tag b{font-weight:800;color:#0b0b0c}
.fade{position:absolute;left:0;right:0;bottom:0;pointer-events:none}
</style></head><body>${body}</body></html>`;

const tag = (size, extra = "") => `<div class="tag" style="font-size:${size}px;${extra}">Pay at campus. <b>Settle later.</b></div>`;

const banners = {
  // 1568 x 524: logo and line left, five tilted phones right, fading to white at the bottom
  "kredo-banner-wide": { w: 1568, h: 524, html: base(1568, 524, "#fff", `
    <img src="${logo}" style="position:absolute;left:74px;top:150px;width:312px">
    ${tag(26, "position:absolute;left:70px;top:262px")}
    ${phone({ name: "notifications", x: 560, y: 232, w: 168, r: -9, z: 1 })}
    ${phone({ name: "scan", x: 746, y: 188, w: 172, r: -5, z: 2 })}
    ${phone({ name: "passport", x: 958, y: 206, w: 172, r: 0, z: 3 })}
    ${phone({ name: "unlocked", x: 1160, y: 170, w: 176, r: 6, z: 4 })}
    ${phone({ name: "receipt", x: 1330, y: 180, w: 172, r: 10, z: 5 })}
    <div class="fade" style="height:150px;background:linear-gradient(rgba(255,255,255,0),#fff 92%)"></div>`) },
  // 3384 x 573: cream half with the logo, yellow half with three flat phones
  "kredo-banner-ultrawide": { w: 3384, h: 573, html: base(3384, 573, "#FFFBE6", `
    <div style="position:absolute;left:1920px;top:0;right:0;bottom:0;background:#FABF05"></div>
    <img src="${logo}" style="position:absolute;left:1020px;top:130px;width:660px">
    ${tag(52, "position:absolute;left:1008px;top:332px")}
    ${phone({ name: "home", x: 2110, y: 72, w: 372 })}
    ${phone({ name: "scan", x: 2548, y: 72, w: 372 })}
    ${phone({ name: "coins-due", x: 2986, y: 72, w: 372 })}`) },
  // 1800 x 950: logo and line on top, five fanned phones along the bottom
  "kredo-poster": { w: 1800, h: 950, html: base(1800, 950, "#fff", `
    <img src="${logo}" style="position:absolute;left:50%;margin-left:-218px;top:44px;width:436px">
    ${tag(34, "position:absolute;left:0;right:0;text-align:center;top:236px")}
    ${phone({ name: "notifications", x: 78, y: 470, w: 330, r: -16, z: 1 })}
    ${phone({ name: "scan", x: 410, y: 400, w: 340, r: -8, z: 2 })}
    ${phone({ name: "passport", x: 745, y: 392, w: 340, r: 0, z: 3 })}
    ${phone({ name: "unlocked", x: 1062, y: 392, w: 340, r: 8, z: 4 })}
    ${phone({ name: "receipt", x: 1372, y: 440, w: 340, r: 16, z: 5 })}
    <div class="fade" style="height:300px;background:linear-gradient(rgba(255,255,255,0),#fff 88%)"></div>`) },
};

const browser = await chromium.launch();
for (const [name, b] of Object.entries(banners)) {
  const tmp = path.join(here, `.${name}.html`);
  fs.writeFileSync(tmp, b.html);
  const page = await browser.newPage({ viewport: { width: b.w, height: b.h } });
  await page.goto("file://" + tmp);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(here, `${name}.png`) });
  await page.close();
  fs.unlinkSync(tmp);
  console.log("wrote", name + ".png", `${b.w}x${b.h}`);
}
await browser.close();
