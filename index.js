const fs = require("fs");
const express = require("express");
const Downloader = require("nodejs-file-downloader");
const Ziper = require("adm-zip");
const convert = require("./converter");

const app = express();
const work_path = __dirname + "/temp/";

/* --- routers --- */
app.get("/subtitle", main);

async function main(req, res) {
  //clear prev temporary file
  fs.readdir(work_path, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(work_path + file, err => {
        if (err) throw err;
      });
    }
  });
  
  const {url} = req.query;
  const handleError = error => {
    console.log(error);
    res.status(500).json({ok: false, msg: error.message});
  };
  const downloader = new Downloader({
    url,
    directory: work_path, //Sub directories will also be automatically created if they do not exist.
    maxAttempts: 3,
    fileName: "sub.zip",
    cloneFiles: false,
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1"
    }
  });

  try {
    await downloader.download();
    const zip = new Ziper(work_path + "sub.zip");
    await zip.extractAllTo(work_path);
    const files = await fs.readdirSync(work_path).filter(file => {
      return /srt/.test(file);
    });
    const srt = await fs.readFileSync(work_path + files[0], "utf8");
    const vtt = await convert(srt);
    await fs.writeFileSync(work_path + "sub.vtt", vtt, 'utf8')
    return res.status(200).download(work_path + "sub.vtt")
  } catch (error) {
    return handleError(error);
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("runing");
  const safari = require("safari");
    const url = `http://127.0.0.1:${PORT}`;
    safari.open( url + "/subtitle?url=https://subscene.com/subtitles/indonesian-text/k8iFzGQgnyQtJ5jvTRJnTrmh8NL5Nppa2w6PSTnuI9CnPndMx1IgUnI-WAcWVAyP1YFF8xWPaW_VGOaDapfdW9UmdJ40bXAtM3-TUgJaLjqPDWSAwyDn68-kPPohL5ge0");
});
