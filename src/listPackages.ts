import * as glob from "glob"
import {promisify} from "util"

const lerna = require(process.env.PWD + "/lerna.json")

export interface PackageJSON {
  name: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface Package {
  path: string;
  json: PackageJSON;
}

export function getPackage(path: string): Package {
  const json = require(path + "/" + "package.json")
  return {
    path,
    json
  }
}


export async function listPackages(): Promise<Package[]> {
  const arrays = await Promise.all(
    lerna.packages.map(
      async (p: string) => {
        const files = await promisify(glob)(p, {absolute: true})
        return files.map(getPackage)
      }
    )
  )
  return Array.prototype.concat.apply([], arrays.map(a => a))
}
