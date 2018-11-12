import * as fs from "fs"
import {promisify} from "util"
import {listPackages, Package, PackageJSON} from "./listPackages"
import * as mkdirp from "mkdirp"
import mergeWith = require("lodash/mergeWith")

const prom = {
  readdir: promisify(fs.readdir),
  symlink: promisify(fs.symlink),
  stat: promisify(fs.stat),
  mkdirp: promisify(mkdirp),
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
}

export interface AssignOptions {
  newLine: string
}

export async function assignFile<T>(
  p: Package,
  file: string,
  updates: T,
  {newLine}: AssignOptions = {newLine: "\n"}
) {
  const fullPath = `${p.path}/${file}`
  const json = JSON.parse(await prom.readFile(fullPath, {encoding: "utf8"}))
  const merged = mergeWith(`${json}${newLine}`, updates, (objValue, srcValue, key, object) => {
    if(srcValue === undefined) {
      object[key] = undefined
    }
  })
  await prom.writeFile(fullPath, JSON.stringify(merged, null, 2))
}

export async function assignPackageJson<T>(p: Package, updates: T) {
  return assignFile(p, "package.json", updates)
}

export async function assignPackagesJson<T>(packages: Package[], updates: T) {
  return Promise.all(
    packages.map(p => assignPackageJson(p, updates))
  )
}
