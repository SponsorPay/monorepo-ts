import * as glob from "glob"
import {promisify} from "util"

const lerna = require(process.cwd() + "/lerna.json")

export interface PackageJSON {
  name: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface Package {
  relativePath: string;
  path: string;
  json: PackageJSON;
}

export function getPackage(relativePath: string): Package {
  const path = `${process.cwd()}/${relativePath}`
  const json = require(path + "/" + "package.json")
  return {
    relativePath,
    path,
    json
  }
}


export async function listPackages(): Promise<Package[]> {
  const arrays = await Promise.all(
    lerna.packages.map(
      async (p: string) => {
        const files = await promisify(glob)(p)
        return files.map(getPackage)
      }
    )
  )
  return Array.prototype.concat.apply([], arrays.map(a => a))
}
