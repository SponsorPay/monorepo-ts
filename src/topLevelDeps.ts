import * as fs from "fs"
import {promisify} from "util"
import {listPackages, Package, PackageJSON} from "./listPackages"
const prom = {
  symlink: promisify(fs.symlink),
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
}

export async function topLevelDeps(packages: Package[]) {
  const packageNameToPackage = new Map<string, Package>(
    packages.map(p => [p.json.name, p] as any)
  )
  let devDeps: any = packages.reduce((prev, current) => {
    const deps = {
      ...current.json.dependencies,
      ...current.json.devDependencies
    }

    const sameKey = Object.keys(deps).find(key => prev.hasOwnProperty(key))
    if (sameKey != null) {
      if (deps[sameKey] !== prev[sameKey]) {
        console.warn(current.json.name, `same key ${sameKey}, different version ${deps[sameKey]}`)
      }
    }

    const toAdd = Object.keys(deps)
      .filter(key => !packageNameToPackage.has(key))
      .reduce((prev, key) => ({...prev, [key]: deps[key]}), {})

    return {...prev, ...toAdd}
  }, {} as Record<string, string>)
  devDeps = Object.keys(devDeps).sort().reduce((prev, next) => ({...prev, [next]: devDeps[next]}), {})
  const path = `${process.env.PWD}/package.json`
  const packageJson: PackageJSON = JSON.parse(await prom.readFile(path, {encoding: "utf8"}))
  packageJson.devDependencies = devDeps
  await prom.writeFile(path, JSON.stringify(packageJson, null, 2))
}
