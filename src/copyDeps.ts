import * as fs from "fs"
import * as rimraf from "rimraf"
import * as mkdirp from "mkdirp"
import {promisify} from "util"
import {Package} from "./listPackages"
import {exec} from "child_process"
import {Try} from "./tryCatch"
import * as ncp from "ncp"

const prom = {
  rimraf: promisify(rimraf),
  mkdirp: promisify(mkdirp),
  ncp: promisify(ncp.ncp),
  exec: promisify(exec),
}

const log = console.log.bind(console);

export async function copyDeps(packages: Package[], updatedOnly = false) {

  function getAllNestedDeps(p: Package): Set<string> {
    const nestedDeps = Array.prototype.concat.apply(
      [],
      Object.keys(p.json.dependencies)
        .map(d => packageNameToPackage.get(d) as Package)
        .filter(_ => _ != null)
        .map(getAllNestedDeps)
        .map(set => Array.from(set.values()))
    )
    return new Set([
      ...Object.keys(p.json.dependencies)
        .map(d => packageNameToPackage.get(d) as Package)
        .filter(_ => _)
        .map(_ => _.json.name),
      ...nestedDeps
    ])
  }

  function scopePackage(p: Package) {
    log(`${p.json.name}: start...`)
    const deps = getAllNestedDeps(p)
    log(`${p.json.name}: linking ${deps.size} dependencies...`)
    Array.from(getAllNestedDeps(p))
      .filter(dep => !updatedOnly || nameToUpdated.has(dep))
      .forEach(async (dep: string) => {
        const depPackage = packageNameToPackage.get(dep)
        if (depPackage != null) {
          const buildDir = `${depPackage.path}`
          const nodeModulesDest = `${p.path}/node_modules/${dep}`
          await prom.mkdirp(nodeModulesDest)
          await prom.rimraf(nodeModulesDest)
          await prom.ncp(buildDir, nodeModulesDest)
        }
      })
  }

  const updated = await Try.of(
    async () => {
      const {stdout} = await prom.exec(`${process.env.PWD}/node_modules/.bin/lerna updated --json`)
      return JSON.parse(stdout) as { name: string }[]
    }
  )
    .getOrElse(() => [])

  const nameToUpdated = new Map<string, Package>(
    updated.map(p => [p.name, p] as any)
  )

  const pathToPackage = new Map<string, Package>(
    packages.map(p => [p.path, p] as any)
  )
  const packageNameToPackage = new Map<string, Package>(
    packages.map(p => [p.json.name, p] as any)
  )
  packages.forEach(scopePackage)
}
