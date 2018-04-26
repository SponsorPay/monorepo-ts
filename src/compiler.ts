import * as chokidar from "chokidar"
import * as ts from "typescript"
import * as glob from "glob"
import {promisify} from "util"
import {Package} from "./listPackages"
import * as fs from "fs"
const log = console.log.bind(console);

export function compiler(p: Package) {
  const tsConfig = require(p.path + "/tsconfig.prod.json")
  const compilerOptions = ts.convertCompilerOptionsFromJson(tsConfig.compilerOptions, p.path)

  function compile(files: string[]) {
    log(`${p.json.name}: compiling ${files.length}...`)
    const program = ts.createProgram(files, compilerOptions.options)
    const emitResult = program.emit()
    if (emitResult.diagnostics.length) {
      log(
        ts.formatDiagnostics(emitResult.diagnostics, {
          getCanonicalFileName: fileName => fileName,
          getCurrentDirectory: () => p.path,
          getNewLine: () => "\n"
        })
      )
    } else {
      log("Compilation complete. Watching for file changes.")
    }
  }

  function increment(rootFileNames: string[]) {
    const files: ts.MapLike<{ version: number }> = {};

    // initialize the list of files
    rootFileNames.forEach(fileName => {
      files[fileName] = { version: 0 };
    });

    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => rootFileNames,
      getScriptVersion: (fileName) => files[fileName] && files[fileName].version.toString(),
      getScriptSnapshot: (fileName) => {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }

        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => compilerOptions.options,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
    };

    const services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())

    function emitFile(fileName: string) {
      let output = services.getEmitOutput(fileName);

      if (!output.emitSkipped) {
        console.log(`Emitting ${fileName}`);
      }
      else {
        logErrors(fileName);
      }

      output.outputFiles.forEach(o => {
        fs.writeFileSync(o.name, o.text, "utf8");
      });
    }

    function logErrors(fileName: string) {
      let allDiagnostics = services.getCompilerOptionsDiagnostics()
        .concat(services.getSyntacticDiagnostics(fileName))
        .concat(services.getSemanticDiagnostics(fileName));

      allDiagnostics.forEach(diagnostic => {
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        if (diagnostic.file) {
          let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
          console.log(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
        else {
          console.log(`  Error: ${message}`);
        }
      });
    }

    chokidar.watch(tsConfig.include, {
      cwd: p.path,
      usePolling: true
    })
      .on('change', path => {
        path = `${p.path}/${path}`
        files[path].version++;
        emitFile(path)
      })
  }

  return {
    async once() {
      const matches = await promisify(glob)(p.path + "/" + tsConfig.include[0])
      return compile(matches)
    },
    async watch() {
      const matches = await promisify(glob)(p.path + "/" + tsConfig.include[0])
      return increment(matches)
    }
  }
}
