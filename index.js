const fs = require("fs");
const express = require("express");
const Downloader = require("nodejs-file-downloader");
const Ziper = require("adm-zip");
const convert = require("./converter")

const app = express();
const work_path = __dirname + "/temp/";

/* --- routers --- */
app.get("/subtitle", main);

async function main(req, res) {
  const {url} = req.query;
  const handleError = error => res.status(500).json({ok: false, msg: error});
  const downloader = new Downloader({
    url,
    directory: work_path, //Sub directories will also be automatically created if they do not exist.
    fileName: "sub.zip",
    cloneFiles: false
  });

  try {
    await downloader.download();
  } catch (error) {
    console.log(error);
    handleError(error);
  }

  const zip = new Ziper(work_path + "sub.zip");
  await zip.extractAllTo(work_path);

  fs.readdir(work_path, (err, files) => {
    //if error
    if (err) return handleError(err);
    //filter unziped file
    files.sort().filter(file => {
      return file.test("srt");
    });
    console.log({filefilter: files[0]});
    const vtt = convert(work_path + files[0])
    fs.writeFile(work_path + "sub.vtt", vtt, (err) => {
      if(err) return handleError(err)
      res.status(200).download(work_path + "sub.vtt")
    })
  })
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("runing");
});