const { default: axios, head } = require("axios");
const { HeaderGenerator } = require("header-generator");
const fs = require("fs");
const crypto = require("crypto");

const genHeader = () => {
  let headerGenerator = new HeaderGenerator({
    browsers: [
      { name: "firefox", minVersion: 80 },
      { name: "chrome", minVersion: 87 },
      "safari",
    ],
    devices: ["desktop"],
    operatingSystems: ["windows"],
  });
  return headerGenerator.getHeaders();
};

const genFileName = async (id) => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const filename = `./images/${id}/${hours}-${minutes}-${seconds}_${day}-${month}-${year}_${id}.jpg`;
  return filename;
};

function getHash(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

const fetchImage = async (id, interval) => {
  let lastHash = null;
  let count = 0;
  fs.mkdirSync("./images/" + id, { recursive: true });
  try {
    setInterval(async () => {
      const headers = genHeader();

      const response = await axios
        .get(
          "https://giaothong.hochiminhcity.gov.vn/render/ImageHandler.ashx?id=" +
            id,
          {
            headers,
            responseType: "arraybuffer",
            timeout: 5000,
          }
        )
        .catch((error) => {
          if (error.code === "ECONNABORTED") {
            console.error(`⏱️ Timeout khi tải ảnh ID: ${id}`);
          } else if (error.response) {
            const status = error.response.status;
            console.error(
              `🚫 Server trả về lỗi ${status} khi tải ảnh ID: ${id}`
            );
          } else {
            console.error(
              `❌ Lỗi không xác định khi tải ảnh ID: ${id}`,
              error.message
            );
          }
          process.exit(1);
        });
      // const currentHash = "";
      const currentHash = getHash(response.data);
      if (currentHash !== lastHash) {
        count++;
        lastHash = currentHash;
        const fileName = await genFileName(id);
        //console.log("Fetched " + count + " 👍:" + fileName);
        process.send?.("Fetched " + count + " 👍:" + fileName);
        fs.writeFileSync(fileName, response.data);
      }
    }, interval);
  } catch (error) {
    console.error("😒 (Func) Lỗi khi fetch ảnh:" + id);
    process.exit(1);
  }
};

const id = process.argv[2];

if (!id) {
  process.exit(1);
}

fetchImage(id, 8000);

// fetchImage("56df8381c062921100c143e2", 8000);
