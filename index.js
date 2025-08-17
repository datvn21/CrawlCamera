const listCameras = require("./ListCamerasWithDistrict.json");
const fs = require("fs");
const { fork } = require("child_process");

const activeChildren = new Map();

// Lọc ra camera theo quận
const data = listCameras.filter(
  (cam) => cam.district && cam.district == "Quận 7"
);

fs.mkdirSync("./images", { recursive: true });

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runChild(cam) {
  const child = fork("./crawl.js", [cam.id]);
  activeChildren.set(child.pid, child);

  child.on("exit", async (code, signal) => {
    console.log(
      `⚠️ Child ${child.pid} đã thoát | code: ${code}, signal: ${signal}`
    );
    activeChildren.delete(child.pid);

    await delay(2000);
    console.log(`🔄 Restart child for cam id ${cam.id}`);
    runChild(cam);
  });

  child.on("message", (msg) => {
    console.log("👶 ", msg);
  });
}

(async () => {
  for (const cam of data) {
    runChild(cam);
    await delay(1000);
  }
})();

setInterval(() => {
  console.log(`📈 Hiện tại có ${activeChildren.size} child đang online`);
}, 8000);
