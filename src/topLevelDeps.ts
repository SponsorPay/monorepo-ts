import * as fs from "fs"
import {promisify} from "util"
import {listPackages, Package, PackageJSON} from "./listPackages"
const prom = {
  symlink: promisify(fs.symlink),
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
}

export async function topLevelDeps(packages: Package[]) {
  let devDeps: any = packages.reduce((prev, current) => {
    const sameKey = Object.keys(current.json.dependencies).find(key => prev.hasOwnProperty(key))
    if(current.json.dependencies[sameKey] !== prev[sameKey]) {
      console.warn(current.json.name, `same key ${sameKey}, different version ${current.json.dependencies[sameKey]}`)
    }
    return {...prev, ...current.json.dependencies}
  }, {} as Record<string, string>)
  devDeps = Object.keys(devDeps).sort().reduce((prev, next) => ({...prev, [next]: devDeps[next]}), {})
  const path = `${process.env.PWD}/package.json`
  const packageJson: PackageJSON = JSON.parse(await prom.readFile(path, {encoding: "utf8"}))
  packageJson.dependencies = devDeps
  await prom.writeFile(path, JSON.stringify(packageJson, null, 2))
}
