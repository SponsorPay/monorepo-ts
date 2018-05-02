import {writeFileSync} from "fs"
import {Package} from "./listPackages"

export function tsConfigPaths(packages: Package[]) {
  const topLevelTsConfigPath = `${process.env.PWD}/tsconfig.json`
  const topLevelTsConfig = require(topLevelTsConfigPath)
  Object.assign(
    topLevelTsConfig.compilerOptions, {
      baseUrl: ".",
      paths: packages.reduce((previousValue, p) => ({...previousValue, [p.json.name]: [`${p.relativePath}/src`]}), {})
    }
  )
  writeFileSync(topLevelTsConfigPath, JSON.stringify(topLevelTsConfig, null, 2))
}
