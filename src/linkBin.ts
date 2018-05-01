import * as fs from "fs"
import {promisify} from "util"
import {listPackages, Package} from "./listPackages"
import * as mkdirp from "mkdirp"

const prom = {
  readdir: promisify(fs.readdir),
  symlink: promisify(fs.symlink),
  stat: promisify(fs.stat),
  mkdirp: promisify(mkdirp),
}

export async function linkBin(packages: Package[]) {
  const binDirPath = `${process.env.PWD}/node_modules/.bin`
  const binaries = await prom.readdir(binDirPath)

  for (const p of packages) {
    const packageBinDirPath = `${p.path}/node_modules/.bin`
    await prom.mkdirp(packageBinDirPath)
    for (const bin of binaries) {
      try {
        await prom.stat(`${packageBinDirPath}/${bin}`)
      } catch (e) {
        console.log(`${packageBinDirPath}/${bin}`, "->", `${binDirPath}/${bin}`)
        prom.symlink(`${binDirPath}/${bin}`, `${packageBinDirPath}/${bin}`)
      }
    }
  }
}
