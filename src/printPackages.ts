import {listPackages} from "./listPackages"

(async function () {
  console.log(
    JSON.stringify(
      await listPackages(),
      null,
      2
    )
  )
})()
