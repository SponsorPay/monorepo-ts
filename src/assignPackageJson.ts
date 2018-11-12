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

export async function assignFile<T>(p: Package, file: string, updates: T) {
  const fullPath = `${p.path}/${file}`
  const json = JSON.parse(await prom.readFile(fullPath, {encoding: "utf8"}))
  await prom.writeFile(fullPath, JSON.stringify(  merge(json, updates), null, 2))
}

export async function assignPackageJson<T>(p: Package, updates: T) {
  return assignFile(p, "package.json", updates)
}

export async function assignPackagesJson<T>(packages: Package[], updates: T) {
  return Promise.all(
    packages.map(p => assignPackageJson(p, updates))
  )
}
