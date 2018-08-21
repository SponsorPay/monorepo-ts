import * as fs from "fs"
import {promisify} from "util"
import {listPackages, Package, PackageJSON} from "./listPackages"
import * as mkdirp from "mkdirp"
import merge = require("lodash/merge")

const prom = {
  readdir: promisify(fs.readdir),
  symlink: promisify(fs.symlink),
  stat: promisify(fs.stat),
  mkdirp: promisify(mkdirp),
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
}

export async function assignPackageJson(p: Package, updates: any) {
  const packageBinDirPath = `${p.path}/package.json`
  const packageJson: PackageJSON = JSON.parse(await prom.readFile(packageBinDirPath, {encoding: "utf8"}))
  await prom.writeFile(packageBinDirPath, JSON.stringify(  merge(packageJson, updates), null, 2))
}


export async function assignPackagesJson(packages: Package[], updates: any) {
  return Promise.all(
    packages.map(p => assignPackageJson(p, updates))
  )
}
