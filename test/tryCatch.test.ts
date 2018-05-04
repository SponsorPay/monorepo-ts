import {exec} from "child_process"
import {promisify} from "util"
import {Try} from "../src/tryCatch"

const prom = {
  exec: promisify(exec)
}

describe("tryCatch", function () {
  it("should sync", async () => {
    console.log(
      await Try.of(() => {
        if (Math.random()) {
          throw new Error()
        }
        return "1"
      })
        .getOrElse(() => "2")
    )
  })

  it("should async", async () => {
    console.log(
      await Try.of(async () => {
        if (Math.random()) {
          throw new Error()
        }
        return "1"
      })
        .getOrElse(() => "2")
    )
  })
})
