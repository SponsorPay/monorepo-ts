import * as fs from "fs"
import * as rimraf from "rimraf"
import * as mkdirp from "mkdirp"
import {promisify} from "util"
import {Package} from "./listPackages"

const prom = {
  rimraf: promisify(rimraf),
  mkdirp: promisify(mkdirp),
  symlink: promisify(fs.symlink),
}

const log = console.log.bind(console);

export function linkDeps(packages: Package[]) {

  function getAllNestedDeps(p: Package): Set<string> {
    const nestedDeps = Array.prototype.concat.apply(
      [],
      Object.keys(p.json.dependencies)
        .map(d => packageNameToPackage.get(d))
        .filter(_ => _)
        .map(getAllNestedDeps)
        .map(set => Array.from(set.values()))
    )
    return new Set([
      ...Object.keys(p.json.dependencies)
        .map(d => packageNameToPackage.get(d))
        .filter(_ => _)
        .map(_ => _.json.name),
      ...nestedDeps
    ])
  }

  function scopePackage(p: Package) {
    const deps = getAllNestedDeps(p)
    log(`${p.json.name}: linking ${deps.size} dependencies...`)
    getAllNestedDeps(p).forEach(async (dep: string) => {
      const depPackage = packageNameToPackage.get(dep)
      const buildDir = `${depPackage.path}/build`
      const nodeModulesDest = `${p.path}/node_modules/${dep}`
      await prom.mkdirp(nodeModulesDest)
      await prom.rimraf(nodeModulesDest)
      await prom.symlink(buildDir, nodeModulesDest)
    })
  }

  const pathToPackage = new Map<string, Package>(
    packages.map(p => [p.path, p] as any)
  )
  const packageNameToPackage = new Map<string, Package>(
    packages.map(p => [p.json.name, p] as any)
  )
  packages.forEach(scopePackage)
}
