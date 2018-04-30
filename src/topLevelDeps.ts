import * as fs from "fs"
import {promisify} from "util"
import {Package, PackageJSON} from "./listPackages"
const prom = {
  symlink: promisify(fs.symlink),
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
}

export async function topLevelDeps(packages: Package[]) {
  let devDeps: any = packages.reduce((prev, current) => ({...prev, ...current.json.devDependencies}), {})
  devDeps = Object.keys(devDeps).sort().reduce((prev, next) => ({...prev, [next]: devDeps[next]}), {})
  const path = `${process.env.PWD}/package.json`
  const packageJson: PackageJSON = JSON.parse(await prom.readFile(path, {encoding: "utf8"}))
  packageJson.devDependencies = devDeps
  await prom.writeFile(path, JSON.stringify(packageJson, null, 2))
}
