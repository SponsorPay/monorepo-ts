#! /usr/bin/env node

import {compiler} from "./compiler"
import {linkDeps} from "./linkDeps"
import {listPackages, Package} from "./listPackages"
import {topLevelDeps} from "./topLevelDeps"

const log = console.log.bind(console);

(async function () {
  const packages = await listPackages()

  await Promise.all(
    packages.map(p => {
      compiler(p).watch()
      // return compiler(p).once()
    })
  )

  topLevelDeps(packages)
  linkDeps(packages)
  log("Watching for file changes.")
})()
