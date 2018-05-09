#! /usr/bin/env node

import {compiler} from "./compiler"
import {linkBin} from "./linkBin"
import {linkDeps} from "./linkDeps"
import {listPackages, Package} from "./listPackages"
import {topLevelDeps} from "./topLevelDeps"
import * as minimist from "minimist"
import {tsConfigPaths} from "./tsConfigPaths"

const args = minimist(process.argv.slice(2))

const log = console.log.bind(console);

(async function () {
  const packages = await listPackages()

  switch (args._[0]) {
    case "link-updated":
      linkDeps(packages, true)
      break;
    case "link-deps":
      linkDeps(packages)
      break;
    case "paths":
      tsConfigPaths(packages)
      break;
    case "print":
      console.log(
        JSON.stringify(
          packages,
          null,
          2
        )
      )
      break
    case "link-bin":
      linkBin(packages)
      break
    case "top-level":
      topLevelDeps(packages)
      break
    default:
      await Promise.all(
        packages.map(p => {
          compiler(p, args.tsconfig).watch()
          // return compiler(p).once()
        })
      )
      linkDeps(packages)
      log("Watching for file changes.")
  }
})()
