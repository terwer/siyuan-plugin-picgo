"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to2, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to2;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js
var require_windows = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js"(exports, module2) {
    module2.exports = isexe;
    isexe.sync = sync;
    var fs4 = require("fs");
    function checkPathExt(path5, options) {
      var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
      if (!pathext) {
        return true;
      }
      pathext = pathext.split(";");
      if (pathext.indexOf("") !== -1) {
        return true;
      }
      for (var i = 0; i < pathext.length; i++) {
        var p = pathext[i].toLowerCase();
        if (p && path5.substr(-p.length).toLowerCase() === p) {
          return true;
        }
      }
      return false;
    }
    function checkStat(stat, path5, options) {
      if (!stat.isSymbolicLink() && !stat.isFile()) {
        return false;
      }
      return checkPathExt(path5, options);
    }
    function isexe(path5, options, cb) {
      fs4.stat(path5, function(er, stat) {
        cb(er, er ? false : checkStat(stat, path5, options));
      });
    }
    function sync(path5, options) {
      return checkStat(fs4.statSync(path5), path5, options);
    }
  }
});

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js
var require_mode = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js"(exports, module2) {
    module2.exports = isexe;
    isexe.sync = sync;
    var fs4 = require("fs");
    function isexe(path5, options, cb) {
      fs4.stat(path5, function(er, stat) {
        cb(er, er ? false : checkStat(stat, options));
      });
    }
    function sync(path5, options) {
      return checkStat(fs4.statSync(path5), options);
    }
    function checkStat(stat, options) {
      return stat.isFile() && checkMode(stat, options);
    }
    function checkMode(stat, options) {
      var mod = stat.mode;
      var uid = stat.uid;
      var gid = stat.gid;
      var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
      var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
      var u3 = parseInt("100", 8);
      var g3 = parseInt("010", 8);
      var o3 = parseInt("001", 8);
      var ug2 = u3 | g3;
      var ret = mod & o3 || mod & g3 && gid === myGid || mod & u3 && uid === myUid || mod & ug2 && myUid === 0;
      return ret;
    }
  }
});

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js
var require_isexe = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js"(exports, module2) {
    var fs4 = require("fs");
    var core;
    if (process.platform === "win32" || global.TESTING_WINDOWS) {
      core = require_windows();
    } else {
      core = require_mode();
    }
    module2.exports = isexe;
    isexe.sync = sync;
    function isexe(path5, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (!cb) {
        if (typeof Promise !== "function") {
          throw new TypeError("callback not provided");
        }
        return new Promise(function(resolve, reject) {
          isexe(path5, options || {}, function(er, is2) {
            if (er) {
              reject(er);
            } else {
              resolve(is2);
            }
          });
        });
      }
      core(path5, options || {}, function(er, is2) {
        if (er) {
          if (er.code === "EACCES" || options && options.ignoreErrors) {
            er = null;
            is2 = false;
          }
        }
        cb(er, is2);
      });
    }
    function sync(path5, options) {
      try {
        return core.sync(path5, options || {});
      } catch (er) {
        if (options && options.ignoreErrors || er.code === "EACCES") {
          return false;
        } else {
          throw er;
        }
      }
    }
  }
});

// ../../node_modules/.pnpm/which@2.0.2/node_modules/which/which.js
var require_which = __commonJS({
  "../../node_modules/.pnpm/which@2.0.2/node_modules/which/which.js"(exports, module2) {
    var isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
    var path5 = require("path");
    var COLON = isWindows ? ";" : ":";
    var isexe = require_isexe();
    var getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
    var getPathInfo = (cmd, opt) => {
      const colon = opt.colon || COLON;
      const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
        // windows always checks the cwd first
        ...isWindows ? [process.cwd()] : [],
        ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
        "").split(colon)
      ];
      const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
      const pathExt = isWindows ? pathExtExe.split(colon) : [""];
      if (isWindows) {
        if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
          pathExt.unshift("");
      }
      return {
        pathEnv,
        pathExt,
        pathExtExe
      };
    };
    var which = (cmd, opt, cb) => {
      if (typeof opt === "function") {
        cb = opt;
        opt = {};
      }
      if (!opt)
        opt = {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      const step = (i) => new Promise((resolve, reject) => {
        if (i === pathEnv.length)
          return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path5.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        resolve(subStep(p, i, 0));
      });
      const subStep = (p, i, ii2) => new Promise((resolve, reject) => {
        if (ii2 === pathExt.length)
          return resolve(step(i + 1));
        const ext = pathExt[ii2];
        isexe(p + ext, { pathExt: pathExtExe }, (er, is2) => {
          if (!er && is2) {
            if (opt.all)
              found.push(p + ext);
            else
              return resolve(p + ext);
          }
          return resolve(subStep(p, i, ii2 + 1));
        });
      });
      return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
    };
    var whichSync = (cmd, opt) => {
      opt = opt || {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      for (let i = 0; i < pathEnv.length; i++) {
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path5.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        for (let j2 = 0; j2 < pathExt.length; j2++) {
          const cur = p + pathExt[j2];
          try {
            const is2 = isexe.sync(cur, { pathExt: pathExtExe });
            if (is2) {
              if (opt.all)
                found.push(cur);
              else
                return cur;
            }
          } catch (ex) {
          }
        }
      }
      if (opt.all && found.length)
        return found;
      if (opt.nothrow)
        return null;
      throw getNotFoundError(cmd);
    };
    module2.exports = which;
    which.sync = whichSync;
  }
});

// ../../node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js
var require_path_key = __commonJS({
  "../../node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js"(exports, module2) {
    "use strict";
    var pathKey = (options = {}) => {
      const environment = options.env || process.env;
      const platform = options.platform || process.platform;
      if (platform !== "win32") {
        return "PATH";
      }
      return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
    };
    module2.exports = pathKey;
    module2.exports.default = pathKey;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/util/resolveCommand.js
var require_resolveCommand = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/util/resolveCommand.js"(exports, module2) {
    "use strict";
    var path5 = require("path");
    var which = require_which();
    var getPathKey = require_path_key();
    function resolveCommandAttempt(parsed, withoutPathExt) {
      const env2 = parsed.options.env || process.env;
      const cwd = process.cwd();
      const hasCustomCwd = parsed.options.cwd != null;
      const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
      if (shouldSwitchCwd) {
        try {
          process.chdir(parsed.options.cwd);
        } catch (err) {
        }
      }
      let resolved;
      try {
        resolved = which.sync(parsed.command, {
          path: env2[getPathKey({ env: env2 })],
          pathExt: withoutPathExt ? path5.delimiter : void 0
        });
      } catch (e) {
      } finally {
        if (shouldSwitchCwd) {
          process.chdir(cwd);
        }
      }
      if (resolved) {
        resolved = path5.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
      }
      return resolved;
    }
    function resolveCommand(parsed) {
      return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
    }
    module2.exports = resolveCommand;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/util/escape.js
var require_escape = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/util/escape.js"(exports, module2) {
    "use strict";
    var metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
    function escapeCommand(arg) {
      arg = arg.replace(metaCharsRegExp, "^$1");
      return arg;
    }
    function escapeArgument(arg, doubleEscapeMetaChars) {
      arg = `${arg}`;
      arg = arg.replace(/(\\*)"/g, '$1$1\\"');
      arg = arg.replace(/(\\*)$/, "$1$1");
      arg = `"${arg}"`;
      arg = arg.replace(metaCharsRegExp, "^$1");
      if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, "^$1");
      }
      return arg;
    }
    module2.exports.command = escapeCommand;
    module2.exports.argument = escapeArgument;
  }
});

// ../../node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js
var require_shebang_regex = __commonJS({
  "../../node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js"(exports, module2) {
    "use strict";
    module2.exports = /^#!(.*)/;
  }
});

// ../../node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js
var require_shebang_command = __commonJS({
  "../../node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js"(exports, module2) {
    "use strict";
    var shebangRegex = require_shebang_regex();
    module2.exports = (string = "") => {
      const match = string.match(shebangRegex);
      if (!match) {
        return null;
      }
      const [path5, argument] = match[0].replace(/#! ?/, "").split(" ");
      const binary = path5.split("/").pop();
      if (binary === "env") {
        return argument;
      }
      return argument ? `${binary} ${argument}` : binary;
    };
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/util/readShebang.js
var require_readShebang = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/util/readShebang.js"(exports, module2) {
    "use strict";
    var fs4 = require("fs");
    var shebangCommand = require_shebang_command();
    function readShebang(command) {
      const size = 150;
      const buffer = Buffer.alloc(size);
      let fd;
      try {
        fd = fs4.openSync(command, "r");
        fs4.readSync(fd, buffer, 0, size, 0);
        fs4.closeSync(fd);
      } catch (e) {
      }
      return shebangCommand(buffer.toString());
    }
    module2.exports = readShebang;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/parse.js
var require_parse = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/parse.js"(exports, module2) {
    "use strict";
    var path5 = require("path");
    var resolveCommand = require_resolveCommand();
    var escape = require_escape();
    var readShebang = require_readShebang();
    var isWin = process.platform === "win32";
    var isExecutableRegExp = /\.(?:com|exe)$/i;
    var isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
    function detectShebang(parsed) {
      parsed.file = resolveCommand(parsed);
      const shebang = parsed.file && readShebang(parsed.file);
      if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;
        return resolveCommand(parsed);
      }
      return parsed.file;
    }
    function parseNonShell(parsed) {
      if (!isWin) {
        return parsed;
      }
      const commandFile = detectShebang(parsed);
      const needsShell = !isExecutableRegExp.test(commandFile);
      if (parsed.options.forceShell || needsShell) {
        const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
        parsed.command = path5.normalize(parsed.command);
        parsed.command = escape.command(parsed.command);
        parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
        const shellCommand = [parsed.command].concat(parsed.args).join(" ");
        parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
        parsed.command = process.env.comspec || "cmd.exe";
        parsed.options.windowsVerbatimArguments = true;
      }
      return parsed;
    }
    function parse(command, args2, options) {
      if (args2 && !Array.isArray(args2)) {
        options = args2;
        args2 = null;
      }
      args2 = args2 ? args2.slice(0) : [];
      options = Object.assign({}, options);
      const parsed = {
        command,
        args: args2,
        options,
        file: void 0,
        original: {
          command,
          args: args2
        }
      };
      return options.shell ? parsed : parseNonShell(parsed);
    }
    module2.exports = parse;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/enoent.js
var require_enoent = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/lib/enoent.js"(exports, module2) {
    "use strict";
    var isWin = process.platform === "win32";
    function notFoundError(original, syscall) {
      return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: "ENOENT",
        errno: "ENOENT",
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args
      });
    }
    function hookChildProcess(cp, parsed) {
      if (!isWin) {
        return;
      }
      const originalEmit = cp.emit;
      cp.emit = function(name, arg1) {
        if (name === "exit") {
          const err = verifyENOENT(arg1, parsed, "spawn");
          if (err) {
            return originalEmit.call(cp, "error", err);
          }
        }
        return originalEmit.apply(cp, arguments);
      };
    }
    function verifyENOENT(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawn");
      }
      return null;
    }
    function verifyENOENTSync(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawnSync");
      }
      return null;
    }
    module2.exports = {
      hookChildProcess,
      verifyENOENT,
      verifyENOENTSync,
      notFoundError
    };
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/index.js
var require_cross_spawn = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.3/node_modules/cross-spawn/index.js"(exports, module2) {
    "use strict";
    var cp = require("child_process");
    var parse = require_parse();
    var enoent = require_enoent();
    function spawn(command, args2, options) {
      const parsed = parse(command, args2, options);
      const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
      enoent.hookChildProcess(spawned, parsed);
      return spawned;
    }
    function spawnSync(command, args2, options) {
      const parsed = parse(command, args2, options);
      const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
      result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
      return result;
    }
    module2.exports = spawn;
    module2.exports.spawn = spawn;
    module2.exports.sync = spawnSync;
    module2.exports._parse = parse;
    module2.exports._enoent = enoent;
  }
});

// ../../node_modules/.pnpm/strip-final-newline@2.0.0/node_modules/strip-final-newline/index.js
var require_strip_final_newline = __commonJS({
  "../../node_modules/.pnpm/strip-final-newline@2.0.0/node_modules/strip-final-newline/index.js"(exports, module2) {
    "use strict";
    module2.exports = (input) => {
      const LF = typeof input === "string" ? "\n" : "\n".charCodeAt();
      const CR = typeof input === "string" ? "\r" : "\r".charCodeAt();
      if (input[input.length - 1] === LF) {
        input = input.slice(0, input.length - 1);
      }
      if (input[input.length - 1] === CR) {
        input = input.slice(0, input.length - 1);
      }
      return input;
    };
  }
});

// ../../node_modules/.pnpm/npm-run-path@4.0.1/node_modules/npm-run-path/index.js
var require_npm_run_path = __commonJS({
  "../../node_modules/.pnpm/npm-run-path@4.0.1/node_modules/npm-run-path/index.js"(exports, module2) {
    "use strict";
    var path5 = require("path");
    var pathKey = require_path_key();
    var npmRunPath = (options) => {
      options = {
        cwd: process.cwd(),
        path: process.env[pathKey()],
        execPath: process.execPath,
        ...options
      };
      let previous;
      let cwdPath = path5.resolve(options.cwd);
      const result = [];
      while (previous !== cwdPath) {
        result.push(path5.join(cwdPath, "node_modules/.bin"));
        previous = cwdPath;
        cwdPath = path5.resolve(cwdPath, "..");
      }
      const execPathDir = path5.resolve(options.cwd, options.execPath, "..");
      result.push(execPathDir);
      return result.concat(options.path).join(path5.delimiter);
    };
    module2.exports = npmRunPath;
    module2.exports.default = npmRunPath;
    module2.exports.env = (options) => {
      options = {
        env: process.env,
        ...options
      };
      const env2 = { ...options.env };
      const path6 = pathKey({ env: env2 });
      options.path = env2[path6];
      env2[path6] = module2.exports(options);
      return env2;
    };
  }
});

// ../../node_modules/.pnpm/mimic-fn@2.1.0/node_modules/mimic-fn/index.js
var require_mimic_fn = __commonJS({
  "../../node_modules/.pnpm/mimic-fn@2.1.0/node_modules/mimic-fn/index.js"(exports, module2) {
    "use strict";
    var mimicFn = (to2, from) => {
      for (const prop of Reflect.ownKeys(from)) {
        Object.defineProperty(to2, prop, Object.getOwnPropertyDescriptor(from, prop));
      }
      return to2;
    };
    module2.exports = mimicFn;
    module2.exports.default = mimicFn;
  }
});

// ../../node_modules/.pnpm/onetime@5.1.2/node_modules/onetime/index.js
var require_onetime = __commonJS({
  "../../node_modules/.pnpm/onetime@5.1.2/node_modules/onetime/index.js"(exports, module2) {
    "use strict";
    var mimicFn = require_mimic_fn();
    var calledFunctions = /* @__PURE__ */ new WeakMap();
    var onetime = (function_, options = {}) => {
      if (typeof function_ !== "function") {
        throw new TypeError("Expected a function");
      }
      let returnValue;
      let callCount = 0;
      const functionName = function_.displayName || function_.name || "<anonymous>";
      const onetime2 = function(...arguments_) {
        calledFunctions.set(onetime2, ++callCount);
        if (callCount === 1) {
          returnValue = function_.apply(this, arguments_);
          function_ = null;
        } else if (options.throw === true) {
          throw new Error(`Function \`${functionName}\` can only be called once`);
        }
        return returnValue;
      };
      mimicFn(onetime2, function_);
      calledFunctions.set(onetime2, callCount);
      return onetime2;
    };
    module2.exports = onetime;
    module2.exports.default = onetime;
    module2.exports.callCount = (function_) => {
      if (!calledFunctions.has(function_)) {
        throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
      }
      return calledFunctions.get(function_);
    };
  }
});

// ../../node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/core.js
var require_core = __commonJS({
  "../../node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SIGNALS = void 0;
    var SIGNALS = [
      {
        name: "SIGHUP",
        number: 1,
        action: "terminate",
        description: "Terminal closed",
        standard: "posix"
      },
      {
        name: "SIGINT",
        number: 2,
        action: "terminate",
        description: "User interruption with CTRL-C",
        standard: "ansi"
      },
      {
        name: "SIGQUIT",
        number: 3,
        action: "core",
        description: "User interruption with CTRL-\\",
        standard: "posix"
      },
      {
        name: "SIGILL",
        number: 4,
        action: "core",
        description: "Invalid machine instruction",
        standard: "ansi"
      },
      {
        name: "SIGTRAP",
        number: 5,
        action: "core",
        description: "Debugger breakpoint",
        standard: "posix"
      },
      {
        name: "SIGABRT",
        number: 6,
        action: "core",
        description: "Aborted",
        standard: "ansi"
      },
      {
        name: "SIGIOT",
        number: 6,
        action: "core",
        description: "Aborted",
        standard: "bsd"
      },
      {
        name: "SIGBUS",
        number: 7,
        action: "core",
        description: "Bus error due to misaligned, non-existing address or paging error",
        standard: "bsd"
      },
      {
        name: "SIGEMT",
        number: 7,
        action: "terminate",
        description: "Command should be emulated but is not implemented",
        standard: "other"
      },
      {
        name: "SIGFPE",
        number: 8,
        action: "core",
        description: "Floating point arithmetic error",
        standard: "ansi"
      },
      {
        name: "SIGKILL",
        number: 9,
        action: "terminate",
        description: "Forced termination",
        standard: "posix",
        forced: true
      },
      {
        name: "SIGUSR1",
        number: 10,
        action: "terminate",
        description: "Application-specific signal",
        standard: "posix"
      },
      {
        name: "SIGSEGV",
        number: 11,
        action: "core",
        description: "Segmentation fault",
        standard: "ansi"
      },
      {
        name: "SIGUSR2",
        number: 12,
        action: "terminate",
        description: "Application-specific signal",
        standard: "posix"
      },
      {
        name: "SIGPIPE",
        number: 13,
        action: "terminate",
        description: "Broken pipe or socket",
        standard: "posix"
      },
      {
        name: "SIGALRM",
        number: 14,
        action: "terminate",
        description: "Timeout or timer",
        standard: "posix"
      },
      {
        name: "SIGTERM",
        number: 15,
        action: "terminate",
        description: "Termination",
        standard: "ansi"
      },
      {
        name: "SIGSTKFLT",
        number: 16,
        action: "terminate",
        description: "Stack is empty or overflowed",
        standard: "other"
      },
      {
        name: "SIGCHLD",
        number: 17,
        action: "ignore",
        description: "Child process terminated, paused or unpaused",
        standard: "posix"
      },
      {
        name: "SIGCLD",
        number: 17,
        action: "ignore",
        description: "Child process terminated, paused or unpaused",
        standard: "other"
      },
      {
        name: "SIGCONT",
        number: 18,
        action: "unpause",
        description: "Unpaused",
        standard: "posix",
        forced: true
      },
      {
        name: "SIGSTOP",
        number: 19,
        action: "pause",
        description: "Paused",
        standard: "posix",
        forced: true
      },
      {
        name: "SIGTSTP",
        number: 20,
        action: "pause",
        description: 'Paused using CTRL-Z or "suspend"',
        standard: "posix"
      },
      {
        name: "SIGTTIN",
        number: 21,
        action: "pause",
        description: "Background process cannot read terminal input",
        standard: "posix"
      },
      {
        name: "SIGBREAK",
        number: 21,
        action: "terminate",
        description: "User interruption with CTRL-BREAK",
        standard: "other"
      },
      {
        name: "SIGTTOU",
        number: 22,
        action: "pause",
        description: "Background process cannot write to terminal output",
        standard: "posix"
      },
      {
        name: "SIGURG",
        number: 23,
        action: "ignore",
        description: "Socket received out-of-band data",
        standard: "bsd"
      },
      {
        name: "SIGXCPU",
        number: 24,
        action: "core",
        description: "Process timed out",
        standard: "bsd"
      },
      {
        name: "SIGXFSZ",
        number: 25,
        action: "core",
        description: "File too big",
        standard: "bsd"
      },
      {
        name: "SIGVTALRM",
        number: 26,
        action: "terminate",
        description: "Timeout or timer",
        standard: "bsd"
      },
      {
        name: "SIGPROF",
        number: 27,
        action: "terminate",
        description: "Timeout or timer",
        standard: "bsd"
      },
      {
        name: "SIGWINCH",
        number: 28,
        action: "ignore",
        description: "Terminal window size changed",
        standard: "bsd"
      },
      {
        name: "SIGIO",
        number: 29,
        action: "terminate",
        description: "I/O is available",
        standard: "other"
      },
      {
        name: "SIGPOLL",
        number: 29,
        action: "terminate",
        description: "Watched event",
        standard: "other"
      },
      {
        name: "SIGINFO",
        number: 29,
        action: "ignore",
        description: "Request for process information",
        standard: "other"
      },
      {
        name: "SIGPWR",
        number: 30,
        action: "terminate",
        description: "Device running out of power",
        standard: "systemv"
      },
      {
        name: "SIGSYS",
        number: 31,
        action: "core",
        description: "Invalid system call",
        standard: "other"
      },
      {
        name: "SIGUNUSED",
        number: 31,
        action: "terminate",
        description: "Invalid system call",
        standard: "other"
      }
    ];
    exports.SIGNALS = SIGNALS;
  }
});

// ../../node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/realtime.js
var require_realtime = __commonJS({
  "../../node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/realtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SIGRTMAX = exports.getRealtimeSignals = void 0;
    var getRealtimeSignals = function() {
      const length = SIGRTMAX - SIGRTMIN + 1;
      return Array.from({ length }, getRealtimeSignal);
    };
    exports.getRealtimeSignals = getRealtimeSignals;
    var getRealtimeSignal = function(value, index) {
      return {
        name: `SIGRT${index + 1}`,
        number: SIGRTMIN + index,
        action: "terminate",
        description: "Application-specific signal (realtime)",
        standard: "posix"
      };
    };
    var SIGRTMIN = 34;
    var SIGRTMAX = 64;
    exports.SIGRTMAX = SIGRTMAX;
  }
});

// ../../node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/signals.js
var require_signals = __commonJS({
  "../../node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/signals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSignals = void 0;
    var _os = require("os");
    var _core = require_core();
    var _realtime = require_realtime();
    var getSignals = function() {
      const realtimeSignals = (0, _realtime.getRealtimeSignals)();
      const signals = [..._core.SIGNALS, ...realtimeSignals].map(normalizeSignal);
      return signals;
    };
    exports.getSignals = getSignals;
    var normalizeSignal = function({
      name,
      number: defaultNumber,
      description,
      action,
      forced = false,
      standard
    }) {
      const {
        signals: { [name]: constantSignal }
      } = _os.constants;
      const supported = constantSignal !== void 0;
      const number = supported ? constantSignal : defaultNumber;
      return { name, number, description, supported, action, forced, standard };
    };
  }
});

// ../../node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/main.js
var require_main = __commonJS({
  "../../node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/main.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.signalsByNumber = exports.signalsByName = void 0;
    var _os = require("os");
    var _signals = require_signals();
    var _realtime = require_realtime();
    var getSignalsByName = function() {
      const signals = (0, _signals.getSignals)();
      return signals.reduce(getSignalByName, {});
    };
    var getSignalByName = function(signalByNameMemo, { name, number, description, supported, action, forced, standard }) {
      return {
        ...signalByNameMemo,
        [name]: { name, number, description, supported, action, forced, standard }
      };
    };
    var signalsByName = getSignalsByName();
    exports.signalsByName = signalsByName;
    var getSignalsByNumber = function() {
      const signals = (0, _signals.getSignals)();
      const length = _realtime.SIGRTMAX + 1;
      const signalsA = Array.from({ length }, (value, number) => getSignalByNumber(number, signals));
      return Object.assign({}, ...signalsA);
    };
    var getSignalByNumber = function(number, signals) {
      const signal = findSignalByNumber(number, signals);
      if (signal === void 0) {
        return {};
      }
      const { name, description, supported, action, forced, standard } = signal;
      return {
        [number]: {
          name,
          number,
          description,
          supported,
          action,
          forced,
          standard
        }
      };
    };
    var findSignalByNumber = function(number, signals) {
      const signal = signals.find(({ name }) => _os.constants.signals[name] === number);
      if (signal !== void 0) {
        return signal;
      }
      return signals.find((signalA) => signalA.number === number);
    };
    var signalsByNumber = getSignalsByNumber();
    exports.signalsByNumber = signalsByNumber;
  }
});

// ../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/error.js
var require_error = __commonJS({
  "../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/error.js"(exports, module2) {
    "use strict";
    var { signalsByName } = require_main();
    var getErrorPrefix = ({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled }) => {
      if (timedOut) {
        return `timed out after ${timeout} milliseconds`;
      }
      if (isCanceled) {
        return "was canceled";
      }
      if (errorCode !== void 0) {
        return `failed with ${errorCode}`;
      }
      if (signal !== void 0) {
        return `was killed with ${signal} (${signalDescription})`;
      }
      if (exitCode !== void 0) {
        return `failed with exit code ${exitCode}`;
      }
      return "failed";
    };
    var makeError = ({
      stdout,
      stderr,
      all,
      error,
      signal,
      exitCode,
      command,
      escapedCommand,
      timedOut,
      isCanceled,
      killed,
      parsed: { options: { timeout } }
    }) => {
      exitCode = exitCode === null ? void 0 : exitCode;
      signal = signal === null ? void 0 : signal;
      const signalDescription = signal === void 0 ? void 0 : signalsByName[signal].description;
      const errorCode = error && error.code;
      const prefix = getErrorPrefix({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled });
      const execaMessage = `Command ${prefix}: ${command}`;
      const isError = Object.prototype.toString.call(error) === "[object Error]";
      const shortMessage = isError ? `${execaMessage}
${error.message}` : execaMessage;
      const message = [shortMessage, stderr, stdout].filter(Boolean).join("\n");
      if (isError) {
        error.originalMessage = error.message;
        error.message = message;
      } else {
        error = new Error(message);
      }
      error.shortMessage = shortMessage;
      error.command = command;
      error.escapedCommand = escapedCommand;
      error.exitCode = exitCode;
      error.signal = signal;
      error.signalDescription = signalDescription;
      error.stdout = stdout;
      error.stderr = stderr;
      if (all !== void 0) {
        error.all = all;
      }
      if ("bufferedData" in error) {
        delete error.bufferedData;
      }
      error.failed = true;
      error.timedOut = Boolean(timedOut);
      error.isCanceled = isCanceled;
      error.killed = killed && !timedOut;
      return error;
    };
    module2.exports = makeError;
  }
});

// ../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/stdio.js
var require_stdio = __commonJS({
  "../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/stdio.js"(exports, module2) {
    "use strict";
    var aliases = ["stdin", "stdout", "stderr"];
    var hasAlias = (options) => aliases.some((alias) => options[alias] !== void 0);
    var normalizeStdio = (options) => {
      if (!options) {
        return;
      }
      const { stdio } = options;
      if (stdio === void 0) {
        return aliases.map((alias) => options[alias]);
      }
      if (hasAlias(options)) {
        throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map((alias) => `\`${alias}\``).join(", ")}`);
      }
      if (typeof stdio === "string") {
        return stdio;
      }
      if (!Array.isArray(stdio)) {
        throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
      }
      const length = Math.max(stdio.length, aliases.length);
      return Array.from({ length }, (value, index) => stdio[index]);
    };
    module2.exports = normalizeStdio;
    module2.exports.node = (options) => {
      const stdio = normalizeStdio(options);
      if (stdio === "ipc") {
        return "ipc";
      }
      if (stdio === void 0 || typeof stdio === "string") {
        return [stdio, stdio, stdio, "ipc"];
      }
      if (stdio.includes("ipc")) {
        return stdio;
      }
      return [...stdio, "ipc"];
    };
  }
});

// ../../node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js
var require_signals2 = __commonJS({
  "../../node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js"(exports, module2) {
    module2.exports = [
      "SIGABRT",
      "SIGALRM",
      "SIGHUP",
      "SIGINT",
      "SIGTERM"
    ];
    if (process.platform !== "win32") {
      module2.exports.push(
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      );
    }
    if (process.platform === "linux") {
      module2.exports.push(
        "SIGIO",
        "SIGPOLL",
        "SIGPWR",
        "SIGSTKFLT",
        "SIGUNUSED"
      );
    }
  }
});

// ../../node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js
var require_signal_exit = __commonJS({
  "../../node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js"(exports, module2) {
    var process5 = global.process;
    var processOk = function(process6) {
      return process6 && typeof process6 === "object" && typeof process6.removeListener === "function" && typeof process6.emit === "function" && typeof process6.reallyExit === "function" && typeof process6.listeners === "function" && typeof process6.kill === "function" && typeof process6.pid === "number" && typeof process6.on === "function";
    };
    if (!processOk(process5)) {
      module2.exports = function() {
        return function() {
        };
      };
    } else {
      assert = require("assert");
      signals = require_signals2();
      isWin = /^win/i.test(process5.platform);
      EE = require("events");
      if (typeof EE !== "function") {
        EE = EE.EventEmitter;
      }
      if (process5.__signal_exit_emitter__) {
        emitter = process5.__signal_exit_emitter__;
      } else {
        emitter = process5.__signal_exit_emitter__ = new EE();
        emitter.count = 0;
        emitter.emitted = {};
      }
      if (!emitter.infinite) {
        emitter.setMaxListeners(Infinity);
        emitter.infinite = true;
      }
      module2.exports = function(cb, opts) {
        if (!processOk(global.process)) {
          return function() {
          };
        }
        assert.equal(typeof cb, "function", "a callback must be provided for exit handler");
        if (loaded === false) {
          load();
        }
        var ev = "exit";
        if (opts && opts.alwaysLast) {
          ev = "afterexit";
        }
        var remove = function() {
          emitter.removeListener(ev, cb);
          if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
            unload();
          }
        };
        emitter.on(ev, cb);
        return remove;
      };
      unload = function unload2() {
        if (!loaded || !processOk(global.process)) {
          return;
        }
        loaded = false;
        signals.forEach(function(sig) {
          try {
            process5.removeListener(sig, sigListeners[sig]);
          } catch (er) {
          }
        });
        process5.emit = originalProcessEmit;
        process5.reallyExit = originalProcessReallyExit;
        emitter.count -= 1;
      };
      module2.exports.unload = unload;
      emit = function emit2(event, code, signal) {
        if (emitter.emitted[event]) {
          return;
        }
        emitter.emitted[event] = true;
        emitter.emit(event, code, signal);
      };
      sigListeners = {};
      signals.forEach(function(sig) {
        sigListeners[sig] = function listener() {
          if (!processOk(global.process)) {
            return;
          }
          var listeners = process5.listeners(sig);
          if (listeners.length === emitter.count) {
            unload();
            emit("exit", null, sig);
            emit("afterexit", null, sig);
            if (isWin && sig === "SIGHUP") {
              sig = "SIGINT";
            }
            process5.kill(process5.pid, sig);
          }
        };
      });
      module2.exports.signals = function() {
        return signals;
      };
      loaded = false;
      load = function load2() {
        if (loaded || !processOk(global.process)) {
          return;
        }
        loaded = true;
        emitter.count += 1;
        signals = signals.filter(function(sig) {
          try {
            process5.on(sig, sigListeners[sig]);
            return true;
          } catch (er) {
            return false;
          }
        });
        process5.emit = processEmit;
        process5.reallyExit = processReallyExit;
      };
      module2.exports.load = load;
      originalProcessReallyExit = process5.reallyExit;
      processReallyExit = function processReallyExit2(code) {
        if (!processOk(global.process)) {
          return;
        }
        process5.exitCode = code || /* istanbul ignore next */
        0;
        emit("exit", process5.exitCode, null);
        emit("afterexit", process5.exitCode, null);
        originalProcessReallyExit.call(process5, process5.exitCode);
      };
      originalProcessEmit = process5.emit;
      processEmit = function processEmit2(ev, arg) {
        if (ev === "exit" && processOk(global.process)) {
          if (arg !== void 0) {
            process5.exitCode = arg;
          }
          var ret = originalProcessEmit.apply(this, arguments);
          emit("exit", process5.exitCode, null);
          emit("afterexit", process5.exitCode, null);
          return ret;
        } else {
          return originalProcessEmit.apply(this, arguments);
        }
      };
    }
    var assert;
    var signals;
    var isWin;
    var EE;
    var emitter;
    var unload;
    var emit;
    var sigListeners;
    var loaded;
    var load;
    var originalProcessReallyExit;
    var processReallyExit;
    var originalProcessEmit;
    var processEmit;
  }
});

// ../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/kill.js
var require_kill = __commonJS({
  "../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/kill.js"(exports, module2) {
    "use strict";
    var os2 = require("os");
    var onExit = require_signal_exit();
    var DEFAULT_FORCE_KILL_TIMEOUT = 1e3 * 5;
    var spawnedKill = (kill, signal = "SIGTERM", options = {}) => {
      const killResult = kill(signal);
      setKillTimeout(kill, signal, options, killResult);
      return killResult;
    };
    var setKillTimeout = (kill, signal, options, killResult) => {
      if (!shouldForceKill(signal, options, killResult)) {
        return;
      }
      const timeout = getForceKillAfterTimeout(options);
      const t = setTimeout(() => {
        kill("SIGKILL");
      }, timeout);
      if (t.unref) {
        t.unref();
      }
    };
    var shouldForceKill = (signal, { forceKillAfterTimeout }, killResult) => {
      return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
    };
    var isSigterm = (signal) => {
      return signal === os2.constants.signals.SIGTERM || typeof signal === "string" && signal.toUpperCase() === "SIGTERM";
    };
    var getForceKillAfterTimeout = ({ forceKillAfterTimeout = true }) => {
      if (forceKillAfterTimeout === true) {
        return DEFAULT_FORCE_KILL_TIMEOUT;
      }
      if (!Number.isFinite(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
        throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
      }
      return forceKillAfterTimeout;
    };
    var spawnedCancel = (spawned, context) => {
      const killResult = spawned.kill();
      if (killResult) {
        context.isCanceled = true;
      }
    };
    var timeoutKill = (spawned, signal, reject) => {
      spawned.kill(signal);
      reject(Object.assign(new Error("Timed out"), { timedOut: true, signal }));
    };
    var setupTimeout = (spawned, { timeout, killSignal = "SIGTERM" }, spawnedPromise) => {
      if (timeout === 0 || timeout === void 0) {
        return spawnedPromise;
      }
      let timeoutId;
      const timeoutPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          timeoutKill(spawned, killSignal, reject);
        }, timeout);
      });
      const safeSpawnedPromise = spawnedPromise.finally(() => {
        clearTimeout(timeoutId);
      });
      return Promise.race([timeoutPromise, safeSpawnedPromise]);
    };
    var validateTimeout = ({ timeout }) => {
      if (timeout !== void 0 && (!Number.isFinite(timeout) || timeout < 0)) {
        throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
      }
    };
    var setExitHandler = async (spawned, { cleanup, detached }, timedPromise) => {
      if (!cleanup || detached) {
        return timedPromise;
      }
      const removeExitHandler = onExit(() => {
        spawned.kill();
      });
      return timedPromise.finally(() => {
        removeExitHandler();
      });
    };
    module2.exports = {
      spawnedKill,
      spawnedCancel,
      setupTimeout,
      validateTimeout,
      setExitHandler
    };
  }
});

// ../../node_modules/.pnpm/is-stream@2.0.1/node_modules/is-stream/index.js
var require_is_stream = __commonJS({
  "../../node_modules/.pnpm/is-stream@2.0.1/node_modules/is-stream/index.js"(exports, module2) {
    "use strict";
    var isStream = (stream) => stream !== null && typeof stream === "object" && typeof stream.pipe === "function";
    isStream.writable = (stream) => isStream(stream) && stream.writable !== false && typeof stream._write === "function" && typeof stream._writableState === "object";
    isStream.readable = (stream) => isStream(stream) && stream.readable !== false && typeof stream._read === "function" && typeof stream._readableState === "object";
    isStream.duplex = (stream) => isStream.writable(stream) && isStream.readable(stream);
    isStream.transform = (stream) => isStream.duplex(stream) && typeof stream._transform === "function";
    module2.exports = isStream;
  }
});

// ../../node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/buffer-stream.js
var require_buffer_stream = __commonJS({
  "../../node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/buffer-stream.js"(exports, module2) {
    "use strict";
    var { PassThrough: PassThroughStream } = require("stream");
    module2.exports = (options) => {
      options = { ...options };
      const { array } = options;
      let { encoding } = options;
      const isBuffer = encoding === "buffer";
      let objectMode = false;
      if (array) {
        objectMode = !(encoding || isBuffer);
      } else {
        encoding = encoding || "utf8";
      }
      if (isBuffer) {
        encoding = null;
      }
      const stream = new PassThroughStream({ objectMode });
      if (encoding) {
        stream.setEncoding(encoding);
      }
      let length = 0;
      const chunks = [];
      stream.on("data", (chunk) => {
        chunks.push(chunk);
        if (objectMode) {
          length = chunks.length;
        } else {
          length += chunk.length;
        }
      });
      stream.getBufferedValue = () => {
        if (array) {
          return chunks;
        }
        return isBuffer ? Buffer.concat(chunks, length) : chunks.join("");
      };
      stream.getBufferedLength = () => length;
      return stream;
    };
  }
});

// ../../node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/index.js
var require_get_stream = __commonJS({
  "../../node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/index.js"(exports, module2) {
    "use strict";
    var { constants: BufferConstants } = require("buffer");
    var stream = require("stream");
    var { promisify } = require("util");
    var bufferStream = require_buffer_stream();
    var streamPipelinePromisified = promisify(stream.pipeline);
    var MaxBufferError = class extends Error {
      constructor() {
        super("maxBuffer exceeded");
        this.name = "MaxBufferError";
      }
    };
    async function getStream(inputStream, options) {
      if (!inputStream) {
        throw new Error("Expected a stream");
      }
      options = {
        maxBuffer: Infinity,
        ...options
      };
      const { maxBuffer } = options;
      const stream2 = bufferStream(options);
      await new Promise((resolve, reject) => {
        const rejectPromise = (error) => {
          if (error && stream2.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
            error.bufferedData = stream2.getBufferedValue();
          }
          reject(error);
        };
        (async () => {
          try {
            await streamPipelinePromisified(inputStream, stream2);
            resolve();
          } catch (error) {
            rejectPromise(error);
          }
        })();
        stream2.on("data", () => {
          if (stream2.getBufferedLength() > maxBuffer) {
            rejectPromise(new MaxBufferError());
          }
        });
      });
      return stream2.getBufferedValue();
    }
    module2.exports = getStream;
    module2.exports.buffer = (stream2, options) => getStream(stream2, { ...options, encoding: "buffer" });
    module2.exports.array = (stream2, options) => getStream(stream2, { ...options, array: true });
    module2.exports.MaxBufferError = MaxBufferError;
  }
});

// ../../node_modules/.pnpm/merge-stream@2.0.0/node_modules/merge-stream/index.js
var require_merge_stream = __commonJS({
  "../../node_modules/.pnpm/merge-stream@2.0.0/node_modules/merge-stream/index.js"(exports, module2) {
    "use strict";
    var { PassThrough } = require("stream");
    module2.exports = function() {
      var sources = [];
      var output = new PassThrough({ objectMode: true });
      output.setMaxListeners(0);
      output.add = add;
      output.isEmpty = isEmpty;
      output.on("unpipe", remove);
      Array.prototype.slice.call(arguments).forEach(add);
      return output;
      function add(source) {
        if (Array.isArray(source)) {
          source.forEach(add);
          return this;
        }
        sources.push(source);
        source.once("end", remove.bind(null, source));
        source.once("error", output.emit.bind(output, "error"));
        source.pipe(output, { end: false });
        return this;
      }
      function isEmpty() {
        return sources.length == 0;
      }
      function remove(source) {
        sources = sources.filter(function(it) {
          return it !== source;
        });
        if (!sources.length && output.readable) {
          output.end();
        }
      }
    };
  }
});

// ../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/stream.js
var require_stream = __commonJS({
  "../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/stream.js"(exports, module2) {
    "use strict";
    var isStream = require_is_stream();
    var getStream = require_get_stream();
    var mergeStream = require_merge_stream();
    var handleInput = (spawned, input) => {
      if (input === void 0 || spawned.stdin === void 0) {
        return;
      }
      if (isStream(input)) {
        input.pipe(spawned.stdin);
      } else {
        spawned.stdin.end(input);
      }
    };
    var makeAllStream = (spawned, { all }) => {
      if (!all || !spawned.stdout && !spawned.stderr) {
        return;
      }
      const mixed = mergeStream();
      if (spawned.stdout) {
        mixed.add(spawned.stdout);
      }
      if (spawned.stderr) {
        mixed.add(spawned.stderr);
      }
      return mixed;
    };
    var getBufferedData = async (stream, streamPromise) => {
      if (!stream) {
        return;
      }
      stream.destroy();
      try {
        return await streamPromise;
      } catch (error) {
        return error.bufferedData;
      }
    };
    var getStreamPromise = (stream, { encoding, buffer, maxBuffer }) => {
      if (!stream || !buffer) {
        return;
      }
      if (encoding) {
        return getStream(stream, { encoding, maxBuffer });
      }
      return getStream.buffer(stream, { maxBuffer });
    };
    var getSpawnedResult = async ({ stdout, stderr, all }, { encoding, buffer, maxBuffer }, processDone) => {
      const stdoutPromise = getStreamPromise(stdout, { encoding, buffer, maxBuffer });
      const stderrPromise = getStreamPromise(stderr, { encoding, buffer, maxBuffer });
      const allPromise = getStreamPromise(all, { encoding, buffer, maxBuffer: maxBuffer * 2 });
      try {
        return await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
      } catch (error) {
        return Promise.all([
          { error, signal: error.signal, timedOut: error.timedOut },
          getBufferedData(stdout, stdoutPromise),
          getBufferedData(stderr, stderrPromise),
          getBufferedData(all, allPromise)
        ]);
      }
    };
    var validateInputSync = ({ input }) => {
      if (isStream(input)) {
        throw new TypeError("The `input` option cannot be a stream in sync mode");
      }
    };
    module2.exports = {
      handleInput,
      makeAllStream,
      getSpawnedResult,
      validateInputSync
    };
  }
});

// ../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/promise.js
var require_promise = __commonJS({
  "../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/promise.js"(exports, module2) {
    "use strict";
    var nativePromisePrototype = (async () => {
    })().constructor.prototype;
    var descriptors = ["then", "catch", "finally"].map((property) => [
      property,
      Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property)
    ]);
    var mergePromise = (spawned, promise) => {
      for (const [property, descriptor] of descriptors) {
        const value = typeof promise === "function" ? (...args2) => Reflect.apply(descriptor.value, promise(), args2) : descriptor.value.bind(promise);
        Reflect.defineProperty(spawned, property, { ...descriptor, value });
      }
      return spawned;
    };
    var getSpawnedPromise = (spawned) => {
      return new Promise((resolve, reject) => {
        spawned.on("exit", (exitCode, signal) => {
          resolve({ exitCode, signal });
        });
        spawned.on("error", (error) => {
          reject(error);
        });
        if (spawned.stdin) {
          spawned.stdin.on("error", (error) => {
            reject(error);
          });
        }
      });
    };
    module2.exports = {
      mergePromise,
      getSpawnedPromise
    };
  }
});

// ../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/command.js
var require_command = __commonJS({
  "../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/command.js"(exports, module2) {
    "use strict";
    var normalizeArgs = (file, args2 = []) => {
      if (!Array.isArray(args2)) {
        return [file];
      }
      return [file, ...args2];
    };
    var NO_ESCAPE_REGEXP = /^[\w.-]+$/;
    var DOUBLE_QUOTES_REGEXP = /"/g;
    var escapeArg = (arg) => {
      if (typeof arg !== "string" || NO_ESCAPE_REGEXP.test(arg)) {
        return arg;
      }
      return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
    };
    var joinCommand = (file, args2) => {
      return normalizeArgs(file, args2).join(" ");
    };
    var getEscapedCommand = (file, args2) => {
      return normalizeArgs(file, args2).map((arg) => escapeArg(arg)).join(" ");
    };
    var SPACES_REGEXP = / +/g;
    var parseCommand = (command) => {
      const tokens = [];
      for (const token of command.trim().split(SPACES_REGEXP)) {
        const previousToken = tokens[tokens.length - 1];
        if (previousToken && previousToken.endsWith("\\")) {
          tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
        } else {
          tokens.push(token);
        }
      }
      return tokens;
    };
    module2.exports = {
      joinCommand,
      getEscapedCommand,
      parseCommand
    };
  }
});

// ../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/index.js
var require_execa = __commonJS({
  "../../node_modules/.pnpm/execa@5.1.1/node_modules/execa/index.js"(exports, module2) {
    "use strict";
    var path5 = require("path");
    var childProcess = require("child_process");
    var crossSpawn = require_cross_spawn();
    var stripFinalNewline = require_strip_final_newline();
    var npmRunPath = require_npm_run_path();
    var onetime = require_onetime();
    var makeError = require_error();
    var normalizeStdio = require_stdio();
    var { spawnedKill, spawnedCancel, setupTimeout, validateTimeout, setExitHandler } = require_kill();
    var { handleInput, getSpawnedResult, makeAllStream, validateInputSync } = require_stream();
    var { mergePromise, getSpawnedPromise } = require_promise();
    var { joinCommand, parseCommand, getEscapedCommand } = require_command();
    var DEFAULT_MAX_BUFFER = 1e3 * 1e3 * 100;
    var getEnv = ({ env: envOption, extendEnv, preferLocal, localDir, execPath }) => {
      const env2 = extendEnv ? { ...process.env, ...envOption } : envOption;
      if (preferLocal) {
        return npmRunPath.env({ env: env2, cwd: localDir, execPath });
      }
      return env2;
    };
    var handleArguments = (file, args2, options = {}) => {
      const parsed = crossSpawn._parse(file, args2, options);
      file = parsed.command;
      args2 = parsed.args;
      options = parsed.options;
      options = {
        maxBuffer: DEFAULT_MAX_BUFFER,
        buffer: true,
        stripFinalNewline: true,
        extendEnv: true,
        preferLocal: false,
        localDir: options.cwd || process.cwd(),
        execPath: process.execPath,
        encoding: "utf8",
        reject: true,
        cleanup: true,
        all: false,
        windowsHide: true,
        ...options
      };
      options.env = getEnv(options);
      options.stdio = normalizeStdio(options);
      if (process.platform === "win32" && path5.basename(file, ".exe") === "cmd") {
        args2.unshift("/q");
      }
      return { file, args: args2, options, parsed };
    };
    var handleOutput = (options, value, error) => {
      if (typeof value !== "string" && !Buffer.isBuffer(value)) {
        return error === void 0 ? void 0 : "";
      }
      if (options.stripFinalNewline) {
        return stripFinalNewline(value);
      }
      return value;
    };
    var execa2 = (file, args2, options) => {
      const parsed = handleArguments(file, args2, options);
      const command = joinCommand(file, args2);
      const escapedCommand = getEscapedCommand(file, args2);
      validateTimeout(parsed.options);
      let spawned;
      try {
        spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
      } catch (error) {
        const dummySpawned = new childProcess.ChildProcess();
        const errorPromise = Promise.reject(makeError({
          error,
          stdout: "",
          stderr: "",
          all: "",
          command,
          escapedCommand,
          parsed,
          timedOut: false,
          isCanceled: false,
          killed: false
        }));
        return mergePromise(dummySpawned, errorPromise);
      }
      const spawnedPromise = getSpawnedPromise(spawned);
      const timedPromise = setupTimeout(spawned, parsed.options, spawnedPromise);
      const processDone = setExitHandler(spawned, parsed.options, timedPromise);
      const context = { isCanceled: false };
      spawned.kill = spawnedKill.bind(null, spawned.kill.bind(spawned));
      spawned.cancel = spawnedCancel.bind(null, spawned, context);
      const handlePromise = async () => {
        const [{ error, exitCode, signal, timedOut }, stdoutResult, stderrResult, allResult] = await getSpawnedResult(spawned, parsed.options, processDone);
        const stdout = handleOutput(parsed.options, stdoutResult);
        const stderr = handleOutput(parsed.options, stderrResult);
        const all = handleOutput(parsed.options, allResult);
        if (error || exitCode !== 0 || signal !== null) {
          const returnedError = makeError({
            error,
            exitCode,
            signal,
            stdout,
            stderr,
            all,
            command,
            escapedCommand,
            parsed,
            timedOut,
            isCanceled: context.isCanceled,
            killed: spawned.killed
          });
          if (!parsed.options.reject) {
            return returnedError;
          }
          throw returnedError;
        }
        return {
          command,
          escapedCommand,
          exitCode: 0,
          stdout,
          stderr,
          all,
          failed: false,
          timedOut: false,
          isCanceled: false,
          killed: false
        };
      };
      const handlePromiseOnce = onetime(handlePromise);
      handleInput(spawned, parsed.options.input);
      spawned.all = makeAllStream(spawned, parsed.options);
      return mergePromise(spawned, handlePromiseOnce);
    };
    module2.exports = execa2;
    module2.exports.sync = (file, args2, options) => {
      const parsed = handleArguments(file, args2, options);
      const command = joinCommand(file, args2);
      const escapedCommand = getEscapedCommand(file, args2);
      validateInputSync(parsed.options);
      let result;
      try {
        result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
      } catch (error) {
        throw makeError({
          error,
          stdout: "",
          stderr: "",
          all: "",
          command,
          escapedCommand,
          parsed,
          timedOut: false,
          isCanceled: false,
          killed: false
        });
      }
      const stdout = handleOutput(parsed.options, result.stdout, result.error);
      const stderr = handleOutput(parsed.options, result.stderr, result.error);
      if (result.error || result.status !== 0 || result.signal !== null) {
        const error = makeError({
          stdout,
          stderr,
          error: result.error,
          signal: result.signal,
          exitCode: result.status,
          command,
          escapedCommand,
          parsed,
          timedOut: result.error && result.error.code === "ETIMEDOUT",
          isCanceled: false,
          killed: result.signal !== null
        });
        if (!parsed.options.reject) {
          return error;
        }
        throw error;
      }
      return {
        command,
        escapedCommand,
        exitCode: 0,
        stdout,
        stderr,
        failed: false,
        timedOut: false,
        isCanceled: false,
        killed: false
      };
    };
    module2.exports.command = (command, options) => {
      const [file, ...args2] = parseCommand(command);
      return execa2(file, args2, options);
    };
    module2.exports.commandSync = (command, options) => {
      const [file, ...args2] = parseCommand(command);
      return execa2.sync(file, args2, options);
    };
    module2.exports.node = (scriptPath, args2, options = {}) => {
      if (args2 && !Array.isArray(args2) && typeof args2 === "object") {
        options = args2;
        args2 = [];
      }
      const stdio = normalizeStdio.node(options);
      const defaultExecArgv = process.execArgv.filter((arg) => !arg.startsWith("--inspect"));
      const {
        nodePath = process.execPath,
        nodeOptions = defaultExecArgv
      } = options;
      return execa2(
        nodePath,
        [
          ...nodeOptions,
          scriptPath,
          ...Array.isArray(args2) ? args2 : []
        ],
        {
          ...options,
          stdin: void 0,
          stdout: void 0,
          stderr: void 0,
          stdio,
          shell: false
        }
      );
    };
  }
});

// ../../node_modules/.pnpm/universalify@2.0.0/node_modules/universalify/index.js
var require_universalify = __commonJS({
  "../../node_modules/.pnpm/universalify@2.0.0/node_modules/universalify/index.js"(exports) {
    "use strict";
    exports.fromCallback = function(fn2) {
      return Object.defineProperty(function(...args2) {
        if (typeof args2[args2.length - 1] === "function")
          fn2.apply(this, args2);
        else {
          return new Promise((resolve, reject) => {
            fn2.call(
              this,
              ...args2,
              (err, res) => err != null ? reject(err) : resolve(res)
            );
          });
        }
      }, "name", { value: fn2.name });
    };
    exports.fromPromise = function(fn2) {
      return Object.defineProperty(function(...args2) {
        const cb = args2[args2.length - 1];
        if (typeof cb !== "function")
          return fn2.apply(this, args2);
        else
          fn2.apply(this, args2.slice(0, -1)).then((r) => cb(null, r), cb);
      }, "name", { value: fn2.name });
    };
  }
});

// ../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  "../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/polyfills.js"(exports, module2) {
    var constants = require("constants");
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {
    }
    if (typeof process.chdir === "function") {
      chdir = process.chdir;
      process.chdir = function(d3) {
        cwd = null;
        chdir.call(process, d3);
      };
      if (Object.setPrototypeOf)
        Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module2.exports = patch;
    function patch(fs4) {
      if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs4);
      }
      if (!fs4.lutimes) {
        patchLutimes(fs4);
      }
      fs4.chown = chownFix(fs4.chown);
      fs4.fchown = chownFix(fs4.fchown);
      fs4.lchown = chownFix(fs4.lchown);
      fs4.chmod = chmodFix(fs4.chmod);
      fs4.fchmod = chmodFix(fs4.fchmod);
      fs4.lchmod = chmodFix(fs4.lchmod);
      fs4.chownSync = chownFixSync(fs4.chownSync);
      fs4.fchownSync = chownFixSync(fs4.fchownSync);
      fs4.lchownSync = chownFixSync(fs4.lchownSync);
      fs4.chmodSync = chmodFixSync(fs4.chmodSync);
      fs4.fchmodSync = chmodFixSync(fs4.fchmodSync);
      fs4.lchmodSync = chmodFixSync(fs4.lchmodSync);
      fs4.stat = statFix(fs4.stat);
      fs4.fstat = statFix(fs4.fstat);
      fs4.lstat = statFix(fs4.lstat);
      fs4.statSync = statFixSync(fs4.statSync);
      fs4.fstatSync = statFixSync(fs4.fstatSync);
      fs4.lstatSync = statFixSync(fs4.lstatSync);
      if (fs4.chmod && !fs4.lchmod) {
        fs4.lchmod = function(path5, mode, cb) {
          if (cb)
            process.nextTick(cb);
        };
        fs4.lchmodSync = function() {
        };
      }
      if (fs4.chown && !fs4.lchown) {
        fs4.lchown = function(path5, uid, gid, cb) {
          if (cb)
            process.nextTick(cb);
        };
        fs4.lchownSync = function() {
        };
      }
      if (platform === "win32") {
        fs4.rename = typeof fs4.rename !== "function" ? fs4.rename : function(fs$rename) {
          function rename(from, to2, cb) {
            var start = Date.now();
            var backoff = 0;
            fs$rename(from, to2, function CB(er) {
              if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
                setTimeout(function() {
                  fs4.stat(to2, function(stater, st) {
                    if (stater && stater.code === "ENOENT")
                      fs$rename(from, to2, CB);
                    else
                      cb(er);
                  });
                }, backoff);
                if (backoff < 100)
                  backoff += 10;
                return;
              }
              if (cb)
                cb(er);
            });
          }
          if (Object.setPrototypeOf)
            Object.setPrototypeOf(rename, fs$rename);
          return rename;
        }(fs4.rename);
      }
      fs4.read = typeof fs4.read !== "function" ? fs4.read : function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
          var callback;
          if (callback_ && typeof callback_ === "function") {
            var eagCounter = 0;
            callback = function(er, _2, __) {
              if (er && er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return fs$read.call(fs4, fd, buffer, offset, length, position, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return fs$read.call(fs4, fd, buffer, offset, length, position, callback);
        }
        if (Object.setPrototypeOf)
          Object.setPrototypeOf(read, fs$read);
        return read;
      }(fs4.read);
      fs4.readSync = typeof fs4.readSync !== "function" ? fs4.readSync : function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
          var eagCounter = 0;
          while (true) {
            try {
              return fs$readSync.call(fs4, fd, buffer, offset, length, position);
            } catch (er) {
              if (er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      }(fs4.readSync);
      function patchLchmod(fs5) {
        fs5.lchmod = function(path5, mode, callback) {
          fs5.open(
            path5,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode,
            function(err, fd) {
              if (err) {
                if (callback)
                  callback(err);
                return;
              }
              fs5.fchmod(fd, mode, function(err2) {
                fs5.close(fd, function(err22) {
                  if (callback)
                    callback(err2 || err22);
                });
              });
            }
          );
        };
        fs5.lchmodSync = function(path5, mode) {
          var fd = fs5.openSync(path5, constants.O_WRONLY | constants.O_SYMLINK, mode);
          var threw = true;
          var ret;
          try {
            ret = fs5.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs5.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs5.closeSync(fd);
            }
          }
          return ret;
        };
      }
      function patchLutimes(fs5) {
        if (constants.hasOwnProperty("O_SYMLINK") && fs5.futimes) {
          fs5.lutimes = function(path5, at, mt, cb) {
            fs5.open(path5, constants.O_SYMLINK, function(er, fd) {
              if (er) {
                if (cb)
                  cb(er);
                return;
              }
              fs5.futimes(fd, at, mt, function(er2) {
                fs5.close(fd, function(er22) {
                  if (cb)
                    cb(er2 || er22);
                });
              });
            });
          };
          fs5.lutimesSync = function(path5, at, mt) {
            var fd = fs5.openSync(path5, constants.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs5.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs5.closeSync(fd);
                } catch (er) {
                }
              } else {
                fs5.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs5.futimes) {
          fs5.lutimes = function(_a2, _b, _c, cb) {
            if (cb)
              process.nextTick(cb);
          };
          fs5.lutimesSync = function() {
          };
        }
      }
      function chmodFix(orig) {
        if (!orig)
          return orig;
        return function(target, mode, cb) {
          return orig.call(fs4, target, mode, function(er) {
            if (chownErOk(er))
              er = null;
            if (cb)
              cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, mode) {
          try {
            return orig.call(fs4, target, mode);
          } catch (er) {
            if (!chownErOk(er))
              throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig)
          return orig;
        return function(target, uid, gid, cb) {
          return orig.call(fs4, target, uid, gid, function(er) {
            if (chownErOk(er))
              er = null;
            if (cb)
              cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, uid, gid) {
          try {
            return orig.call(fs4, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er))
              throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig)
          return orig;
        return function(target, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0)
                stats.uid += 4294967296;
              if (stats.gid < 0)
                stats.gid += 4294967296;
            }
            if (cb)
              cb.apply(this, arguments);
          }
          return options ? orig.call(fs4, target, options, callback) : orig.call(fs4, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, options) {
          var stats = options ? orig.call(fs4, target, options) : orig.call(fs4, target);
          if (stats) {
            if (stats.uid < 0)
              stats.uid += 4294967296;
            if (stats.gid < 0)
              stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er)
          return true;
        if (er.code === "ENOSYS")
          return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === "EINVAL" || er.code === "EPERM")
            return true;
        }
        return false;
      }
    }
  }
});

// ../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  "../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/legacy-streams.js"(exports, module2) {
    var Stream = require("stream").Stream;
    module2.exports = legacy;
    function legacy(fs4) {
      return {
        ReadStream,
        WriteStream
      };
      function ReadStream(path5, options) {
        if (!(this instanceof ReadStream))
          return new ReadStream(path5, options);
        Stream.call(this);
        var self2 = this;
        this.path = path5;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = "r";
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.encoding)
          this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ("number" !== typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) {
            throw new Error("start must be <= end");
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function() {
            self2._read();
          });
          return;
        }
        fs4.open(this.path, this.flags, this.mode, function(err, fd) {
          if (err) {
            self2.emit("error", err);
            self2.readable = false;
            return;
          }
          self2.fd = fd;
          self2.emit("open", fd);
          self2._read();
        });
      }
      function WriteStream(path5, options) {
        if (!(this instanceof WriteStream))
          return new WriteStream(path5, options);
        Stream.call(this);
        this.path = path5;
        this.fd = null;
        this.writable = true;
        this.flags = "w";
        this.encoding = "binary";
        this.mode = 438;
        this.bytesWritten = 0;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) {
            throw new Error("start must be >= zero");
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs4.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  }
});

// ../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  "../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/clone.js"(exports, module2) {
    "use strict";
    module2.exports = clone;
    var getPrototypeOf = Object.getPrototypeOf || function(obj) {
      return obj.__proto__;
    };
    function clone(obj) {
      if (obj === null || typeof obj !== "object")
        return obj;
      if (obj instanceof Object)
        var copy = { __proto__: getPrototypeOf(obj) };
      else
        var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach(function(key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
      });
      return copy;
    }
  }
});

// ../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  "../../node_modules/.pnpm/graceful-fs@4.2.11/node_modules/graceful-fs/graceful-fs.js"(exports, module2) {
    var fs4 = require("fs");
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone = require_clone();
    var util = require("util");
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === "function" && typeof Symbol.for === "function") {
      gracefulQueue = Symbol.for("graceful-fs.queue");
      previousSymbol = Symbol.for("graceful-fs.previous");
    } else {
      gracefulQueue = "___graceful-fs.queue";
      previousSymbol = "___graceful-fs.previous";
    }
    function noop() {
    }
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function() {
          return queue2;
        }
      });
    }
    var debug = noop;
    if (util.debuglog)
      debug = util.debuglog("gfs4");
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
      debug = function() {
        var m = util.format.apply(util, arguments);
        m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
        console.error(m);
      };
    if (!fs4[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs4, queue);
      fs4.close = function(fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs4, fd, function(err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === "function")
              cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      }(fs4.close);
      fs4.closeSync = function(fs$closeSync) {
        function closeSync(fd) {
          fs$closeSync.apply(fs4, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync;
      }(fs4.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
        process.on("exit", function() {
          debug(fs4[gracefulQueue]);
          require("assert").equal(fs4[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs4[gracefulQueue]);
    }
    module2.exports = patch(clone(fs4));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs4.__patched) {
      module2.exports = patch(fs4);
      fs4.__patched = true;
    }
    function patch(fs5) {
      polyfills(fs5);
      fs5.gracefulify = patch;
      fs5.createReadStream = createReadStream;
      fs5.createWriteStream = createWriteStream;
      var fs$readFile = fs5.readFile;
      fs5.readFile = readFile;
      function readFile(path5, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$readFile(path5, options, cb);
        function go$readFile(path6, options2, cb2, startTime) {
          return fs$readFile(path6, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$readFile, [path6, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs5.writeFile;
      fs5.writeFile = writeFile;
      function writeFile(path5, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$writeFile(path5, data, options, cb);
        function go$writeFile(path6, data2, options2, cb2, startTime) {
          return fs$writeFile(path6, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$writeFile, [path6, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs5.appendFile;
      if (fs$appendFile)
        fs5.appendFile = appendFile;
      function appendFile(path5, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$appendFile(path5, data, options, cb);
        function go$appendFile(path6, data2, options2, cb2, startTime) {
          return fs$appendFile(path6, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$appendFile, [path6, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs5.copyFile;
      if (fs$copyFile)
        fs5.copyFile = copyFile;
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === "function") {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs5.readdir;
      fs5.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path5, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path6, options2, cb2, startTime) {
          return fs$readdir(path6, fs$readdirCallback(
            path6,
            options2,
            cb2,
            startTime
          ));
        } : function go$readdir2(path6, options2, cb2, startTime) {
          return fs$readdir(path6, options2, fs$readdirCallback(
            path6,
            options2,
            cb2,
            startTime
          ));
        };
        return go$readdir(path5, options, cb);
        function fs$readdirCallback(path6, options2, cb2, startTime) {
          return function(err, files) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([
                go$readdir,
                [path6, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort)
                files.sort();
              if (typeof cb2 === "function")
                cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === "v0.8") {
        var legStreams = legacy(fs5);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs5.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs5.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs5, "ReadStream", {
        get: function() {
          return ReadStream;
        },
        set: function(val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs5, "WriteStream", {
        get: function() {
          return WriteStream;
        },
        set: function(val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs5, "FileReadStream", {
        get: function() {
          return FileReadStream;
        },
        set: function(val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs5, "FileWriteStream", {
        get: function() {
          return FileWriteStream;
        },
        set: function(val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      function ReadStream(path5, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
            that.read();
          }
        });
      }
      function WriteStream(path5, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
          }
        });
      }
      function createReadStream(path5, options) {
        return new fs5.ReadStream(path5, options);
      }
      function createWriteStream(path5, options) {
        return new fs5.WriteStream(path5, options);
      }
      var fs$open = fs5.open;
      fs5.open = open;
      function open(path5, flags, mode, cb) {
        if (typeof mode === "function")
          cb = mode, mode = null;
        return go$open(path5, flags, mode, cb);
        function go$open(path6, flags2, mode2, cb2, startTime) {
          return fs$open(path6, flags2, mode2, function(err, fd) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$open, [path6, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs5;
    }
    function enqueue(elem) {
      debug("ENQUEUE", elem[0].name, elem[1]);
      fs4[gracefulQueue].push(elem);
      retry();
    }
    var retryTimer;
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs4[gracefulQueue].length; ++i) {
        if (fs4[gracefulQueue][i].length > 2) {
          fs4[gracefulQueue][i][3] = now;
          fs4[gracefulQueue][i][4] = now;
        }
      }
      retry();
    }
    function retry() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs4[gracefulQueue].length === 0)
        return;
      var elem = fs4[gracefulQueue].shift();
      var fn2 = elem[0];
      var args2 = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug("RETRY", fn2.name, args2);
        fn2.apply(null, args2);
      } else if (Date.now() - startTime >= 6e4) {
        debug("TIMEOUT", fn2.name, args2);
        var cb = args2.pop();
        if (typeof cb === "function")
          cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug("RETRY", fn2.name, args2);
          fn2.apply(null, args2.concat([startTime]));
        } else {
          fs4[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0);
      }
    }
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/fs/index.js
var require_fs = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/fs/index.js"(exports) {
    "use strict";
    var u3 = require_universalify().fromCallback;
    var fs4 = require_graceful_fs();
    var api = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((key) => {
      return typeof fs4[key] === "function";
    });
    Object.assign(exports, fs4);
    api.forEach((method) => {
      exports[method] = u3(fs4[method]);
    });
    exports.exists = function(filename, callback) {
      if (typeof callback === "function") {
        return fs4.exists(filename, callback);
      }
      return new Promise((resolve) => {
        return fs4.exists(filename, resolve);
      });
    };
    exports.read = function(fd, buffer, offset, length, position, callback) {
      if (typeof callback === "function") {
        return fs4.read(fd, buffer, offset, length, position, callback);
      }
      return new Promise((resolve, reject) => {
        fs4.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
          if (err)
            return reject(err);
          resolve({ bytesRead, buffer: buffer2 });
        });
      });
    };
    exports.write = function(fd, buffer, ...args2) {
      if (typeof args2[args2.length - 1] === "function") {
        return fs4.write(fd, buffer, ...args2);
      }
      return new Promise((resolve, reject) => {
        fs4.write(fd, buffer, ...args2, (err, bytesWritten, buffer2) => {
          if (err)
            return reject(err);
          resolve({ bytesWritten, buffer: buffer2 });
        });
      });
    };
    exports.readv = function(fd, buffers, ...args2) {
      if (typeof args2[args2.length - 1] === "function") {
        return fs4.readv(fd, buffers, ...args2);
      }
      return new Promise((resolve, reject) => {
        fs4.readv(fd, buffers, ...args2, (err, bytesRead, buffers2) => {
          if (err)
            return reject(err);
          resolve({ bytesRead, buffers: buffers2 });
        });
      });
    };
    exports.writev = function(fd, buffers, ...args2) {
      if (typeof args2[args2.length - 1] === "function") {
        return fs4.writev(fd, buffers, ...args2);
      }
      return new Promise((resolve, reject) => {
        fs4.writev(fd, buffers, ...args2, (err, bytesWritten, buffers2) => {
          if (err)
            return reject(err);
          resolve({ bytesWritten, buffers: buffers2 });
        });
      });
    };
    if (typeof fs4.realpath.native === "function") {
      exports.realpath.native = u3(fs4.realpath.native);
    } else {
      process.emitWarning(
        "fs.realpath.native is not a function. Is fs being monkey-patched?",
        "Warning",
        "fs-extra-WARN0003"
      );
    }
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/mkdirs/utils.js"(exports, module2) {
    "use strict";
    var path5 = require("path");
    module2.exports.checkPath = function checkPath(pth) {
      if (process.platform === "win32") {
        const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path5.parse(pth).root, ""));
        if (pathHasInvalidWinCharacters) {
          const error = new Error(`Path contains invalid characters: ${pth}`);
          error.code = "EINVAL";
          throw error;
        }
      }
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/mkdirs/make-dir.js"(exports, module2) {
    "use strict";
    var fs4 = require_fs();
    var { checkPath } = require_utils();
    var getMode = (options) => {
      const defaults = { mode: 511 };
      if (typeof options === "number")
        return options;
      return { ...defaults, ...options }.mode;
    };
    module2.exports.makeDir = async (dir, options) => {
      checkPath(dir);
      return fs4.mkdir(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
    module2.exports.makeDirSync = (dir, options) => {
      checkPath(dir);
      return fs4.mkdirSync(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/mkdirs/index.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromPromise;
    var { makeDir: _makeDir, makeDirSync } = require_make_dir();
    var makeDir = u3(_makeDir);
    module2.exports = {
      mkdirs: makeDir,
      mkdirsSync: makeDirSync,
      // alias
      mkdirp: makeDir,
      mkdirpSync: makeDirSync,
      ensureDir: makeDir,
      ensureDirSync: makeDirSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/path-exists/index.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromPromise;
    var fs4 = require_fs();
    function pathExists(path5) {
      return fs4.access(path5).then(() => true).catch(() => false);
    }
    module2.exports = {
      pathExists: u3(pathExists),
      pathExistsSync: fs4.existsSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/util/utimes.js
var require_utimes = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/util/utimes.js"(exports, module2) {
    "use strict";
    var fs4 = require_graceful_fs();
    function utimesMillis(path5, atime, mtime, callback) {
      fs4.open(path5, "r+", (err, fd) => {
        if (err)
          return callback(err);
        fs4.futimes(fd, atime, mtime, (futimesErr) => {
          fs4.close(fd, (closeErr) => {
            if (callback)
              callback(futimesErr || closeErr);
          });
        });
      });
    }
    function utimesMillisSync(path5, atime, mtime) {
      const fd = fs4.openSync(path5, "r+");
      fs4.futimesSync(fd, atime, mtime);
      return fs4.closeSync(fd);
    }
    module2.exports = {
      utimesMillis,
      utimesMillisSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/util/stat.js
var require_stat = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/util/stat.js"(exports, module2) {
    "use strict";
    var fs4 = require_fs();
    var path5 = require("path");
    var util = require("util");
    function getStats(src, dest, opts) {
      const statFunc = opts.dereference ? (file) => fs4.stat(file, { bigint: true }) : (file) => fs4.lstat(file, { bigint: true });
      return Promise.all([
        statFunc(src),
        statFunc(dest).catch((err) => {
          if (err.code === "ENOENT")
            return null;
          throw err;
        })
      ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
    }
    function getStatsSync(src, dest, opts) {
      let destStat;
      const statFunc = opts.dereference ? (file) => fs4.statSync(file, { bigint: true }) : (file) => fs4.lstatSync(file, { bigint: true });
      const srcStat = statFunc(src);
      try {
        destStat = statFunc(dest);
      } catch (err) {
        if (err.code === "ENOENT")
          return { srcStat, destStat: null };
        throw err;
      }
      return { srcStat, destStat };
    }
    function checkPaths(src, dest, funcName, opts, cb) {
      util.callbackify(getStats)(src, dest, opts, (err, stats) => {
        if (err)
          return cb(err);
        const { srcStat, destStat } = stats;
        if (destStat) {
          if (areIdentical(srcStat, destStat)) {
            const srcBaseName = path5.basename(src);
            const destBaseName = path5.basename(dest);
            if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
              return cb(null, { srcStat, destStat, isChangingCase: true });
            }
            return cb(new Error("Source and destination must not be the same."));
          }
          if (srcStat.isDirectory() && !destStat.isDirectory()) {
            return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`));
          }
          if (!srcStat.isDirectory() && destStat.isDirectory()) {
            return cb(new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`));
          }
        }
        if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
          return cb(new Error(errMsg(src, dest, funcName)));
        }
        return cb(null, { srcStat, destStat });
      });
    }
    function checkPathsSync(src, dest, funcName, opts) {
      const { srcStat, destStat } = getStatsSync(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path5.basename(src);
          const destBaseName = path5.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    function checkParentPaths(src, srcStat, dest, funcName, cb) {
      const srcParent = path5.resolve(path5.dirname(src));
      const destParent = path5.resolve(path5.dirname(dest));
      if (destParent === srcParent || destParent === path5.parse(destParent).root)
        return cb();
      fs4.stat(destParent, { bigint: true }, (err, destStat) => {
        if (err) {
          if (err.code === "ENOENT")
            return cb();
          return cb(err);
        }
        if (areIdentical(srcStat, destStat)) {
          return cb(new Error(errMsg(src, dest, funcName)));
        }
        return checkParentPaths(src, srcStat, destParent, funcName, cb);
      });
    }
    function checkParentPathsSync(src, srcStat, dest, funcName) {
      const srcParent = path5.resolve(path5.dirname(src));
      const destParent = path5.resolve(path5.dirname(dest));
      if (destParent === srcParent || destParent === path5.parse(destParent).root)
        return;
      let destStat;
      try {
        destStat = fs4.statSync(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT")
          return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPathsSync(src, srcStat, destParent, funcName);
    }
    function areIdentical(srcStat, destStat) {
      return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
    }
    function isSrcSubdir(src, dest) {
      const srcArr = path5.resolve(src).split(path5.sep).filter((i) => i);
      const destArr = path5.resolve(dest).split(path5.sep).filter((i) => i);
      return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true);
    }
    function errMsg(src, dest, funcName) {
      return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
    }
    module2.exports = {
      checkPaths,
      checkPathsSync,
      checkParentPaths,
      checkParentPathsSync,
      isSrcSubdir,
      areIdentical
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/copy/copy.js
var require_copy = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/copy/copy.js"(exports, module2) {
    "use strict";
    var fs4 = require_graceful_fs();
    var path5 = require("path");
    var mkdirs = require_mkdirs().mkdirs;
    var pathExists = require_path_exists().pathExists;
    var utimesMillis = require_utimes().utimesMillis;
    var stat = require_stat();
    function copy(src, dest, opts, cb) {
      if (typeof opts === "function" && !cb) {
        cb = opts;
        opts = {};
      } else if (typeof opts === "function") {
        opts = { filter: opts };
      }
      cb = cb || function() {
      };
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0001"
        );
      }
      stat.checkPaths(src, dest, "copy", opts, (err, stats) => {
        if (err)
          return cb(err);
        const { srcStat, destStat } = stats;
        stat.checkParentPaths(src, srcStat, dest, "copy", (err2) => {
          if (err2)
            return cb(err2);
          runFilter(src, dest, opts, (err3, include) => {
            if (err3)
              return cb(err3);
            if (!include)
              return cb();
            checkParentDir(destStat, src, dest, opts, cb);
          });
        });
      });
    }
    function checkParentDir(destStat, src, dest, opts, cb) {
      const destParent = path5.dirname(dest);
      pathExists(destParent, (err, dirExists) => {
        if (err)
          return cb(err);
        if (dirExists)
          return getStats(destStat, src, dest, opts, cb);
        mkdirs(destParent, (err2) => {
          if (err2)
            return cb(err2);
          return getStats(destStat, src, dest, opts, cb);
        });
      });
    }
    function runFilter(src, dest, opts, cb) {
      if (!opts.filter)
        return cb(null, true);
      Promise.resolve(opts.filter(src, dest)).then((include) => cb(null, include), (error) => cb(error));
    }
    function getStats(destStat, src, dest, opts, cb) {
      const stat2 = opts.dereference ? fs4.stat : fs4.lstat;
      stat2(src, (err, srcStat) => {
        if (err)
          return cb(err);
        if (srcStat.isDirectory())
          return onDir(srcStat, destStat, src, dest, opts, cb);
        else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice())
          return onFile(srcStat, destStat, src, dest, opts, cb);
        else if (srcStat.isSymbolicLink())
          return onLink(destStat, src, dest, opts, cb);
        else if (srcStat.isSocket())
          return cb(new Error(`Cannot copy a socket file: ${src}`));
        else if (srcStat.isFIFO())
          return cb(new Error(`Cannot copy a FIFO pipe: ${src}`));
        return cb(new Error(`Unknown file: ${src}`));
      });
    }
    function onFile(srcStat, destStat, src, dest, opts, cb) {
      if (!destStat)
        return copyFile(srcStat, src, dest, opts, cb);
      return mayCopyFile(srcStat, src, dest, opts, cb);
    }
    function mayCopyFile(srcStat, src, dest, opts, cb) {
      if (opts.overwrite) {
        fs4.unlink(dest, (err) => {
          if (err)
            return cb(err);
          return copyFile(srcStat, src, dest, opts, cb);
        });
      } else if (opts.errorOnExist) {
        return cb(new Error(`'${dest}' already exists`));
      } else
        return cb();
    }
    function copyFile(srcStat, src, dest, opts, cb) {
      fs4.copyFile(src, dest, (err) => {
        if (err)
          return cb(err);
        if (opts.preserveTimestamps)
          return handleTimestampsAndMode(srcStat.mode, src, dest, cb);
        return setDestMode(dest, srcStat.mode, cb);
      });
    }
    function handleTimestampsAndMode(srcMode, src, dest, cb) {
      if (fileIsNotWritable(srcMode)) {
        return makeFileWritable(dest, srcMode, (err) => {
          if (err)
            return cb(err);
          return setDestTimestampsAndMode(srcMode, src, dest, cb);
        });
      }
      return setDestTimestampsAndMode(srcMode, src, dest, cb);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode, cb) {
      return setDestMode(dest, srcMode | 128, cb);
    }
    function setDestTimestampsAndMode(srcMode, src, dest, cb) {
      setDestTimestamps(src, dest, (err) => {
        if (err)
          return cb(err);
        return setDestMode(dest, srcMode, cb);
      });
    }
    function setDestMode(dest, srcMode, cb) {
      return fs4.chmod(dest, srcMode, cb);
    }
    function setDestTimestamps(src, dest, cb) {
      fs4.stat(src, (err, updatedSrcStat) => {
        if (err)
          return cb(err);
        return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb);
      });
    }
    function onDir(srcStat, destStat, src, dest, opts, cb) {
      if (!destStat)
        return mkDirAndCopy(srcStat.mode, src, dest, opts, cb);
      return copyDir(src, dest, opts, cb);
    }
    function mkDirAndCopy(srcMode, src, dest, opts, cb) {
      fs4.mkdir(dest, (err) => {
        if (err)
          return cb(err);
        copyDir(src, dest, opts, (err2) => {
          if (err2)
            return cb(err2);
          return setDestMode(dest, srcMode, cb);
        });
      });
    }
    function copyDir(src, dest, opts, cb) {
      fs4.readdir(src, (err, items) => {
        if (err)
          return cb(err);
        return copyDirItems(items, src, dest, opts, cb);
      });
    }
    function copyDirItems(items, src, dest, opts, cb) {
      const item = items.pop();
      if (!item)
        return cb();
      return copyDirItem(items, item, src, dest, opts, cb);
    }
    function copyDirItem(items, item, src, dest, opts, cb) {
      const srcItem = path5.join(src, item);
      const destItem = path5.join(dest, item);
      runFilter(srcItem, destItem, opts, (err, include) => {
        if (err)
          return cb(err);
        if (!include)
          return copyDirItems(items, src, dest, opts, cb);
        stat.checkPaths(srcItem, destItem, "copy", opts, (err2, stats) => {
          if (err2)
            return cb(err2);
          const { destStat } = stats;
          getStats(destStat, srcItem, destItem, opts, (err3) => {
            if (err3)
              return cb(err3);
            return copyDirItems(items, src, dest, opts, cb);
          });
        });
      });
    }
    function onLink(destStat, src, dest, opts, cb) {
      fs4.readlink(src, (err, resolvedSrc) => {
        if (err)
          return cb(err);
        if (opts.dereference) {
          resolvedSrc = path5.resolve(process.cwd(), resolvedSrc);
        }
        if (!destStat) {
          return fs4.symlink(resolvedSrc, dest, cb);
        } else {
          fs4.readlink(dest, (err2, resolvedDest) => {
            if (err2) {
              if (err2.code === "EINVAL" || err2.code === "UNKNOWN")
                return fs4.symlink(resolvedSrc, dest, cb);
              return cb(err2);
            }
            if (opts.dereference) {
              resolvedDest = path5.resolve(process.cwd(), resolvedDest);
            }
            if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
              return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`));
            }
            if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
              return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`));
            }
            return copyLink(resolvedSrc, dest, cb);
          });
        }
      });
    }
    function copyLink(resolvedSrc, dest, cb) {
      fs4.unlink(dest, (err) => {
        if (err)
          return cb(err);
        return fs4.symlink(resolvedSrc, dest, cb);
      });
    }
    module2.exports = copy;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/copy/copy-sync.js"(exports, module2) {
    "use strict";
    var fs4 = require_graceful_fs();
    var path5 = require("path");
    var mkdirsSync = require_mkdirs().mkdirsSync;
    var utimesMillisSync = require_utimes().utimesMillisSync;
    var stat = require_stat();
    function copySync(src, dest, opts) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0002"
        );
      }
      const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "copy");
      if (opts.filter && !opts.filter(src, dest))
        return;
      const destParent = path5.dirname(dest);
      if (!fs4.existsSync(destParent))
        mkdirsSync(destParent);
      return getStats(destStat, src, dest, opts);
    }
    function getStats(destStat, src, dest, opts) {
      const statSync = opts.dereference ? fs4.statSync : fs4.lstatSync;
      const srcStat = statSync(src);
      if (srcStat.isDirectory())
        return onDir(srcStat, destStat, src, dest, opts);
      else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice())
        return onFile(srcStat, destStat, src, dest, opts);
      else if (srcStat.isSymbolicLink())
        return onLink(destStat, src, dest, opts);
      else if (srcStat.isSocket())
        throw new Error(`Cannot copy a socket file: ${src}`);
      else if (srcStat.isFIFO())
        throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat)
        return copyFile(srcStat, src, dest, opts);
      return mayCopyFile(srcStat, src, dest, opts);
    }
    function mayCopyFile(srcStat, src, dest, opts) {
      if (opts.overwrite) {
        fs4.unlinkSync(dest);
        return copyFile(srcStat, src, dest, opts);
      } else if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    function copyFile(srcStat, src, dest, opts) {
      fs4.copyFileSync(src, dest);
      if (opts.preserveTimestamps)
        handleTimestamps(srcStat.mode, src, dest);
      return setDestMode(dest, srcStat.mode);
    }
    function handleTimestamps(srcMode, src, dest) {
      if (fileIsNotWritable(srcMode))
        makeFileWritable(dest, srcMode);
      return setDestTimestamps(src, dest);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode) {
      return setDestMode(dest, srcMode | 128);
    }
    function setDestMode(dest, srcMode) {
      return fs4.chmodSync(dest, srcMode);
    }
    function setDestTimestamps(src, dest) {
      const updatedSrcStat = fs4.statSync(src);
      return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat)
        return mkDirAndCopy(srcStat.mode, src, dest, opts);
      return copyDir(src, dest, opts);
    }
    function mkDirAndCopy(srcMode, src, dest, opts) {
      fs4.mkdirSync(dest);
      copyDir(src, dest, opts);
      return setDestMode(dest, srcMode);
    }
    function copyDir(src, dest, opts) {
      fs4.readdirSync(src).forEach((item) => copyDirItem(item, src, dest, opts));
    }
    function copyDirItem(item, src, dest, opts) {
      const srcItem = path5.join(src, item);
      const destItem = path5.join(dest, item);
      if (opts.filter && !opts.filter(srcItem, destItem))
        return;
      const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
      return getStats(destStat, srcItem, destItem, opts);
    }
    function onLink(destStat, src, dest, opts) {
      let resolvedSrc = fs4.readlinkSync(src);
      if (opts.dereference) {
        resolvedSrc = path5.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs4.symlinkSync(resolvedSrc, dest);
      } else {
        let resolvedDest;
        try {
          resolvedDest = fs4.readlinkSync(dest);
        } catch (err) {
          if (err.code === "EINVAL" || err.code === "UNKNOWN")
            return fs4.symlinkSync(resolvedSrc, dest);
          throw err;
        }
        if (opts.dereference) {
          resolvedDest = path5.resolve(process.cwd(), resolvedDest);
        }
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
        return copyLink(resolvedSrc, dest);
      }
    }
    function copyLink(resolvedSrc, dest) {
      fs4.unlinkSync(dest);
      return fs4.symlinkSync(resolvedSrc, dest);
    }
    module2.exports = copySync;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/copy/index.js
var require_copy2 = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/copy/index.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromCallback;
    module2.exports = {
      copy: u3(require_copy()),
      copySync: require_copy_sync()
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/remove/index.js
var require_remove = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/remove/index.js"(exports, module2) {
    "use strict";
    var fs4 = require_graceful_fs();
    var u3 = require_universalify().fromCallback;
    function remove(path5, callback) {
      fs4.rm(path5, { recursive: true, force: true }, callback);
    }
    function removeSync(path5) {
      fs4.rmSync(path5, { recursive: true, force: true });
    }
    module2.exports = {
      remove: u3(remove),
      removeSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/empty/index.js
var require_empty = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/empty/index.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromPromise;
    var fs4 = require_fs();
    var path5 = require("path");
    var mkdir = require_mkdirs();
    var remove = require_remove();
    var emptyDir = u3(async function emptyDir2(dir) {
      let items;
      try {
        items = await fs4.readdir(dir);
      } catch {
        return mkdir.mkdirs(dir);
      }
      return Promise.all(items.map((item) => remove.remove(path5.join(dir, item))));
    });
    function emptyDirSync(dir) {
      let items;
      try {
        items = fs4.readdirSync(dir);
      } catch {
        return mkdir.mkdirsSync(dir);
      }
      items.forEach((item) => {
        item = path5.join(dir, item);
        remove.removeSync(item);
      });
    }
    module2.exports = {
      emptyDirSync,
      emptydirSync: emptyDirSync,
      emptyDir,
      emptydir: emptyDir
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/file.js
var require_file = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/file.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromCallback;
    var path5 = require("path");
    var fs4 = require_graceful_fs();
    var mkdir = require_mkdirs();
    function createFile(file, callback) {
      function makeFile() {
        fs4.writeFile(file, "", (err) => {
          if (err)
            return callback(err);
          callback();
        });
      }
      fs4.stat(file, (err, stats) => {
        if (!err && stats.isFile())
          return callback();
        const dir = path5.dirname(file);
        fs4.stat(dir, (err2, stats2) => {
          if (err2) {
            if (err2.code === "ENOENT") {
              return mkdir.mkdirs(dir, (err3) => {
                if (err3)
                  return callback(err3);
                makeFile();
              });
            }
            return callback(err2);
          }
          if (stats2.isDirectory())
            makeFile();
          else {
            fs4.readdir(dir, (err3) => {
              if (err3)
                return callback(err3);
            });
          }
        });
      });
    }
    function createFileSync(file) {
      let stats;
      try {
        stats = fs4.statSync(file);
      } catch {
      }
      if (stats && stats.isFile())
        return;
      const dir = path5.dirname(file);
      try {
        if (!fs4.statSync(dir).isDirectory()) {
          fs4.readdirSync(dir);
        }
      } catch (err) {
        if (err && err.code === "ENOENT")
          mkdir.mkdirsSync(dir);
        else
          throw err;
      }
      fs4.writeFileSync(file, "");
    }
    module2.exports = {
      createFile: u3(createFile),
      createFileSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/link.js
var require_link = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/link.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromCallback;
    var path5 = require("path");
    var fs4 = require_graceful_fs();
    var mkdir = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    var { areIdentical } = require_stat();
    function createLink(srcpath, dstpath, callback) {
      function makeLink(srcpath2, dstpath2) {
        fs4.link(srcpath2, dstpath2, (err) => {
          if (err)
            return callback(err);
          callback(null);
        });
      }
      fs4.lstat(dstpath, (_2, dstStat) => {
        fs4.lstat(srcpath, (err, srcStat) => {
          if (err) {
            err.message = err.message.replace("lstat", "ensureLink");
            return callback(err);
          }
          if (dstStat && areIdentical(srcStat, dstStat))
            return callback(null);
          const dir = path5.dirname(dstpath);
          pathExists(dir, (err2, dirExists) => {
            if (err2)
              return callback(err2);
            if (dirExists)
              return makeLink(srcpath, dstpath);
            mkdir.mkdirs(dir, (err3) => {
              if (err3)
                return callback(err3);
              makeLink(srcpath, dstpath);
            });
          });
        });
      });
    }
    function createLinkSync(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = fs4.lstatSync(dstpath);
      } catch {
      }
      try {
        const srcStat = fs4.lstatSync(srcpath);
        if (dstStat && areIdentical(srcStat, dstStat))
          return;
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      const dir = path5.dirname(dstpath);
      const dirExists = fs4.existsSync(dir);
      if (dirExists)
        return fs4.linkSync(srcpath, dstpath);
      mkdir.mkdirsSync(dir);
      return fs4.linkSync(srcpath, dstpath);
    }
    module2.exports = {
      createLink: u3(createLink),
      createLinkSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/symlink-paths.js"(exports, module2) {
    "use strict";
    var path5 = require("path");
    var fs4 = require_graceful_fs();
    var pathExists = require_path_exists().pathExists;
    function symlinkPaths(srcpath, dstpath, callback) {
      if (path5.isAbsolute(srcpath)) {
        return fs4.lstat(srcpath, (err) => {
          if (err) {
            err.message = err.message.replace("lstat", "ensureSymlink");
            return callback(err);
          }
          return callback(null, {
            toCwd: srcpath,
            toDst: srcpath
          });
        });
      } else {
        const dstdir = path5.dirname(dstpath);
        const relativeToDst = path5.join(dstdir, srcpath);
        return pathExists(relativeToDst, (err, exists) => {
          if (err)
            return callback(err);
          if (exists) {
            return callback(null, {
              toCwd: relativeToDst,
              toDst: srcpath
            });
          } else {
            return fs4.lstat(srcpath, (err2) => {
              if (err2) {
                err2.message = err2.message.replace("lstat", "ensureSymlink");
                return callback(err2);
              }
              return callback(null, {
                toCwd: srcpath,
                toDst: path5.relative(dstdir, srcpath)
              });
            });
          }
        });
      }
    }
    function symlinkPathsSync(srcpath, dstpath) {
      let exists;
      if (path5.isAbsolute(srcpath)) {
        exists = fs4.existsSync(srcpath);
        if (!exists)
          throw new Error("absolute srcpath does not exist");
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      } else {
        const dstdir = path5.dirname(dstpath);
        const relativeToDst = path5.join(dstdir, srcpath);
        exists = fs4.existsSync(relativeToDst);
        if (exists) {
          return {
            toCwd: relativeToDst,
            toDst: srcpath
          };
        } else {
          exists = fs4.existsSync(srcpath);
          if (!exists)
            throw new Error("relative srcpath does not exist");
          return {
            toCwd: srcpath,
            toDst: path5.relative(dstdir, srcpath)
          };
        }
      }
    }
    module2.exports = {
      symlinkPaths,
      symlinkPathsSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/symlink-type.js"(exports, module2) {
    "use strict";
    var fs4 = require_graceful_fs();
    function symlinkType(srcpath, type, callback) {
      callback = typeof type === "function" ? type : callback;
      type = typeof type === "function" ? false : type;
      if (type)
        return callback(null, type);
      fs4.lstat(srcpath, (err, stats) => {
        if (err)
          return callback(null, "file");
        type = stats && stats.isDirectory() ? "dir" : "file";
        callback(null, type);
      });
    }
    function symlinkTypeSync(srcpath, type) {
      let stats;
      if (type)
        return type;
      try {
        stats = fs4.lstatSync(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    module2.exports = {
      symlinkType,
      symlinkTypeSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/symlink.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromCallback;
    var path5 = require("path");
    var fs4 = require_fs();
    var _mkdirs = require_mkdirs();
    var mkdirs = _mkdirs.mkdirs;
    var mkdirsSync = _mkdirs.mkdirsSync;
    var _symlinkPaths = require_symlink_paths();
    var symlinkPaths = _symlinkPaths.symlinkPaths;
    var symlinkPathsSync = _symlinkPaths.symlinkPathsSync;
    var _symlinkType = require_symlink_type();
    var symlinkType = _symlinkType.symlinkType;
    var symlinkTypeSync = _symlinkType.symlinkTypeSync;
    var pathExists = require_path_exists().pathExists;
    var { areIdentical } = require_stat();
    function createSymlink(srcpath, dstpath, type, callback) {
      callback = typeof type === "function" ? type : callback;
      type = typeof type === "function" ? false : type;
      fs4.lstat(dstpath, (err, stats) => {
        if (!err && stats.isSymbolicLink()) {
          Promise.all([
            fs4.stat(srcpath),
            fs4.stat(dstpath)
          ]).then(([srcStat, dstStat]) => {
            if (areIdentical(srcStat, dstStat))
              return callback(null);
            _createSymlink(srcpath, dstpath, type, callback);
          });
        } else
          _createSymlink(srcpath, dstpath, type, callback);
      });
    }
    function _createSymlink(srcpath, dstpath, type, callback) {
      symlinkPaths(srcpath, dstpath, (err, relative) => {
        if (err)
          return callback(err);
        srcpath = relative.toDst;
        symlinkType(relative.toCwd, type, (err2, type2) => {
          if (err2)
            return callback(err2);
          const dir = path5.dirname(dstpath);
          pathExists(dir, (err3, dirExists) => {
            if (err3)
              return callback(err3);
            if (dirExists)
              return fs4.symlink(srcpath, dstpath, type2, callback);
            mkdirs(dir, (err4) => {
              if (err4)
                return callback(err4);
              fs4.symlink(srcpath, dstpath, type2, callback);
            });
          });
        });
      });
    }
    function createSymlinkSync(srcpath, dstpath, type) {
      let stats;
      try {
        stats = fs4.lstatSync(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        const srcStat = fs4.statSync(srcpath);
        const dstStat = fs4.statSync(dstpath);
        if (areIdentical(srcStat, dstStat))
          return;
      }
      const relative = symlinkPathsSync(srcpath, dstpath);
      srcpath = relative.toDst;
      type = symlinkTypeSync(relative.toCwd, type);
      const dir = path5.dirname(dstpath);
      const exists = fs4.existsSync(dir);
      if (exists)
        return fs4.symlinkSync(srcpath, dstpath, type);
      mkdirsSync(dir);
      return fs4.symlinkSync(srcpath, dstpath, type);
    }
    module2.exports = {
      createSymlink: u3(createSymlink),
      createSymlinkSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/index.js
var require_ensure = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/ensure/index.js"(exports, module2) {
    "use strict";
    var { createFile, createFileSync } = require_file();
    var { createLink, createLinkSync } = require_link();
    var { createSymlink, createSymlinkSync } = require_symlink();
    module2.exports = {
      // file
      createFile,
      createFileSync,
      ensureFile: createFile,
      ensureFileSync: createFileSync,
      // link
      createLink,
      createLinkSync,
      ensureLink: createLink,
      ensureLinkSync: createLinkSync,
      // symlink
      createSymlink,
      createSymlinkSync,
      ensureSymlink: createSymlink,
      ensureSymlinkSync: createSymlinkSync
    };
  }
});

// ../../node_modules/.pnpm/jsonfile@6.1.0/node_modules/jsonfile/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/.pnpm/jsonfile@6.1.0/node_modules/jsonfile/utils.js"(exports, module2) {
    function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
      const EOF = finalEOL ? EOL : "";
      const str = JSON.stringify(obj, replacer, spaces);
      return str.replace(/\n/g, EOL) + EOF;
    }
    function stripBom(content) {
      if (Buffer.isBuffer(content))
        content = content.toString("utf8");
      return content.replace(/^\uFEFF/, "");
    }
    module2.exports = { stringify, stripBom };
  }
});

// ../../node_modules/.pnpm/jsonfile@6.1.0/node_modules/jsonfile/index.js
var require_jsonfile = __commonJS({
  "../../node_modules/.pnpm/jsonfile@6.1.0/node_modules/jsonfile/index.js"(exports, module2) {
    var _fs;
    try {
      _fs = require_graceful_fs();
    } catch (_2) {
      _fs = require("fs");
    }
    var universalify = require_universalify();
    var { stringify, stripBom } = require_utils2();
    async function _readFile(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs4 = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      let data = await universalify.fromCallback(fs4.readFile)(file, options);
      data = stripBom(data);
      let obj;
      try {
        obj = JSON.parse(data, options ? options.reviver : null);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
      return obj;
    }
    var readFile = universalify.fromPromise(_readFile);
    function readFileSync(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs4 = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      try {
        let content = fs4.readFileSync(file, options);
        content = stripBom(content);
        return JSON.parse(content, options.reviver);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
    }
    async function _writeFile(file, obj, options = {}) {
      const fs4 = options.fs || _fs;
      const str = stringify(obj, options);
      await universalify.fromCallback(fs4.writeFile)(file, str, options);
    }
    var writeFile = universalify.fromPromise(_writeFile);
    function writeFileSync(file, obj, options = {}) {
      const fs4 = options.fs || _fs;
      const str = stringify(obj, options);
      return fs4.writeFileSync(file, str, options);
    }
    var jsonfile = {
      readFile,
      readFileSync,
      writeFile,
      writeFileSync
    };
    module2.exports = jsonfile;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile2 = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/json/jsonfile.js"(exports, module2) {
    "use strict";
    var jsonFile = require_jsonfile();
    module2.exports = {
      // jsonfile exports
      readJson: jsonFile.readFile,
      readJsonSync: jsonFile.readFileSync,
      writeJson: jsonFile.writeFile,
      writeJsonSync: jsonFile.writeFileSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/output-file/index.js
var require_output_file = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/output-file/index.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromCallback;
    var fs4 = require_graceful_fs();
    var path5 = require("path");
    var mkdir = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    function outputFile(file, data, encoding, callback) {
      if (typeof encoding === "function") {
        callback = encoding;
        encoding = "utf8";
      }
      const dir = path5.dirname(file);
      pathExists(dir, (err, itDoes) => {
        if (err)
          return callback(err);
        if (itDoes)
          return fs4.writeFile(file, data, encoding, callback);
        mkdir.mkdirs(dir, (err2) => {
          if (err2)
            return callback(err2);
          fs4.writeFile(file, data, encoding, callback);
        });
      });
    }
    function outputFileSync(file, ...args2) {
      const dir = path5.dirname(file);
      if (fs4.existsSync(dir)) {
        return fs4.writeFileSync(file, ...args2);
      }
      mkdir.mkdirsSync(dir);
      fs4.writeFileSync(file, ...args2);
    }
    module2.exports = {
      outputFile: u3(outputFile),
      outputFileSync
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/json/output-json.js
var require_output_json = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/json/output-json.js"(exports, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFile } = require_output_file();
    async function outputJson(file, data, options = {}) {
      const str = stringify(data, options);
      await outputFile(file, str, options);
    }
    module2.exports = outputJson;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/json/output-json-sync.js"(exports, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFileSync } = require_output_file();
    function outputJsonSync(file, data, options) {
      const str = stringify(data, options);
      outputFileSync(file, str, options);
    }
    module2.exports = outputJsonSync;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/json/index.js
var require_json = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/json/index.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromPromise;
    var jsonFile = require_jsonfile2();
    jsonFile.outputJson = u3(require_output_json());
    jsonFile.outputJsonSync = require_output_json_sync();
    jsonFile.outputJSON = jsonFile.outputJson;
    jsonFile.outputJSONSync = jsonFile.outputJsonSync;
    jsonFile.writeJSON = jsonFile.writeJson;
    jsonFile.writeJSONSync = jsonFile.writeJsonSync;
    jsonFile.readJSON = jsonFile.readJson;
    jsonFile.readJSONSync = jsonFile.readJsonSync;
    module2.exports = jsonFile;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/move/move.js
var require_move = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/move/move.js"(exports, module2) {
    "use strict";
    var fs4 = require_graceful_fs();
    var path5 = require("path");
    var copy = require_copy2().copy;
    var remove = require_remove().remove;
    var mkdirp = require_mkdirs().mkdirp;
    var pathExists = require_path_exists().pathExists;
    var stat = require_stat();
    function move(src, dest, opts, cb) {
      if (typeof opts === "function") {
        cb = opts;
        opts = {};
      }
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      stat.checkPaths(src, dest, "move", opts, (err, stats) => {
        if (err)
          return cb(err);
        const { srcStat, isChangingCase = false } = stats;
        stat.checkParentPaths(src, srcStat, dest, "move", (err2) => {
          if (err2)
            return cb(err2);
          if (isParentRoot(dest))
            return doRename(src, dest, overwrite, isChangingCase, cb);
          mkdirp(path5.dirname(dest), (err3) => {
            if (err3)
              return cb(err3);
            return doRename(src, dest, overwrite, isChangingCase, cb);
          });
        });
      });
    }
    function isParentRoot(dest) {
      const parent2 = path5.dirname(dest);
      const parsedPath = path5.parse(parent2);
      return parsedPath.root === parent2;
    }
    function doRename(src, dest, overwrite, isChangingCase, cb) {
      if (isChangingCase)
        return rename(src, dest, overwrite, cb);
      if (overwrite) {
        return remove(dest, (err) => {
          if (err)
            return cb(err);
          return rename(src, dest, overwrite, cb);
        });
      }
      pathExists(dest, (err, destExists) => {
        if (err)
          return cb(err);
        if (destExists)
          return cb(new Error("dest already exists."));
        return rename(src, dest, overwrite, cb);
      });
    }
    function rename(src, dest, overwrite, cb) {
      fs4.rename(src, dest, (err) => {
        if (!err)
          return cb();
        if (err.code !== "EXDEV")
          return cb(err);
        return moveAcrossDevice(src, dest, overwrite, cb);
      });
    }
    function moveAcrossDevice(src, dest, overwrite, cb) {
      const opts = {
        overwrite,
        errorOnExist: true,
        preserveTimestamps: true
      };
      copy(src, dest, opts, (err) => {
        if (err)
          return cb(err);
        return remove(src, cb);
      });
    }
    module2.exports = move;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/move/move-sync.js"(exports, module2) {
    "use strict";
    var fs4 = require_graceful_fs();
    var path5 = require("path");
    var copySync = require_copy2().copySync;
    var removeSync = require_remove().removeSync;
    var mkdirpSync = require_mkdirs().mkdirpSync;
    var stat = require_stat();
    function moveSync(src, dest, opts) {
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "move");
      if (!isParentRoot(dest))
        mkdirpSync(path5.dirname(dest));
      return doRename(src, dest, overwrite, isChangingCase);
    }
    function isParentRoot(dest) {
      const parent2 = path5.dirname(dest);
      const parsedPath = path5.parse(parent2);
      return parsedPath.root === parent2;
    }
    function doRename(src, dest, overwrite, isChangingCase) {
      if (isChangingCase)
        return rename(src, dest, overwrite);
      if (overwrite) {
        removeSync(dest);
        return rename(src, dest, overwrite);
      }
      if (fs4.existsSync(dest))
        throw new Error("dest already exists.");
      return rename(src, dest, overwrite);
    }
    function rename(src, dest, overwrite) {
      try {
        fs4.renameSync(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV")
          throw err;
        return moveAcrossDevice(src, dest, overwrite);
      }
    }
    function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true,
        preserveTimestamps: true
      };
      copySync(src, dest, opts);
      return removeSync(src);
    }
    module2.exports = moveSync;
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/move/index.js
var require_move2 = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/move/index.js"(exports, module2) {
    "use strict";
    var u3 = require_universalify().fromCallback;
    module2.exports = {
      move: u3(require_move()),
      moveSync: require_move_sync()
    };
  }
});

// ../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/.pnpm/fs-extra@11.1.1/node_modules/fs-extra/lib/index.js"(exports, module2) {
    "use strict";
    module2.exports = {
      // Export promiseified graceful-fs:
      ...require_fs(),
      // Export extra methods:
      ...require_copy2(),
      ...require_empty(),
      ...require_ensure(),
      ...require_json(),
      ...require_mkdirs(),
      ...require_move2(),
      ...require_output_file(),
      ...require_path_exists(),
      ...require_remove()
    };
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// ../../node_modules/.pnpm/fix-path@4.0.0/node_modules/fix-path/index.js
var import_node_process3 = __toESM(require("node:process"), 1);

// ../../node_modules/.pnpm/shell-env@4.0.1/node_modules/shell-env/index.js
var import_node_process2 = __toESM(require("node:process"), 1);
var import_execa = __toESM(require_execa(), 1);

// ../../node_modules/.pnpm/ansi-regex@6.0.1/node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
  ].join("|");
  return new RegExp(pattern, onlyFirst ? void 0 : "g");
}

// ../../node_modules/.pnpm/strip-ansi@7.1.0/node_modules/strip-ansi/index.js
var regex = ansiRegex();
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, "");
}

// ../../node_modules/.pnpm/default-shell@2.2.0/node_modules/default-shell/index.js
var import_node_process = __toESM(require("node:process"), 1);
var import_node_os = require("node:os");
var detectDefaultShell = () => {
  const { env: env2 } = import_node_process.default;
  if (import_node_process.default.platform === "win32") {
    return env2.COMSPEC || "cmd.exe";
  }
  try {
    const { shell } = (0, import_node_os.userInfo)();
    if (shell) {
      return shell;
    }
  } catch {
  }
  if (import_node_process.default.platform === "darwin") {
    return env2.SHELL || "/bin/zsh";
  }
  return env2.SHELL || "/bin/sh";
};
var defaultShell = detectDefaultShell();
var default_shell_default = defaultShell;

// ../../node_modules/.pnpm/shell-env@4.0.1/node_modules/shell-env/index.js
var args = [
  "-ilc",
  'echo -n "_SHELL_ENV_DELIMITER_"; env; echo -n "_SHELL_ENV_DELIMITER_"; exit'
];
var env = {
  // Disables Oh My Zsh auto-update thing that can block the process.
  DISABLE_AUTO_UPDATE: "true"
};
var parseEnv = (env2) => {
  env2 = env2.split("_SHELL_ENV_DELIMITER_")[1];
  const returnValue = {};
  for (const line of stripAnsi(env2).split("\n").filter((line2) => Boolean(line2))) {
    const [key, ...values] = line.split("=");
    returnValue[key] = values.join("=");
  }
  return returnValue;
};
function shellEnvSync(shell) {
  if (import_node_process2.default.platform === "win32") {
    return import_node_process2.default.env;
  }
  try {
    const { stdout } = import_execa.default.sync(shell || default_shell_default, args, { env });
    return parseEnv(stdout);
  } catch (error) {
    if (shell) {
      throw error;
    } else {
      return import_node_process2.default.env;
    }
  }
}

// ../../node_modules/.pnpm/shell-path@3.0.0/node_modules/shell-path/index.js
function shellPathSync() {
  const { PATH } = shellEnvSync();
  return PATH;
}

// ../../node_modules/.pnpm/fix-path@4.0.0/node_modules/fix-path/index.js
function fixPath() {
  if (import_node_process3.default.platform === "win32") {
    return;
  }
  import_node_process3.default.env.PATH = shellPathSync() || [
    "./node_modules/.bin",
    "/.nodebrew/current/bin",
    "/usr/local/bin",
    import_node_process3.default.env.PATH
  ].join(":");
}

// ../../libs/zhi-lib-base/dist/index.js
var w = (n3, $2, p) => {
  const s3 = $2 ?? "zhi", i = (t) => {
    const e = t.getFullYear(), o3 = String(t.getMonth() + 1).padStart(2, "0"), r = String(t.getDate()).padStart(2, "0"), S2 = String(t.getHours()).padStart(2, "0"), u3 = String(t.getMinutes()).padStart(2, "0"), d3 = String(t.getSeconds()).padStart(2, "0");
    return `${e}-${o3}-${r} ${S2}:${u3}:${d3}`;
  }, c3 = (t, e) => {
    const o3 = i(/* @__PURE__ */ new Date()), r = typeof e == "boolean" ? String(e) : e;
    r ? console.log(`[${s3}] [${o3}] [DEBUG] [${n3}] ${t}`, r) : console.log(`[${s3}] [${o3}] [DEBUG] [${n3}] ${t}`);
  }, l = (t, e) => {
    const o3 = i(/* @__PURE__ */ new Date()), r = typeof e == "boolean" ? String(e) : e;
    r ? console.info(`[${s3}] [${o3}] [INFO] [${n3}] ${t}`, r) : console.info(`[${s3}] [${o3}] [INFO] [${n3}] ${t}`);
  }, f = (t, e) => {
    const o3 = i(/* @__PURE__ */ new Date()), r = typeof e == "boolean" ? String(e) : e;
    r ? console.warn(`[${s3}] [${o3}] [WARN] [${n3}] ${t}`, r) : console.warn(`[${s3}] [${o3}] [WARN] [${n3}] ${t}`);
  }, g3 = (t, e) => {
    const o3 = i(/* @__PURE__ */ new Date());
    e ? console.error(`[${s3}] [${o3}] [ERROR] [${n3}] ${t.toString()}`, e) : console.error(`[${s3}] [${o3}] [ERROR] [${n3}] ${t.toString()}`);
  };
  return {
    debug: (t, e) => {
      p && (e ? c3(t, e) : c3(t));
    },
    info: (t, e) => {
      e ? l(t, e) : l(t);
    },
    warn: (t, e) => {
      e ? f(t, e) : f(t);
    },
    error: (t, e) => {
      e ? g3(t, e) : g3(t);
    }
  };
};
var D = (n3, $2) => {
  if (n3 && $2 !== void 0 && n3.length > $2)
    return n3[$2];
};

// ../../libs/zhi-device/dist/index.js
var b = Object.defineProperty;
var g = (r, e, t) => e in r ? b(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t;
var o = (r, e, t) => (g(r, typeof e != "symbol" ? e + "" : e, t), t);
var d = class {
  /**
   * 检测是否运行在Chrome插件中
   */
  static isInChromeExtension() {
    return d.isInBrowser ? window.location.href.indexOf("chrome-extension://") > -1 : false;
  }
  /**
   * 复制网页内容到剪贴板
   *
   * @param text - 待复制的文本
   */
  static async copyToClipboardInBrowser(e) {
    if (navigator && navigator.clipboard)
      await navigator.clipboard.writeText(e);
    else {
      const t = document.createElement("input");
      t.style.position = "fixed", t.style.opacity = "0", t.value = e, document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t);
    }
  }
};
var s = d;
o(s, "isNode", typeof process < "u" && process.versions != null && process.versions.node != null), /**
* 是否在浏览器环境
*/
o(s, "isInBrowser", typeof window < "u" && typeof document < "u"), /**
* 浏览器路径分隔符
*/
o(s, "BrowserSeparator", "/"), /**
* 是否是Electron环境
*/
o(s, "isElectron", () => typeof process < "u" && process.versions != null && process.versions.electron != null), /**
* 是否有Node环境，目前包括 Electron 和 Node
*/
o(s, "hasNodeEnv", () => d.isElectron() || d.isNode), /**
* 通用的从 url 中获取获取参数的方法，优先获取查询参数，然后获取 hash 参数与
*
* @param key - 参数
* @author terwer
* @version 0.9.0
* @since 0.0.1
*/
o(s, "getQueryParam", (e) => {
  if (!d.isInBrowser)
    return "";
  const t = window.location.href, i = t.indexOf("?");
  if (i !== -1) {
    const h = t.indexOf("#", i), p = h !== -1 ? t.substring(i + 1, h) : t.substring(i + 1), y = new URLSearchParams(p).get(e);
    if (y)
      return y;
  }
  const a = t.indexOf("#");
  if (a !== -1) {
    const h = t.substring(a + 1), w2 = new URLSearchParams(h).get(e);
    if (w2)
      return w2;
  }
  return "";
}), /**
* 替换 URL 的参数
* 思路：
* 1. 使用了 URLSearchParams 对象来解析和构建 URL 查询参数。
*
* 2. 在处理包含 hash 片段的 URL 时使用了 split 函数将 URL 分成两部分：基本 URL 和 hash 片段。
*
* 3. 然后，再次使用 split 函数将基本 URL 分成两部分：路径和查询参数。
*
* 4. 将查询参数转换为 URLSearchParams 对象，然后设置指定的参数名和值。
*
* 5. 最后，使用 toString 函数将查询参数转换为字符串，并将其与路径组合成新的基本 URL。如果 URL 包含 hash 片段，则将其添加到新的基本 URL 中。
*
* @param url - 链接地址
* @param paramName - 参数名
* @param paramValue - 参数值
*/
o(s, "replaceUrlParam", (e, t, i) => {
  i == null && (i = "");
  const a = new RegExp("\\b(" + t + "=).*?(&|#|$)");
  if (e.search(a) >= 0)
    return e.replace(a, "$1" + i + "$2");
  const [h, p] = e.split("#"), [w2, y] = h.split("?"), m = new URLSearchParams(y);
  m.set(t, i);
  const f = m.toString(), P2 = w2 + (f ? "?" + f : "");
  return p ? P2 + "#" + p : P2;
}), /**
* 设置url参数
*
* @param urlstring - url
* @param key - key
* @param value - value
*/
o(s, "setUrlParameter", (e, t, i) => {
  if (e.includes(t))
    return d.replaceUrlParam(e, t, i);
  const a = e.split("#");
  let h = a[0];
  const p = a[1];
  return h.includes("?") ? h += `&${t}=${i}` : h += `?${t}=${i}`, p && (h += "#" + p), h;
}), /**
* 重新加载指定tab
*
* @param tabname - tabname
* @param t - 延迟时间
*/
o(s, "reloadTabPage", (e, t) => {
  setTimeout(function() {
    if (d.isInBrowser) {
      const i = window.location.href;
      window.location.href = d.setUrlParameter(i, "tab", e);
    }
  }, t ?? 200);
}), /**
* 刷新当前tab页面
*
* @param t - 延迟时间
*/
o(s, "reloadPage", (e) => {
  setTimeout(function() {
    d.isInBrowser && window.location.reload();
  }, e ?? 200);
}), /**
* 刷新当前tab页面
*
* @param msg - 消息提示
* @param cb - 回调
* @param t - 延迟时间
*/
o(s, "reloadPageWithMessageCallback", (e, t, i) => {
  t && t(e), setTimeout(function() {
    d.isInBrowser && window.location.reload();
  }, i ?? 200);
});
var n = /* @__PURE__ */ ((r) => (r.BasePathType_Appearance = "Appearance", r.BasePathType_Data = "Data", r.BasePathType_Themes = "Themes", r.BasePathType_ZhiTheme = "ZhiTheme", r.BasePathType_ThisPlugin = "ThisPlugin", r.BasePathType_AppData = "AppData", r.BasePathType_AppNpm = "AppNpm", r.BasePathType_AppService = "AppService", r.BasePathType_Absolute = "Absolute", r.BasePathType_None = "None", r))(n || {});
var u = class {
  /**
   * 检测是否运行在思源打开的浏览器中
   */
  static isInSiyuanBrowser() {
    return s.isInBrowser ? typeof window.siyuan < "u" && typeof window.Lute < "u" : false;
  }
  /**
   * 思源笔记 window 对象
   */
  static siyuanWindow() {
    let e;
    return this.isInSiyuanWidget() ? e = parent.window : this.isInSiyuanRendererWin() || this.isInSiyuanBrowser() || typeof window < "u" ? e = window : e = void 0, e;
  }
  // =========================
  // require start
  // =========================
  /**
   * 获取 require 路径
   *
   * @param libpath - 依赖全路径
   * @param type - 可选，以谁的基本路径为准
   * @param pluginName - 可选，当前插件目录
   */
  static getRequirePath(e, t, i) {
    if (!s.hasNodeEnv())
      throw new Error("require ony works on node env");
    let a = e;
    switch (t) {
      case n.BasePathType_Appearance:
        a = this.joinPath(this.siyuanAppearancePath(), e);
        break;
      case n.BasePathType_Data:
        a = this.joinPath(this.siyuanDataPath(), e);
        break;
      case n.BasePathType_Themes:
        a = this.joinPath(this.siyuanAppearancePath(), "themes", e);
        break;
      case n.BasePathType_ZhiTheme:
        a = this.joinPath(this.siyuanAppearancePath(), "themes", "zhi", e);
        break;
      case n.BasePathType_ThisPlugin:
        if (!i)
          throw new Error("pluginName must be provided when use plugin path");
        a = this.joinPath(this.siyuanDataPath(), "plugins", i, e);
        break;
      case n.BasePathType_AppData:
        a = this.joinPath(this.appDataFolder(), e);
        break;
      case n.BasePathType_AppNpm:
        a = this.joinPath(this.appNpmFolder(), e);
        break;
      case n.BasePathType_AppService:
        a = this.joinPath(this.appServiceFolder(), e);
        break;
      case n.BasePathType_Absolute:
        break;
    }
    return a;
  }
  // =========================
  // require end
  // =========================
  // =========================
  // import start
  // =========================
  /**
   * 获取 import 路径
   *
   * @param jsPath - js相对路径全路径
   * @param type - 类型
   * @param pluginName - 可选，当前插件目录
   */
  static getImportPath(e, t, i) {
    let a = e;
    switch (t) {
      case n.BasePathType_Appearance:
        a = this.browserJoinPath(this.siyuanAppearanceRelativePath(), e);
        break;
      case n.BasePathType_Data:
        a = this.browserJoinPath(this.siyuanDataRelativePath(), e);
        break;
      case n.BasePathType_Themes:
        a = this.browserJoinPath(this.siyuanThemeRelativePath(), e);
        break;
      case n.BasePathType_ZhiTheme:
        a = this.browserJoinPath(this.zhiThemeRelativePath(), e);
        break;
      case n.BasePathType_ThisPlugin:
        if (!i)
          throw new Error("pluginName must be provided when use plugin path");
        a = this.browserJoinPath(this.siyuanDataRelativePath(), "plugins", i, e);
        break;
      case n.BasePathType_Absolute:
        break;
      default:
        throw new Error("type not provided or not supported");
    }
    return a;
  }
  /**
   * 引入json
   *
   * @param jsPath - js相对路径全路径
   * @param type - 类型
   * @param pluginName - 可选，当前插件目录
   */
  static async importJs(e, t, i) {
    const a = this.getImportPath(e, t, i), { default: h } = await import(
      /* @vite-ignore */
      a
    );
    return h;
  }
  /**
   * 引入 zhi 主题的 js - 以 zhi 主题 的根路径为基本路径
   *
   * @param jsPath - 相对于 zhi 主题根路径的相对路径
   */
  static async importZhiThemeJs(e) {
    return await this.importJs(e, n.BasePathType_ZhiTheme);
  }
  // =========================
  // import start
  // =========================
  /**
   * 路径拼接
   *
   * @param paths - 路径数组
   */
  static joinPath(...e) {
    if (s.hasNodeEnv()) {
      const t = this.requireNpm("path");
      if (t)
        return t.join(...e);
    }
    return this.browserJoinPath(...e);
  }
  static browserJoinPath(...e) {
    return e.join(s.BrowserSeparator);
  }
  /**
   * 思源笔记 workspace 目录
   */
  static siyuanWorkspacePath() {
    const e = this.siyuanWindow();
    if (!e)
      throw new Error("Not in siyuan env");
    return e.siyuan.config.system.workspaceDir;
  }
  static siyuanConfPath() {
    const e = this.siyuanWindow();
    if (!e)
      throw new Error("Not in siyuan env");
    return e.siyuan.config.system.confDir;
  }
  /**
   * 思源笔记 data 目录
   */
  static siyuanDataPath() {
    const e = this.siyuanWindow();
    if (!e)
      throw new Error("Not in siyuan env");
    return e.siyuan.config.system.dataDir;
  }
  /**
   * 思源笔记 data 目录-相对路径
   */
  static siyuanDataRelativePath() {
    if (!this.siyuanWindow())
      throw new Error("Not in siyuan env");
    return "";
  }
  /**
   * 思源笔记 appearance 目录
   */
  static siyuanAppearancePath() {
    return this.joinPath(this.siyuanConfPath(), "appearance");
  }
  /**
   * 思源笔记 appearance 目录-相对路径
   */
  static siyuanAppearanceRelativePath() {
    if (!this.siyuanWindow())
      throw new Error("Not in siyuan env");
    return this.browserJoinPath("", "appearance");
  }
  /**
   * 思源笔记 themes 目录-绝对路径
   *
   * 注意: 如果是非 electron 和 Node 环境，这里返回的是浏览器的路径，不是物理路径
   * 如果使用物理路径，请调用 siyuanAppearancePath 或者 siyuanDataPath
   *
   * @author terwer
   * @since 0.1.0
   */
  static siyuanThemePath() {
    if (s.hasNodeEnv())
      return this.joinPath(this.siyuanAppearancePath(), "themes");
    {
      const e = this.siyuanWindow();
      if (!e)
        throw new Error("Not in siyuan env");
      return this.joinPath(e.location.origin, "appearance", "themes");
    }
  }
  /**
   * 思源笔记 themes 目录-相对路径
   */
  static siyuanThemeRelativePath() {
    if (!this.siyuanWindow())
      throw new Error("Not in siyuan env");
    return this.browserJoinPath("", "appearance", "themes");
  }
  /**
   * zhi 主题目录 - 绝对路径
   */
  static zhiThemePath() {
    return this.joinPath(this.siyuanThemePath(), "zhi");
  }
  /**
   * zhi 主题目录 - 相对路径
   */
  static zhiThemeRelativePath() {
    return this.browserJoinPath(this.siyuanThemeRelativePath(), "zhi");
  }
  /**
   * 用户数据目录
   */
  static appDataFolder() {
    const e = u.siyuanWindow().process, t = u.requireNpm("path");
    let i;
    if (e.platform === "darwin")
      i = t.join(e.env.HOME ?? "/Users/terwer", "/Library/Application Support");
    else if (e.platform === "win32")
      i = e.env.APPDATA;
    else if (e.platform === "linux")
      i = e.env.HOME;
    else
      throw new Error("OS not supported");
    return t.join(i ?? e.cwd());
  }
  /**
   * 工作空间名称
   */
  static siyuanWorkspaceName() {
    return this.requireNpm("path").basename(this.siyuanWorkspacePath());
  }
  /**
   * 思源社区目录
   */
  static appSiyuancommunityFolder() {
    return this.joinPath(this.appDataFolder(), "siyuancommunity");
  }
  /**
   * Node包安装目录
   */
  static nodeFolder() {
    return this.joinPath(this.appSiyuancommunityFolder(), "node");
  }
  /**
   * Node包当前目录
   */
  static nodeCurrentFolder() {
    return this.joinPath(this.nodeFolder(), "current");
  }
  /**
   * Node包当前bin目录
   */
  static nodeCurrentBinFolder() {
    return this.joinPath(this.nodeCurrentFolder(), "bin");
  }
  /**
   * 思源社区工作空间目录
   */
  static appWorkspaceFolder() {
    return this.joinPath(this.appSiyuancommunityFolder(), "workspace");
  }
  /**
   * 当前用户NPM包目录
   */
  static appNpmFolder() {
    return this.joinPath(this.appWorkspaceFolder(), this.siyuanWorkspaceName());
  }
  /**
   * 当前用户服务目录
   */
  static appServiceFolder() {
    return this.joinPath(this.appNpmFolder(), "apps");
  }
};
var c = u;
o(c, "isInSiyuanWidget", () => s.isInBrowser ? typeof window.siyuan > "u" && typeof window.parent.process < "u" && window.parent.process.versions != null && window.parent.process.versions.electron != null : false), /**
* 思源笔记渲染窗口
*
* @author terwer
* @version 0.1.0
* @since 0.0.1
*/
o(c, "isInSiyuanRendererWin", () => typeof window < "u" && window.process && window.process.type === "renderer"), /**
* 依赖 npm
*
* @param libpath
* @param win - 可选，执行窗口
*/
o(c, "requireNpm", (e, t) => u.requireLib(e, n.BasePathType_Absolute, "", t)), /**
* 引入依赖
*
* @param libpath - 依赖全路径
* @param type - 可选，以谁的基本路径为准
* @param pluginName - 可选，当前插件目录
* @param win - 可选，执行窗口
*/
o(c, "requireLib", (e, t, i, a) => {
  const h = u.getRequirePath(e, t, i), p = a ?? u.siyuanWindow();
  if (!p)
    return require(h);
  if (typeof p.require < "u")
    return p.require(h);
}), /**
* 引入依赖，以 data 的基本路径为准
*
* @param libpath - 相对于 appearance 的相对路径
*/
o(c, "requireAppearanceLib", (e) => u.requireLib(e, n.BasePathType_Appearance)), /**
* 引入依赖，以 data 的基本路径为准
*
* @param libpath - 相对于 data 的相对路径
*/
o(c, "requireDataLib", (e) => u.requireLib(e, n.BasePathType_Data)), /**
* 引入依赖，以 theme 的基本路径为准
*
* @param libpath - 相对于 theme 的相对路径
*/
o(c, "requireThemesLib", (e) => u.requireLib(e, n.BasePathType_Themes)), /**
* 引入依赖，以 ZhiTheme 的基本路径为准
*
* @param libpath - 相对于 ZhiTheme 的相对路径
*/
o(c, "requireZhiThemeLib", (e) => u.requireLib(e, n.BasePathType_ZhiTheme)), /**
* 引入依赖，以 AppService 的基本路径为准
*
* @param libpath - 相对于 AppService 的相对路径
*/
o(c, "requireAppServiceLib", (e) => u.requireLib(e, n.BasePathType_AppService));

// ../../libs/zhi-cmd/dist/index.cjs
var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
  get: (a, b22) => (typeof require !== "undefined" ? require : a)[b22]
}) : x2)(function(x2) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x2 + '" is not supported');
});
var b2 = Object.defineProperty;
var g2 = (r, e, t) => e in r ? b2(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t;
var o2 = (r, e, t) => (g2(r, typeof e != "symbol" ? e + "" : e, t), t);
var d2 = class {
  /**
   * 检测是否运行在Chrome插件中
   */
  static isInChromeExtension() {
    return d2.isInBrowser ? window.location.href.indexOf("chrome-extension://") > -1 : false;
  }
  /**
   * 复制网页内容到剪贴板
   *
   * @param text - 待复制的文本
   */
  static async copyToClipboardInBrowser(e) {
    if (navigator && navigator.clipboard)
      await navigator.clipboard.writeText(e);
    else {
      const t = document.createElement("input");
      t.style.position = "fixed", t.style.opacity = "0", t.value = e, document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t);
    }
  }
};
var s2 = d2;
o2(s2, "isNode", typeof process < "u" && process.versions != null && process.versions.node != null), /**
* 是否在浏览器环境
*/
o2(s2, "isInBrowser", typeof window < "u" && typeof document < "u"), /**
* 浏览器路径分隔符
*/
o2(s2, "BrowserSeparator", "/"), /**
* 是否是Electron环境
*/
o2(s2, "isElectron", () => typeof process < "u" && process.versions != null && process.versions.electron != null), /**
* 是否有Node环境，目前包括 Electron 和 Node
*/
o2(s2, "hasNodeEnv", () => d2.isElectron() || d2.isNode), /**
* 通用的从 url 中获取获取参数的方法，优先获取查询参数，然后获取 hash 参数与
*
* @param key - 参数
* @author terwer
* @version 0.9.0
* @since 0.0.1
*/
o2(s2, "getQueryParam", (e) => {
  if (!d2.isInBrowser)
    return "";
  const t = window.location.href, i = t.indexOf("?");
  if (i !== -1) {
    const h = t.indexOf("#", i), p = h !== -1 ? t.substring(i + 1, h) : t.substring(i + 1), y = new URLSearchParams(p).get(e);
    if (y)
      return y;
  }
  const a = t.indexOf("#");
  if (a !== -1) {
    const h = t.substring(a + 1), w2 = new URLSearchParams(h).get(e);
    if (w2)
      return w2;
  }
  return "";
}), /**
* 替换 URL 的参数
* 思路：
* 1. 使用了 URLSearchParams 对象来解析和构建 URL 查询参数。
*
* 2. 在处理包含 hash 片段的 URL 时使用了 split 函数将 URL 分成两部分：基本 URL 和 hash 片段。
*
* 3. 然后，再次使用 split 函数将基本 URL 分成两部分：路径和查询参数。
*
* 4. 将查询参数转换为 URLSearchParams 对象，然后设置指定的参数名和值。
*
* 5. 最后，使用 toString 函数将查询参数转换为字符串，并将其与路径组合成新的基本 URL。如果 URL 包含 hash 片段，则将其添加到新的基本 URL 中。
*
* @param url - 链接地址
* @param paramName - 参数名
* @param paramValue - 参数值
*/
o2(s2, "replaceUrlParam", (e, t, i) => {
  i == null && (i = "");
  const a = new RegExp("\\b(" + t + "=).*?(&|#|$)");
  if (e.search(a) >= 0)
    return e.replace(a, "$1" + i + "$2");
  const [h, p] = e.split("#"), [w2, y] = h.split("?"), m = new URLSearchParams(y);
  m.set(t, i);
  const f = m.toString(), P2 = w2 + (f ? "?" + f : "");
  return p ? P2 + "#" + p : P2;
}), /**
* 设置url参数
*
* @param urlstring - url
* @param key - key
* @param value - value
*/
o2(s2, "setUrlParameter", (e, t, i) => {
  if (e.includes(t))
    return d2.replaceUrlParam(e, t, i);
  const a = e.split("#");
  let h = a[0];
  const p = a[1];
  return h.includes("?") ? h += `&${t}=${i}` : h += `?${t}=${i}`, p && (h += "#" + p), h;
}), /**
* 重新加载指定tab
*
* @param tabname - tabname
* @param t - 延迟时间
*/
o2(s2, "reloadTabPage", (e, t) => {
  setTimeout(function() {
    if (d2.isInBrowser) {
      const i = window.location.href;
      window.location.href = d2.setUrlParameter(i, "tab", e);
    }
  }, t ?? 200);
}), /**
* 刷新当前tab页面
*
* @param t - 延迟时间
*/
o2(s2, "reloadPage", (e) => {
  setTimeout(function() {
    d2.isInBrowser && window.location.reload();
  }, e ?? 200);
}), /**
* 刷新当前tab页面
*
* @param msg - 消息提示
* @param cb - 回调
* @param t - 延迟时间
*/
o2(s2, "reloadPageWithMessageCallback", (e, t, i) => {
  t && t(e), setTimeout(function() {
    d2.isInBrowser && window.location.reload();
  }, i ?? 200);
});
var n2 = /* @__PURE__ */ ((r) => (r.BasePathType_Appearance = "Appearance", r.BasePathType_Data = "Data", r.BasePathType_Themes = "Themes", r.BasePathType_ZhiTheme = "ZhiTheme", r.BasePathType_ThisPlugin = "ThisPlugin", r.BasePathType_AppData = "AppData", r.BasePathType_AppNpm = "AppNpm", r.BasePathType_AppService = "AppService", r.BasePathType_Absolute = "Absolute", r.BasePathType_None = "None", r))(n2 || {});
var u2 = class {
  /**
   * 检测是否运行在思源打开的浏览器中
   */
  static isInSiyuanBrowser() {
    return s2.isInBrowser ? typeof window.siyuan < "u" && typeof window.Lute < "u" : false;
  }
  /**
   * 思源笔记 window 对象
   */
  static siyuanWindow() {
    let e;
    return this.isInSiyuanWidget() ? e = parent.window : this.isInSiyuanRendererWin() || this.isInSiyuanBrowser() || typeof window < "u" ? e = window : e = void 0, e;
  }
  // =========================
  // require start
  // =========================
  /**
   * 获取 require 路径
   *
   * @param libpath - 依赖全路径
   * @param type - 可选，以谁的基本路径为准
   * @param pluginName - 可选，当前插件目录
   */
  static getRequirePath(e, t, i) {
    if (!s2.hasNodeEnv())
      throw new Error("require ony works on node env");
    let a = e;
    switch (t) {
      case n2.BasePathType_Appearance:
        a = this.joinPath(this.siyuanAppearancePath(), e);
        break;
      case n2.BasePathType_Data:
        a = this.joinPath(this.siyuanDataPath(), e);
        break;
      case n2.BasePathType_Themes:
        a = this.joinPath(this.siyuanAppearancePath(), "themes", e);
        break;
      case n2.BasePathType_ZhiTheme:
        a = this.joinPath(this.siyuanAppearancePath(), "themes", "zhi", e);
        break;
      case n2.BasePathType_ThisPlugin:
        if (!i)
          throw new Error("pluginName must be provided when use plugin path");
        a = this.joinPath(this.siyuanDataPath(), "plugins", i, e);
        break;
      case n2.BasePathType_AppData:
        a = this.joinPath(this.appDataFolder(), e);
        break;
      case n2.BasePathType_AppNpm:
        a = this.joinPath(this.appNpmFolder(), e);
        break;
      case n2.BasePathType_AppService:
        a = this.joinPath(this.appServiceFolder(), e);
        break;
      case n2.BasePathType_Absolute:
        break;
    }
    return a;
  }
  // =========================
  // require end
  // =========================
  // =========================
  // import start
  // =========================
  /**
   * 获取 import 路径
   *
   * @param jsPath - js相对路径全路径
   * @param type - 类型
   * @param pluginName - 可选，当前插件目录
   */
  static getImportPath(e, t, i) {
    let a = e;
    switch (t) {
      case n2.BasePathType_Appearance:
        a = this.browserJoinPath(this.siyuanAppearanceRelativePath(), e);
        break;
      case n2.BasePathType_Data:
        a = this.browserJoinPath(this.siyuanDataRelativePath(), e);
        break;
      case n2.BasePathType_Themes:
        a = this.browserJoinPath(this.siyuanThemeRelativePath(), e);
        break;
      case n2.BasePathType_ZhiTheme:
        a = this.browserJoinPath(this.zhiThemeRelativePath(), e);
        break;
      case n2.BasePathType_ThisPlugin:
        if (!i)
          throw new Error("pluginName must be provided when use plugin path");
        a = this.browserJoinPath(this.siyuanDataRelativePath(), "plugins", i, e);
        break;
      case n2.BasePathType_Absolute:
        break;
      default:
        throw new Error("type not provided or not supported");
    }
    return a;
  }
  /**
   * 引入json
   *
   * @param jsPath - js相对路径全路径
   * @param type - 类型
   * @param pluginName - 可选，当前插件目录
   */
  static async importJs(e, t, i) {
    const a = this.getImportPath(e, t, i), { default: h } = await import(
      /* @vite-ignore */
      a
    );
    return h;
  }
  /**
   * 引入 zhi 主题的 js - 以 zhi 主题 的根路径为基本路径
   *
   * @param jsPath - 相对于 zhi 主题根路径的相对路径
   */
  static async importZhiThemeJs(e) {
    return await this.importJs(e, n2.BasePathType_ZhiTheme);
  }
  // =========================
  // import start
  // =========================
  /**
   * 路径拼接
   *
   * @param paths - 路径数组
   */
  static joinPath(...e) {
    if (s2.hasNodeEnv()) {
      const t = this.requireNpm("path");
      if (t)
        return t.join(...e);
    }
    return this.browserJoinPath(...e);
  }
  static browserJoinPath(...e) {
    return e.join(s2.BrowserSeparator);
  }
  /**
   * 思源笔记 workspace 目录
   */
  static siyuanWorkspacePath() {
    const e = this.siyuanWindow();
    if (!e)
      throw new Error("Not in siyuan env");
    return e.siyuan.config.system.workspaceDir;
  }
  static siyuanConfPath() {
    const e = this.siyuanWindow();
    if (!e)
      throw new Error("Not in siyuan env");
    return e.siyuan.config.system.confDir;
  }
  /**
   * 思源笔记 data 目录
   */
  static siyuanDataPath() {
    const e = this.siyuanWindow();
    if (!e)
      throw new Error("Not in siyuan env");
    return e.siyuan.config.system.dataDir;
  }
  /**
   * 思源笔记 data 目录-相对路径
   */
  static siyuanDataRelativePath() {
    if (!this.siyuanWindow())
      throw new Error("Not in siyuan env");
    return "";
  }
  /**
   * 思源笔记 appearance 目录
   */
  static siyuanAppearancePath() {
    return this.joinPath(this.siyuanConfPath(), "appearance");
  }
  /**
   * 思源笔记 appearance 目录-相对路径
   */
  static siyuanAppearanceRelativePath() {
    if (!this.siyuanWindow())
      throw new Error("Not in siyuan env");
    return this.browserJoinPath("", "appearance");
  }
  /**
   * 思源笔记 themes 目录-绝对路径
   *
   * 注意: 如果是非 electron 和 Node 环境，这里返回的是浏览器的路径，不是物理路径
   * 如果使用物理路径，请调用 siyuanAppearancePath 或者 siyuanDataPath
   *
   * @author terwer
   * @since 0.1.0
   */
  static siyuanThemePath() {
    if (s2.hasNodeEnv())
      return this.joinPath(this.siyuanAppearancePath(), "themes");
    {
      const e = this.siyuanWindow();
      if (!e)
        throw new Error("Not in siyuan env");
      return this.joinPath(e.location.origin, "appearance", "themes");
    }
  }
  /**
   * 思源笔记 themes 目录-相对路径
   */
  static siyuanThemeRelativePath() {
    if (!this.siyuanWindow())
      throw new Error("Not in siyuan env");
    return this.browserJoinPath("", "appearance", "themes");
  }
  /**
   * zhi 主题目录 - 绝对路径
   */
  static zhiThemePath() {
    return this.joinPath(this.siyuanThemePath(), "zhi");
  }
  /**
   * zhi 主题目录 - 相对路径
   */
  static zhiThemeRelativePath() {
    return this.browserJoinPath(this.siyuanThemeRelativePath(), "zhi");
  }
  /**
   * 用户数据目录
   */
  static appDataFolder() {
    const e = u2.siyuanWindow().process, t = u2.requireNpm("path");
    let i;
    if (e.platform === "darwin")
      i = t.join(e.env.HOME ?? "/Users/terwer", "/Library/Application Support");
    else if (e.platform === "win32")
      i = e.env.APPDATA;
    else if (e.platform === "linux")
      i = e.env.HOME;
    else
      throw new Error("OS not supported");
    return t.join(i ?? e.cwd());
  }
  /**
   * 工作空间名称
   */
  static siyuanWorkspaceName() {
    return this.requireNpm("path").basename(this.siyuanWorkspacePath());
  }
  /**
   * 思源社区目录
   */
  static appSiyuancommunityFolder() {
    return this.joinPath(this.appDataFolder(), "siyuancommunity");
  }
  /**
   * Node包安装目录
   */
  static nodeFolder() {
    return this.joinPath(this.appSiyuancommunityFolder(), "node");
  }
  /**
   * Node包当前目录
   */
  static nodeCurrentFolder() {
    return this.joinPath(this.nodeFolder(), "current");
  }
  /**
   * Node包当前bin目录
   */
  static nodeCurrentBinFolder() {
    return this.joinPath(this.nodeCurrentFolder(), "bin");
  }
  /**
   * 思源社区工作空间目录
   */
  static appWorkspaceFolder() {
    return this.joinPath(this.appSiyuancommunityFolder(), "workspace");
  }
  /**
   * 当前用户NPM包目录
   */
  static appNpmFolder() {
    return this.joinPath(this.appWorkspaceFolder(), this.siyuanWorkspaceName());
  }
  /**
   * 当前用户服务目录
   */
  static appServiceFolder() {
    return this.joinPath(this.appNpmFolder(), "apps");
  }
};
var c2 = u2;
o2(c2, "isInSiyuanWidget", () => s2.isInBrowser ? typeof window.siyuan > "u" && typeof window.parent.process < "u" && window.parent.process.versions != null && window.parent.process.versions.electron != null : false), /**
* 思源笔记渲染窗口
*
* @author terwer
* @version 0.1.0
* @since 0.0.1
*/
o2(c2, "isInSiyuanRendererWin", () => typeof window < "u" && window.process && window.process.type === "renderer"), /**
* 依赖 npm
*
* @param libpath
* @param win - 可选，执行窗口
*/
o2(c2, "requireNpm", (e, t) => u2.requireLib(e, n2.BasePathType_Absolute, "", t)), /**
* 引入依赖
*
* @param libpath - 依赖全路径
* @param type - 可选，以谁的基本路径为准
* @param pluginName - 可选，当前插件目录
* @param win - 可选，执行窗口
*/
o2(c2, "requireLib", (e, t, i, a) => {
  const h = u2.getRequirePath(e, t, i), p = a ?? u2.siyuanWindow();
  if (!p)
    return __require(h);
  if (typeof p.require < "u")
    return p.require(h);
}), /**
* 引入依赖，以 data 的基本路径为准
*
* @param libpath - 相对于 appearance 的相对路径
*/
o2(c2, "requireAppearanceLib", (e) => u2.requireLib(e, n2.BasePathType_Appearance)), /**
* 引入依赖，以 data 的基本路径为准
*
* @param libpath - 相对于 data 的相对路径
*/
o2(c2, "requireDataLib", (e) => u2.requireLib(e, n2.BasePathType_Data)), /**
* 引入依赖，以 theme 的基本路径为准
*
* @param libpath - 相对于 theme 的相对路径
*/
o2(c2, "requireThemesLib", (e) => u2.requireLib(e, n2.BasePathType_Themes)), /**
* 引入依赖，以 ZhiTheme 的基本路径为准
*
* @param libpath - 相对于 ZhiTheme 的相对路径
*/
o2(c2, "requireZhiThemeLib", (e) => u2.requireLib(e, n2.BasePathType_ZhiTheme)), /**
* 引入依赖，以 AppService 的基本路径为准
*
* @param libpath - 相对于 AppService 的相对路径
*/
o2(c2, "requireAppServiceLib", (e) => u2.requireLib(e, n2.BasePathType_AppService));
var CustomCmd = class {
  /**
   * 使用 Electron 自带的 node 运行命令
   *
   * https://github.com/UniBO-PRISMLab/wam/issues/26#issuecomment-1456204046
   * https://github.com/nodejs/help/issues/3885
   * https://github.com/npm/pacote
   *
   * 示例：
   * ```
   * await customCmd.executeCommandWithBundledNode("./node_modules/.bin/next", ["-v"], "/Users/terwer/Downloads/n")
   *
   * const command = "/Users/terwer/Documents/mydocs/zhi-framework/zhi/libs/zhi-cmd/public/setup.js"
   * const args = []
   * const cwd = undefined
   * const result = await zhiCmd.executeCommandWithBundledNodeAsync(command, args, cwd)
   * if (result.status) {
   *   console.log("命令执行成功！😄")
   * } else {
   *   console.error("命令执行失败😭: ", result.msg)
   * }
   * ```
   *
   * @param command - 命令
   * @param args - 参数
   * @param cwd - 运行目录，默认 process.cwd
   */
  async executeCommandWithBundledNodeAsync(command, args2 = [], cwd) {
    const siyuanRequire = c2.siyuanWindow()?.require ?? __require;
    const process22 = c2.siyuanWindow()?.process ?? global.process;
    const { fork } = siyuanRequire("child_process");
    const fs4 = siyuanRequire("fs");
    const path5 = siyuanRequire("path");
    return new Promise((resolve) => {
      const options = {
        cwd: cwd ?? process22.cwd(),
        silent: true
      };
      console.log(`\u6B63\u5728\u4F7F\u7528 Electron \u81EA\u5E26\u7684 Node \u6267\u884C\u547D\u4EE4\uFF1A${command},args=>${args2}, options=>`, options);
      const child = fork(command, args2, options);
      const logFilePath = path5.join(
        process22.env?.HOME ?? process22.env?.USERPROFILE ?? process22.env?.Temp ?? cwd,
        "electron-command-log.txt"
      );
      console.log(`\u547D\u4EE4\u6267\u884C\u65E5\u5FD7\u5DF2\u4FDD\u5B58\u5230\u6587\u4EF6 => ${logFilePath}`);
      const logStream = fs4.createWriteStream(logFilePath, { flags: "a" });
      child.stdout.pipe(logStream);
      child.stderr.pipe(logStream);
      child.on("error", (err) => {
        resolve({
          status: false,
          code: -1,
          msg: err.message
        });
      });
      child.on("exit", (code) => {
        if (code === 0) {
          resolve({
            status: true,
            code,
            msg: "\u5B50\u8FDB\u7A0B\u8FD0\u884C\u6210\u529F"
          });
        } else {
          const errorMessage = `\u5B50\u8FDB\u7A0B\u5F02\u5E38\u9000\u51FA\u{1F612}\uFF0C\u9000\u51FA\u7801: ${code}`;
          resolve({
            status: false,
            code,
            msg: errorMessage
          });
        }
      });
    });
  }
  /**
   * 自定义执行系统命令
   *
   * 示例：
   * ```
   * await customCmd.executeCommand("./node_modules/.bin/nuxt", ["preview"], { shell: true, cwd: '/Users/terwer/Downloads/nu' })
   *
   * await customCmd.executeCommand("node", ["./server/index.mjs"], { cwd: '/Users/terwer/Downloads/nu' })
   *
   * const command = `--version`
   * const args = []
   * const options = {
   *   env: {
   *     PATH:"/Users/terwer/Downloads/node/node-v18.18.2-darwin-x64/bin"
   *   }
   * }
   * await zhiCmd.executeCommand("node", [`${command}`], options)
   * ```
   *
   * @param command - 命令
   * @param args - 参数
   * @param options - 选项
   */
  async executeCommand(command, args2, options = {}) {
    const { exec } = c2.requireLib("child_process");
    const fullCommand = `${command} ${args2.join(" ")}`;
    console.log("==========================================>");
    console.log("executeCommand fullCommand =>", fullCommand);
    console.log("<==========================================");
    return new Promise((resolve, reject) => {
      exec(fullCommand, options, (err, stdout) => {
        if (err) {
          console.error("executeCommand error =>", err);
          reject(err);
        } else {
          console.info("executeCommand success =>", stdout);
          resolve(stdout);
        }
      });
    });
  }
  /**
   * 自定义执行系统命令
   *
   * 示例：
   * ```
   * await customCmd.executeCommandWithSpawn("./node_modules/.bin/nuxt", ["preview"], { shell: true, cwd: '/Users/terwer/Downloads/nu' })
   * await customCmd.executeCommandWithSpawn("node", ["./server/index.mjs"], { cwd: '/Users/terwer/Downloads/nu' })
   * ```
   *
   * @param command - 命令
   * @param args - 参数
   * @param options - 选项
   */
  async executeCommandWithSpawn(command, args2, options = {}) {
    const { spawn } = c2.requireLib("child_process");
    const siyuanRequire = c2.siyuanWindow()?.require ?? __require;
    const process22 = c2.siyuanWindow()?.process ?? global.process;
    const fs4 = siyuanRequire("fs");
    const path5 = siyuanRequire("path");
    return new Promise((resolve, reject) => {
      const child = spawn(command, args2, options);
      const logFilePath = path5.join(
        process22.env?.HOME ?? process22.env?.USERPROFILE ?? process22.env?.Temp ?? process22.cwd,
        "local-service-command-log.txt"
      );
      console.log(`\u547D\u4EE4\u6267\u884C\u65E5\u5FD7\u5DF2\u4FDD\u5B58\u5230\u6587\u4EF6 => ${logFilePath}`);
      const logStream = fs4.createWriteStream(logFilePath, { flags: "a" });
      child.stdout.pipe(logStream);
      child.stderr.pipe(logStream);
      let output = "";
      let error = "";
      child.stdout.on("data", (data) => {
        output += data.toString();
      });
      child.stderr.on("error", (data) => {
        error += data.toString();
      });
      child.on("error", (err) => {
        resolve(err.message);
      });
      child.on("exit", (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          resolve(error);
        }
      });
    });
  }
  /**
   * 获取 Electron 的 Node 版本
   */
  async getElectronNodeVersion() {
    return c2.siyuanWindow().process.versions.node;
  }
  /**
   * 获取系统的 Node 版本
   */
  async getSystemNodeVersion() {
    return await this.executeCommand("node", ["-v"], { shell: true });
  }
};

// src/lib/npmHelper.ts
var import_path2 = __toESM(require("path"), 1);

// src/lib/packageHelper.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var logger = w("package-helper", "zhi", false);
function createPackageJson(name, version, dependencies, filePath) {
  const packageJson = {
    name,
    version,
    description: "npm store for zhi",
    keywords: ["zhi", "app"],
    author: "terwer",
    license: "GPL",
    dependencies
  };
  if (!filePath) {
    filePath = import_path.default.join(process.cwd(), "package.json");
  }
  const data = JSON.stringify(packageJson, null, 2);
  import_fs.default.writeFileSync(filePath, data);
  logger.info(`package.json created successfully at ${filePath}!`);
}
function updatePackageJson(depsFilePath, packageJsonFilePath) {
  if (!depsFilePath) {
    depsFilePath = import_path.default.join(process.cwd(), "deps.json");
  }
  if (!packageJsonFilePath) {
    packageJsonFilePath = import_path.default.join(process.cwd(), "package.json");
  }
  const depsString = import_fs.default.readFileSync(depsFilePath).toString();
  const hash = import_crypto.default.createHash("sha256").update(depsString).digest("hex");
  const hashFilePath = import_path.default.join(import_path.default.dirname(packageJsonFilePath), ".deps-hash");
  let oldHash;
  try {
    oldHash = import_fs.default.readFileSync(hashFilePath).toString();
  } catch (err) {
    oldHash = "";
  }
  if (oldHash === hash) {
    logger.info(`deps.json hasn't changed since last update, skip`);
    return false;
  }
  const packageJsonString = import_fs.default.readFileSync(packageJsonFilePath).toString();
  const packageJson = JSON.parse(packageJsonString);
  const deps = JSON.parse(depsString);
  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...deps
  };
  import_fs.default.writeFileSync(packageJsonFilePath, JSON.stringify(packageJson, null, 2));
  logger.info(`dependencies updated successfully at ${packageJsonFilePath}`);
  return true;
}
function updatePackageJsonHash(depsFilePath, packageJsonFilePath) {
  if (!depsFilePath) {
    depsFilePath = import_path.default.join(process.cwd(), "deps.json");
  }
  if (!packageJsonFilePath) {
    packageJsonFilePath = import_path.default.join(process.cwd(), "package.json");
  }
  const hashFilePath = import_path.default.join(import_path.default.dirname(packageJsonFilePath), ".deps-hash");
  const depsString = import_fs.default.readFileSync(depsFilePath).toString();
  const hash = import_crypto.default.createHash("sha256").update(depsString).digest("hex");
  import_fs.default.writeFileSync(hashFilePath, hash);
  return true;
}

// ../../libs/zhi-common/dist/index.js
var ou = Object.defineProperty;
var gu = (n3, e, i) => e in n3 ? ou(n3, e, { enumerable: true, configurable: true, writable: true, value: i }) : n3[e] = i;
var G = (n3, e, i) => (gu(n3, typeof e != "symbol" ? e + "" : e, i), i);
var Mn = class {
  /**
   * 格式化字符串
   *
   * @param str - 字符串，可用占位符，例如：test \{0\} str
   * @param args - 按占位符顺序排列的参数
   * @author terwer
   * @since 0.0.1
   */
  static f(e, ...i) {
    let u3 = e;
    for (let a = 0; a < i.length; a++) {
      const o3 = i[a];
      typeof o3 == "string" ? u3 = u3.replace(`{${a}}`, o3) : u3 = u3.replace(`{${a}}`, o3.toString());
    }
    return u3;
  }
  /**
   * 字符串拼接
   *
   * @param str - 字符串数组
   */
  static appendStr(...e) {
    return e.join("");
  }
  /**
   * 判断字符串中，是否包含数组中任何一个元素
   *
   * @param str - 字符串
   * @param arr - 字符串数组
   */
  static includeInArray(e, i) {
    let u3 = false;
    for (let a = 0; a < i.length; a++) {
      const o3 = i[a];
      e.includes(o3) && (u3 = true);
    }
    return u3;
  }
  /**
   * 截取指定长度的字符串
   *
   * @param str - str
   * @param length - 长度
   * @param ignore - 不要结尾省略号
   */
  static getByLength(e, i, u3) {
    const a = e;
    return a.length < i ? a : u3 ? a.substring(0, i) : a.substring(0, i) + "...";
  }
  /**
   * 字符串空值检测
   *
   * @param str - 待检测的字符串
   */
  static isEmptyString(e) {
    return !e || typeof e != "string" ? true : e.trim().length === 0;
  }
  /**
   * 路径组合，解决多出来/的问题
   *
   * @param path1 - 路径1
   * @param path2 - 路径2
   */
  static pathJoin(e, i) {
    let u3 = e;
    const a = e.lastIndexOf("/");
    return a + 1 === e.length && (u3 = e.substring(0, a)), i.indexOf("/") === 0 ? u3 = u3 + i : u3 = u3 + "/" + i, u3;
  }
  /**
   * 强转boolean
   *
   * @param val - val
   */
  static parseBoolean(e) {
    return e || (e = "false"), e.toString().toLowerCase() === "true";
  }
  /**
   * 首字母大写
   *
   * @param name
   */
  static upperFirst(e) {
    return e.substring(0, 1).toUpperCase() + e.substring(1).toLowerCase();
  }
  /**
   * 移除标题数字
   *
   * @param str
   */
  static removeTitleNumber(e) {
    let i = e;
    const u3 = /([0-9]*)\./;
    return i = i.replace(u3, ""), i;
  }
  /**
   * 根据拼音获取首字母
   *
   * @param pinyin
   */
  static getFirstLetters(e) {
    let i = "";
    return e.split("-").forEach((a) => {
      i += a[0];
    }), i;
  }
};
var Qn = (n3, e, i) => {
  const u3 = e ?? "zhi", a = (l) => {
    const r = l.getFullYear(), t = String(l.getMonth() + 1).padStart(2, "0"), y = String(l.getDate()).padStart(2, "0"), d3 = String(l.getHours()).padStart(2, "0"), c3 = String(l.getMinutes()).padStart(2, "0"), w2 = String(l.getSeconds()).padStart(2, "0");
    return `${r}-${t}-${y} ${d3}:${c3}:${w2}`;
  }, o3 = (l, r) => {
    const t = a(/* @__PURE__ */ new Date()), y = typeof r == "boolean" ? String(r) : r;
    y ? console.log(`[${u3}] [${t}] [DEBUG] [${n3}] ${l}`, y) : console.log(`[${u3}] [${t}] [DEBUG] [${n3}] ${l}`);
  }, g3 = (l, r) => {
    const t = a(/* @__PURE__ */ new Date()), y = typeof r == "boolean" ? String(r) : r;
    y ? console.info(`[${u3}] [${t}] [INFO] [${n3}] ${l}`, y) : console.info(`[${u3}] [${t}] [INFO] [${n3}] ${l}`);
  }, s3 = (l, r) => {
    const t = a(/* @__PURE__ */ new Date()), y = typeof r == "boolean" ? String(r) : r;
    y ? console.warn(`[${u3}] [${t}] [WARN] [${n3}] ${l}`, y) : console.warn(`[${u3}] [${t}] [WARN] [${n3}] ${l}`);
  }, h = (l, r) => {
    const t = a(/* @__PURE__ */ new Date());
    r ? console.error(`[${u3}] [${t}] [ERROR] [${n3}] ${l.toString()}`, r) : console.error(`[${u3}] [${t}] [ERROR] [${n3}] ${l.toString()}`);
  };
  return {
    debug: (l, r) => {
      i && (r ? o3(l, r) : o3(l));
    },
    info: (l, r) => {
      r ? g3(l, r) : g3(l);
    },
    warn: (l, r) => {
      r ? s3(l, r) : s3(l);
    },
    error: (l, r) => {
      r ? h(l, r) : h(l);
    }
  };
};
var Te = class {
  /**
   * 安全的解析json
   *
   * @param str json字符串
   * @param def 默认值
   */
  static safeParse(e, i) {
    let u3;
    if (typeof e != "string")
      return this.logger.debug("not json string, ignore parse"), e;
    Mn.isEmptyString(e) && (u3 = i);
    try {
      e = this.extractContent(e), u3 = JSON.parse(e) || i;
    } catch (a) {
      u3 = i, this.logger.warn("json parse error", a);
    }
    return typeof u3 == "string" && (u3 = JSON.parse(u3) || i), u3;
  }
  static extractContent(e) {
    const i = e.match(/```json\n([\s\S]*)\n```/);
    return i ? i[1] : e;
  }
};
G(Te, "logger", Qn("json-util"));
var Qi = class {
  /**
   * 给日期添加小时
   *
   * @param date - Date
   * @param numOfHours - 数字
   * @author terwer
   * @since 1.0.0
   */
  static addHoursToDate(e, i) {
    return e.setTime(e.getTime() + i * 60 * 60 * 1e3), e;
  }
  /**
   * 转换ISO日期为中文日期的通用转换方法
   *
   * @param str - '2022-07-18T06:25:48.000Z
   * @param isAddTimeZone - 是否增加时区（默认不增加）
   * @param isShort - 是否只返回日期
   * @author terwer
   * @since 1.0.0
   */
  static formatIsoToZhDateFormat(e, i, u3) {
    if (!e)
      return "";
    let a = e;
    const o3 = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(.\d{3})Z$/gm, g3 = a.match(o3);
    if (g3 == null)
      return e;
    for (let s3 = 0; s3 < g3.length; s3++) {
      const h = g3[s3];
      let l = h;
      i && (l = this.addHoursToDate(new Date(h), 8).toISOString());
      const r = l.split("T"), t = r[0], y = r[1].split(".")[0];
      let d3 = t + this.TIME_SPLIT + y;
      u3 && (d3 = t), a = a.replace(h, d3);
    }
    return a;
  }
  /**
   * 转换ISO日期为中文完整时间
   *
   * @param str - '2022-07-18T06:25:48.000Z
   * @param isAddTimeZone - 是否增加时区，默认不增加
   * @param isShort - 是否短时间
   */
  static formatIsoToZh(e, i, u3) {
    return this.formatIsoToZhDateFormat(e, i, u3);
  }
  /**
   * 转换ISO日期为中文日期
   *
   * @param str - '2022-07-18T06:25:48.000Z
   * @param isAddTimeZone - 是否增加时区，默认不增加
   */
  static formatIsoToZhDate(e, i) {
    return this.formatIsoToZhDateFormat(e, i, true);
  }
  /**
   * 转换ISO日期为中文时间
   *
   * @param str - '2022-07-18T06:25:48.000Z
   * @param isAddTimeZone - 是否增加时区，默认不增加
   */
  static formatIsoToZhTime(e, i) {
    return this.formatIsoToZhDateFormat(e, i).split(this.TIME_SPLIT)[1];
  }
  /**
   * 当前日期时间完整格式，格式：2023-03-10 02:03:43
   */
  static nowZh() {
    return this.formatIsoToZhDateFormat((/* @__PURE__ */ new Date()).toISOString(), true);
  }
  /**
   * 当前日期，格式：2023-03-10
   */
  static nowDateZh() {
    return this.formatIsoToZhDateFormat((/* @__PURE__ */ new Date()).toISOString(), true, true);
  }
  /**
   * 当前时间，格式：02:03:43
   */
  static nowTimeZh() {
    return this.formatIsoToZhDateFormat((/* @__PURE__ */ new Date()).toISOString(), true).split(this.TIME_SPLIT)[1];
  }
  /**
   * 当前年份
   */
  static nowYear() {
    return (/* @__PURE__ */ new Date()).getFullYear();
  }
  /**
   * 时间戳转时间
   *
   * @param timestamp - 时间戳
   */
  static formatTimestampToZhDate(e) {
    return typeof e == "string" && (e = parseInt(e)), this.formatIsoToZhDate(new Date(e).toISOString());
  }
  /**
   * 转换数字日期为中文日期
   *
   * @param str '20220718142548'
   */
  static formatNumToZhDate(e) {
    if (!e)
      return "";
    const u3 = e.replace(/\D/g, ""), a = u3.slice(0, 4), o3 = u3.slice(4, 6), g3 = u3.slice(6, 8), s3 = u3.slice(8, 10), h = u3.slice(10, 12), l = u3.slice(12, 14);
    let r = a;
    return o3 ? g3 ? s3 ? h ? l ? r = a + "-" + o3 + "-" + g3 + " " + s3 + ":" + h + ":" + l : r = a + "-" + o3 + "-" + g3 + " " + s3 + ":" + h : r = a + "-" + o3 + "-" + g3 + " " + s3 : r = a + "-" + o3 + "-" + g3 : r = a + "-" + o3 : r = a, r;
  }
  /**
   * 字符转Date
   *
   * @param dateString dateString
   *
   * ```
   * should be in ISO format: "yyyy-mm-dd hh:MM:ss" or
   * "yyyy-mm-dd", "yyyy-mm" or "yyyy" or yyyymmddsss
   * ```
   *
   * @returns {Date}
   */
  static convertStringToDate(e) {
    const i = this.formatNumToZhDate(e);
    return new Date(i);
  }
};
G(Qi, "TIME_SPLIT", " ");
var Bi = class {
  /**
   * 移除标题数字
   *
   * @param str - 字符串
   */
  static removeTitleNumber(e) {
    let i = e;
    const u3 = /([0-9]*)\.?/;
    return i = i.replace(u3, ""), i;
  }
  /**
   * 删除挂件的HTML
   *
   * @param str - 原字符
   */
  static removeWidgetTag(e) {
    let i = e.toString();
    const u3 = /<iframe.*src="\/widgets\/publisher.*<\/iframe>/g;
    i = i.replace(u3, "");
    const a = /<iframe.*src="\/widgets\/sy-post-publisher.*<\/iframe>/g;
    i = i.replace(a, "");
    const o3 = /<iframe.*\/widgets\/Note*\sAttrs.*\/iframe>/g;
    return i = i.replace(o3, ""), i;
  }
  /**
   * 删除Markdown文本的挂件的HTML
   *
   * @param str - 原字符
   */
  static removeMdWidgetTag(e) {
    let i = e.toString();
    return i = this.removeWidgetTag(i), i;
  }
  /**
   * 去除html标签，残缺不全也可以
   *
   * @param str - 字符串
   */
  static filterHtml(e) {
    e = e.replace(/<style((.|\n|\r)*?)<\/style>/g, ""), e = e.replace(/<script((.|\n|\r)*?)<\/script>/g, ""), e = e.replace(/<[^>]*>/g, ""), e = e.replace(/&.*;/g, ""), e = e.replace(/(^\s*)|(\s*$)/g, ""), e = e.replace(/</g, "").replace(/>/g, ""), e = e.replace(/"/g, "").replace(/'/g, ""), e = e.replace(/\*/g, ""), e = e.replace(/\$/g, ""), e = e.replace(/\./g, ""), e = e.replace(/\+/g, ""), e = e.replace(/\s+/g, ""), e = e.replace(/[:|：]/g, "_"), e = e.replace(/[;|；]/g, "_"), e = e.replace(/\^/g, "_"), e = e.replace(/!/g, "_"), e = e.replace(/@/g, "at_"), e = e.replace(/---/g, "");
    const i = ["\\d*/\\d/\\d*", "[\u3001|\\\\]", "[\uFF0C|,]", "\\d", "/", "-"];
    for (let u3 = 0; u3 < i.length; u3++) {
      const a = new RegExp(i[u3], "g");
      e = e.replace(a, "");
    }
    return e = e.toLowerCase(), e;
  }
  /**
   * 截取指定长度html
   *
   * @param html - html
   * @param length - 长度
   * @param ignoreSign - 不要结尾省略号
   */
  static parseHtml(e, i, u3) {
    const a = this.filterHtml(e), o3 = u3 ? "" : "...", g3 = /[\u4e00-\u9fa5]/;
    let s3 = 0, h = "";
    for (let l = 0; l < a.length; l++) {
      const r = a[l];
      if (g3.test(r) ? s3 += 2 : s3 += 1, s3 > i) {
        h = a.slice(0, l) + o3;
        break;
      }
    }
    return h || a;
  }
  /**
   * 移除H1标签
   *
   * @param html - html
   */
  static removeH1(e) {
    let i = e;
    const u3 = /<h1.*?\/h1>/, a = i.match(u3);
    return a && (i = i.replace(a[0], "")), i = i.replace(/---/g, ""), i;
  }
  /**
   * 移除Markdown里面的H1标签
   *
   * JavaScript 正则表达式可以用来删除所有 Markdown 中的 h1 标签。下面是一个示例代码：
   *
   * const str = "# This is an H1\n## This is an H2\n### This is an H3";
   *
   * const regex = /^# .*$/gm;
   * const result = str.replace(regex, '');
   *
   * console.log(result);
   * 在这个例子中，我们使用正则表达式 /^# .*$/gm 来匹配所有的 h1 标签。
   * 在 JavaScript 中，^ 匹配行首，# 匹配 # 字符，.* 匹配任意字符，$ 匹配行尾，m 标记表示多行模式。
   */
  static removeMdH1(e) {
    let i = e;
    const u3 = /^# .*$/m;
    return i = i.replace(u3, ""), i;
  }
};
function su(n3, e) {
  const i = /* @__PURE__ */ Object.create(null), u3 = n3.split(",");
  for (let a = 0; a < u3.length; a++)
    i[u3[a]] = true;
  return e ? (a) => !!i[a.toLowerCase()] : (a) => !!i[a];
}
var K = process.env.NODE_ENV !== "production" ? Object.freeze({}) : {};
process.env.NODE_ENV !== "production" && Object.freeze([]);
var He = () => {
};
var hu = /^on[^a-z]/;
var lu = (n3) => hu.test(n3);
var P = Object.assign;
var tu = (n3, e) => {
  const i = n3.indexOf(e);
  i > -1 && n3.splice(i, 1);
};
var ru = Object.prototype.hasOwnProperty;
var L = (n3, e) => ru.call(n3, e);
var Y = Array.isArray;
var pn = (n3) => ae(n3) === "[object Map]";
var yu = (n3) => ae(n3) === "[object Set]";
var F = (n3) => typeof n3 == "function";
var A = (n3) => typeof n3 == "string";
var Fe = (n3) => typeof n3 == "symbol";
var x = (n3) => n3 !== null && typeof n3 == "object";
var du = (n3) => x(n3) && F(n3.then) && F(n3.catch);
var bu = Object.prototype.toString;
var ae = (n3) => bu.call(n3);
var xi = (n3) => ae(n3).slice(8, -1);
var cu = (n3) => ae(n3) === "[object Object]";
var Me = (n3) => A(n3) && n3 !== "NaN" && n3[0] !== "-" && "" + parseInt(n3, 10) === n3;
var wu = (n3) => {
  const e = /* @__PURE__ */ Object.create(null);
  return (i) => e[i] || (e[i] = n3(i));
};
var pu = wu(
  (n3) => n3.charAt(0).toUpperCase() + n3.slice(1)
);
var vn = (n3, e) => !Object.is(n3, e);
var ju = (n3, e, i) => {
  Object.defineProperty(n3, e, {
    configurable: true,
    enumerable: false,
    value: i
  });
};
var qe;
var de = () => qe || (qe = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Qe(n3) {
  if (Y(n3)) {
    const e = {};
    for (let i = 0; i < n3.length; i++) {
      const u3 = n3[i], a = A(u3) ? Lu(u3) : Qe(u3);
      if (a)
        for (const o3 in a)
          e[o3] = a[o3];
    }
    return e;
  } else {
    if (A(n3))
      return n3;
    if (x(n3))
      return n3;
  }
}
var mu = /;(?![^(]*\))/g;
var Yu = /:([^]+)/;
var fu = /\/\*[^]*?\*\//g;
function Lu(n3) {
  const e = {};
  return n3.replace(fu, "").split(mu).forEach((i) => {
    if (i) {
      const u3 = i.split(Yu);
      u3.length > 1 && (e[u3[0].trim()] = u3[1].trim());
    }
  }), e;
}
function Be(n3) {
  let e = "";
  if (A(n3))
    e = n3;
  else if (Y(n3))
    for (let i = 0; i < n3.length; i++) {
      const u3 = Be(n3[i]);
      u3 && (e += u3 + " ");
    }
  else if (x(n3))
    for (const i in n3)
      n3[i] && (e += i + " ");
  return e.trim();
}
function ni(n3, ...e) {
  console.warn(`[Vue warn] ${n3}`, ...e);
}
var Ni;
function Zu(n3, e = Ni) {
  e && e.active && e.effects.push(n3);
}
function Su() {
  return Ni;
}
var be = (n3) => {
  const e = new Set(n3);
  return e.w = 0, e.n = 0, e;
};
var Gi = (n3) => (n3.w & V) > 0;
var Pi = (n3) => (n3.n & V) > 0;
var Cu = ({ deps: n3 }) => {
  if (n3.length)
    for (let e = 0; e < n3.length; e++)
      n3[e].w |= V;
};
var Ju = (n3) => {
  const { deps: e } = n3;
  if (e.length) {
    let i = 0;
    for (let u3 = 0; u3 < e.length; u3++) {
      const a = e[u3];
      Gi(a) && !Pi(a) ? a.delete(n3) : e[i++] = a, a.w &= ~V, a.n &= ~V;
    }
    e.length = i;
  }
};
var ce = /* @__PURE__ */ new WeakMap();
var Zn = 0;
var V = 1;
var we = 30;
var Q;
var en = Symbol(process.env.NODE_ENV !== "production" ? "iterate" : "");
var pe = Symbol(process.env.NODE_ENV !== "production" ? "Map key iterate" : "");
var ku = class {
  constructor(e, i = null, u3) {
    this.fn = e, this.scheduler = i, this.active = true, this.deps = [], this.parent = void 0, Zu(this, u3);
  }
  run() {
    if (!this.active)
      return this.fn();
    let e = Q, i = an;
    for (; e; ) {
      if (e === this)
        return;
      e = e.parent;
    }
    try {
      return this.parent = Q, Q = this, an = true, V = 1 << ++Zn, Zn <= we ? Cu(this) : ei(this), this.fn();
    } finally {
      Zn <= we && Ju(this), V = 1 << --Zn, Q = this.parent, an = i, this.parent = void 0, this.deferStop && this.stop();
    }
  }
  stop() {
    Q === this ? this.deferStop = true : this.active && (ei(this), this.onStop && this.onStop(), this.active = false);
  }
};
function ei(n3) {
  const { deps: e } = n3;
  if (e.length) {
    for (let i = 0; i < e.length; i++)
      e[i].delete(n3);
    e.length = 0;
  }
}
var an = true;
var Ei = [];
function Ai() {
  Ei.push(an), an = false;
}
function Wi() {
  const n3 = Ei.pop();
  an = n3 === void 0 ? true : n3;
}
function N(n3, e, i) {
  if (an && Q) {
    let u3 = ce.get(n3);
    u3 || ce.set(n3, u3 = /* @__PURE__ */ new Map());
    let a = u3.get(i);
    a || u3.set(i, a = be());
    const o3 = process.env.NODE_ENV !== "production" ? { effect: Q, target: n3, type: e, key: i } : void 0;
    Du(a, o3);
  }
}
function Du(n3, e) {
  let i = false;
  Zn <= we ? Pi(n3) || (n3.n |= V, i = !Gi(n3)) : i = !n3.has(Q), i && (n3.add(Q), Q.deps.push(n3), process.env.NODE_ENV !== "production" && Q.onTrack && Q.onTrack(
    P(
      {
        effect: Q
      },
      e
    )
  ));
}
function q(n3, e, i, u3, a, o3) {
  const g3 = ce.get(n3);
  if (!g3)
    return;
  let s3 = [];
  if (e === "clear")
    s3 = [...g3.values()];
  else if (i === "length" && Y(n3)) {
    const l = Number(u3);
    g3.forEach((r, t) => {
      (t === "length" || t >= l) && s3.push(r);
    });
  } else
    switch (i !== void 0 && s3.push(g3.get(i)), e) {
      case "add":
        Y(n3) ? Me(i) && s3.push(g3.get("length")) : (s3.push(g3.get(en)), pn(n3) && s3.push(g3.get(pe)));
        break;
      case "delete":
        Y(n3) || (s3.push(g3.get(en)), pn(n3) && s3.push(g3.get(pe)));
        break;
      case "set":
        pn(n3) && s3.push(g3.get(en));
        break;
    }
  const h = process.env.NODE_ENV !== "production" ? { target: n3, type: e, key: i, newValue: u3, oldValue: a, oldTarget: o3 } : void 0;
  if (s3.length === 1)
    s3[0] && (process.env.NODE_ENV !== "production" ? Bn(s3[0], h) : Bn(s3[0]));
  else {
    const l = [];
    for (const r of s3)
      r && l.push(...r);
    process.env.NODE_ENV !== "production" ? Bn(be(l), h) : Bn(be(l));
  }
}
function Bn(n3, e) {
  const i = Y(n3) ? n3 : [...n3];
  for (const u3 of i)
    u3.computed && ii(u3, e);
  for (const u3 of i)
    u3.computed || ii(u3, e);
}
function ii(n3, e) {
  (n3 !== Q || n3.allowRecurse) && (process.env.NODE_ENV !== "production" && n3.onTrigger && n3.onTrigger(P({ effect: n3 }, e)), n3.scheduler ? n3.scheduler() : n3.run());
}
var Xu = /* @__PURE__ */ su("__proto__,__v_isRef,__isVue");
var Ki = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((n3) => n3 !== "arguments" && n3 !== "caller").map((n3) => Symbol[n3]).filter(Fe)
);
var Tu = /* @__PURE__ */ xe();
var Hu = /* @__PURE__ */ xe(true);
var Fu = /* @__PURE__ */ xe(true, true);
var ai = /* @__PURE__ */ Mu();
function Mu() {
  const n3 = {};
  return ["includes", "indexOf", "lastIndexOf"].forEach((e) => {
    n3[e] = function(...i) {
      const u3 = j(this);
      for (let o3 = 0, g3 = this.length; o3 < g3; o3++)
        N(u3, "get", o3 + "");
      const a = u3[e](...i);
      return a === -1 || a === false ? u3[e](...i.map(j)) : a;
    };
  }), ["push", "pop", "shift", "unshift", "splice"].forEach((e) => {
    n3[e] = function(...i) {
      Ai();
      const u3 = j(this)[e].apply(this, i);
      return Wi(), u3;
    };
  }), n3;
}
function Qu(n3) {
  const e = j(this);
  return N(e, "has", n3), e.hasOwnProperty(n3);
}
function xe(n3 = false, e = false) {
  return function(u3, a, o3) {
    if (a === "__v_isReactive")
      return !n3;
    if (a === "__v_isReadonly")
      return n3;
    if (a === "__v_isShallow")
      return e;
    if (a === "__v_raw" && o3 === (n3 ? e ? Ii : _i : e ? Uu : Oi).get(u3))
      return u3;
    const g3 = Y(u3);
    if (!n3) {
      if (g3 && L(ai, a))
        return Reflect.get(ai, a, o3);
      if (a === "hasOwnProperty")
        return Qu;
    }
    const s3 = Reflect.get(u3, a, o3);
    return (Fe(a) ? Ki.has(a) : Xu(a)) || (n3 || N(u3, "get", a), e) ? s3 : H(s3) ? g3 && Me(a) ? s3 : s3.value : x(s3) ? n3 ? Ui(s3) : zi(s3) : s3;
  };
}
var Bu = /* @__PURE__ */ xu();
function xu(n3 = false) {
  return function(i, u3, a, o3) {
    let g3 = i[u3];
    if (sn(g3) && H(g3) && !H(a))
      return false;
    if (!n3 && (!je(a) && !sn(a) && (g3 = j(g3), a = j(a)), !Y(i) && H(g3) && !H(a)))
      return g3.value = a, true;
    const s3 = Y(i) && Me(u3) ? Number(u3) < i.length : L(i, u3), h = Reflect.set(i, u3, a, o3);
    return i === j(o3) && (s3 ? vn(a, g3) && q(i, "set", u3, a, g3) : q(i, "add", u3, a)), h;
  };
}
function Nu(n3, e) {
  const i = L(n3, e), u3 = n3[e], a = Reflect.deleteProperty(n3, e);
  return a && i && q(n3, "delete", e, void 0, u3), a;
}
function Gu(n3, e) {
  const i = Reflect.has(n3, e);
  return (!Fe(e) || !Ki.has(e)) && N(n3, "has", e), i;
}
function Pu(n3) {
  return N(n3, "iterate", Y(n3) ? "length" : en), Reflect.ownKeys(n3);
}
var Eu = {
  get: Tu,
  set: Bu,
  deleteProperty: Nu,
  has: Gu,
  ownKeys: Pu
};
var Ri = {
  get: Hu,
  set(n3, e) {
    return process.env.NODE_ENV !== "production" && ni(
      `Set operation on key "${String(e)}" failed: target is readonly.`,
      n3
    ), true;
  },
  deleteProperty(n3, e) {
    return process.env.NODE_ENV !== "production" && ni(
      `Delete operation on key "${String(e)}" failed: target is readonly.`,
      n3
    ), true;
  }
};
var Au = /* @__PURE__ */ P(
  {},
  Ri,
  {
    get: Fu
  }
);
var Ne = (n3) => n3;
var ue = (n3) => Reflect.getPrototypeOf(n3);
function xn(n3, e, i = false, u3 = false) {
  n3 = n3.__v_raw;
  const a = j(n3), o3 = j(e);
  i || (e !== o3 && N(a, "get", e), N(a, "get", o3));
  const { has: g3 } = ue(a), s3 = u3 ? Ne : i ? Ae : Ee;
  if (g3.call(a, e))
    return s3(n3.get(e));
  if (g3.call(a, o3))
    return s3(n3.get(o3));
  n3 !== a && n3.get(e);
}
function Nn(n3, e = false) {
  const i = this.__v_raw, u3 = j(i), a = j(n3);
  return e || (n3 !== a && N(u3, "has", n3), N(u3, "has", a)), n3 === a ? i.has(n3) : i.has(n3) || i.has(a);
}
function Gn(n3, e = false) {
  return n3 = n3.__v_raw, !e && N(j(n3), "iterate", en), Reflect.get(n3, "size", n3);
}
function ui(n3) {
  n3 = j(n3);
  const e = j(this);
  return ue(e).has.call(e, n3) || (e.add(n3), q(e, "add", n3, n3)), this;
}
function oi(n3, e) {
  e = j(e);
  const i = j(this), { has: u3, get: a } = ue(i);
  let o3 = u3.call(i, n3);
  o3 ? process.env.NODE_ENV !== "production" && vi(i, u3, n3) : (n3 = j(n3), o3 = u3.call(i, n3));
  const g3 = a.call(i, n3);
  return i.set(n3, e), o3 ? vn(e, g3) && q(i, "set", n3, e, g3) : q(i, "add", n3, e), this;
}
function gi(n3) {
  const e = j(this), { has: i, get: u3 } = ue(e);
  let a = i.call(e, n3);
  a ? process.env.NODE_ENV !== "production" && vi(e, i, n3) : (n3 = j(n3), a = i.call(e, n3));
  const o3 = u3 ? u3.call(e, n3) : void 0, g3 = e.delete(n3);
  return a && q(e, "delete", n3, void 0, o3), g3;
}
function si() {
  const n3 = j(this), e = n3.size !== 0, i = process.env.NODE_ENV !== "production" ? pn(n3) ? new Map(n3) : new Set(n3) : void 0, u3 = n3.clear();
  return e && q(n3, "clear", void 0, void 0, i), u3;
}
function Pn(n3, e) {
  return function(u3, a) {
    const o3 = this, g3 = o3.__v_raw, s3 = j(g3), h = e ? Ne : n3 ? Ae : Ee;
    return !n3 && N(s3, "iterate", en), g3.forEach((l, r) => u3.call(a, h(l), h(r), o3));
  };
}
function En(n3, e, i) {
  return function(...u3) {
    const a = this.__v_raw, o3 = j(a), g3 = pn(o3), s3 = n3 === "entries" || n3 === Symbol.iterator && g3, h = n3 === "keys" && g3, l = a[n3](...u3), r = i ? Ne : e ? Ae : Ee;
    return !e && N(
      o3,
      "iterate",
      h ? pe : en
    ), {
      // iterator protocol
      next() {
        const { value: t, done: y } = l.next();
        return y ? { value: t, done: y } : {
          value: s3 ? [r(t[0]), r(t[1])] : r(t),
          done: y
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function O(n3) {
  return function(...e) {
    if (process.env.NODE_ENV !== "production") {
      const i = e[0] ? `on key "${e[0]}" ` : "";
      console.warn(
        `${pu(n3)} operation ${i}failed: target is readonly.`,
        j(this)
      );
    }
    return n3 === "delete" ? false : this;
  };
}
function Wu() {
  const n3 = {
    get(o3) {
      return xn(this, o3);
    },
    get size() {
      return Gn(this);
    },
    has: Nn,
    add: ui,
    set: oi,
    delete: gi,
    clear: si,
    forEach: Pn(false, false)
  }, e = {
    get(o3) {
      return xn(this, o3, false, true);
    },
    get size() {
      return Gn(this);
    },
    has: Nn,
    add: ui,
    set: oi,
    delete: gi,
    clear: si,
    forEach: Pn(false, true)
  }, i = {
    get(o3) {
      return xn(this, o3, true);
    },
    get size() {
      return Gn(this, true);
    },
    has(o3) {
      return Nn.call(this, o3, true);
    },
    add: O("add"),
    set: O("set"),
    delete: O("delete"),
    clear: O("clear"),
    forEach: Pn(true, false)
  }, u3 = {
    get(o3) {
      return xn(this, o3, true, true);
    },
    get size() {
      return Gn(this, true);
    },
    has(o3) {
      return Nn.call(this, o3, true);
    },
    add: O("add"),
    set: O("set"),
    delete: O("delete"),
    clear: O("clear"),
    forEach: Pn(true, true)
  };
  return ["keys", "values", "entries", Symbol.iterator].forEach((o3) => {
    n3[o3] = En(
      o3,
      false,
      false
    ), i[o3] = En(
      o3,
      true,
      false
    ), e[o3] = En(
      o3,
      false,
      true
    ), u3[o3] = En(
      o3,
      true,
      true
    );
  }), [
    n3,
    i,
    e,
    u3
  ];
}
var [
  Ku,
  Ru,
  vu,
  Ou
] = /* @__PURE__ */ Wu();
function Ge(n3, e) {
  const i = e ? n3 ? Ou : vu : n3 ? Ru : Ku;
  return (u3, a, o3) => a === "__v_isReactive" ? !n3 : a === "__v_isReadonly" ? n3 : a === "__v_raw" ? u3 : Reflect.get(
    L(i, a) && a in u3 ? i : u3,
    a,
    o3
  );
}
var _u = {
  get: /* @__PURE__ */ Ge(false, false)
};
var Iu = {
  get: /* @__PURE__ */ Ge(true, false)
};
var zu = {
  get: /* @__PURE__ */ Ge(true, true)
};
function vi(n3, e, i) {
  const u3 = j(i);
  if (u3 !== i && e.call(n3, u3)) {
    const a = xi(n3);
    console.warn(
      `Reactive ${a} contains both the raw and reactive versions of the same object${a === "Map" ? " as keys" : ""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
    );
  }
}
var Oi = /* @__PURE__ */ new WeakMap();
var Uu = /* @__PURE__ */ new WeakMap();
var _i = /* @__PURE__ */ new WeakMap();
var Ii = /* @__PURE__ */ new WeakMap();
function $u(n3) {
  switch (n3) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function Vu(n3) {
  return n3.__v_skip || !Object.isExtensible(n3) ? 0 : $u(xi(n3));
}
function zi(n3) {
  return sn(n3) ? n3 : Pe(
    n3,
    false,
    Eu,
    _u,
    Oi
  );
}
function Ui(n3) {
  return Pe(
    n3,
    true,
    Ri,
    Iu,
    _i
  );
}
function An(n3) {
  return Pe(
    n3,
    true,
    Au,
    zu,
    Ii
  );
}
function Pe(n3, e, i, u3, a) {
  if (!x(n3))
    return process.env.NODE_ENV !== "production" && console.warn(`value cannot be made reactive: ${String(n3)}`), n3;
  if (n3.__v_raw && !(e && n3.__v_isReactive))
    return n3;
  const o3 = a.get(n3);
  if (o3)
    return o3;
  const g3 = Vu(n3);
  if (g3 === 0)
    return n3;
  const s3 = new Proxy(
    n3,
    g3 === 2 ? u3 : i
  );
  return a.set(n3, s3), s3;
}
function U(n3) {
  return sn(n3) ? U(n3.__v_raw) : !!(n3 && n3.__v_isReactive);
}
function sn(n3) {
  return !!(n3 && n3.__v_isReadonly);
}
function je(n3) {
  return !!(n3 && n3.__v_isShallow);
}
function me(n3) {
  return U(n3) || sn(n3);
}
function j(n3) {
  const e = n3 && n3.__v_raw;
  return e ? j(e) : n3;
}
function qu(n3) {
  return ju(n3, "__v_skip", true), n3;
}
var Ee = (n3) => x(n3) ? zi(n3) : n3;
var Ae = (n3) => x(n3) ? Ui(n3) : n3;
function H(n3) {
  return !!(n3 && n3.__v_isRef === true);
}
function no(n3) {
  return H(n3) ? n3.value : n3;
}
var eo = {
  get: (n3, e, i) => no(Reflect.get(n3, e, i)),
  set: (n3, e, i, u3) => {
    const a = n3[e];
    return H(a) && !H(i) ? (a.value = i, true) : Reflect.set(n3, e, i, u3);
  }
};
function io(n3) {
  return U(n3) ? n3 : new Proxy(n3, eo);
}
var un = [];
function ao(n3) {
  un.push(n3);
}
function uo() {
  un.pop();
}
function X(n3, ...e) {
  if (process.env.NODE_ENV === "production")
    return;
  Ai();
  const i = un.length ? un[un.length - 1].component : null, u3 = i && i.appContext.config.warnHandler, a = oo();
  if (u3)
    on(
      u3,
      i,
      11,
      [
        n3 + e.join(""),
        i && i.proxy,
        a.map(
          ({ vnode: o3 }) => `at <${ra(i, o3.type)}>`
        ).join(`
`),
        a
      ]
    );
  else {
    const o3 = [`[Vue warn]: ${n3}`, ...e];
    a.length && o3.push(`
`, ...go(a)), console.warn(...o3);
  }
  Wi();
}
function oo() {
  let n3 = un[un.length - 1];
  if (!n3)
    return [];
  const e = [];
  for (; n3; ) {
    const i = e[0];
    i && i.vnode === n3 ? i.recurseCount++ : e.push({
      vnode: n3,
      recurseCount: 0
    });
    const u3 = n3.component && n3.component.parent;
    n3 = u3 && u3.vnode;
  }
  return e;
}
function go(n3) {
  const e = [];
  return n3.forEach((i, u3) => {
    e.push(...u3 === 0 ? [] : [`
`], ...so(i));
  }), e;
}
function so({ vnode: n3, recurseCount: e }) {
  const i = e > 0 ? `... (${e} recursive calls)` : "", u3 = n3.component ? n3.component.parent == null : false, a = ` at <${ra(
    n3.component,
    n3.type,
    u3
  )}`, o3 = ">" + i;
  return n3.props ? [a, ...ho(n3.props), o3] : [a + o3];
}
function ho(n3) {
  const e = [], i = Object.keys(n3);
  return i.slice(0, 3).forEach((u3) => {
    e.push(...$i(u3, n3[u3]));
  }), i.length > 3 && e.push(" ..."), e;
}
function $i(n3, e, i) {
  return A(e) ? (e = JSON.stringify(e), i ? e : [`${n3}=${e}`]) : typeof e == "number" || typeof e == "boolean" || e == null ? i ? e : [`${n3}=${e}`] : H(e) ? (e = $i(n3, j(e.value), true), i ? e : [`${n3}=Ref<`, e, ">"]) : F(e) ? [`${n3}=fn${e.name ? `<${e.name}>` : ""}`] : (e = j(e), i ? e : [`${n3}=`, e]);
}
var Vi = {
  sp: "serverPrefetch hook",
  bc: "beforeCreate hook",
  c: "created hook",
  bm: "beforeMount hook",
  m: "mounted hook",
  bu: "beforeUpdate hook",
  u: "updated",
  bum: "beforeUnmount hook",
  um: "unmounted hook",
  a: "activated hook",
  da: "deactivated hook",
  ec: "errorCaptured hook",
  rtc: "renderTracked hook",
  rtg: "renderTriggered hook",
  [0]: "setup function",
  [1]: "render function",
  [2]: "watcher getter",
  [3]: "watcher callback",
  [4]: "watcher cleanup function",
  [5]: "native event handler",
  [6]: "component event handler",
  [7]: "vnode hook",
  [8]: "directive hook",
  [9]: "transition hook",
  [10]: "app errorHandler",
  [11]: "app warnHandler",
  [12]: "ref function",
  [13]: "async component loader",
  [14]: "scheduler flush. This is likely a Vue internals bug. Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/core"
};
function on(n3, e, i, u3) {
  let a;
  try {
    a = u3 ? n3(...u3) : n3();
  } catch (o3) {
    qi(o3, e, i);
  }
  return a;
}
function Ye(n3, e, i, u3) {
  if (F(n3)) {
    const o3 = on(n3, e, i, u3);
    return o3 && du(o3) && o3.catch((g3) => {
      qi(g3, e, i);
    }), o3;
  }
  const a = [];
  for (let o3 = 0; o3 < n3.length; o3++)
    a.push(Ye(n3[o3], e, i, u3));
  return a;
}
function qi(n3, e, i, u3 = true) {
  const a = e ? e.vnode : null;
  if (e) {
    let o3 = e.parent;
    const g3 = e.proxy, s3 = process.env.NODE_ENV !== "production" ? Vi[i] : i;
    for (; o3; ) {
      const l = o3.ec;
      if (l) {
        for (let r = 0; r < l.length; r++)
          if (l[r](n3, g3, s3) === false)
            return;
      }
      o3 = o3.parent;
    }
    const h = e.appContext.config.errorHandler;
    if (h) {
      on(
        h,
        null,
        10,
        [n3, g3, s3]
      );
      return;
    }
  }
  lo(n3, i, a, u3);
}
function lo(n3, e, i, u3 = true) {
  if (process.env.NODE_ENV !== "production") {
    const a = Vi[e];
    if (i && ao(i), X(`Unhandled error${a ? ` during execution of ${a}` : ""}`), i && uo(), u3)
      throw n3;
    console.error(n3);
  } else
    console.error(n3);
}
var On = false;
var fe = false;
var E = [];
var I = 0;
var jn = [];
var W = null;
var _ = 0;
var na = /* @__PURE__ */ Promise.resolve();
var We = null;
var to = 100;
function ro(n3) {
  const e = We || na;
  return n3 ? e.then(this ? n3.bind(this) : n3) : e;
}
function yo(n3) {
  let e = I + 1, i = E.length;
  for (; e < i; ) {
    const u3 = e + i >>> 1;
    Dn(E[u3]) < n3 ? e = u3 + 1 : i = u3;
  }
  return e;
}
function Ke(n3) {
  (!E.length || !E.includes(
    n3,
    On && n3.allowRecurse ? I + 1 : I
  )) && (n3.id == null ? E.push(n3) : E.splice(yo(n3.id), 0, n3), ea());
}
function ea() {
  !On && !fe && (fe = true, We = na.then(aa));
}
function ia(n3) {
  Y(n3) ? jn.push(...n3) : (!W || !W.includes(
    n3,
    n3.allowRecurse ? _ + 1 : _
  )) && jn.push(n3), ea();
}
function bo(n3) {
  if (jn.length) {
    const e = [...new Set(jn)];
    if (jn.length = 0, W) {
      W.push(...e);
      return;
    }
    for (W = e, process.env.NODE_ENV !== "production" && (n3 = n3 || /* @__PURE__ */ new Map()), W.sort((i, u3) => Dn(i) - Dn(u3)), _ = 0; _ < W.length; _++)
      process.env.NODE_ENV !== "production" && ua(n3, W[_]) || W[_]();
    W = null, _ = 0;
  }
}
var Dn = (n3) => n3.id == null ? 1 / 0 : n3.id;
var co = (n3, e) => {
  const i = Dn(n3) - Dn(e);
  if (i === 0) {
    if (n3.pre && !e.pre)
      return -1;
    if (e.pre && !n3.pre)
      return 1;
  }
  return i;
};
function aa(n3) {
  fe = false, On = true, process.env.NODE_ENV !== "production" && (n3 = n3 || /* @__PURE__ */ new Map()), E.sort(co);
  const e = process.env.NODE_ENV !== "production" ? (i) => ua(n3, i) : He;
  try {
    for (I = 0; I < E.length; I++) {
      const i = E[I];
      if (i && i.active !== false) {
        if (process.env.NODE_ENV !== "production" && e(i))
          continue;
        on(i, null, 14);
      }
    }
  } finally {
    I = 0, E.length = 0, bo(n3), On = false, We = null, (E.length || jn.length) && aa(n3);
  }
}
function ua(n3, e) {
  if (!n3.has(e))
    n3.set(e, 1);
  else {
    const i = n3.get(e);
    if (i > to) {
      const u3 = e.ownerInstance, a = u3 && ta(u3.type);
      return X(
        `Maximum recursive updates exceeded${a ? ` in component <${a}>` : ""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`
      ), true;
    } else
      n3.set(e, i + 1);
  }
}
var fn = /* @__PURE__ */ new Set();
process.env.NODE_ENV !== "production" && (de().__VUE_HMR_RUNTIME__ = {
  createRecord: ge(wo),
  rerender: ge(po),
  reload: ge(jo)
});
var _n = /* @__PURE__ */ new Map();
function wo(n3, e) {
  return _n.has(n3) ? false : (_n.set(n3, {
    initialDef: Jn(e),
    instances: /* @__PURE__ */ new Set()
  }), true);
}
function Jn(n3) {
  return ya(n3) ? n3.__vccOpts : n3;
}
function po(n3, e) {
  const i = _n.get(n3);
  i && (i.initialDef.render = e, [...i.instances].forEach((u3) => {
    e && (u3.render = e, Jn(u3.type).render = e), u3.renderCache = [], u3.update();
  }));
}
function jo(n3, e) {
  const i = _n.get(n3);
  if (!i)
    return;
  e = Jn(e), hi(i.initialDef, e);
  const u3 = [...i.instances];
  for (const a of u3) {
    const o3 = Jn(a.type);
    fn.has(o3) || (o3 !== i.initialDef && hi(o3, e), fn.add(o3)), a.appContext.propsCache.delete(a.type), a.appContext.emitsCache.delete(a.type), a.appContext.optionsCache.delete(a.type), a.ceReload ? (fn.add(o3), a.ceReload(e.styles), fn.delete(o3)) : a.parent ? Ke(a.parent.update) : a.appContext.reload ? a.appContext.reload() : typeof window < "u" ? window.location.reload() : console.warn(
      "[HMR] Root or manually mounted instance modified. Full reload required."
    );
  }
  ia(() => {
    for (const a of u3)
      fn.delete(
        Jn(a.type)
      );
  });
}
function hi(n3, e) {
  P(n3, e);
  for (const i in n3)
    i !== "__file" && !(i in e) && delete n3[i];
}
function ge(n3) {
  return (e, i) => {
    try {
      return n3(e, i);
    } catch (u3) {
      console.error(u3), console.warn(
        "[HMR] Something went wrong during Vue component hot-reload. Full reload required."
      );
    }
  };
}
var z = null;
var mo = null;
var Yo = (n3) => n3.__isSuspense;
function fo(n3, e) {
  e && e.pendingBranch ? Y(n3) ? e.effects.push(...n3) : e.effects.push(n3) : ia(n3);
}
var Wn = {};
function Lo(n3, e, { immediate: i, deep: u3, flush: a, onTrack: o3, onTrigger: g3 } = K) {
  var s3;
  process.env.NODE_ENV !== "production" && !e && (i !== void 0 && X(
    'watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.'
  ), u3 !== void 0 && X(
    'watch() "deep" option is only respected when using the watch(source, callback, options?) signature.'
  ));
  const h = (f) => {
    X(
      "Invalid watch source: ",
      f,
      "A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types."
    );
  }, l = Su() === ((s3 = mn) == null ? void 0 : s3.scope) ? mn : null;
  let r, t = false, y = false;
  if (H(n3) ? (r = () => n3.value, t = je(n3)) : U(n3) ? (r = () => n3, u3 = true) : Y(n3) ? (y = true, t = n3.some((f) => U(f) || je(f)), r = () => n3.map((f) => {
    if (H(f))
      return f.value;
    if (U(f))
      return rn(f);
    if (F(f))
      return on(f, l, 2);
    process.env.NODE_ENV !== "production" && h(f);
  })) : F(n3) ? e ? r = () => on(n3, l, 2) : r = () => {
    if (!(l && l.isUnmounted))
      return d3 && d3(), Ye(
        n3,
        l,
        3,
        [c3]
      );
  } : (r = He, process.env.NODE_ENV !== "production" && h(n3)), e && u3) {
    const f = r;
    r = () => rn(f());
  }
  let d3, c3 = (f) => {
    d3 = p.onStop = () => {
      on(f, l, 4);
    };
  }, w2 = y ? new Array(n3.length).fill(Wn) : Wn;
  const m = () => {
    if (p.active)
      if (e) {
        const f = p.run();
        (u3 || t || (y ? f.some(
          (au, uu) => vn(au, w2[uu])
        ) : vn(f, w2))) && (d3 && d3(), Ye(e, l, 3, [
          f,
          // pass undefined as the old value when it's changed for the first time
          w2 === Wn ? void 0 : y && w2[0] === Wn ? [] : w2,
          c3
        ]), w2 = f);
      } else
        p.run();
  };
  m.allowRecurse = !!e;
  let J;
  a === "sync" ? J = m : a === "post" ? J = () => di(m, l && l.suspense) : (m.pre = true, l && (m.id = l.uid), J = () => Ke(m));
  const p = new ku(r, J);
  return process.env.NODE_ENV !== "production" && (p.onTrack = o3, p.onTrigger = g3), e ? i ? m() : w2 = p.run() : a === "post" ? di(
    p.run.bind(p),
    l && l.suspense
  ) : p.run(), () => {
    p.stop(), l && l.scope && tu(l.scope.effects, p);
  };
}
function Zo(n3, e, i) {
  const u3 = this.proxy, a = A(n3) ? n3.includes(".") ? So(u3, n3) : () => u3[n3] : n3.bind(u3, u3);
  let o3;
  F(e) ? o3 = e : (o3 = e.handler, i = e);
  const g3 = mn;
  ci(this);
  const s3 = Lo(a, o3.bind(u3), i);
  return g3 ? ci(g3) : Ko(), s3;
}
function So(n3, e) {
  const i = e.split(".");
  return () => {
    let u3 = n3;
    for (let a = 0; a < i.length && u3; a++)
      u3 = u3[i[a]];
    return u3;
  };
}
function rn(n3, e) {
  if (!x(n3) || n3.__v_skip || (e = e || /* @__PURE__ */ new Set(), e.has(n3)))
    return n3;
  if (e.add(n3), H(n3))
    rn(n3.value, e);
  else if (Y(n3))
    for (let i = 0; i < n3.length; i++)
      rn(n3[i], e);
  else if (yu(n3) || pn(n3))
    n3.forEach((i) => {
      rn(i, e);
    });
  else if (cu(n3))
    for (const i in n3)
      rn(n3[i], e);
  return n3;
}
var Co = Symbol.for("v-ndc");
var Le = (n3) => n3 ? Ro(n3) ? vo(n3) || n3.proxy : Le(n3.parent) : null;
var kn = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ P(/* @__PURE__ */ Object.create(null), {
    $: (n3) => n3,
    $el: (n3) => n3.vnode.el,
    $data: (n3) => n3.data,
    $props: (n3) => process.env.NODE_ENV !== "production" ? An(n3.props) : n3.props,
    $attrs: (n3) => process.env.NODE_ENV !== "production" ? An(n3.attrs) : n3.attrs,
    $slots: (n3) => process.env.NODE_ENV !== "production" ? An(n3.slots) : n3.slots,
    $refs: (n3) => process.env.NODE_ENV !== "production" ? An(n3.refs) : n3.refs,
    $parent: (n3) => Le(n3.parent),
    $root: (n3) => Le(n3.root),
    $emit: (n3) => n3.emit,
    $options: (n3) => __VUE_OPTIONS_API__ ? Xo(n3) : n3.type,
    $forceUpdate: (n3) => n3.f || (n3.f = () => Ke(n3.update)),
    $nextTick: (n3) => n3.n || (n3.n = ro.bind(n3.proxy)),
    $watch: (n3) => __VUE_OPTIONS_API__ ? Zo.bind(n3) : He
  })
);
var Jo = (n3) => n3 === "_" || n3 === "$";
var se = (n3, e) => n3 !== K && !n3.__isScriptSetup && L(n3, e);
var ko = {
  get({ _: n3 }, e) {
    const { ctx: i, setupState: u3, data: a, props: o3, accessCache: g3, type: s3, appContext: h } = n3;
    if (process.env.NODE_ENV !== "production" && e === "__isVue")
      return true;
    let l;
    if (e[0] !== "$") {
      const d3 = g3[e];
      if (d3 !== void 0)
        switch (d3) {
          case 1:
            return u3[e];
          case 2:
            return a[e];
          case 4:
            return i[e];
          case 3:
            return o3[e];
        }
      else {
        if (se(u3, e))
          return g3[e] = 1, u3[e];
        if (a !== K && L(a, e))
          return g3[e] = 2, a[e];
        if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (l = n3.propsOptions[0]) && L(l, e)
        )
          return g3[e] = 3, o3[e];
        if (i !== K && L(i, e))
          return g3[e] = 4, i[e];
        (!__VUE_OPTIONS_API__ || Do) && (g3[e] = 0);
      }
    }
    const r = kn[e];
    let t, y;
    if (r)
      return e === "$attrs" ? (N(n3, "get", e), process.env.NODE_ENV !== "production" && void 0) : process.env.NODE_ENV !== "production" && e === "$slots" && N(n3, "get", e), r(n3);
    if (
      // css module (injected by vue-loader)
      (t = s3.__cssModules) && (t = t[e])
    )
      return t;
    if (i !== K && L(i, e))
      return g3[e] = 4, i[e];
    if (
      // global properties
      y = h.config.globalProperties, L(y, e)
    )
      return y[e];
    process.env.NODE_ENV !== "production" && z && (!A(e) || // #1091 avoid internal isRef/isVNode checks on component instance leading
    // to infinite warning loop
    e.indexOf("__v") !== 0) && (a !== K && Jo(e[0]) && L(a, e) ? X(
      `Property ${JSON.stringify(
        e
      )} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`
    ) : n3 === z && X(
      `Property ${JSON.stringify(e)} was accessed during render but is not defined on instance.`
    ));
  },
  set({ _: n3 }, e, i) {
    const { data: u3, setupState: a, ctx: o3 } = n3;
    return se(a, e) ? (a[e] = i, true) : process.env.NODE_ENV !== "production" && a.__isScriptSetup && L(a, e) ? (X(`Cannot mutate <script setup> binding "${e}" from Options API.`), false) : u3 !== K && L(u3, e) ? (u3[e] = i, true) : L(n3.props, e) ? (process.env.NODE_ENV !== "production" && X(`Attempting to mutate prop "${e}". Props are readonly.`), false) : e[0] === "$" && e.slice(1) in n3 ? (process.env.NODE_ENV !== "production" && X(
      `Attempting to mutate public property "${e}". Properties starting with $ are reserved and readonly.`
    ), false) : (process.env.NODE_ENV !== "production" && e in n3.appContext.config.globalProperties ? Object.defineProperty(o3, e, {
      enumerable: true,
      configurable: true,
      value: i
    }) : o3[e] = i, true);
  },
  has({
    _: { data: n3, setupState: e, accessCache: i, ctx: u3, appContext: a, propsOptions: o3 }
  }, g3) {
    let s3;
    return !!i[g3] || n3 !== K && L(n3, g3) || se(e, g3) || (s3 = o3[0]) && L(s3, g3) || L(u3, g3) || L(kn, g3) || L(a.config.globalProperties, g3);
  },
  defineProperty(n3, e, i) {
    return i.get != null ? n3._.accessCache[e] = 0 : L(i, "value") && this.set(n3, e, i.value, null), Reflect.defineProperty(n3, e, i);
  }
};
process.env.NODE_ENV !== "production" && (ko.ownKeys = (n3) => (X(
  "Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead."
), Reflect.ownKeys(n3)));
function li(n3) {
  return Y(n3) ? n3.reduce(
    (e, i) => (e[i] = null, e),
    {}
  ) : n3;
}
var Do = true;
function Xo(n3) {
  const e = n3.type, { mixins: i, extends: u3 } = e, {
    mixins: a,
    optionsCache: o3,
    config: { optionMergeStrategies: g3 }
  } = n3.appContext, s3 = o3.get(e);
  let h;
  return s3 ? h = s3 : !a.length && !i && !u3 ? h = e : (h = {}, a.length && a.forEach(
    (l) => In(h, l, g3, true)
  ), In(h, e, g3)), x(e) && o3.set(e, h), h;
}
function In(n3, e, i, u3 = false) {
  const { mixins: a, extends: o3 } = e;
  o3 && In(n3, o3, i, true), a && a.forEach(
    (g3) => In(n3, g3, i, true)
  );
  for (const g3 in e)
    if (u3 && g3 === "expose")
      process.env.NODE_ENV !== "production" && X(
        '"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.'
      );
    else {
      const s3 = To[g3] || i && i[g3];
      n3[g3] = s3 ? s3(n3[g3], e[g3]) : e[g3];
    }
  return n3;
}
var To = {
  data: ti,
  props: yi,
  emits: yi,
  // objects
  methods: Sn,
  computed: Sn,
  // lifecycle
  beforeCreate: D2,
  created: D2,
  beforeMount: D2,
  mounted: D2,
  beforeUpdate: D2,
  updated: D2,
  beforeDestroy: D2,
  beforeUnmount: D2,
  destroyed: D2,
  unmounted: D2,
  activated: D2,
  deactivated: D2,
  errorCaptured: D2,
  serverPrefetch: D2,
  // assets
  components: Sn,
  directives: Sn,
  // watch
  watch: Fo,
  // provide / inject
  provide: ti,
  inject: Ho
};
function ti(n3, e) {
  return e ? n3 ? function() {
    return P(
      F(n3) ? n3.call(this, this) : n3,
      F(e) ? e.call(this, this) : e
    );
  } : e : n3;
}
function Ho(n3, e) {
  return Sn(ri(n3), ri(e));
}
function ri(n3) {
  if (Y(n3)) {
    const e = {};
    for (let i = 0; i < n3.length; i++)
      e[n3[i]] = n3[i];
    return e;
  }
  return n3;
}
function D2(n3, e) {
  return n3 ? [...new Set([].concat(n3, e))] : e;
}
function Sn(n3, e) {
  return n3 ? P(/* @__PURE__ */ Object.create(null), n3, e) : e;
}
function yi(n3, e) {
  return n3 ? Y(n3) && Y(e) ? [.../* @__PURE__ */ new Set([...n3, ...e])] : P(
    /* @__PURE__ */ Object.create(null),
    li(n3),
    li(e ?? {})
  ) : e;
}
function Fo(n3, e) {
  if (!n3)
    return e;
  if (!e)
    return n3;
  const i = P(/* @__PURE__ */ Object.create(null), n3);
  for (const u3 in e)
    i[u3] = D2(n3[u3], e[u3]);
  return i;
}
var di = fo;
var Mo = (n3) => n3.__isTeleport;
var oa = Symbol.for("v-fgt");
var Qo = Symbol.for("v-txt");
var Bo = Symbol.for("v-cmt");
var yn = null;
function xo(n3) {
  return n3 ? n3.__v_isVNode === true : false;
}
var No = (...n3) => ha(
  ...n3
);
var ga = "__vInternal";
var sa = ({ key: n3 }) => n3 ?? null;
var Kn = ({
  ref: n3,
  ref_key: e,
  ref_for: i
}) => (typeof n3 == "number" && (n3 = "" + n3), n3 != null ? A(n3) || H(n3) || F(n3) ? { i: z, r: n3, k: e, f: !!i } : n3 : null);
function Go(n3, e = null, i = null, u3 = 0, a = null, o3 = n3 === oa ? 0 : 1, g3 = false, s3 = false) {
  const h = {
    __v_isVNode: true,
    __v_skip: true,
    type: n3,
    props: e,
    key: e && sa(e),
    ref: e && Kn(e),
    scopeId: mo,
    slotScopeIds: null,
    children: i,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: o3,
    patchFlag: u3,
    dynamicProps: a,
    dynamicChildren: null,
    appContext: null,
    ctx: z
  };
  return s3 ? (Re(h, i), o3 & 128 && n3.normalize(h)) : i && (h.shapeFlag |= A(i) ? 8 : 16), process.env.NODE_ENV !== "production" && h.key !== h.key && X("VNode created with invalid key (NaN). VNode type:", h.type), // avoid a block node from tracking itself
  !g3 && // has current parent block
  yn && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (h.patchFlag > 0 || o3 & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  h.patchFlag !== 32 && yn.push(h), h;
}
var Po = process.env.NODE_ENV !== "production" ? No : ha;
function ha(n3, e = null, i = null, u3 = 0, a = null, o3 = false) {
  if ((!n3 || n3 === Co) && (process.env.NODE_ENV !== "production" && !n3 && X(`Invalid vnode type when creating vnode: ${n3}.`), n3 = Bo), xo(n3)) {
    const s3 = zn(
      n3,
      e,
      true
      /* mergeRef: true */
    );
    return i && Re(s3, i), !o3 && yn && (s3.shapeFlag & 6 ? yn[yn.indexOf(n3)] = s3 : yn.push(s3)), s3.patchFlag |= -2, s3;
  }
  if (ya(n3) && (n3 = n3.__vccOpts), e) {
    e = Eo(e);
    let { class: s3, style: h } = e;
    s3 && !A(s3) && (e.class = Be(s3)), x(h) && (me(h) && !Y(h) && (h = P({}, h)), e.style = Qe(h));
  }
  const g3 = A(n3) ? 1 : Yo(n3) ? 128 : Mo(n3) ? 64 : x(n3) ? 4 : F(n3) ? 2 : 0;
  return process.env.NODE_ENV !== "production" && g3 & 4 && me(n3) && (n3 = j(n3), X(
    "Vue received a Component which was made a reactive object. This can lead to unnecessary performance overhead, and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",
    `
Component that was made reactive: `,
    n3
  )), Go(
    n3,
    e,
    i,
    u3,
    a,
    g3,
    o3,
    true
  );
}
function Eo(n3) {
  return n3 ? me(n3) || ga in n3 ? P({}, n3) : n3 : null;
}
function zn(n3, e, i = false) {
  const { props: u3, ref: a, patchFlag: o3, children: g3 } = n3, s3 = e ? Wo(u3 || {}, e) : u3;
  return {
    __v_isVNode: true,
    __v_skip: true,
    type: n3.type,
    props: s3,
    key: s3 && sa(s3),
    ref: e && e.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      i && a ? Y(a) ? a.concat(Kn(e)) : [a, Kn(e)] : Kn(e)
    ) : a,
    scopeId: n3.scopeId,
    slotScopeIds: n3.slotScopeIds,
    children: process.env.NODE_ENV !== "production" && o3 === -1 && Y(g3) ? g3.map(la) : g3,
    target: n3.target,
    targetAnchor: n3.targetAnchor,
    staticCount: n3.staticCount,
    shapeFlag: n3.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: e && n3.type !== oa ? o3 === -1 ? 16 : o3 | 16 : o3,
    dynamicProps: n3.dynamicProps,
    dynamicChildren: n3.dynamicChildren,
    appContext: n3.appContext,
    dirs: n3.dirs,
    transition: n3.transition,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: n3.component,
    suspense: n3.suspense,
    ssContent: n3.ssContent && zn(n3.ssContent),
    ssFallback: n3.ssFallback && zn(n3.ssFallback),
    el: n3.el,
    anchor: n3.anchor,
    ctx: n3.ctx,
    ce: n3.ce
  };
}
function la(n3) {
  const e = zn(n3);
  return Y(n3.children) && (e.children = n3.children.map(la)), e;
}
function Ao(n3 = " ", e = 0) {
  return Po(Qo, null, n3, e);
}
function Re(n3, e) {
  let i = 0;
  const { shapeFlag: u3 } = n3;
  if (e == null)
    e = null;
  else if (Y(e))
    i = 16;
  else if (typeof e == "object")
    if (u3 & 65) {
      const a = e.default;
      a && (a._c && (a._d = false), Re(n3, a()), a._c && (a._d = true));
      return;
    } else {
      i = 32;
      const a = e._;
      !a && !(ga in e) ? e._ctx = z : a === 3 && z && (z.slots._ === 1 ? e._ = 1 : (e._ = 2, n3.patchFlag |= 1024));
    }
  else
    F(e) ? (e = { default: e, _ctx: z }, i = 32) : (e = String(e), u3 & 64 ? (i = 16, e = [Ao(e)]) : i = 8);
  n3.children = e, n3.shapeFlag |= i;
}
function Wo(...n3) {
  const e = {};
  for (let i = 0; i < n3.length; i++) {
    const u3 = n3[i];
    for (const a in u3)
      if (a === "class")
        e.class !== u3.class && (e.class = Be([e.class, u3.class]));
      else if (a === "style")
        e.style = Qe([e.style, u3.style]);
      else if (lu(a)) {
        const o3 = e[a], g3 = u3[a];
        g3 && o3 !== g3 && !(Y(o3) && o3.includes(g3)) && (e[a] = o3 ? [].concat(o3, g3) : g3);
      } else
        a !== "" && (e[a] = u3[a]);
  }
  return e;
}
var mn = null;
var ve;
var hn;
var bi = "__VUE_INSTANCE_SETTERS__";
(hn = de()[bi]) || (hn = de()[bi] = []), hn.push((n3) => mn = n3), ve = (n3) => {
  hn.length > 1 ? hn.forEach((e) => e(n3)) : hn[0](n3);
};
var ci = (n3) => {
  ve(n3), n3.scope.on();
};
var Ko = () => {
  mn && mn.scope.off(), ve(null);
};
function Ro(n3) {
  return n3.vnode.shapeFlag & 4;
}
function vo(n3) {
  if (n3.exposed)
    return n3.exposeProxy || (n3.exposeProxy = new Proxy(io(qu(n3.exposed)), {
      get(e, i) {
        if (i in e)
          return e[i];
        if (i in kn)
          return kn[i](n3);
      },
      has(e, i) {
        return i in e || i in kn;
      }
    }));
}
var Oo = /(?:^|[-_])(\w)/g;
var _o = (n3) => n3.replace(Oo, (e) => e.toUpperCase()).replace(/[-_]/g, "");
function ta(n3, e = true) {
  return F(n3) ? n3.displayName || n3.name : n3.name || e && n3.__name;
}
function ra(n3, e, i = false) {
  let u3 = ta(e);
  if (!u3 && e.__file) {
    const a = e.__file.match(/([^/\\]+)\.\w+$/);
    a && (u3 = a[1]);
  }
  if (!u3 && n3 && n3.parent) {
    const a = (o3) => {
      for (const g3 in o3)
        if (o3[g3] === e)
          return g3;
    };
    u3 = a(
      n3.components || n3.parent.type.components
    ) || a(n3.appContext.components);
  }
  return u3 ? _o(u3) : i ? "App" : "Anonymous";
}
function ya(n3) {
  return F(n3) && "__vccOpts" in n3;
}
function he(n3) {
  return !!(n3 && n3.__v_isShallow);
}
function Io() {
  if (process.env.NODE_ENV === "production" || typeof window > "u")
    return;
  const n3 = { style: "color:#3ba776" }, e = { style: "color:#0b1bc9" }, i = { style: "color:#b62e24" }, u3 = { style: "color:#9d288c" }, a = {
    header(t) {
      return x(t) ? t.__isVue ? ["div", n3, "VueInstance"] : H(t) ? [
        "div",
        {},
        ["span", n3, r(t)],
        "<",
        s3(t.value),
        ">"
      ] : U(t) ? [
        "div",
        {},
        ["span", n3, he(t) ? "ShallowReactive" : "Reactive"],
        "<",
        s3(t),
        `>${sn(t) ? " (readonly)" : ""}`
      ] : sn(t) ? [
        "div",
        {},
        ["span", n3, he(t) ? "ShallowReadonly" : "Readonly"],
        "<",
        s3(t),
        ">"
      ] : null : null;
    },
    hasBody(t) {
      return t && t.__isVue;
    },
    body(t) {
      if (t && t.__isVue)
        return [
          "div",
          {},
          ...o3(t.$)
        ];
    }
  };
  function o3(t) {
    const y = [];
    t.type.props && t.props && y.push(g3("props", j(t.props))), t.setupState !== K && y.push(g3("setup", t.setupState)), t.data !== K && y.push(g3("data", j(t.data)));
    const d3 = h(t, "computed");
    d3 && y.push(g3("computed", d3));
    const c3 = h(t, "inject");
    return c3 && y.push(g3("injected", c3)), y.push([
      "div",
      {},
      [
        "span",
        {
          style: u3.style + ";opacity:0.66"
        },
        "$ (internal): "
      ],
      ["object", { object: t }]
    ]), y;
  }
  function g3(t, y) {
    return y = P({}, y), Object.keys(y).length ? [
      "div",
      { style: "line-height:1.25em;margin-bottom:0.6em" },
      [
        "div",
        {
          style: "color:#476582"
        },
        t
      ],
      [
        "div",
        {
          style: "padding-left:1.25em"
        },
        ...Object.keys(y).map((d3) => [
          "div",
          {},
          ["span", u3, d3 + ": "],
          s3(y[d3], false)
        ])
      ]
    ] : ["span", {}];
  }
  function s3(t, y = true) {
    return typeof t == "number" ? ["span", e, t] : typeof t == "string" ? ["span", i, JSON.stringify(t)] : typeof t == "boolean" ? ["span", u3, t] : x(t) ? ["object", { object: y ? j(t) : t }] : ["span", i, String(t)];
  }
  function h(t, y) {
    const d3 = t.type;
    if (F(d3))
      return;
    const c3 = {};
    for (const w2 in t.ctx)
      l(d3, w2, y) && (c3[w2] = t.ctx[w2]);
    return c3;
  }
  function l(t, y, d3) {
    const c3 = t[d3];
    if (Y(c3) && c3.includes(y) || x(c3) && y in c3 || t.extends && l(t.extends, y, d3) || t.mixins && t.mixins.some((w2) => l(w2, y, d3)))
      return true;
  }
  function r(t) {
    return he(t) ? "ShallowRef" : t.effect ? "ComputedRef" : "Ref";
  }
  window.devtoolsFormatters ? window.devtoolsFormatters.push(a) : window.devtoolsFormatters = [a];
}
function zo() {
  Io();
}
process.env.NODE_ENV !== "production" && zo();
var da = class {
  /**
   * 检测是否是空对象
   *
   * @param obj - 对象
   */
  static isEmptyObject(e) {
    return e ? Object.getPrototypeOf(e) === Object.prototype && Object.getOwnPropertyNames(e).length === 0 && Object.getOwnPropertySymbols(e).length === 0 : true;
  }
  /**
   * 获取对象的属性值
   *
   * @param {any} object - 目标对象
   * @param {string} key - 属性键值
   * @param {any} [defaultValue=""] - 默认值
   */
  static getProperty(e, i, u3 = "") {
    if (Mn.isEmptyString(i))
      return u3;
    let a = e;
    if ((H(e) || U(e)) && (a = j(e)), typeof a != "object")
      throw new Error("Invalid arguments. object should be an object");
    try {
      return a.hasOwnProperty(i) ? a[i] : u3;
    } catch (o3) {
      return this.logger.warn(`getProperty ${i} Error:`, o3), u3;
    }
  }
};
G(da, "logger", Qn("object-util"));
var Ln = class {
};
G(Ln, "dateUtil", Qi), G(Ln, "strUtil", Mn), G(Ln, "htmlUtil", Bi), G(Ln, "jsonUtil", Te), G(Ln, "objectUtil", da);
function ba(n3) {
  return typeof n3 > "u" || n3 === null;
}
function Uo(n3) {
  return typeof n3 == "object" && n3 !== null;
}
function $o(n3) {
  return Array.isArray(n3) ? n3 : ba(n3) ? [] : [n3];
}
function Vo(n3, e) {
  var i, u3, a, o3;
  if (e)
    for (o3 = Object.keys(e), i = 0, u3 = o3.length; i < u3; i += 1)
      a = o3[i], n3[a] = e[a];
  return n3;
}
function qo(n3, e) {
  var i = "", u3;
  for (u3 = 0; u3 < e; u3 += 1)
    i += n3;
  return i;
}
function ng(n3) {
  return n3 === 0 && Number.NEGATIVE_INFINITY === 1 / n3;
}
var eg = ba;
var ig = Uo;
var ag = $o;
var ug = qo;
var og = ng;
var gg = Vo;
var S = {
  isNothing: eg,
  isObject: ig,
  toArray: ag,
  repeat: ug,
  isNegativeZero: og,
  extend: gg
};
function ca(n3, e) {
  var i = "", u3 = n3.reason || "(unknown reason)";
  return n3.mark ? (n3.mark.name && (i += 'in "' + n3.mark.name + '" '), i += "(" + (n3.mark.line + 1) + ":" + (n3.mark.column + 1) + ")", !e && n3.mark.snippet && (i += `

` + n3.mark.snippet), u3 + " " + i) : u3;
}
function Xn(n3, e) {
  Error.call(this), this.name = "YAMLException", this.reason = n3, this.mark = e, this.message = ca(this, false), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
Xn.prototype = Object.create(Error.prototype);
Xn.prototype.constructor = Xn;
Xn.prototype.toString = function(e) {
  return this.name + ": " + ca(this, e);
};
var T = Xn;
function le(n3, e, i, u3, a) {
  var o3 = "", g3 = "", s3 = Math.floor(a / 2) - 1;
  return u3 - e > s3 && (o3 = " ... ", e = u3 - s3 + o3.length), i - u3 > s3 && (g3 = " ...", i = u3 + s3 - g3.length), {
    str: o3 + n3.slice(e, i).replace(/\t/g, "\u2192") + g3,
    pos: u3 - e + o3.length
    // relative position
  };
}
function te(n3, e) {
  return S.repeat(" ", e - n3.length) + n3;
}
function sg(n3, e) {
  if (e = Object.create(e || null), !n3.buffer)
    return null;
  e.maxLength || (e.maxLength = 79), typeof e.indent != "number" && (e.indent = 1), typeof e.linesBefore != "number" && (e.linesBefore = 3), typeof e.linesAfter != "number" && (e.linesAfter = 2);
  for (var i = /\r?\n|\r|\0/g, u3 = [0], a = [], o3, g3 = -1; o3 = i.exec(n3.buffer); )
    a.push(o3.index), u3.push(o3.index + o3[0].length), n3.position <= o3.index && g3 < 0 && (g3 = u3.length - 2);
  g3 < 0 && (g3 = u3.length - 1);
  var s3 = "", h, l, r = Math.min(n3.line + e.linesAfter, a.length).toString().length, t = e.maxLength - (e.indent + r + 3);
  for (h = 1; h <= e.linesBefore && !(g3 - h < 0); h++)
    l = le(
      n3.buffer,
      u3[g3 - h],
      a[g3 - h],
      n3.position - (u3[g3] - u3[g3 - h]),
      t
    ), s3 = S.repeat(" ", e.indent) + te((n3.line - h + 1).toString(), r) + " | " + l.str + `
` + s3;
  for (l = le(n3.buffer, u3[g3], a[g3], n3.position, t), s3 += S.repeat(" ", e.indent) + te((n3.line + 1).toString(), r) + " | " + l.str + `
`, s3 += S.repeat("-", e.indent + r + 3 + l.pos) + `^
`, h = 1; h <= e.linesAfter && !(g3 + h >= a.length); h++)
    l = le(
      n3.buffer,
      u3[g3 + h],
      a[g3 + h],
      n3.position - (u3[g3] - u3[g3 + h]),
      t
    ), s3 += S.repeat(" ", e.indent) + te((n3.line + h + 1).toString(), r) + " | " + l.str + `
`;
  return s3.replace(/\n$/, "");
}
var hg = sg;
var lg = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
];
var tg = [
  "scalar",
  "sequence",
  "mapping"
];
function rg(n3) {
  var e = {};
  return n3 !== null && Object.keys(n3).forEach(function(i) {
    n3[i].forEach(function(u3) {
      e[String(u3)] = i;
    });
  }), e;
}
function yg(n3, e) {
  if (e = e || {}, Object.keys(e).forEach(function(i) {
    if (lg.indexOf(i) === -1)
      throw new T('Unknown option "' + i + '" is met in definition of "' + n3 + '" YAML type.');
  }), this.options = e, this.tag = n3, this.kind = e.kind || null, this.resolve = e.resolve || function() {
    return true;
  }, this.construct = e.construct || function(i) {
    return i;
  }, this.instanceOf = e.instanceOf || null, this.predicate = e.predicate || null, this.represent = e.represent || null, this.representName = e.representName || null, this.defaultStyle = e.defaultStyle || null, this.multi = e.multi || false, this.styleAliases = rg(e.styleAliases || null), tg.indexOf(this.kind) === -1)
    throw new T('Unknown kind "' + this.kind + '" is specified for "' + n3 + '" YAML type.');
}
var C = yg;
function wi(n3, e) {
  var i = [];
  return n3[e].forEach(function(u3) {
    var a = i.length;
    i.forEach(function(o3, g3) {
      o3.tag === u3.tag && o3.kind === u3.kind && o3.multi === u3.multi && (a = g3);
    }), i[a] = u3;
  }), i;
}
function dg() {
  var n3 = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, e, i;
  function u3(a) {
    a.multi ? (n3.multi[a.kind].push(a), n3.multi.fallback.push(a)) : n3[a.kind][a.tag] = n3.fallback[a.tag] = a;
  }
  for (e = 0, i = arguments.length; e < i; e += 1)
    arguments[e].forEach(u3);
  return n3;
}
function Ze(n3) {
  return this.extend(n3);
}
Ze.prototype.extend = function(e) {
  var i = [], u3 = [];
  if (e instanceof C)
    u3.push(e);
  else if (Array.isArray(e))
    u3 = u3.concat(e);
  else if (e && (Array.isArray(e.implicit) || Array.isArray(e.explicit)))
    e.implicit && (i = i.concat(e.implicit)), e.explicit && (u3 = u3.concat(e.explicit));
  else
    throw new T("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  i.forEach(function(o3) {
    if (!(o3 instanceof C))
      throw new T("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (o3.loadKind && o3.loadKind !== "scalar")
      throw new T("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (o3.multi)
      throw new T("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), u3.forEach(function(o3) {
    if (!(o3 instanceof C))
      throw new T("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var a = Object.create(Ze.prototype);
  return a.implicit = (this.implicit || []).concat(i), a.explicit = (this.explicit || []).concat(u3), a.compiledImplicit = wi(a, "implicit"), a.compiledExplicit = wi(a, "explicit"), a.compiledTypeMap = dg(a.compiledImplicit, a.compiledExplicit), a;
};
var wa = Ze;
var pa = new C("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(n3) {
    return n3 !== null ? n3 : "";
  }
});
var ja = new C("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(n3) {
    return n3 !== null ? n3 : [];
  }
});
var ma = new C("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(n3) {
    return n3 !== null ? n3 : {};
  }
});
var Ya = new wa({
  explicit: [
    pa,
    ja,
    ma
  ]
});
function bg(n3) {
  if (n3 === null)
    return true;
  var e = n3.length;
  return e === 1 && n3 === "~" || e === 4 && (n3 === "null" || n3 === "Null" || n3 === "NULL");
}
function cg() {
  return null;
}
function wg(n3) {
  return n3 === null;
}
var fa = new C("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: bg,
  construct: cg,
  predicate: wg,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
function pg(n3) {
  if (n3 === null)
    return false;
  var e = n3.length;
  return e === 4 && (n3 === "true" || n3 === "True" || n3 === "TRUE") || e === 5 && (n3 === "false" || n3 === "False" || n3 === "FALSE");
}
function jg(n3) {
  return n3 === "true" || n3 === "True" || n3 === "TRUE";
}
function mg(n3) {
  return Object.prototype.toString.call(n3) === "[object Boolean]";
}
var La = new C("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: pg,
  construct: jg,
  predicate: mg,
  represent: {
    lowercase: function(n3) {
      return n3 ? "true" : "false";
    },
    uppercase: function(n3) {
      return n3 ? "TRUE" : "FALSE";
    },
    camelcase: function(n3) {
      return n3 ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
function Yg(n3) {
  return 48 <= n3 && n3 <= 57 || 65 <= n3 && n3 <= 70 || 97 <= n3 && n3 <= 102;
}
function fg(n3) {
  return 48 <= n3 && n3 <= 55;
}
function Lg(n3) {
  return 48 <= n3 && n3 <= 57;
}
function Zg(n3) {
  if (n3 === null)
    return false;
  var e = n3.length, i = 0, u3 = false, a;
  if (!e)
    return false;
  if (a = n3[i], (a === "-" || a === "+") && (a = n3[++i]), a === "0") {
    if (i + 1 === e)
      return true;
    if (a = n3[++i], a === "b") {
      for (i++; i < e; i++)
        if (a = n3[i], a !== "_") {
          if (a !== "0" && a !== "1")
            return false;
          u3 = true;
        }
      return u3 && a !== "_";
    }
    if (a === "x") {
      for (i++; i < e; i++)
        if (a = n3[i], a !== "_") {
          if (!Yg(n3.charCodeAt(i)))
            return false;
          u3 = true;
        }
      return u3 && a !== "_";
    }
    if (a === "o") {
      for (i++; i < e; i++)
        if (a = n3[i], a !== "_") {
          if (!fg(n3.charCodeAt(i)))
            return false;
          u3 = true;
        }
      return u3 && a !== "_";
    }
  }
  if (a === "_")
    return false;
  for (; i < e; i++)
    if (a = n3[i], a !== "_") {
      if (!Lg(n3.charCodeAt(i)))
        return false;
      u3 = true;
    }
  return !(!u3 || a === "_");
}
function Sg(n3) {
  var e = n3, i = 1, u3;
  if (e.indexOf("_") !== -1 && (e = e.replace(/_/g, "")), u3 = e[0], (u3 === "-" || u3 === "+") && (u3 === "-" && (i = -1), e = e.slice(1), u3 = e[0]), e === "0")
    return 0;
  if (u3 === "0") {
    if (e[1] === "b")
      return i * parseInt(e.slice(2), 2);
    if (e[1] === "x")
      return i * parseInt(e.slice(2), 16);
    if (e[1] === "o")
      return i * parseInt(e.slice(2), 8);
  }
  return i * parseInt(e, 10);
}
function Cg(n3) {
  return Object.prototype.toString.call(n3) === "[object Number]" && n3 % 1 === 0 && !S.isNegativeZero(n3);
}
var Za = new C("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: Zg,
  construct: Sg,
  predicate: Cg,
  represent: {
    binary: function(n3) {
      return n3 >= 0 ? "0b" + n3.toString(2) : "-0b" + n3.toString(2).slice(1);
    },
    octal: function(n3) {
      return n3 >= 0 ? "0o" + n3.toString(8) : "-0o" + n3.toString(8).slice(1);
    },
    decimal: function(n3) {
      return n3.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(n3) {
      return n3 >= 0 ? "0x" + n3.toString(16).toUpperCase() : "-0x" + n3.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
var Jg = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function kg(n3) {
  return !(n3 === null || !Jg.test(n3) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  n3[n3.length - 1] === "_");
}
function Dg(n3) {
  var e, i;
  return e = n3.replace(/_/g, "").toLowerCase(), i = e[0] === "-" ? -1 : 1, "+-".indexOf(e[0]) >= 0 && (e = e.slice(1)), e === ".inf" ? i === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : e === ".nan" ? NaN : i * parseFloat(e, 10);
}
var Xg = /^[-+]?[0-9]+e/;
function Tg(n3, e) {
  var i;
  if (isNaN(n3))
    switch (e) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === n3)
    switch (e) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === n3)
    switch (e) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (S.isNegativeZero(n3))
    return "-0.0";
  return i = n3.toString(10), Xg.test(i) ? i.replace("e", ".e") : i;
}
function Hg(n3) {
  return Object.prototype.toString.call(n3) === "[object Number]" && (n3 % 1 !== 0 || S.isNegativeZero(n3));
}
var Sa = new C("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: kg,
  construct: Dg,
  predicate: Hg,
  represent: Tg,
  defaultStyle: "lowercase"
});
var Ca = Ya.extend({
  implicit: [
    fa,
    La,
    Za,
    Sa
  ]
});
var Ja = Ca;
var ka = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
);
var Da = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function Fg(n3) {
  return n3 === null ? false : ka.exec(n3) !== null || Da.exec(n3) !== null;
}
function Mg(n3) {
  var e, i, u3, a, o3, g3, s3, h = 0, l = null, r, t, y;
  if (e = ka.exec(n3), e === null && (e = Da.exec(n3)), e === null)
    throw new Error("Date resolve error");
  if (i = +e[1], u3 = +e[2] - 1, a = +e[3], !e[4])
    return new Date(Date.UTC(i, u3, a));
  if (o3 = +e[4], g3 = +e[5], s3 = +e[6], e[7]) {
    for (h = e[7].slice(0, 3); h.length < 3; )
      h += "0";
    h = +h;
  }
  return e[9] && (r = +e[10], t = +(e[11] || 0), l = (r * 60 + t) * 6e4, e[9] === "-" && (l = -l)), y = new Date(Date.UTC(i, u3, a, o3, g3, s3, h)), l && y.setTime(y.getTime() - l), y;
}
function Qg(n3) {
  return n3.toISOString();
}
var Xa = new C("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: Fg,
  construct: Mg,
  instanceOf: Date,
  represent: Qg
});
function Bg(n3) {
  return n3 === "<<" || n3 === null;
}
var Ta = new C("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: Bg
});
var Oe = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function xg(n3) {
  if (n3 === null)
    return false;
  var e, i, u3 = 0, a = n3.length, o3 = Oe;
  for (i = 0; i < a; i++)
    if (e = o3.indexOf(n3.charAt(i)), !(e > 64)) {
      if (e < 0)
        return false;
      u3 += 6;
    }
  return u3 % 8 === 0;
}
function Ng(n3) {
  var e, i, u3 = n3.replace(/[\r\n=]/g, ""), a = u3.length, o3 = Oe, g3 = 0, s3 = [];
  for (e = 0; e < a; e++)
    e % 4 === 0 && e && (s3.push(g3 >> 16 & 255), s3.push(g3 >> 8 & 255), s3.push(g3 & 255)), g3 = g3 << 6 | o3.indexOf(u3.charAt(e));
  return i = a % 4 * 6, i === 0 ? (s3.push(g3 >> 16 & 255), s3.push(g3 >> 8 & 255), s3.push(g3 & 255)) : i === 18 ? (s3.push(g3 >> 10 & 255), s3.push(g3 >> 2 & 255)) : i === 12 && s3.push(g3 >> 4 & 255), new Uint8Array(s3);
}
function Gg(n3) {
  var e = "", i = 0, u3, a, o3 = n3.length, g3 = Oe;
  for (u3 = 0; u3 < o3; u3++)
    u3 % 3 === 0 && u3 && (e += g3[i >> 18 & 63], e += g3[i >> 12 & 63], e += g3[i >> 6 & 63], e += g3[i & 63]), i = (i << 8) + n3[u3];
  return a = o3 % 3, a === 0 ? (e += g3[i >> 18 & 63], e += g3[i >> 12 & 63], e += g3[i >> 6 & 63], e += g3[i & 63]) : a === 2 ? (e += g3[i >> 10 & 63], e += g3[i >> 4 & 63], e += g3[i << 2 & 63], e += g3[64]) : a === 1 && (e += g3[i >> 2 & 63], e += g3[i << 4 & 63], e += g3[64], e += g3[64]), e;
}
function Pg(n3) {
  return Object.prototype.toString.call(n3) === "[object Uint8Array]";
}
var Ha = new C("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: xg,
  construct: Ng,
  predicate: Pg,
  represent: Gg
});
var Eg = Object.prototype.hasOwnProperty;
var Ag = Object.prototype.toString;
function Wg(n3) {
  if (n3 === null)
    return true;
  var e = [], i, u3, a, o3, g3, s3 = n3;
  for (i = 0, u3 = s3.length; i < u3; i += 1) {
    if (a = s3[i], g3 = false, Ag.call(a) !== "[object Object]")
      return false;
    for (o3 in a)
      if (Eg.call(a, o3))
        if (!g3)
          g3 = true;
        else
          return false;
    if (!g3)
      return false;
    if (e.indexOf(o3) === -1)
      e.push(o3);
    else
      return false;
  }
  return true;
}
function Kg(n3) {
  return n3 !== null ? n3 : [];
}
var Fa = new C("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: Wg,
  construct: Kg
});
var Rg = Object.prototype.toString;
function vg(n3) {
  if (n3 === null)
    return true;
  var e, i, u3, a, o3, g3 = n3;
  for (o3 = new Array(g3.length), e = 0, i = g3.length; e < i; e += 1) {
    if (u3 = g3[e], Rg.call(u3) !== "[object Object]" || (a = Object.keys(u3), a.length !== 1))
      return false;
    o3[e] = [a[0], u3[a[0]]];
  }
  return true;
}
function Og(n3) {
  if (n3 === null)
    return [];
  var e, i, u3, a, o3, g3 = n3;
  for (o3 = new Array(g3.length), e = 0, i = g3.length; e < i; e += 1)
    u3 = g3[e], a = Object.keys(u3), o3[e] = [a[0], u3[a[0]]];
  return o3;
}
var Ma = new C("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: vg,
  construct: Og
});
var _g = Object.prototype.hasOwnProperty;
function Ig(n3) {
  if (n3 === null)
    return true;
  var e, i = n3;
  for (e in i)
    if (_g.call(i, e) && i[e] !== null)
      return false;
  return true;
}
function zg(n3) {
  return n3 !== null ? n3 : {};
}
var Qa = new C("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: Ig,
  construct: zg
});
var _e = Ja.extend({
  implicit: [
    Xa,
    Ta
  ],
  explicit: [
    Ha,
    Fa,
    Ma,
    Qa
  ]
});
var nn = Object.prototype.hasOwnProperty;
var Un = 1;
var Ba = 2;
var xa = 3;
var $n = 4;
var re = 1;
var Ug = 2;
var pi = 3;
var $g = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var Vg = /[\x85\u2028\u2029]/;
var qg = /[,\[\]\{\}]/;
var Na = /^(?:!|!!|![a-z\-]+!)$/i;
var Ga = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function ji(n3) {
  return Object.prototype.toString.call(n3);
}
function R(n3) {
  return n3 === 10 || n3 === 13;
}
function gn(n3) {
  return n3 === 9 || n3 === 32;
}
function B(n3) {
  return n3 === 9 || n3 === 32 || n3 === 10 || n3 === 13;
}
function dn(n3) {
  return n3 === 44 || n3 === 91 || n3 === 93 || n3 === 123 || n3 === 125;
}
function ns(n3) {
  var e;
  return 48 <= n3 && n3 <= 57 ? n3 - 48 : (e = n3 | 32, 97 <= e && e <= 102 ? e - 97 + 10 : -1);
}
function es(n3) {
  return n3 === 120 ? 2 : n3 === 117 ? 4 : n3 === 85 ? 8 : 0;
}
function is(n3) {
  return 48 <= n3 && n3 <= 57 ? n3 - 48 : -1;
}
function mi(n3) {
  return n3 === 48 ? "\0" : n3 === 97 ? "\x07" : n3 === 98 ? "\b" : n3 === 116 || n3 === 9 ? "	" : n3 === 110 ? `
` : n3 === 118 ? "\v" : n3 === 102 ? "\f" : n3 === 114 ? "\r" : n3 === 101 ? "\x1B" : n3 === 32 ? " " : n3 === 34 ? '"' : n3 === 47 ? "/" : n3 === 92 ? "\\" : n3 === 78 ? "\x85" : n3 === 95 ? "\xA0" : n3 === 76 ? "\u2028" : n3 === 80 ? "\u2029" : "";
}
function as(n3) {
  return n3 <= 65535 ? String.fromCharCode(n3) : String.fromCharCode(
    (n3 - 65536 >> 10) + 55296,
    (n3 - 65536 & 1023) + 56320
  );
}
var Pa = new Array(256);
var Ea = new Array(256);
for (ln = 0; ln < 256; ln++)
  Pa[ln] = mi(ln) ? 1 : 0, Ea[ln] = mi(ln);
var ln;
function us(n3, e) {
  this.input = n3, this.filename = e.filename || null, this.schema = e.schema || _e, this.onWarning = e.onWarning || null, this.legacy = e.legacy || false, this.json = e.json || false, this.listener = e.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = n3.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function Aa(n3, e) {
  var i = {
    name: n3.filename,
    buffer: n3.input.slice(0, -1),
    // omit trailing \0
    position: n3.position,
    line: n3.line,
    column: n3.position - n3.lineStart
  };
  return i.snippet = hg(i), new T(e, i);
}
function b3(n3, e) {
  throw Aa(n3, e);
}
function Vn(n3, e) {
  n3.onWarning && n3.onWarning.call(null, Aa(n3, e));
}
var Yi = {
  YAML: function(e, i, u3) {
    var a, o3, g3;
    e.version !== null && b3(e, "duplication of %YAML directive"), u3.length !== 1 && b3(e, "YAML directive accepts exactly one argument"), a = /^([0-9]+)\.([0-9]+)$/.exec(u3[0]), a === null && b3(e, "ill-formed argument of the YAML directive"), o3 = parseInt(a[1], 10), g3 = parseInt(a[2], 10), o3 !== 1 && b3(e, "unacceptable YAML version of the document"), e.version = u3[0], e.checkLineBreaks = g3 < 2, g3 !== 1 && g3 !== 2 && Vn(e, "unsupported YAML version of the document");
  },
  TAG: function(e, i, u3) {
    var a, o3;
    u3.length !== 2 && b3(e, "TAG directive accepts exactly two arguments"), a = u3[0], o3 = u3[1], Na.test(a) || b3(e, "ill-formed tag handle (first argument) of the TAG directive"), nn.call(e.tagMap, a) && b3(e, 'there is a previously declared suffix for "' + a + '" tag handle'), Ga.test(o3) || b3(e, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      o3 = decodeURIComponent(o3);
    } catch {
      b3(e, "tag prefix is malformed: " + o3);
    }
    e.tagMap[a] = o3;
  }
};
function $(n3, e, i, u3) {
  var a, o3, g3, s3;
  if (e < i) {
    if (s3 = n3.input.slice(e, i), u3)
      for (a = 0, o3 = s3.length; a < o3; a += 1)
        g3 = s3.charCodeAt(a), g3 === 9 || 32 <= g3 && g3 <= 1114111 || b3(n3, "expected valid JSON character");
    else
      $g.test(s3) && b3(n3, "the stream contains non-printable characters");
    n3.result += s3;
  }
}
function fi(n3, e, i, u3) {
  var a, o3, g3, s3;
  for (S.isObject(i) || b3(n3, "cannot merge mappings; the provided source object is unacceptable"), a = Object.keys(i), g3 = 0, s3 = a.length; g3 < s3; g3 += 1)
    o3 = a[g3], nn.call(e, o3) || (e[o3] = i[o3], u3[o3] = true);
}
function bn(n3, e, i, u3, a, o3, g3, s3, h) {
  var l, r;
  if (Array.isArray(a))
    for (a = Array.prototype.slice.call(a), l = 0, r = a.length; l < r; l += 1)
      Array.isArray(a[l]) && b3(n3, "nested arrays are not supported inside keys"), typeof a == "object" && ji(a[l]) === "[object Object]" && (a[l] = "[object Object]");
  if (typeof a == "object" && ji(a) === "[object Object]" && (a = "[object Object]"), a = String(a), e === null && (e = {}), u3 === "tag:yaml.org,2002:merge")
    if (Array.isArray(o3))
      for (l = 0, r = o3.length; l < r; l += 1)
        fi(n3, e, o3[l], i);
    else
      fi(n3, e, o3, i);
  else
    !n3.json && !nn.call(i, a) && nn.call(e, a) && (n3.line = g3 || n3.line, n3.lineStart = s3 || n3.lineStart, n3.position = h || n3.position, b3(n3, "duplicated mapping key")), a === "__proto__" ? Object.defineProperty(e, a, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: o3
    }) : e[a] = o3, delete i[a];
  return e;
}
function Ie(n3) {
  var e;
  e = n3.input.charCodeAt(n3.position), e === 10 ? n3.position++ : e === 13 ? (n3.position++, n3.input.charCodeAt(n3.position) === 10 && n3.position++) : b3(n3, "a line break is expected"), n3.line += 1, n3.lineStart = n3.position, n3.firstTabInLine = -1;
}
function Z(n3, e, i) {
  for (var u3 = 0, a = n3.input.charCodeAt(n3.position); a !== 0; ) {
    for (; gn(a); )
      a === 9 && n3.firstTabInLine === -1 && (n3.firstTabInLine = n3.position), a = n3.input.charCodeAt(++n3.position);
    if (e && a === 35)
      do
        a = n3.input.charCodeAt(++n3.position);
      while (a !== 10 && a !== 13 && a !== 0);
    if (R(a))
      for (Ie(n3), a = n3.input.charCodeAt(n3.position), u3++, n3.lineIndent = 0; a === 32; )
        n3.lineIndent++, a = n3.input.charCodeAt(++n3.position);
    else
      break;
  }
  return i !== -1 && u3 !== 0 && n3.lineIndent < i && Vn(n3, "deficient indentation"), u3;
}
function oe(n3) {
  var e = n3.position, i;
  return i = n3.input.charCodeAt(e), !!((i === 45 || i === 46) && i === n3.input.charCodeAt(e + 1) && i === n3.input.charCodeAt(e + 2) && (e += 3, i = n3.input.charCodeAt(e), i === 0 || B(i)));
}
function ze(n3, e) {
  e === 1 ? n3.result += " " : e > 1 && (n3.result += S.repeat(`
`, e - 1));
}
function os(n3, e, i) {
  var u3, a, o3, g3, s3, h, l, r, t = n3.kind, y = n3.result, d3;
  if (d3 = n3.input.charCodeAt(n3.position), B(d3) || dn(d3) || d3 === 35 || d3 === 38 || d3 === 42 || d3 === 33 || d3 === 124 || d3 === 62 || d3 === 39 || d3 === 34 || d3 === 37 || d3 === 64 || d3 === 96 || (d3 === 63 || d3 === 45) && (a = n3.input.charCodeAt(n3.position + 1), B(a) || i && dn(a)))
    return false;
  for (n3.kind = "scalar", n3.result = "", o3 = g3 = n3.position, s3 = false; d3 !== 0; ) {
    if (d3 === 58) {
      if (a = n3.input.charCodeAt(n3.position + 1), B(a) || i && dn(a))
        break;
    } else if (d3 === 35) {
      if (u3 = n3.input.charCodeAt(n3.position - 1), B(u3))
        break;
    } else {
      if (n3.position === n3.lineStart && oe(n3) || i && dn(d3))
        break;
      if (R(d3))
        if (h = n3.line, l = n3.lineStart, r = n3.lineIndent, Z(n3, false, -1), n3.lineIndent >= e) {
          s3 = true, d3 = n3.input.charCodeAt(n3.position);
          continue;
        } else {
          n3.position = g3, n3.line = h, n3.lineStart = l, n3.lineIndent = r;
          break;
        }
    }
    s3 && ($(n3, o3, g3, false), ze(n3, n3.line - h), o3 = g3 = n3.position, s3 = false), gn(d3) || (g3 = n3.position + 1), d3 = n3.input.charCodeAt(++n3.position);
  }
  return $(n3, o3, g3, false), n3.result ? true : (n3.kind = t, n3.result = y, false);
}
function gs(n3, e) {
  var i, u3, a;
  if (i = n3.input.charCodeAt(n3.position), i !== 39)
    return false;
  for (n3.kind = "scalar", n3.result = "", n3.position++, u3 = a = n3.position; (i = n3.input.charCodeAt(n3.position)) !== 0; )
    if (i === 39)
      if ($(n3, u3, n3.position, true), i = n3.input.charCodeAt(++n3.position), i === 39)
        u3 = n3.position, n3.position++, a = n3.position;
      else
        return true;
    else
      R(i) ? ($(n3, u3, a, true), ze(n3, Z(n3, false, e)), u3 = a = n3.position) : n3.position === n3.lineStart && oe(n3) ? b3(n3, "unexpected end of the document within a single quoted scalar") : (n3.position++, a = n3.position);
  b3(n3, "unexpected end of the stream within a single quoted scalar");
}
function ss(n3, e) {
  var i, u3, a, o3, g3, s3;
  if (s3 = n3.input.charCodeAt(n3.position), s3 !== 34)
    return false;
  for (n3.kind = "scalar", n3.result = "", n3.position++, i = u3 = n3.position; (s3 = n3.input.charCodeAt(n3.position)) !== 0; ) {
    if (s3 === 34)
      return $(n3, i, n3.position, true), n3.position++, true;
    if (s3 === 92) {
      if ($(n3, i, n3.position, true), s3 = n3.input.charCodeAt(++n3.position), R(s3))
        Z(n3, false, e);
      else if (s3 < 256 && Pa[s3])
        n3.result += Ea[s3], n3.position++;
      else if ((g3 = es(s3)) > 0) {
        for (a = g3, o3 = 0; a > 0; a--)
          s3 = n3.input.charCodeAt(++n3.position), (g3 = ns(s3)) >= 0 ? o3 = (o3 << 4) + g3 : b3(n3, "expected hexadecimal character");
        n3.result += as(o3), n3.position++;
      } else
        b3(n3, "unknown escape sequence");
      i = u3 = n3.position;
    } else
      R(s3) ? ($(n3, i, u3, true), ze(n3, Z(n3, false, e)), i = u3 = n3.position) : n3.position === n3.lineStart && oe(n3) ? b3(n3, "unexpected end of the document within a double quoted scalar") : (n3.position++, u3 = n3.position);
  }
  b3(n3, "unexpected end of the stream within a double quoted scalar");
}
function hs(n3, e) {
  var i = true, u3, a, o3, g3 = n3.tag, s3, h = n3.anchor, l, r, t, y, d3, c3 = /* @__PURE__ */ Object.create(null), w2, m, J, p;
  if (p = n3.input.charCodeAt(n3.position), p === 91)
    r = 93, d3 = false, s3 = [];
  else if (p === 123)
    r = 125, d3 = true, s3 = {};
  else
    return false;
  for (n3.anchor !== null && (n3.anchorMap[n3.anchor] = s3), p = n3.input.charCodeAt(++n3.position); p !== 0; ) {
    if (Z(n3, true, e), p = n3.input.charCodeAt(n3.position), p === r)
      return n3.position++, n3.tag = g3, n3.anchor = h, n3.kind = d3 ? "mapping" : "sequence", n3.result = s3, true;
    i ? p === 44 && b3(n3, "expected the node content, but found ','") : b3(n3, "missed comma between flow collection entries"), m = w2 = J = null, t = y = false, p === 63 && (l = n3.input.charCodeAt(n3.position + 1), B(l) && (t = y = true, n3.position++, Z(n3, true, e))), u3 = n3.line, a = n3.lineStart, o3 = n3.position, Yn(n3, e, Un, false, true), m = n3.tag, w2 = n3.result, Z(n3, true, e), p = n3.input.charCodeAt(n3.position), (y || n3.line === u3) && p === 58 && (t = true, p = n3.input.charCodeAt(++n3.position), Z(n3, true, e), Yn(n3, e, Un, false, true), J = n3.result), d3 ? bn(n3, s3, c3, m, w2, J, u3, a, o3) : t ? s3.push(bn(n3, null, c3, m, w2, J, u3, a, o3)) : s3.push(w2), Z(n3, true, e), p = n3.input.charCodeAt(n3.position), p === 44 ? (i = true, p = n3.input.charCodeAt(++n3.position)) : i = false;
  }
  b3(n3, "unexpected end of the stream within a flow collection");
}
function ls(n3, e) {
  var i, u3, a = re, o3 = false, g3 = false, s3 = e, h = 0, l = false, r, t;
  if (t = n3.input.charCodeAt(n3.position), t === 124)
    u3 = false;
  else if (t === 62)
    u3 = true;
  else
    return false;
  for (n3.kind = "scalar", n3.result = ""; t !== 0; )
    if (t = n3.input.charCodeAt(++n3.position), t === 43 || t === 45)
      re === a ? a = t === 43 ? pi : Ug : b3(n3, "repeat of a chomping mode identifier");
    else if ((r = is(t)) >= 0)
      r === 0 ? b3(n3, "bad explicit indentation width of a block scalar; it cannot be less than one") : g3 ? b3(n3, "repeat of an indentation width identifier") : (s3 = e + r - 1, g3 = true);
    else
      break;
  if (gn(t)) {
    do
      t = n3.input.charCodeAt(++n3.position);
    while (gn(t));
    if (t === 35)
      do
        t = n3.input.charCodeAt(++n3.position);
      while (!R(t) && t !== 0);
  }
  for (; t !== 0; ) {
    for (Ie(n3), n3.lineIndent = 0, t = n3.input.charCodeAt(n3.position); (!g3 || n3.lineIndent < s3) && t === 32; )
      n3.lineIndent++, t = n3.input.charCodeAt(++n3.position);
    if (!g3 && n3.lineIndent > s3 && (s3 = n3.lineIndent), R(t)) {
      h++;
      continue;
    }
    if (n3.lineIndent < s3) {
      a === pi ? n3.result += S.repeat(`
`, o3 ? 1 + h : h) : a === re && o3 && (n3.result += `
`);
      break;
    }
    for (u3 ? gn(t) ? (l = true, n3.result += S.repeat(`
`, o3 ? 1 + h : h)) : l ? (l = false, n3.result += S.repeat(`
`, h + 1)) : h === 0 ? o3 && (n3.result += " ") : n3.result += S.repeat(`
`, h) : n3.result += S.repeat(`
`, o3 ? 1 + h : h), o3 = true, g3 = true, h = 0, i = n3.position; !R(t) && t !== 0; )
      t = n3.input.charCodeAt(++n3.position);
    $(n3, i, n3.position, false);
  }
  return true;
}
function Li(n3, e) {
  var i, u3 = n3.tag, a = n3.anchor, o3 = [], g3, s3 = false, h;
  if (n3.firstTabInLine !== -1)
    return false;
  for (n3.anchor !== null && (n3.anchorMap[n3.anchor] = o3), h = n3.input.charCodeAt(n3.position); h !== 0 && (n3.firstTabInLine !== -1 && (n3.position = n3.firstTabInLine, b3(n3, "tab characters must not be used in indentation")), !(h !== 45 || (g3 = n3.input.charCodeAt(n3.position + 1), !B(g3)))); ) {
    if (s3 = true, n3.position++, Z(n3, true, -1) && n3.lineIndent <= e) {
      o3.push(null), h = n3.input.charCodeAt(n3.position);
      continue;
    }
    if (i = n3.line, Yn(n3, e, xa, false, true), o3.push(n3.result), Z(n3, true, -1), h = n3.input.charCodeAt(n3.position), (n3.line === i || n3.lineIndent > e) && h !== 0)
      b3(n3, "bad indentation of a sequence entry");
    else if (n3.lineIndent < e)
      break;
  }
  return s3 ? (n3.tag = u3, n3.anchor = a, n3.kind = "sequence", n3.result = o3, true) : false;
}
function ts(n3, e, i) {
  var u3, a, o3, g3, s3, h, l = n3.tag, r = n3.anchor, t = {}, y = /* @__PURE__ */ Object.create(null), d3 = null, c3 = null, w2 = null, m = false, J = false, p;
  if (n3.firstTabInLine !== -1)
    return false;
  for (n3.anchor !== null && (n3.anchorMap[n3.anchor] = t), p = n3.input.charCodeAt(n3.position); p !== 0; ) {
    if (!m && n3.firstTabInLine !== -1 && (n3.position = n3.firstTabInLine, b3(n3, "tab characters must not be used in indentation")), u3 = n3.input.charCodeAt(n3.position + 1), o3 = n3.line, (p === 63 || p === 58) && B(u3))
      p === 63 ? (m && (bn(n3, t, y, d3, c3, null, g3, s3, h), d3 = c3 = w2 = null), J = true, m = true, a = true) : m ? (m = false, a = true) : b3(n3, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), n3.position += 1, p = u3;
    else {
      if (g3 = n3.line, s3 = n3.lineStart, h = n3.position, !Yn(n3, i, Ba, false, true))
        break;
      if (n3.line === o3) {
        for (p = n3.input.charCodeAt(n3.position); gn(p); )
          p = n3.input.charCodeAt(++n3.position);
        if (p === 58)
          p = n3.input.charCodeAt(++n3.position), B(p) || b3(n3, "a whitespace character is expected after the key-value separator within a block mapping"), m && (bn(n3, t, y, d3, c3, null, g3, s3, h), d3 = c3 = w2 = null), J = true, m = false, a = false, d3 = n3.tag, c3 = n3.result;
        else if (J)
          b3(n3, "can not read an implicit mapping pair; a colon is missed");
        else
          return n3.tag = l, n3.anchor = r, true;
      } else if (J)
        b3(n3, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return n3.tag = l, n3.anchor = r, true;
    }
    if ((n3.line === o3 || n3.lineIndent > e) && (m && (g3 = n3.line, s3 = n3.lineStart, h = n3.position), Yn(n3, e, $n, true, a) && (m ? c3 = n3.result : w2 = n3.result), m || (bn(n3, t, y, d3, c3, w2, g3, s3, h), d3 = c3 = w2 = null), Z(n3, true, -1), p = n3.input.charCodeAt(n3.position)), (n3.line === o3 || n3.lineIndent > e) && p !== 0)
      b3(n3, "bad indentation of a mapping entry");
    else if (n3.lineIndent < e)
      break;
  }
  return m && bn(n3, t, y, d3, c3, null, g3, s3, h), J && (n3.tag = l, n3.anchor = r, n3.kind = "mapping", n3.result = t), J;
}
function rs(n3) {
  var e, i = false, u3 = false, a, o3, g3;
  if (g3 = n3.input.charCodeAt(n3.position), g3 !== 33)
    return false;
  if (n3.tag !== null && b3(n3, "duplication of a tag property"), g3 = n3.input.charCodeAt(++n3.position), g3 === 60 ? (i = true, g3 = n3.input.charCodeAt(++n3.position)) : g3 === 33 ? (u3 = true, a = "!!", g3 = n3.input.charCodeAt(++n3.position)) : a = "!", e = n3.position, i) {
    do
      g3 = n3.input.charCodeAt(++n3.position);
    while (g3 !== 0 && g3 !== 62);
    n3.position < n3.length ? (o3 = n3.input.slice(e, n3.position), g3 = n3.input.charCodeAt(++n3.position)) : b3(n3, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; g3 !== 0 && !B(g3); )
      g3 === 33 && (u3 ? b3(n3, "tag suffix cannot contain exclamation marks") : (a = n3.input.slice(e - 1, n3.position + 1), Na.test(a) || b3(n3, "named tag handle cannot contain such characters"), u3 = true, e = n3.position + 1)), g3 = n3.input.charCodeAt(++n3.position);
    o3 = n3.input.slice(e, n3.position), qg.test(o3) && b3(n3, "tag suffix cannot contain flow indicator characters");
  }
  o3 && !Ga.test(o3) && b3(n3, "tag name cannot contain such characters: " + o3);
  try {
    o3 = decodeURIComponent(o3);
  } catch {
    b3(n3, "tag name is malformed: " + o3);
  }
  return i ? n3.tag = o3 : nn.call(n3.tagMap, a) ? n3.tag = n3.tagMap[a] + o3 : a === "!" ? n3.tag = "!" + o3 : a === "!!" ? n3.tag = "tag:yaml.org,2002:" + o3 : b3(n3, 'undeclared tag handle "' + a + '"'), true;
}
function ys(n3) {
  var e, i;
  if (i = n3.input.charCodeAt(n3.position), i !== 38)
    return false;
  for (n3.anchor !== null && b3(n3, "duplication of an anchor property"), i = n3.input.charCodeAt(++n3.position), e = n3.position; i !== 0 && !B(i) && !dn(i); )
    i = n3.input.charCodeAt(++n3.position);
  return n3.position === e && b3(n3, "name of an anchor node must contain at least one character"), n3.anchor = n3.input.slice(e, n3.position), true;
}
function ds(n3) {
  var e, i, u3;
  if (u3 = n3.input.charCodeAt(n3.position), u3 !== 42)
    return false;
  for (u3 = n3.input.charCodeAt(++n3.position), e = n3.position; u3 !== 0 && !B(u3) && !dn(u3); )
    u3 = n3.input.charCodeAt(++n3.position);
  return n3.position === e && b3(n3, "name of an alias node must contain at least one character"), i = n3.input.slice(e, n3.position), nn.call(n3.anchorMap, i) || b3(n3, 'unidentified alias "' + i + '"'), n3.result = n3.anchorMap[i], Z(n3, true, -1), true;
}
function Yn(n3, e, i, u3, a) {
  var o3, g3, s3, h = 1, l = false, r = false, t, y, d3, c3, w2, m;
  if (n3.listener !== null && n3.listener("open", n3), n3.tag = null, n3.anchor = null, n3.kind = null, n3.result = null, o3 = g3 = s3 = $n === i || xa === i, u3 && Z(n3, true, -1) && (l = true, n3.lineIndent > e ? h = 1 : n3.lineIndent === e ? h = 0 : n3.lineIndent < e && (h = -1)), h === 1)
    for (; rs(n3) || ys(n3); )
      Z(n3, true, -1) ? (l = true, s3 = o3, n3.lineIndent > e ? h = 1 : n3.lineIndent === e ? h = 0 : n3.lineIndent < e && (h = -1)) : s3 = false;
  if (s3 && (s3 = l || a), (h === 1 || $n === i) && (Un === i || Ba === i ? w2 = e : w2 = e + 1, m = n3.position - n3.lineStart, h === 1 ? s3 && (Li(n3, m) || ts(n3, m, w2)) || hs(n3, w2) ? r = true : (g3 && ls(n3, w2) || gs(n3, w2) || ss(n3, w2) ? r = true : ds(n3) ? (r = true, (n3.tag !== null || n3.anchor !== null) && b3(n3, "alias node should not have any properties")) : os(n3, w2, Un === i) && (r = true, n3.tag === null && (n3.tag = "?")), n3.anchor !== null && (n3.anchorMap[n3.anchor] = n3.result)) : h === 0 && (r = s3 && Li(n3, m))), n3.tag === null)
    n3.anchor !== null && (n3.anchorMap[n3.anchor] = n3.result);
  else if (n3.tag === "?") {
    for (n3.result !== null && n3.kind !== "scalar" && b3(n3, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + n3.kind + '"'), t = 0, y = n3.implicitTypes.length; t < y; t += 1)
      if (c3 = n3.implicitTypes[t], c3.resolve(n3.result)) {
        n3.result = c3.construct(n3.result), n3.tag = c3.tag, n3.anchor !== null && (n3.anchorMap[n3.anchor] = n3.result);
        break;
      }
  } else if (n3.tag !== "!") {
    if (nn.call(n3.typeMap[n3.kind || "fallback"], n3.tag))
      c3 = n3.typeMap[n3.kind || "fallback"][n3.tag];
    else
      for (c3 = null, d3 = n3.typeMap.multi[n3.kind || "fallback"], t = 0, y = d3.length; t < y; t += 1)
        if (n3.tag.slice(0, d3[t].tag.length) === d3[t].tag) {
          c3 = d3[t];
          break;
        }
    c3 || b3(n3, "unknown tag !<" + n3.tag + ">"), n3.result !== null && c3.kind !== n3.kind && b3(n3, "unacceptable node kind for !<" + n3.tag + '> tag; it should be "' + c3.kind + '", not "' + n3.kind + '"'), c3.resolve(n3.result, n3.tag) ? (n3.result = c3.construct(n3.result, n3.tag), n3.anchor !== null && (n3.anchorMap[n3.anchor] = n3.result)) : b3(n3, "cannot resolve a node with !<" + n3.tag + "> explicit tag");
  }
  return n3.listener !== null && n3.listener("close", n3), n3.tag !== null || n3.anchor !== null || r;
}
function bs(n3) {
  var e = n3.position, i, u3, a, o3 = false, g3;
  for (n3.version = null, n3.checkLineBreaks = n3.legacy, n3.tagMap = /* @__PURE__ */ Object.create(null), n3.anchorMap = /* @__PURE__ */ Object.create(null); (g3 = n3.input.charCodeAt(n3.position)) !== 0 && (Z(n3, true, -1), g3 = n3.input.charCodeAt(n3.position), !(n3.lineIndent > 0 || g3 !== 37)); ) {
    for (o3 = true, g3 = n3.input.charCodeAt(++n3.position), i = n3.position; g3 !== 0 && !B(g3); )
      g3 = n3.input.charCodeAt(++n3.position);
    for (u3 = n3.input.slice(i, n3.position), a = [], u3.length < 1 && b3(n3, "directive name must not be less than one character in length"); g3 !== 0; ) {
      for (; gn(g3); )
        g3 = n3.input.charCodeAt(++n3.position);
      if (g3 === 35) {
        do
          g3 = n3.input.charCodeAt(++n3.position);
        while (g3 !== 0 && !R(g3));
        break;
      }
      if (R(g3))
        break;
      for (i = n3.position; g3 !== 0 && !B(g3); )
        g3 = n3.input.charCodeAt(++n3.position);
      a.push(n3.input.slice(i, n3.position));
    }
    g3 !== 0 && Ie(n3), nn.call(Yi, u3) ? Yi[u3](n3, u3, a) : Vn(n3, 'unknown document directive "' + u3 + '"');
  }
  if (Z(n3, true, -1), n3.lineIndent === 0 && n3.input.charCodeAt(n3.position) === 45 && n3.input.charCodeAt(n3.position + 1) === 45 && n3.input.charCodeAt(n3.position + 2) === 45 ? (n3.position += 3, Z(n3, true, -1)) : o3 && b3(n3, "directives end mark is expected"), Yn(n3, n3.lineIndent - 1, $n, false, true), Z(n3, true, -1), n3.checkLineBreaks && Vg.test(n3.input.slice(e, n3.position)) && Vn(n3, "non-ASCII line breaks are interpreted as content"), n3.documents.push(n3.result), n3.position === n3.lineStart && oe(n3)) {
    n3.input.charCodeAt(n3.position) === 46 && (n3.position += 3, Z(n3, true, -1));
    return;
  }
  if (n3.position < n3.length - 1)
    b3(n3, "end of the stream or a document separator is expected");
  else
    return;
}
function Wa(n3, e) {
  n3 = String(n3), e = e || {}, n3.length !== 0 && (n3.charCodeAt(n3.length - 1) !== 10 && n3.charCodeAt(n3.length - 1) !== 13 && (n3 += `
`), n3.charCodeAt(0) === 65279 && (n3 = n3.slice(1)));
  var i = new us(n3, e), u3 = n3.indexOf("\0");
  for (u3 !== -1 && (i.position = u3, b3(i, "null byte is not allowed in input")), i.input += "\0"; i.input.charCodeAt(i.position) === 32; )
    i.lineIndent += 1, i.position += 1;
  for (; i.position < i.length - 1; )
    bs(i);
  return i.documents;
}
function cs(n3, e, i) {
  e !== null && typeof e == "object" && typeof i > "u" && (i = e, e = null);
  var u3 = Wa(n3, i);
  if (typeof e != "function")
    return u3;
  for (var a = 0, o3 = u3.length; a < o3; a += 1)
    e(u3[a]);
}
function ws(n3, e) {
  var i = Wa(n3, e);
  if (i.length !== 0) {
    if (i.length === 1)
      return i[0];
    throw new T("expected a single document in the stream, but found more");
  }
}
var ps = cs;
var js = ws;
var Ka = {
  loadAll: ps,
  load: js
};
var Ra = Object.prototype.toString;
var va = Object.prototype.hasOwnProperty;
var Ue = 65279;
var ms = 9;
var Tn = 10;
var Ys = 13;
var fs2 = 32;
var Ls = 33;
var Zs = 34;
var Se = 35;
var Ss = 37;
var Cs = 38;
var Js = 39;
var ks = 42;
var Oa = 44;
var Ds = 45;
var qn = 58;
var Xs = 61;
var Ts = 62;
var Hs = 63;
var Fs = 64;
var _a = 91;
var Ia = 93;
var Ms = 96;
var za = 123;
var Qs = 124;
var Ua = 125;
var k = {};
k[0] = "\\0";
k[7] = "\\a";
k[8] = "\\b";
k[9] = "\\t";
k[10] = "\\n";
k[11] = "\\v";
k[12] = "\\f";
k[13] = "\\r";
k[27] = "\\e";
k[34] = '\\"';
k[92] = "\\\\";
k[133] = "\\N";
k[160] = "\\_";
k[8232] = "\\L";
k[8233] = "\\P";
var Bs = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var xs = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function Ns(n3, e) {
  var i, u3, a, o3, g3, s3, h;
  if (e === null)
    return {};
  for (i = {}, u3 = Object.keys(e), a = 0, o3 = u3.length; a < o3; a += 1)
    g3 = u3[a], s3 = String(e[g3]), g3.slice(0, 2) === "!!" && (g3 = "tag:yaml.org,2002:" + g3.slice(2)), h = n3.compiledTypeMap.fallback[g3], h && va.call(h.styleAliases, s3) && (s3 = h.styleAliases[s3]), i[g3] = s3;
  return i;
}
function Gs(n3) {
  var e, i, u3;
  if (e = n3.toString(16).toUpperCase(), n3 <= 255)
    i = "x", u3 = 2;
  else if (n3 <= 65535)
    i = "u", u3 = 4;
  else if (n3 <= 4294967295)
    i = "U", u3 = 8;
  else
    throw new T("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + i + S.repeat("0", u3 - e.length) + e;
}
var Ps = 1;
var Hn = 2;
function Es(n3) {
  this.schema = n3.schema || _e, this.indent = Math.max(1, n3.indent || 2), this.noArrayIndent = n3.noArrayIndent || false, this.skipInvalid = n3.skipInvalid || false, this.flowLevel = S.isNothing(n3.flowLevel) ? -1 : n3.flowLevel, this.styleMap = Ns(this.schema, n3.styles || null), this.sortKeys = n3.sortKeys || false, this.lineWidth = n3.lineWidth || 80, this.noRefs = n3.noRefs || false, this.noCompatMode = n3.noCompatMode || false, this.condenseFlow = n3.condenseFlow || false, this.quotingType = n3.quotingType === '"' ? Hn : Ps, this.forceQuotes = n3.forceQuotes || false, this.replacer = typeof n3.replacer == "function" ? n3.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function Zi(n3, e) {
  for (var i = S.repeat(" ", e), u3 = 0, a = -1, o3 = "", g3, s3 = n3.length; u3 < s3; )
    a = n3.indexOf(`
`, u3), a === -1 ? (g3 = n3.slice(u3), u3 = s3) : (g3 = n3.slice(u3, a + 1), u3 = a + 1), g3.length && g3 !== `
` && (o3 += i), o3 += g3;
  return o3;
}
function Ce(n3, e) {
  return `
` + S.repeat(" ", n3.indent * e);
}
function As(n3, e) {
  var i, u3, a;
  for (i = 0, u3 = n3.implicitTypes.length; i < u3; i += 1)
    if (a = n3.implicitTypes[i], a.resolve(e))
      return true;
  return false;
}
function ne(n3) {
  return n3 === fs2 || n3 === ms;
}
function Fn(n3) {
  return 32 <= n3 && n3 <= 126 || 161 <= n3 && n3 <= 55295 && n3 !== 8232 && n3 !== 8233 || 57344 <= n3 && n3 <= 65533 && n3 !== Ue || 65536 <= n3 && n3 <= 1114111;
}
function Si(n3) {
  return Fn(n3) && n3 !== Ue && n3 !== Ys && n3 !== Tn;
}
function Ci(n3, e, i) {
  var u3 = Si(n3), a = u3 && !ne(n3);
  return (
    // ns-plain-safe
    (i ? (
      // c = flow-in
      u3
    ) : u3 && n3 !== Oa && n3 !== _a && n3 !== Ia && n3 !== za && n3 !== Ua) && n3 !== Se && !(e === qn && !a) || Si(e) && !ne(e) && n3 === Se || e === qn && a
  );
}
function Ws(n3) {
  return Fn(n3) && n3 !== Ue && !ne(n3) && n3 !== Ds && n3 !== Hs && n3 !== qn && n3 !== Oa && n3 !== _a && n3 !== Ia && n3 !== za && n3 !== Ua && n3 !== Se && n3 !== Cs && n3 !== ks && n3 !== Ls && n3 !== Qs && n3 !== Xs && n3 !== Ts && n3 !== Js && n3 !== Zs && n3 !== Ss && n3 !== Fs && n3 !== Ms;
}
function Ks(n3) {
  return !ne(n3) && n3 !== qn;
}
function Cn(n3, e) {
  var i = n3.charCodeAt(e), u3;
  return i >= 55296 && i <= 56319 && e + 1 < n3.length && (u3 = n3.charCodeAt(e + 1), u3 >= 56320 && u3 <= 57343) ? (i - 55296) * 1024 + u3 - 56320 + 65536 : i;
}
function $a(n3) {
  var e = /^\n* /;
  return e.test(n3);
}
var Va = 1;
var Je = 2;
var qa = 3;
var nu = 4;
var tn = 5;
function Rs(n3, e, i, u3, a, o3, g3, s3) {
  var h, l = 0, r = null, t = false, y = false, d3 = u3 !== -1, c3 = -1, w2 = Ws(Cn(n3, 0)) && Ks(Cn(n3, n3.length - 1));
  if (e || g3)
    for (h = 0; h < n3.length; l >= 65536 ? h += 2 : h++) {
      if (l = Cn(n3, h), !Fn(l))
        return tn;
      w2 = w2 && Ci(l, r, s3), r = l;
    }
  else {
    for (h = 0; h < n3.length; l >= 65536 ? h += 2 : h++) {
      if (l = Cn(n3, h), l === Tn)
        t = true, d3 && (y = y || // Foldable line = too long, and not more-indented.
        h - c3 - 1 > u3 && n3[c3 + 1] !== " ", c3 = h);
      else if (!Fn(l))
        return tn;
      w2 = w2 && Ci(l, r, s3), r = l;
    }
    y = y || d3 && h - c3 - 1 > u3 && n3[c3 + 1] !== " ";
  }
  return !t && !y ? w2 && !g3 && !a(n3) ? Va : o3 === Hn ? tn : Je : i > 9 && $a(n3) ? tn : g3 ? o3 === Hn ? tn : Je : y ? nu : qa;
}
function vs(n3, e, i, u3, a) {
  n3.dump = function() {
    if (e.length === 0)
      return n3.quotingType === Hn ? '""' : "''";
    if (!n3.noCompatMode && (Bs.indexOf(e) !== -1 || xs.test(e)))
      return n3.quotingType === Hn ? '"' + e + '"' : "'" + e + "'";
    var o3 = n3.indent * Math.max(1, i), g3 = n3.lineWidth === -1 ? -1 : Math.max(Math.min(n3.lineWidth, 40), n3.lineWidth - o3), s3 = u3 || n3.flowLevel > -1 && i >= n3.flowLevel;
    function h(l) {
      return As(n3, l);
    }
    switch (Rs(
      e,
      s3,
      n3.indent,
      g3,
      h,
      n3.quotingType,
      n3.forceQuotes && !u3,
      a
    )) {
      case Va:
        return e;
      case Je:
        return "'" + e.replace(/'/g, "''") + "'";
      case qa:
        return "|" + Ji(e, n3.indent) + ki(Zi(e, o3));
      case nu:
        return ">" + Ji(e, n3.indent) + ki(Zi(Os(e, g3), o3));
      case tn:
        return '"' + _s(e) + '"';
      default:
        throw new T("impossible error: invalid scalar style");
    }
  }();
}
function Ji(n3, e) {
  var i = $a(n3) ? String(e) : "", u3 = n3[n3.length - 1] === `
`, a = u3 && (n3[n3.length - 2] === `
` || n3 === `
`), o3 = a ? "+" : u3 ? "" : "-";
  return i + o3 + `
`;
}
function ki(n3) {
  return n3[n3.length - 1] === `
` ? n3.slice(0, -1) : n3;
}
function Os(n3, e) {
  for (var i = /(\n+)([^\n]*)/g, u3 = function() {
    var l = n3.indexOf(`
`);
    return l = l !== -1 ? l : n3.length, i.lastIndex = l, Di(n3.slice(0, l), e);
  }(), a = n3[0] === `
` || n3[0] === " ", o3, g3; g3 = i.exec(n3); ) {
    var s3 = g3[1], h = g3[2];
    o3 = h[0] === " ", u3 += s3 + (!a && !o3 && h !== "" ? `
` : "") + Di(h, e), a = o3;
  }
  return u3;
}
function Di(n3, e) {
  if (n3 === "" || n3[0] === " ")
    return n3;
  for (var i = / [^ ]/g, u3, a = 0, o3, g3 = 0, s3 = 0, h = ""; u3 = i.exec(n3); )
    s3 = u3.index, s3 - a > e && (o3 = g3 > a ? g3 : s3, h += `
` + n3.slice(a, o3), a = o3 + 1), g3 = s3;
  return h += `
`, n3.length - a > e && g3 > a ? h += n3.slice(a, g3) + `
` + n3.slice(g3 + 1) : h += n3.slice(a), h.slice(1);
}
function _s(n3) {
  for (var e = "", i = 0, u3, a = 0; a < n3.length; i >= 65536 ? a += 2 : a++)
    i = Cn(n3, a), u3 = k[i], !u3 && Fn(i) ? (e += n3[a], i >= 65536 && (e += n3[a + 1])) : e += u3 || Gs(i);
  return e;
}
function Is(n3, e, i) {
  var u3 = "", a = n3.tag, o3, g3, s3;
  for (o3 = 0, g3 = i.length; o3 < g3; o3 += 1)
    s3 = i[o3], n3.replacer && (s3 = n3.replacer.call(i, String(o3), s3)), (v(n3, e, s3, false, false) || typeof s3 > "u" && v(n3, e, null, false, false)) && (u3 !== "" && (u3 += "," + (n3.condenseFlow ? "" : " ")), u3 += n3.dump);
  n3.tag = a, n3.dump = "[" + u3 + "]";
}
function Xi(n3, e, i, u3) {
  var a = "", o3 = n3.tag, g3, s3, h;
  for (g3 = 0, s3 = i.length; g3 < s3; g3 += 1)
    h = i[g3], n3.replacer && (h = n3.replacer.call(i, String(g3), h)), (v(n3, e + 1, h, true, true, false, true) || typeof h > "u" && v(n3, e + 1, null, true, true, false, true)) && ((!u3 || a !== "") && (a += Ce(n3, e)), n3.dump && Tn === n3.dump.charCodeAt(0) ? a += "-" : a += "- ", a += n3.dump);
  n3.tag = o3, n3.dump = a || "[]";
}
function zs(n3, e, i) {
  var u3 = "", a = n3.tag, o3 = Object.keys(i), g3, s3, h, l, r;
  for (g3 = 0, s3 = o3.length; g3 < s3; g3 += 1)
    r = "", u3 !== "" && (r += ", "), n3.condenseFlow && (r += '"'), h = o3[g3], l = i[h], n3.replacer && (l = n3.replacer.call(i, h, l)), v(n3, e, h, false, false) && (n3.dump.length > 1024 && (r += "? "), r += n3.dump + (n3.condenseFlow ? '"' : "") + ":" + (n3.condenseFlow ? "" : " "), v(n3, e, l, false, false) && (r += n3.dump, u3 += r));
  n3.tag = a, n3.dump = "{" + u3 + "}";
}
function Us(n3, e, i, u3) {
  var a = "", o3 = n3.tag, g3 = Object.keys(i), s3, h, l, r, t, y;
  if (n3.sortKeys === true)
    g3.sort();
  else if (typeof n3.sortKeys == "function")
    g3.sort(n3.sortKeys);
  else if (n3.sortKeys)
    throw new T("sortKeys must be a boolean or a function");
  for (s3 = 0, h = g3.length; s3 < h; s3 += 1)
    y = "", (!u3 || a !== "") && (y += Ce(n3, e)), l = g3[s3], r = i[l], n3.replacer && (r = n3.replacer.call(i, l, r)), v(n3, e + 1, l, true, true, true) && (t = n3.tag !== null && n3.tag !== "?" || n3.dump && n3.dump.length > 1024, t && (n3.dump && Tn === n3.dump.charCodeAt(0) ? y += "?" : y += "? "), y += n3.dump, t && (y += Ce(n3, e)), v(n3, e + 1, r, true, t) && (n3.dump && Tn === n3.dump.charCodeAt(0) ? y += ":" : y += ": ", y += n3.dump, a += y));
  n3.tag = o3, n3.dump = a || "{}";
}
function Ti(n3, e, i) {
  var u3, a, o3, g3, s3, h;
  for (a = i ? n3.explicitTypes : n3.implicitTypes, o3 = 0, g3 = a.length; o3 < g3; o3 += 1)
    if (s3 = a[o3], (s3.instanceOf || s3.predicate) && (!s3.instanceOf || typeof e == "object" && e instanceof s3.instanceOf) && (!s3.predicate || s3.predicate(e))) {
      if (i ? s3.multi && s3.representName ? n3.tag = s3.representName(e) : n3.tag = s3.tag : n3.tag = "?", s3.represent) {
        if (h = n3.styleMap[s3.tag] || s3.defaultStyle, Ra.call(s3.represent) === "[object Function]")
          u3 = s3.represent(e, h);
        else if (va.call(s3.represent, h))
          u3 = s3.represent[h](e, h);
        else
          throw new T("!<" + s3.tag + '> tag resolver accepts not "' + h + '" style');
        n3.dump = u3;
      }
      return true;
    }
  return false;
}
function v(n3, e, i, u3, a, o3, g3) {
  n3.tag = null, n3.dump = i, Ti(n3, i, false) || Ti(n3, i, true);
  var s3 = Ra.call(n3.dump), h = u3, l;
  u3 && (u3 = n3.flowLevel < 0 || n3.flowLevel > e);
  var r = s3 === "[object Object]" || s3 === "[object Array]", t, y;
  if (r && (t = n3.duplicates.indexOf(i), y = t !== -1), (n3.tag !== null && n3.tag !== "?" || y || n3.indent !== 2 && e > 0) && (a = false), y && n3.usedDuplicates[t])
    n3.dump = "*ref_" + t;
  else {
    if (r && y && !n3.usedDuplicates[t] && (n3.usedDuplicates[t] = true), s3 === "[object Object]")
      u3 && Object.keys(n3.dump).length !== 0 ? (Us(n3, e, n3.dump, a), y && (n3.dump = "&ref_" + t + n3.dump)) : (zs(n3, e, n3.dump), y && (n3.dump = "&ref_" + t + " " + n3.dump));
    else if (s3 === "[object Array]")
      u3 && n3.dump.length !== 0 ? (n3.noArrayIndent && !g3 && e > 0 ? Xi(n3, e - 1, n3.dump, a) : Xi(n3, e, n3.dump, a), y && (n3.dump = "&ref_" + t + n3.dump)) : (Is(n3, e, n3.dump), y && (n3.dump = "&ref_" + t + " " + n3.dump));
    else if (s3 === "[object String]")
      n3.tag !== "?" && vs(n3, n3.dump, e, o3, h);
    else {
      if (s3 === "[object Undefined]")
        return false;
      if (n3.skipInvalid)
        return false;
      throw new T("unacceptable kind of an object to dump " + s3);
    }
    n3.tag !== null && n3.tag !== "?" && (l = encodeURI(
      n3.tag[0] === "!" ? n3.tag.slice(1) : n3.tag
    ).replace(/!/g, "%21"), n3.tag[0] === "!" ? l = "!" + l : l.slice(0, 18) === "tag:yaml.org,2002:" ? l = "!!" + l.slice(18) : l = "!<" + l + ">", n3.dump = l + " " + n3.dump);
  }
  return true;
}
function $s(n3, e) {
  var i = [], u3 = [], a, o3;
  for (ke(n3, i, u3), a = 0, o3 = u3.length; a < o3; a += 1)
    e.duplicates.push(i[u3[a]]);
  e.usedDuplicates = new Array(o3);
}
function ke(n3, e, i) {
  var u3, a, o3;
  if (n3 !== null && typeof n3 == "object")
    if (a = e.indexOf(n3), a !== -1)
      i.indexOf(a) === -1 && i.push(a);
    else if (e.push(n3), Array.isArray(n3))
      for (a = 0, o3 = n3.length; a < o3; a += 1)
        ke(n3[a], e, i);
    else
      for (u3 = Object.keys(n3), a = 0, o3 = u3.length; a < o3; a += 1)
        ke(n3[u3[a]], e, i);
}
function Vs(n3, e) {
  e = e || {};
  var i = new Es(e);
  i.noRefs || $s(n3, i);
  var u3 = n3;
  return i.replacer && (u3 = i.replacer.call({ "": u3 }, "", u3)), v(i, 0, u3, true, true) ? i.dump + `
` : "";
}
var qs = Vs;
var nh = {
  dump: qs
};
function $e(n3, e) {
  return function() {
    throw new Error("Function yaml." + n3 + " is removed in js-yaml 4. Use yaml." + e + " instead, which is now safe by default.");
  };
}
var eh = C;
var ih = wa;
var ah = Ya;
var uh = Ca;
var oh = Ja;
var gh = _e;
var sh = Ka.load;
var hh = Ka.loadAll;
var lh = nh.dump;
var th = T;
var rh = {
  binary: Ha,
  float: Sa,
  map: ma,
  null: fa,
  pairs: Ma,
  set: Qa,
  timestamp: Xa,
  bool: La,
  int: Za,
  merge: Ta,
  omap: Fa,
  seq: ja,
  str: pa
};
var yh = $e("safeLoad", "load");
var dh = $e("safeLoadAll", "loadAll");
var bh = $e("safeDump", "dump");
var ye = {
  Type: eh,
  Schema: ih,
  FAILSAFE_SCHEMA: ah,
  JSON_SCHEMA: uh,
  CORE_SCHEMA: oh,
  DEFAULT_SCHEMA: gh,
  load: sh,
  loadAll: hh,
  dump: lh,
  YAMLException: th,
  types: rh,
  safeLoad: yh,
  safeLoadAll: dh,
  safeDump: bh
};
var Hi = class {
  /**
   * yaml转对象
   *
   * @param content - 待处理的包含YAML的字符串
   */
  static yaml2Obj(e) {
    const i = this.extractFrontmatter(e);
    let u3 = ye.load(i, {});
    return u3 || (u3 = {}), u3;
  }
  /**
   * 将 YAML 文档的内容解析为对象
   *
   * @param content - YAML 文档的内容
   * @returns 解析后的对象
   * @throws 如果找不到 YAML 分隔符，则抛出错误
   */
  static async yaml2ObjAsync(e) {
    const u3 = this.extractFrontmatter(e, true).match(this.YAML_REGEX);
    if (u3) {
      const a = u3[1];
      try {
        return ye.load(a);
      } catch {
        throw new Error("\u65E0\u6CD5\u89E3\u6790 YAML \u5185\u5BB9");
      }
    } else
      throw new Error("\u627E\u4E0D\u5230 YAML \u5206\u9694\u7B26\uFF01");
  }
  /**
   * 对象转yaml字符串
   *
   * @param obj
   */
  static obj2Yaml(e) {
    let i = ye.dump(e, {});
    return i = Mn.appendStr(`---
`, i, "---"), i;
  }
  /**
   * 提取正文前置数据的静态公共方法
   *
   * @param content - 包含正文和前置数据的字符串
   * @param addSign - 是否包含符号
   */
  static extractFrontmatter(e, i) {
    const u3 = e.match(this.YAML_REGEX);
    if (u3) {
      let a = u3[1].trim();
      return i && (a = `---
${a}
---`), a;
    } else
      return "";
  }
  /**
   * 提取正文
   *
   * @param content - 包含正文和前置数据的字符串
   */
  static extractMarkdown(e) {
    let i = e;
    return this.YAML_REGEX.test(e) && (i = e.replace(this.YAML_REGEX, ""), this.logger.info("\u53D1\u73B0\u539F\u6709\u7684YAML\uFF0C\u5DF2\u79FB\u9664")), i;
  }
  /**
   * 将 YAML 头部添加到 Markdown 内容中
   *
   * @param yaml - 要添加的 YAML 头部
   * @param content - 原始的 Markdown 内容
   * @returns 更新后的 Markdown 内容
   */
  static addYamlToMd(e, i) {
    const u3 = this.extractMarkdown(i);
    return `${e}
${u3}`;
  }
};
G(Hi, "logger", Qn("yaml-util")), G(Hi, "YAML_REGEX", /^-{3}\n([\s\S]*?\n)-{3}/);
var Rn = [["\0", "", "", "", "", "", "", "\x07", "\b", "	", `
`, "\v", "\f", "\r", "", "", "", "", "", "", "", "", "", "", "", "", "", "\x1B", "", "", "", "", " ", "!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "\x7F", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , " ", "!", "C/", "PS", "$?", "Y=", "|", "SS", '"', "(c)", "a", "<<", "!", , "(r)", "-", "deg", "+-", "2", "3", "'", "u", "P", "*", ",", "1", "o", ">>", "1/4", "1/2", "3/4", "?", "A", "A", "A", "A", "A", "A", "AE", "C", "E", "E", "E", "E", "I", "I", "I", "I", "D", "N", "O", "O", "O", "O", "O", "x", "O", "U", "U", "U", "U", "U", "Th", "ss", "a", "a", "a", "a", "a", "a", "ae", "c", "e", "e", "e", "e", "i", "i", "i", "i", "d", "n", "o", "o", "o", "o", "o", "/", "o", "u", "u", "u", "u", "y", "th", "y"], ["A", "a", "A", "a", "A", "a", "C", "c", "C", "c", "C", "c", "C", "c", "D", "d", "D", "d", "E", "e", "E", "e", "E", "e", "E", "e", "E", "e", "G", "g", "G", "g", "G", "g", "G", "g", "H", "h", "H", "h", "I", "i", "I", "i", "I", "i", "I", "i", "I", "i", "IJ", "ij", "J", "j", "K", "k", "k", "L", "l", "L", "l", "L", "l", "L", "l", "L", "l", "N", "n", "N", "n", "N", "n", "'n", "NG", "ng", "O", "o", "O", "o", "O", "o", "OE", "oe", "R", "r", "R", "r", "R", "r", "S", "s", "S", "s", "S", "s", "S", "s", "T", "t", "T", "t", "T", "t", "U", "u", "U", "u", "U", "u", "U", "u", "U", "u", "U", "u", "W", "w", "Y", "y", "Y", "Z", "z", "Z", "z", "Z", "z", "s", "b", "B", "B", "b", "6", "6", "O", "C", "c", "D", "D", "D", "d", "d", "3", "@", "E", "F", "f", "G", "G", "hv", "I", "I", "K", "k", "l", "l", "W", "N", "n", "O", "O", "o", "OI", "oi", "P", "p", "YR", "2", "2", "SH", "sh", "t", "T", "t", "T", "U", "u", "Y", "V", "Y", "y", "Z", "z", "ZH", "ZH", "zh", "zh", "2", "5", "5", "ts", "w", "|", "||", "|=", "!", "DZ", "Dz", "dz", "LJ", "Lj", "lj", "NJ", "Nj", "nj", "A", "a", "I", "i", "O", "o", "U", "u", "U", "u", "U", "u", "U", "u", "U", "u", "@", "A", "a", "A", "a", "AE", "ae", "G", "g", "G", "g", "K", "k", "O", "o", "O", "o", "ZH", "zh", "j", "DZ", "D", "dz", "G", "g", "HV", "W", "N", "n", "A", "a", "AE", "ae", "O", "o"], ["A", "a", "A", "a", "E", "e", "E", "e", "I", "i", "I", "i", "O", "o", "O", "o", "R", "r", "R", "r", "U", "u", "U", "u", "S", "s", "T", "t", "Y", "y", "H", "h", "N", "d", "OU", "ou", "Z", "z", "A", "a", "E", "e", "O", "o", "O", "o", "O", "o", "O", "o", "Y", "y", "l", "n", "t", "j", "db", "qp", "A", "C", "c", "L", "T", "s", "z", "?", "?", "B", "U", "V", "E", "e", "J", "j", "Q", "q", "R", "r", "Y", "y", "a", "a", "a", "b", "o", "c", "d", "d", "e", "@", "@", "e", "e", "e", "e", "j", "g", "g", "g", "g", "u", "Y", "h", "h", "i", "i", "I", "l", "l", "l", "lZ", "W", "W", "m", "n", "n", "n", "o", "OE", "O", "F", "R", "R", "R", "R", "r", "r", "R", "R", "R", "s", "S", "j", "S", "S", "t", "t", "U", "U", "v", "^", "W", "Y", "Y", "z", "z", "Z", "Z", "?", "?", "?", "C", "@", "B", "E", "G", "H", "j", "k", "L", "q", "?", "?", "dz", "dZ", "dz", "ts", "tS", "tC", "fN", "ls", "lz", "WW", "]]", "h", "h", "k", "h", "j", "r", "r", "r", "r", "w", "y", "'", '"', "`", "'", "`", "`", "'", "?", "?", "<", ">", "^", "V", "^", "V", "'", "-", "/", "\\", ",", "_", "\\", "/", ":", ".", "`", "'", "^", "V", "+", "-", "V", ".", "@", ",", "~", '"', "R", "X", "G", "l", "s", "x", "?", , , , , , , , "V", "=", '"'], [, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "'", ",", , , , , , , , , "?", , , , , , , , "A", ";", "E", "I", "I", , "O", , "U", "O", "I", "A", "V", "G", "D", "E", "Z", "I", "Th", "I", "K", "L", "M", "N", "X", "O", "P", "R", , "S", "T", "Y", "F", "H", "Ps", "O", "I", "Y", "a", "e", "i", "i", "y", "a", "v", "g", "d", "e", "z", "i", "th", "i", "k", "l", "m", "n", "x", "o", "p", "r", "s", "s", "t", "y", "f", "h", "ps", "o", "i", "y", "o", "y", "o", , "b", "th", "U", "U", "U", "ph", "p", "&", , , "St", "st", "W", "w", "Q", "q", "Sp", "sp", "Sh", "sh", "F", "f", "Kh", "kh", "H", "h", "G", "g", "CH", "ch", "Ti", "ti", "k", "r", "c", "j"], ["Jo", "Yo", "Dj", "Gj", "Ie", "Dz", "I", "Yi", "J", "Lj", "Nj", "Tsh", "Kj", "I", "U", "Dzh", "A", "B", "V", "G", "D", "E", "Zh", "Z", "I", "Y", "K", "L", "M", "N", "O", "P", "R", "S", "T", "U", "F", "H", "C", "Ch", "Sh", "Shch", , "Y", , "E", "Yu", "Ya", "a", "b", "v", "g", "d", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "f", "h", "c", "ch", "sh", "shch", , "y", , "e", "yu", "ya", "je", "yo", "dj", "gj", "ie", "dz", "i", "yi", "j", "lj", "nj", "tsh", "kj", "i", "u", "dzh", "O", "o", "E", "e", "Ie", "ie", "E", "e", "Ie", "ie", "O", "o", "Io", "io", "Ks", "ks", "Ps", "ps", "F", "f", "Y", "y", "Y", "y", "u", "u", "O", "o", "O", "o", "Ot", "ot", "Q", "q", "*1000*", , , , , , "*100.000*", "*1.000.000*", , , '"', '"', "R'", "r'", "G'", "g'", "G'", "g'", "G'", "g'", "Zh'", "zh'", "Z'", "z'", "K'", "k'", "K'", "k'", "K'", "k'", "K'", "k'", "N'", "n'", "Ng", "ng", "P'", "p'", "Kh", "kh", "S'", "s'", "T'", "t'", "U", "u", "U'", "u'", "Kh'", "kh'", "Tts", "tts", "Ch'", "ch'", "Ch'", "ch'", "H", "h", "Ch", "ch", "Ch'", "ch'", "`", "Zh", "zh", "K'", "k'", , , "N'", "n'", , , "Ch", "ch", , , , "a", "a", "A", "a", "Ae", "ae", "Ie", "ie", "@", "@", "@", "@", "Zh", "zh", "Z", "z", "Dz", "dz", "I", "i", "I", "i", "O", "o", "O", "o", "O", "o", "E", "e", "U", "u", "U", "u", "U", "u", "Ch", "ch", , , "Y", "y"], [, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "A", "B", "G", "D", "E", "Z", "E", "E", "T`", "Zh", "I", "L", "Kh", "Ts", "K", "H", "Dz", "Gh", "Ch", "M", "Y", "N", "Sh", "O", "Ch`", "P", "J", "Rh", "S", "V", "T", "R", "Ts`", "W", "P`", "K`", "O", "F", , , "<", "'", "/", "!", ",", "?", ".", , "a", "b", "g", "d", "e", "z", "e", "e", "t`", "zh", "i", "l", "kh", "ts", "k", "h", "dz", "gh", "ch", "m", "y", "n", "sh", "o", "ch`", "p", "j", "rh", "s", "v", "t", "r", "ts`", "w", "p`", "k`", "o", "f", "ew", , ".", "-", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "@", "e", "a", "o", "i", "e", "e", "a", "a", "o", , "u", "'", , , , , , , ":", , , , , , , , , , , , , , "b", "g", "d", "h", "v", "z", "kh", "t", "y", "k", "k", "l", "m", "m", "n", "n", "s", "`", "p", "p", "ts", "ts", "q", "r", "sh", "t", , , , , , "V", "oy", "i", "'", '"'], [, , , , , , , , , , , , ",", , , , , , , , , , , , , , , ";", , , , "?", , , "a", "'", "w'", , "y'", , "b", "@", "t", "th", "j", "H", "kh", "d", "dh", "r", "z", "s", "sh", "S", "D", "T", "Z", "aa", "G", , , , , , , "f", "q", "k", "l", "m", "n", "h", "w", "~", "y", "an", "un", "in", "a", "u", "i", "W", , , "'", "'", , , , , , , , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "%", ".", ",", "*", , , , "'", "'", "'", , "'", "'w", "'u", "'y", "tt", "tth", "b", "t", "T", "p", "th", "bh", "'h", "H", "ny", "dy", "H", "ch", "cch", "dd", "D", "D", "Dt", "dh", "ddh", "d", "D", "D", "rr", "R", "R", "R", "R", "R", "R", "j", "R", "S", "S", "S", "S", "S", "T", "GH", "F", "F", "F", "v", "f", "ph", "Q", "Q", "kh", "k", "K", "K", "ng", "K", "g", "G", "N", "G", "G", "G", "L", "L", "L", "L", "N", "N", "N", "N", "N", "h", "Ch", "hy", "h", "H", "@", "W", "oe", "oe", "u", "yu", "yu", "W", "v", "y", "Y", "Y", "W", , , "y", "y'", ".", "ae", , , , , , , , "@", "#", , , , , , , , , , , "^", , , , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Sh", "D", "Gh", "&", "+m"], ["//", "/", ",", "!", "!", "-", ",", ",", ";", "?", "~", "{", "}", "*", , , "'", , "b", "g", "g", "d", "d", "h", "w", "z", "H", "t", "t", "y", "yh", "k", "l", "m", "n", "s", "s", "`", "p", "p", "S", "q", "r", "sh", "t", , , , "a", "a", "a", "A", "A", "A", "e", "e", "e", "E", "i", "i", "u", "u", "u", "o", , "`", "'", , , "X", "Q", "@", "@", "|", "+", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "h", "sh", "n", "r", "b", "L", "k", "'", "v", "m", "f", "dh", "th", "l", "g", "ny", "s", "d", "z", "t", "y", "p", "j", "ch", "tt", "hh", "kh", "th", "z", "sh", "s", "d", "t", "z", "`", "gh", "q", "w", "a", "aa", "i", "ee", "u", "oo", "e", "ey", "o", "oa"], [], [, "N", "N", "H", , "a", "aa", "i", "ii", "u", "uu", "R", "L", "eN", "e", "e", "ai", "oN", "o", "o", "au", "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", "nnn", "p", "ph", "b", "bh", "m", "y", "r", "rr", "l", "l", "lll", "v", "sh", "ss", "s", "h", , , "'", "'", "aa", "i", "ii", "u", "uu", "R", "RR", "eN", "e", "e", "ai", "oN", "o", "o", "au", , , , "AUM", "'", "'", "`", "'", , , , "q", "khh", "ghh", "z", "dddh", "rh", "f", "yy", "RR", "LL", "L", "LL", " / ", " // ", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", , , , , , , , , , , , , , , , , "N", "N", "H", , "a", "aa", "i", "ii", "u", "uu", "R", "RR", , , "e", "ai", , , "o", "au", "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", , "p", "ph", "b", "bh", "m", "y", "r", , "l", , , , "sh", "ss", "s", "h", , , "'", , "aa", "i", "ii", "u", "uu", "R", "RR", , , "e", "ai", , , "o", "au", , , , , , , , , , , "+", , , , , "rr", "rh", , "yy", "RR", "LL", "L", "LL", , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "r'", "r`", "Rs", "Rs", "1/", "2/", "3/", "4/", " 1 - 1/", "/16"], [, , "N", , , "a", "aa", "i", "ii", "u", "uu", , , , , "ee", "ai", , , "oo", "au", "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", , "p", "ph", "b", "bb", "m", "y", "r", , "l", "ll", , "v", "sh", , "s", "h", , , "'", , "aa", "i", "ii", "u", "uu", , , , , "ee", "ai", , , "oo", "au", , , , , , , , , , , , , "khh", "ghh", "z", "rr", , "f", , , , , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "N", "H", , , "G.E.O.", , , , , , , , , , , , , "N", "N", "H", , "a", "aa", "i", "ii", "u", "uu", "R", , "eN", , "e", "ai", "oN", , "o", "au", "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", , "p", "ph", "b", "bh", "m", "ya", "r", , "l", "ll", , "v", "sh", "ss", "s", "h", , , "'", "'", "aa", "i", "ii", "u", "uu", "R", "RR", "eN", , "e", "ai", "oN", , "o", "au", , , , "AUM", , , , , , , , , , , , , , , , "RR", , , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], [, "N", "N", "H", , "a", "aa", "i", "ii", "u", "uu", "R", "L", , , "e", "ai", , , "o", "au", "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", , "p", "ph", "b", "bh", "m", "y", "r", , "l", "ll", , , "sh", "ss", "s", "h", , , "'", "'", "aa", "i", "ii", "u", "uu", "R", , , , "e", "ai", , , "o", "au", , , , , , , , , , "+", "+", , , , , "rr", "rh", , "yy", "RR", "LL", , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", , , , , , , , , , , , , , , , , , , "N", "H", , "a", "aa", "i", "ii", "u", "uu", , , , "e", "ee", "ai", , "o", "oo", "au", "k", , , , "ng", "c", , "j", , "ny", "tt", , , , "nn", "t", , , , "n", "nnn", "p", , , , "m", "y", "r", "rr", "l", "ll", "lll", "v", , "ss", "s", "h", , , , , "aa", "i", "ii", "u", "uu", , , , "e", "ee", "ai", , "o", "oo", "au", , , , , , , , , , , "+", , , , , , , , , , , , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+10+", "+100+", "+1000+"], [, "N", "N", "H", , "a", "aa", "i", "ii", "u", "uu", "R", "L", , "e", "ee", "ai", , "o", "oo", "au", "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", , "p", "ph", "b", "bh", "m", "y", "r", "rr", "l", "ll", , "v", "sh", "ss", "s", "h", , , , , "aa", "i", "ii", "u", "uu", "R", "RR", , "e", "ee", "ai", , "o", "oo", "au", , , , , , , , , "+", "+", , , , , , , , , , "RR", "LL", , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", , , , , , , , , , , , , , , , , , , "N", "H", , "a", "aa", "i", "ii", "u", "uu", "R", "L", , "e", "ee", "ai", , "o", "oo", "au", "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", , "p", "ph", "b", "bh", "m", "y", "r", "rr", "l", "ll", , "v", "sh", "ss", "s", "h", , , , , "aa", "i", "ii", "u", "uu", "R", "RR", , "e", "ee", "ai", , "o", "oo", "au", , , , , , , , , "+", "+", , , , , , , , "lll", , "RR", "LL", , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], [, , "N", "H", , "a", "aa", "i", "ii", "u", "uu", "R", "L", , "e", "ee", "ai", , "o", "oo", "au", "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", , "p", "ph", "b", "bh", "m", "y", "r", "rr", "l", "ll", "lll", "v", "sh", "ss", "s", "h", , , , , "aa", "i", "ii", "u", "uu", "R", , , "e", "ee", "ai", , "o", "oo", "au", , , , , , , , , , , "+", , , , , , , , , "RR", "LL", , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", , , , , , , , , , , , , , , , , , , "N", "H", , "a", "aa", "ae", "aae", "i", "ii", "u", "uu", "R", "RR", "L", "LL", "e", "ee", "ai", "o", "oo", "au", , , , "k", "kh", "g", "gh", "ng", "nng", "c", "ch", "j", "jh", "ny", "jny", "nyj", "tt", "tth", "dd", "ddh", "nn", "nndd", "t", "th", "d", "dh", "n", , "nd", "p", "ph", "b", "bh", "m", "mb", "y", "r", , "l", , , "v", "sh", "ss", "s", "h", "ll", "f", , , , , , , , , "aa", "ae", "aae", "i", "ii", "u", , "uu", , "R", "e", "ee", "ai", "o", "oo", "au", "L", , , , , , , , , , , , , , , , , , , "RR", "LL", " . "], [, "k", "kh", "kh", "kh", "kh", "kh", "ng", "cch", "ch", "ch", "ch", "ch", "y", "d", "t", "th", "th", "th", "n", "d", "t", "th", "th", "th", "n", "b", "p", "ph", "f", "ph", "f", "ph", "m", "y", "r", "R", "l", "L", "w", "s", "s", "s", "h", "l", "`", "h", "~", "a", "a", "aa", "am", "i", "ii", "ue", "uue", "u", "uu", "'", , , , , "Bh.", "e", "ae", "o", "ai", "ai", "ao", "+", , , , , , , "M", , " * ", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", " // ", " /// ", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "k", "kh", , "kh", , , "ng", "ch", , "s", , , "ny", , , , , , , "d", "h", "th", "th", , "n", "b", "p", "ph", "f", "ph", "f", , "m", "y", "r", , "l", , "w", , , "s", "h", , "`", , "~", "a", , "aa", "am", "i", "ii", "y", "yy", "u", "uu", , "o", "l", "ny", , , "e", "ei", "o", "ay", "ai", , "+", , , , , , , "M", , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", , , "hn", "hm"], ["AUM", , , , , , , , " // ", " * ", , "-", " / ", " / ", " // ", " -/ ", " +/ ", " X/ ", " /XX/ ", " /X/ ", ",", , , , , , , , , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".5", "1.5", "2.5", "3.5", "4.5", "5.5", "6.5", "7.5", "8.5", "-.5", "+", "*", "^", "_", , "~", , "]", "[[", "]]", , , "k", "kh", "g", "gh", "ng", "c", "ch", "j", , "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", "p", "ph", "b", "bh", "m", "ts", "tsh", "dz", "dzh", "w", "zh", "z", "'", "y", "r", "l", "sh", "ssh", "s", "h", "a", "kss", "r", , , , , , , "aa", "i", "ii", "u", "uu", "R", "RR", "L", "LL", "e", "ee", "o", "oo", "M", "H", "i", "ii", , , , , , , , , , , , , , , "k", "kh", "g", "gh", "ng", "c", "ch", "j", , "ny", "tt", "tth", "dd", "ddh", "nn", "t", "th", "d", "dh", "n", "p", "ph", "b", "bh", "m", "ts", "tsh", "dz", "dzh", "w", "zh", "z", "'", "y", "r", "l", "sh", "ss", "s", "h", "a", "kss", "w", "y", "r", , "X", " :X: ", " /O/ ", " /o/ ", " \\o\\ ", " (O) "], ["k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "nny", "tt", "tth", "dd", "ddh", "nn", "tt", "th", "d", "dh", "n", "p", "ph", "b", "bh", "m", "y", "r", "l", "w", "s", "h", "ll", "a", , "i", "ii", "u", "uu", "e", , "o", "au", , "aa", "i", "ii", "u", "uu", "e", "ai", , , , "N", "'", ":", , , , , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", " / ", " // ", "n*", "r*", "l*", "e*", "sh", "ss", "R", "RR", "L", "LL", "R", "RR", "L", "LL", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "A", "B", "G", "D", "E", "V", "Z", "T`", "I", "K", "L", "M", "N", "O", "P", "Zh", "R", "S", "T", "U", "P`", "K`", "G'", "Q", "Sh", "Ch`", "C`", "Z'", "C", "Ch", "X", "J", "H", "E", "Y", "W", "Xh", "OE", , , , , , , , , , , "a", "b", "g", "d", "e", "v", "z", "t`", "i", "k", "l", "m", "n", "o", "p", "zh", "r", "s", "t", "u", "p`", "k`", "g'", "q", "sh", "ch`", "c`", "z'", "c", "ch", "x", "j", "h", "e", "y", "w", "xh", "oe", "f", , , , , " // "], ["g", "gg", "n", "d", "dd", "r", "m", "b", "bb", "s", "ss", , "j", "jj", "c", "k", "t", "p", "h", "ng", "nn", "nd", "nb", "dg", "rn", "rr", "rh", "rN", "mb", "mN", "bg", "bn", , "bs", "bsg", "bst", "bsb", "bss", "bsj", "bj", "bc", "bt", "bp", "bN", "bbN", "sg", "sn", "sd", "sr", "sm", "sb", "sbg", "sss", "s", "sj", "sc", "sk", "st", "sp", "sh", , , , , "Z", "g", "d", "m", "b", "s", "Z", , "j", "c", "t", "p", "N", "j", , , , , "ck", "ch", , , "pb", "pN", "hh", "Q", , , , , , , , "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "weo", "we", "wi", "yu", "eu", "yi", "i", "a-o", "a-u", "ya-o", "ya-yo", "eo-o", "eo-u", "eo-eu", "yeo-o", "yeo-u", "o-eo", "o-e", "o-ye", "o-o", "o-u", "yo-ya", "yo-yae", "yo-yeo", "yo-o", "yo-i", "u-a", "u-ae", "u-eo-eu", "u-ye", "u-u", "yu-a", "yu-eo", "yu-e", "yu-yeo", "yu-ye", "yu-u", "yu-i", "eu-u", "eu-eu", "yi-u", "i-a", "i-ya", "i-o", "i-u", "i-eu", "i-U", "U", "U-eo", "U-u", "U-i", "UU", , , , , , "g", "gg", "gs", "n", "nj", "nh", "d", "l", "lg", "lm", "lb", "ls", "lt", "lp", "lh", "m", "b", "bs", "s", "ss", "ng", "j", "c", "k", "t", "p", "h", "gl", "gsg", "ng", "nd", "ns", "nZ", "nt", "dg", "tl", "lgs", "ln", "ld", "lth", "ll", "lmg", "lms", "lbs", "lbh", "rNp", "lss", "lZ", "lk", "lQ", "mg", "ml", "mb", "ms", "mss", "mZ", "mc", "mh", "mN", "bl", "bp", "ph", "pN", "sg", "sd", "sl", "sb", "Z", "g", "ss", , "kh", "N", "Ns", "NZ", "pb", "pN", "hn", "hl", "hm", "hb", "Q"], ["ha", "hu", "hi", "haa", "hee", "he", "ho", , "la", "lu", "li", "laa", "lee", "le", "lo", "lwa", "hha", "hhu", "hhi", "hhaa", "hhee", "hhe", "hho", "hhwa", "ma", "mu", "mi", "maa", "mee", "me", "mo", "mwa", "sza", "szu", "szi", "szaa", "szee", "sze", "szo", "szwa", "ra", "ru", "ri", "raa", "ree", "re", "ro", "rwa", "sa", "su", "si", "saa", "see", "se", "so", "swa", "sha", "shu", "shi", "shaa", "shee", "she", "sho", "shwa", "qa", "qu", "qi", "qaa", "qee", "qe", "qo", , "qwa", , "qwi", "qwaa", "qwee", "qwe", , , "qha", "qhu", "qhi", "qhaa", "qhee", "qhe", "qho", , "qhwa", , "qhwi", "qhwaa", "qhwee", "qhwe", , , "ba", "bu", "bi", "baa", "bee", "be", "bo", "bwa", "va", "vu", "vi", "vaa", "vee", "ve", "vo", "vwa", "ta", "tu", "ti", "taa", "tee", "te", "to", "twa", "ca", "cu", "ci", "caa", "cee", "ce", "co", "cwa", "xa", "xu", "xi", "xaa", "xee", "xe", "xo", , "xwa", , "xwi", "xwaa", "xwee", "xwe", , , "na", "nu", "ni", "naa", "nee", "ne", "no", "nwa", "nya", "nyu", "nyi", "nyaa", "nyee", "nye", "nyo", "nywa", "'a", "'u", , "'aa", "'ee", "'e", "'o", "'wa", "ka", "ku", "ki", "kaa", "kee", "ke", "ko", , "kwa", , "kwi", "kwaa", "kwee", "kwe", , , "kxa", "kxu", "kxi", "kxaa", "kxee", "kxe", "kxo", , "kxwa", , "kxwi", "kxwaa", "kxwee", "kxwe", , , "wa", "wu", "wi", "waa", "wee", "we", "wo", , "`a", "`u", "`i", "`aa", "`ee", "`e", "`o", , "za", "zu", "zi", "zaa", "zee", "ze", "zo", "zwa", "zha", "zhu", "zhi", "zhaa", "zhee", "zhe", "zho", "zhwa", "ya", "yu", "yi", "yaa", "yee", "ye", "yo", , "da", "du", "di", "daa", "dee", "de", "do", "dwa", "dda", "ddu", "ddi", "ddaa", "ddee", "dde", "ddo", "ddwa"], ["ja", "ju", "ji", "jaa", "jee", "je", "jo", "jwa", "ga", "gu", "gi", "gaa", "gee", "ge", "go", , "gwa", , "gwi", "gwaa", "gwee", "gwe", , , "gga", "ggu", "ggi", "ggaa", "ggee", "gge", "ggo", , "tha", "thu", "thi", "thaa", "thee", "the", "tho", "thwa", "cha", "chu", "chi", "chaa", "chee", "che", "cho", "chwa", "pha", "phu", "phi", "phaa", "phee", "phe", "pho", "phwa", "tsa", "tsu", "tsi", "tsaa", "tsee", "tse", "tso", "tswa", "tza", "tzu", "tzi", "tzaa", "tzee", "tze", "tzo", , "fa", "fu", "fi", "faa", "fee", "fe", "fo", "fwa", "pa", "pu", "pi", "paa", "pee", "pe", "po", "pwa", "rya", "mya", "fya", , , , , , , " ", ".", ",", ";", ":", ":: ", "?", "//", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10+", "20+", "30+", "40+", "50+", "60+", "70+", "80+", "90+", "100+", "10,000+", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "a", "e", "i", "o", "u", "v", "ga", "ka", "ge", "gi", "go", "gu", "gv", "ha", "he", "hi", "ho", "hu", "hv", "la", "le", "li", "lo", "lu", "lv", "ma", "me", "mi", "mo", "mu", "na", "hna", "nah", "ne", "ni", "no", "nu", "nv", "qua", "que", "qui", "quo", "quu", "quv", "sa", "s", "se", "si", "so", "su", "sv", "da", "ta", "de", "te", "di", "ti", "do", "du", "dv", "dla", "tla", "tle", "tli", "tlo", "tlu", "tlv", "tsa", "tse", "tsi", "tso", "tsu", "tsv", "wa", "we", "wi", "wo", "wu", "wv", "ya", "ye", "yi", "yo", "yu", "yv"], [, "ai", "aai", "i", "ii", "u", "uu", "oo", "ee", "i", "a", "aa", "we", "we", "wi", "wi", "wii", "wii", "wo", "wo", "woo", "woo", "woo", "wa", "wa", "waa", "waa", "waa", "ai", "w", "'", "t", "k", "sh", "s", "n", "w", "n", , "w", "c", "?", "l", "en", "in", "on", "an", "pai", "paai", "pi", "pii", "pu", "puu", "poo", "hee", "hi", "pa", "paa", "pwe", "pwe", "pwi", "pwi", "pwii", "pwii", "pwo", "pwo", "pwoo", "pwoo", "pwa", "pwa", "pwaa", "pwaa", "pwaa", "p", "p", "h", "tai", "taai", "ti", "tii", "tu", "tuu", "too", "dee", "di", "ta", "taa", "twe", "twe", "twi", "twi", "twii", "twii", "two", "two", "twoo", "twoo", "twa", "twa", "twaa", "twaa", "twaa", "t", "tte", "tti", "tto", "tta", "kai", "kaai", "ki", "kii", "ku", "kuu", "koo", "ka", "kaa", "kwe", "kwe", "kwi", "kwi", "kwii", "kwii", "kwo", "kwo", "kwoo", "kwoo", "kwa", "kwa", "kwaa", "kwaa", "kwaa", "k", "kw", "keh", "kih", "koh", "kah", "gai", "caai", "gi", "gii", "gu", "guu", "coo", "ga", "gaa", "cwe", "cwe", "cwi", "cwi", "cwii", "cwii", "cwo", "cwo", "cwoo", "cwoo", "cwa", "cwa", "cwaa", "cwaa", "cwaa", "g", "th", "mai", "maai", "mi", "mii", "mu", "muu", "moo", "ma", "maa", "mwe", "mwe", "mwi", "mwi", "mwii", "mwii", "mwo", "mwo", "mwoo", "mwoo", "mwa", "mwa", "mwaa", "mwaa", "mwaa", "m", "m", "mh", "m", "m", "nai", "naai", "ni", "nii", "nu", "nuu", "noo", "na", "naa", "nwe", "nwe", "nwa", "nwa", "nwaa", "nwaa", "nwaa", "n", "ng", "nh", "lai", "laai", "li", "lii", "lu", "luu", "loo", "la", "laa", "lwe", "lwe", "lwi", "lwi", "lwii", "lwii", "lwo", "lwo", "lwoo", "lwoo", "lwa", "lwa", "lwaa", "lwaa", "l", "l", "l", "sai", "saai", "si", "sii", "su", "suu", "soo", "sa", "saa", "swe", "swe", "swi", "swi", "swii", "swii", "swo", "swo", "swoo", "swoo"], ["swa", "swa", "swaa", "swaa", "swaa", "s", "s", "sw", "s", "sk", "skw", "sW", "spwa", "stwa", "skwa", "scwa", "she", "shi", "shii", "sho", "shoo", "sha", "shaa", "shwe", "shwe", "shwi", "shwi", "shwii", "shwii", "shwo", "shwo", "shwoo", "shwoo", "shwa", "shwa", "shwaa", "shwaa", "sh", "jai", "yaai", "ji", "jii", "ju", "juu", "yoo", "ja", "jaa", "ywe", "ywe", "ywi", "ywi", "ywii", "ywii", "ywo", "ywo", "ywoo", "ywoo", "ywa", "ywa", "ywaa", "ywaa", "ywaa", "j", "y", "y", "yi", "re", "rai", "le", "raai", "ri", "rii", "ru", "ruu", "lo", "ra", "raa", "la", "rwaa", "rwaa", "r", "r", "r", "vai", "faai", "vi", "vii", "vu", "vuu", "va", "vaa", "fwaa", "fwaa", "v", "the", "the", "thi", "thi", "thii", "thii", "tho", "thoo", "tha", "thaa", "thwaa", "thwaa", "th", "tthe", "tthi", "ttho", "ttha", "tth", "tye", "tyi", "tyo", "tya", "he", "hi", "hii", "ho", "hoo", "ha", "haa", "h", "h", "hk", "qaai", "qi", "qii", "qu", "quu", "qa", "qaa", "q", "tlhe", "tlhi", "tlho", "tlha", "re", "ri", "ro", "ra", "ngaai", "ngi", "ngii", "ngu", "nguu", "nga", "ngaa", "ng", "nng", "she", "shi", "sho", "sha", "the", "thi", "tho", "tha", "th", "lhi", "lhii", "lho", "lhoo", "lha", "lhaa", "lh", "the", "thi", "thii", "tho", "thoo", "tha", "thaa", "th", "b", "e", "i", "o", "a", "we", "wi", "wo", "wa", "ne", "ni", "no", "na", "ke", "ki", "ko", "ka", "he", "hi", "ho", "ha", "ghu", "gho", "ghe", "ghee", "ghi", "gha", "ru", "ro", "re", "ree", "ri", "ra", "wu", "wo", "we", "wee", "wi", "wa", "hwu", "hwo", "hwe", "hwee", "hwi", "hwa", "thu", "tho", "the", "thee", "thi", "tha", "ttu", "tto", "tte", "ttee", "tti", "tta", "pu", "po", "pe", "pee", "pi", "pa", "p", "gu", "go", "ge", "gee", "gi", "ga", "khu", "kho", "khe", "khee", "khi", "kha", "kku", "kko", "kke", "kkee", "kki"], ["kka", "kk", "nu", "no", "ne", "nee", "ni", "na", "mu", "mo", "me", "mee", "mi", "ma", "yu", "yo", "ye", "yee", "yi", "ya", "ju", "ju", "jo", "je", "jee", "ji", "ji", "ja", "jju", "jjo", "jje", "jjee", "jji", "jja", "lu", "lo", "le", "lee", "li", "la", "dlu", "dlo", "dle", "dlee", "dli", "dla", "lhu", "lho", "lhe", "lhee", "lhi", "lha", "tlhu", "tlho", "tlhe", "tlhee", "tlhi", "tlha", "tlu", "tlo", "tle", "tlee", "tli", "tla", "zu", "zo", "ze", "zee", "zi", "za", "z", "z", "dzu", "dzo", "dze", "dzee", "dzi", "dza", "su", "so", "se", "see", "si", "sa", "shu", "sho", "she", "shee", "shi", "sha", "sh", "tsu", "tso", "tse", "tsee", "tsi", "tsa", "chu", "cho", "che", "chee", "chi", "cha", "ttsu", "ttso", "ttse", "ttsee", "ttsi", "ttsa", "X", ".", "qai", "ngai", "nngi", "nngii", "nngo", "nngoo", "nnga", "nngaa", , , , , , , , , , " ", "b", "l", "f", "s", "n", "h", "d", "t", "c", "q", "m", "g", "ng", "z", "r", "a", "o", "u", "e", "i", "ch", "th", "ph", "p", "x", "p", "<", ">", , , , "f", "v", "u", "yr", "y", "w", "th", "th", "a", "o", "ac", "ae", "o", "o", "o", "oe", "on", "r", "k", "c", "k", "g", "ng", "g", "g", "w", "h", "h", "h", "h", "n", "n", "n", "i", "e", "j", "g", "ae", "a", "eo", "p", "z", "s", "s", "s", "c", "z", "t", "t", "d", "b", "b", "p", "p", "e", "m", "m", "m", "l", "l", "ng", "ng", "d", "o", "ear", "ior", "qu", "qu", "qu", "s", "yr", "yr", "yr", "q", "x", ".", ":", "+", "17", "18", "19"], [, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "k", "kh", "g", "gh", "ng", "c", "ch", "j", "jh", "ny", "t", "tth", "d", "ddh", "nn", "t", "th", "d", "dh", "n", "p", "ph", "b", "bh", "m", "y", "r", "l", "v", "sh", "ss", "s", "h", "l", "q", "a", "aa", "i", "ii", "u", "uk", "uu", "uuv", "ry", "ryy", "ly", "lyy", "e", "ai", "oo", "oo", "au", "a", "aa", "aa", "i", "ii", "y", "yy", "u", "uu", "ua", "oe", "ya", "ie", "e", "ae", "ai", "oo", "au", "M", "H", "a`", , , , "r", , "!", , , , , , ".", " // ", ":", "+", "++", " * ", " /// ", "KR", "'", , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], [" @ ", " ... ", ",", ". ", ": ", " // ", , "-", ",", ". ", , , , , , , "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", , , , , , , "a", "e", "i", "o", "u", "O", "U", "ee", "n", "ng", "b", "p", "q", "g", "m", "l", "s", "sh", "t", "d", "ch", "j", "y", "r", "w", "f", "k", "kha", "ts", "z", "h", "zr", "lh", "zh", "ch", "-", "e", "i", "o", "u", "O", "U", "ng", "b", "p", "q", "g", "m", "t", "d", "ch", "j", "ts", "y", "w", "k", "g", "h", "jy", "ny", "dz", "e", "i", "iy", "U", "u", "ng", "k", "g", "h", "p", "sh", "t", "d", "j", "f", "g", "h", "ts", "z", "r", "ch", "zh", "i", "k", "r", "f", "zh", , , , , , , , , , "H", "X", "W", "M", " 3 ", " 333 ", "a", "i", "k", "ng", "c", "tt", "tth", "dd", "nn", "t", "d", "p", "ph", "ss", "zh", "z", "a", "t", "zh", "gh", "ng", "c", "jh", "tta", "ddh", "t", "dh", "ss", "cy", "zh", "z", "u", "y", "bh", "'"], [], [], [], [], [], ["A", "a", "B", "b", "B", "b", "B", "b", "C", "c", "D", "d", "D", "d", "D", "d", "D", "d", "D", "d", "E", "e", "E", "e", "E", "e", "E", "e", "E", "e", "F", "f", "G", "g", "H", "h", "H", "h", "H", "h", "H", "h", "H", "h", "I", "i", "I", "i", "K", "k", "K", "k", "K", "k", "L", "l", "L", "l", "L", "l", "L", "l", "M", "m", "M", "m", "M", "m", "N", "n", "N", "n", "N", "n", "N", "n", "O", "o", "O", "o", "O", "o", "O", "o", "P", "p", "P", "p", "R", "r", "R", "r", "R", "r", "R", "r", "S", "s", "S", "s", "S", "s", "S", "s", "S", "s", "T", "t", "T", "t", "T", "t", "T", "t", "U", "u", "U", "u", "U", "u", "U", "u", "U", "u", "V", "v", "V", "v", "W", "w", "W", "w", "W", "w", "W", "w", "W", "w", "X", "x", "X", "x", "Y", "y", "Z", "z", "Z", "z", "Z", "z", "h", "t", "w", "y", "a", "S", , , , , "A", "a", "A", "a", "A", "a", "A", "a", "A", "a", "A", "a", "A", "a", "A", "a", "A", "a", "A", "a", "A", "a", "A", "a", "E", "e", "E", "e", "E", "e", "E", "e", "E", "e", "E", "e", "E", "e", "E", "e", "I", "i", "I", "i", "O", "o", "O", "o", "O", "o", "O", "o", "O", "o", "O", "o", "O", "o", "O", "o", "O", "o", "O", "o", "O", "o", "O", "o", "U", "u", "U", "u", "U", "u", "U", "u", "U", "u", "U", "u", "U", "u", "Y", "y", "Y", "y", "Y", "y", "Y", "y"], ["a", "a", "a", "a", "a", "a", "a", "a", "A", "A", "A", "A", "A", "A", "A", "A", "e", "e", "e", "e", "e", "e", , , "E", "E", "E", "E", "E", "E", , , "e", "e", "e", "e", "e", "e", "e", "e", "E", "E", "E", "E", "E", "E", "E", "E", "i", "i", "i", "i", "i", "i", "i", "i", "I", "I", "I", "I", "I", "I", "I", "I", "o", "o", "o", "o", "o", "o", , , "O", "O", "O", "O", "O", "O", , , "u", "u", "u", "u", "u", "u", "u", "u", , "U", , "U", , "U", , "U", "o", "o", "o", "o", "o", "o", "o", "o", "O", "O", "O", "O", "O", "O", "O", "O", "a", "a", "e", "e", "e", "e", "i", "i", "o", "o", "u", "u", "o", "o", , , "a", "a", "a", "a", "a", "a", "a", "a", "A", "A", "A", "A", "A", "A", "A", "A", "e", "e", "e", "e", "e", "e", "e", "e", "E", "E", "E", "E", "E", "E", "E", "E", "o", "o", "o", "o", "o", "o", "o", "o", "O", "O", "O", "O", "O", "O", "O", "O", "a", "a", "a", "a", "a", , "a", "a", "A", "A", "A", "A", "A", "'", "i", "'", "~", '"~', "e", "e", "e", , "e", "e", "E", "E", "E", "E", "E", "'`", "''", "'~", "i", "i", "i", "i", , , "i", "i", "I", "I", "I", "I", , "`'", "`'", "`~", "u", "u", "u", "u", "R", "R", "u", "u", "U", "U", "U", "U", "R", '"`', `"'`, "`", , , "o", "o", "o", , "o", "o", "O", "O", "O", "O", "O", "'", "`"], [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", , , , , "-", "-", "-", "-", "--", "--", "||", "_", "'", "'", ",", "'", '"', '"', ",,", '"', "+", "++", "*", "*>", ".", "..", "...", ".", `
`, `

`, , , , , , " ", "%0", "%00", "'", "''", "'''", "`", "``", "```", "^", "<", ">", "*", "!!", "!?", "-", "_", "-", "^", "***", "--", "/", "-[", "]-", , "?!", "!?", "7", "PP", "(]", "[)", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "0", , , , "4", "5", "6", "7", "8", "9", "+", "-", "=", "(", ")", "n", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "-", "=", "(", ")", , , , , , , , , , , , , , , , , , "ECU", "CL", "Cr", "FF", "L", "mil", "N", "Pts", "Rs", "W", "NS", "D", "EU", "K", "T", "Dr"], [, , "C", , , , , , , , "g", "H", "H", "H", "h", , "I", "I", "L", "l", "lb", "N", "no", "(p)", "P", "P", "Q", "R", "R", "R", , , "(sm)", "(tel)", "(tm)", , "Z", , , "mho", "Z", , , , "B", "C", "e", "e", , "F", , "M", "o", , , , , "i", "Q", "(fax)", "pi", , , "Pi", , "G", "L", "L", "Y", "D", "d", "e", "i", "j", , , "per", , , , , , , " 1/3 ", " 2/3 ", " 1/5 ", " 2/5 ", " 3/5 ", " 4/5 ", " 1/6 ", " 5/6 ", " 1/8 ", " 3/8 ", " 5/8 ", " 7/8 ", " 1/", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "L", "C", "D", "M", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "l", "c", "d", "m", "(D", "D)", "((|))", ")", , , , , , , , , , , , , "-", "|", "-", "|", "-", "|", "\\", "/", "\\", "/", "-", "-", "~", "~", "-", "|", "-", "|", "-", "-", "-", "|", "-", "|", "|", "-", "-", "-", "-", "-", "-", "|", "|", "|", "|", "|", "|", "|", "^", "V", "\\", "=", "V", "^", "-", "-", "|", "|", "-", "-", "|", "|", "=", "|", "=", "=", "|", "=", "|", "=", "=", "=", "=", "=", "=", "|", "=", "|", "=", "|", "\\", "/", "\\", "/", "=", "=", "~", "~", "|", "|", "-", "|", "-", "|", "-", "-", "-", "|", "-", "|", "|", "|", "|", "|", "|", "|", "-", "\\", "\\", "|"], [], [], [], ["-", "-", "|", "|", "-", "-", "|", "|", "-", "-", "|", "|", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "-", "-", "|", "|", "-", "|", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "+", "/", "\\", "X", "-", "|", "-", "|", "-", "|", "-", "|", "-", "|", "-", "|", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "-", "|", , , , , , , , , , , "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "^", "^", "^", "^", ">", ">", ">", ">", ">", ">", "V", "V", "V", "V", "<", "<", "<", "<", "<", "<", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "#", "#", "#", "#", "#", "^", "^", "^", "O", "#", "#", "#", "#", "#", "#", "#", "#"], [], [], [" ", "a", "1", "b", "'", "k", "2", "l", "@", "c", "i", "f", "/", "m", "s", "p", '"', "e", "3", "h", "9", "o", "6", "r", "^", "d", "j", "g", ">", "n", "t", "q", ",", "*", "5", "<", "-", "u", "8", "v", ".", "%", "[", "$", "+", "x", "!", "&", ";", ":", "4", "\\", "0", "z", "7", "(", "_", "?", "w", "]", "#", "y", ")", "=", "[d7]", "[d17]", "[d27]", "[d127]", "[d37]", "[d137]", "[d237]", "[d1237]", "[d47]", "[d147]", "[d247]", "[d1247]", "[d347]", "[d1347]", "[d2347]", "[d12347]", "[d57]", "[d157]", "[d257]", "[d1257]", "[d357]", "[d1357]", "[d2357]", "[d12357]", "[d457]", "[d1457]", "[d2457]", "[d12457]", "[d3457]", "[d13457]", "[d23457]", "[d123457]", "[d67]", "[d167]", "[d267]", "[d1267]", "[d367]", "[d1367]", "[d2367]", "[d12367]", "[d467]", "[d1467]", "[d2467]", "[d12467]", "[d3467]", "[d13467]", "[d23467]", "[d123467]", "[d567]", "[d1567]", "[d2567]", "[d12567]", "[d3567]", "[d13567]", "[d23567]", "[d123567]", "[d4567]", "[d14567]", "[d24567]", "[d124567]", "[d34567]", "[d134567]", "[d234567]", "[d1234567]", "[d8]", "[d18]", "[d28]", "[d128]", "[d38]", "[d138]", "[d238]", "[d1238]", "[d48]", "[d148]", "[d248]", "[d1248]", "[d348]", "[d1348]", "[d2348]", "[d12348]", "[d58]", "[d158]", "[d258]", "[d1258]", "[d358]", "[d1358]", "[d2358]", "[d12358]", "[d458]", "[d1458]", "[d2458]", "[d12458]", "[d3458]", "[d13458]", "[d23458]", "[d123458]", "[d68]", "[d168]", "[d268]", "[d1268]", "[d368]", "[d1368]", "[d2368]", "[d12368]", "[d468]", "[d1468]", "[d2468]", "[d12468]", "[d3468]", "[d13468]", "[d23468]", "[d123468]", "[d568]", "[d1568]", "[d2568]", "[d12568]", "[d3568]", "[d13568]", "[d23568]", "[d123568]", "[d4568]", "[d14568]", "[d24568]", "[d124568]", "[d34568]", "[d134568]", "[d234568]", "[d1234568]", "[d78]", "[d178]", "[d278]", "[d1278]", "[d378]", "[d1378]", "[d2378]", "[d12378]", "[d478]", "[d1478]", "[d2478]", "[d12478]", "[d3478]", "[d13478]", "[d23478]", "[d123478]", "[d578]", "[d1578]", "[d2578]", "[d12578]", "[d3578]", "[d13578]", "[d23578]", "[d123578]", "[d4578]", "[d14578]", "[d24578]", "[d124578]", "[d34578]", "[d134578]", "[d234578]", "[d1234578]", "[d678]", "[d1678]", "[d2678]", "[d12678]", "[d3678]", "[d13678]", "[d23678]", "[d123678]", "[d4678]", "[d14678]", "[d24678]", "[d124678]", "[d34678]", "[d134678]", "[d234678]", "[d1234678]", "[d5678]", "[d15678]", "[d25678]", "[d125678]", "[d35678]", "[d135678]", "[d235678]", "[d1235678]", "[d45678]", "[d145678]", "[d245678]", "[d1245678]", "[d345678]", "[d1345678]", "[d2345678]", "[d12345678]"], [], [], [], [], [], [], [], [" ", ",", ". ", '"', "[JIS]", '"', "/", "0", "<", "> ", "<<", ">> ", "[", "] ", "{", "} ", "[(", ")] ", "@", "X ", "[", "] ", "[[", "]] ", "((", ")) ", "[[", "]] ", "~ ", "``", "''", ",,", "@", "1", "2", "3", "4", "5", "6", "7", "8", "9", , , , , , , "~", "+", "+", "+", "+", , "@", " // ", "+10+", "+20+", "+30+", , , , , , , "a", "a", "i", "i", "u", "u", "e", "e", "o", "o", "ka", "ga", "ki", "gi", "ku", "gu", "ke", "ge", "ko", "go", "sa", "za", "si", "zi", "su", "zu", "se", "ze", "so", "zo", "ta", "da", "ti", "di", "tu", "tu", "du", "te", "de", "to", "do", "na", "ni", "nu", "ne", "no", "ha", "ba", "pa", "hi", "bi", "pi", "hu", "bu", "pu", "he", "be", "pe", "ho", "bo", "po", "ma", "mi", "mu", "me", "mo", "ya", "ya", "yu", "yu", "yo", "yo", "ra", "ri", "ru", "re", "ro", "wa", "wa", "wi", "we", "wo", "n", "vu", , , , , , , , , '"', '"', , , "a", "a", "i", "i", "u", "u", "e", "e", "o", "o", "ka", "ga", "ki", "gi", "ku", "gu", "ke", "ge", "ko", "go", "sa", "za", "si", "zi", "su", "zu", "se", "ze", "so", "zo", "ta", "da", "ti", "di", "tu", "tu", "du", "te", "de", "to", "do", "na", "ni", "nu", "ne", "no", "ha", "ba", "pa", "hi", "bi", "pi", "hu", "bu", "pu", "he", "be", "pe", "ho", "bo", "po", "ma", "mi", "mu", "me", "mo", "ya", "ya", "yu", "yu", "yo", "yo", "ra", "ri", "ru", "re", "ro", "wa", "wa", "wi", "we", "wo", "n", "vu", "ka", "ke", "va", "vi", "ve", "vo", , , '"', '"'], [, , , , , "B", "P", "M", "F", "D", "T", "N", "L", "G", "K", "H", "J", "Q", "X", "ZH", "CH", "SH", "R", "Z", "C", "S", "A", "O", "E", "EH", "AI", "EI", "AU", "OU", "AN", "EN", "ANG", "ENG", "ER", "I", "U", "IU", "V", "NG", "GN", , , , , "g", "gg", "gs", "n", "nj", "nh", "d", "dd", "r", "lg", "lm", "lb", "ls", "lt", "lp", "rh", "m", "b", "bb", "bs", "s", "ss", , "j", "jj", "c", "k", "t", "p", "h", "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "weo", "we", "wi", "yu", "eu", "yi", "i", , "nn", "nd", "ns", "nZ", "lgs", "ld", "lbs", "lZ", "lQ", "mb", "ms", "mZ", "mN", "bg", , "bsg", "bst", "bj", "bt", "bN", "bbN", "sg", "sn", "sd", "sb", "sj", "Z", , "N", "Ns", "NZ", "pN", "hh", "Q", "yo-ya", "yo-yae", "yo-i", "yu-yeo", "yu-ye", "yu-i", "U", "U-i", , , , , , , , , , , , , , , , , , "BU", "ZI", "JI", "GU", "EE", "ENN", "OO", "ONN", "IR", "ANN", "INN", "UNN", "IM", "NGG", "AINN", "AUNN", "AM", "OM", "ONG", "INNN", "P", "T", "K", "H"], ["(g)", "(n)", "(d)", "(r)", "(m)", "(b)", "(s)", "()", "(j)", "(c)", "(k)", "(t)", "(p)", "(h)", "(ga)", "(na)", "(da)", "(ra)", "(ma)", "(ba)", "(sa)", "(a)", "(ja)", "(ca)", "(ka)", "(ta)", "(pa)", "(ha)", "(ju)", , , , "(1) ", "(2) ", "(3) ", "(4) ", "(5) ", "(6) ", "(7) ", "(8) ", "(9) ", "(10) ", "(Yue) ", "(Huo) ", "(Shui) ", "(Mu) ", "(Jin) ", "(Tu) ", "(Ri) ", "(Zhu) ", "(You) ", "(She) ", "(Ming) ", "(Te) ", "(Cai) ", "(Zhu) ", "(Lao) ", "(Dai) ", "(Hu) ", "(Xue) ", "(Jian) ", "(Qi) ", "(Zi) ", "(Xie) ", "(Ji) ", "(Xiu) ", "<<", ">>", , , , , , , , , , , , , , , , , , , , , , , , , , , , , "(g)", "(n)", "(d)", "(r)", "(m)", "(b)", "(s)", "()", "(j)", "(c)", "(k)", "(t)", "(p)", "(h)", "(ga)", "(na)", "(da)", "(ra)", "(ma)", "(ba)", "(sa)", "(a)", "(ja)", "(ca)", "(ka)", "(ta)", "(pa)", "(ha)", , , , "KIS ", "(1) ", "(2) ", "(3) ", "(4) ", "(5) ", "(6) ", "(7) ", "(8) ", "(9) ", "(10) ", "(Yue) ", "(Huo) ", "(Shui) ", "(Mu) ", "(Jin) ", "(Tu) ", "(Ri) ", "(Zhu) ", "(You) ", "(She) ", "(Ming) ", "(Te) ", "(Cai) ", "(Zhu) ", "(Lao) ", "(Mi) ", "(Nan) ", "(Nu) ", "(Shi) ", "(You) ", "(Yin) ", "(Zhu) ", "(Xiang) ", "(Xiu) ", "(Xie) ", "(Zheng) ", "(Shang) ", "(Zhong) ", "(Xia) ", "(Zuo) ", "(You) ", "(Yi) ", "(Zong) ", "(Xue) ", "(Jian) ", "(Qi) ", "(Zi) ", "(Xie) ", "(Ye) ", , , , , , , , , , , , , , , , "1M", "2M", "3M", "4M", "5M", "6M", "7M", "8M", "9M", "10M", "11M", "12M", , , , , "a", "i", "u", "u", "o", "ka", "ki", "ku", "ke", "ko", "sa", "si", "su", "se", "so", "ta", "ti", "tu", "te", "to", "na", "ni", "nu", "ne", "no", "ha", "hi", "hu", "he", "ho", "ma", "mi", "mu", "me", "mo", "ya", "yu", "yo", "ra", "ri", "ru", "re", "ro", "wa", "wi", "we", "wo"], ["apartment", "alpha", "ampere", "are", "inning", "inch", "won", "escudo", "acre", "ounce", "ohm", "kai-ri", "carat", "calorie", "gallon", "gamma", "giga", "guinea", "curie", "guilder", "kilo", "kilogram", "kilometer", "kilowatt", "gram", "gram ton", "cruzeiro", "krone", "case", "koruna", "co-op", "cycle", "centime", "shilling", "centi", "cent", "dozen", "desi", "dollar", "ton", "nano", "knot", "heights", "percent", "parts", "barrel", "piaster", "picul", "pico", "building", "farad", "feet", "bushel", "franc", "hectare", "peso", "pfennig", "hertz", "pence", "page", "beta", "point", "volt", "hon", "pound", "hall", "horn", "micro", "mile", "mach", "mark", "mansion", "micron", "milli", "millibar", "mega", "megaton", "meter", "yard", "yard", "yuan", "liter", "lira", "rupee", "ruble", "rem", "roentgen", "watt", "0h", "1h", "2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h", "22h", "23h", "24h", "HPA", "da", "AU", "bar", "oV", "pc", , , , , "Heisei", "Syouwa", "Taisyou", "Meiji", "Inc.", "pA", "nA", "microamp", "mA", "kA", "kB", "MB", "GB", "cal", "kcal", "pF", "nF", "microFarad", "microgram", "mg", "kg", "Hz", "kHz", "MHz", "GHz", "THz", "microliter", "ml", "dl", "kl", "fm", "nm", "micrometer", "mm", "cm", "km", "mm^2", "cm^2", "m^2", "km^2", "mm^4", "cm^3", "m^3", "km^3", "m/s", "m/s^2", "Pa", "kPa", "MPa", "GPa", "rad", "rad/s", "rad/s^2", "ps", "ns", "microsecond", "ms", "pV", "nV", "microvolt", "mV", "kV", "MV", "pW", "nW", "microwatt", "mW", "kW", "MW", "kOhm", "MOhm", "a.m.", "Bq", "cc", "cd", "C/kg", "Co.", "dB", "Gy", "ha", "HP", "in", "K.K.", "KM", "kt", "lm", "ln", "log", "lx", "mb", "mil", "mol", "pH", "p.m.", "PPM", "PR", "sr", "Sv", "Wb", , , "1d", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "10d", "11d", "12d", "13d", "14d", "15d", "16d", "17d", "18d", "19d", "20d", "21d", "22d", "23d", "24d", "25d", "26d", "27d", "28d", "29d", "30d", "31d"], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], ["Yi", "Ding", "Kao", "Qi", "Shang", "Xia", , "Wan", "Zhang", "San", "Shang", "Xia", "Ji", "Bu", "Yu", "Mian", "Gai", "Chou", "Chou", "Zhuan", "Qie", "Pi", "Shi", "Shi", "Qiu", "Bing", "Ye", "Cong", "Dong", "Si", "Cheng", "Diu", "Qiu", "Liang", "Diu", "You", "Liang", "Yan", "Bing", "Sang", "Gun", "Jiu", "Ge", "Ya", "Qiang", "Zhong", "Ji", "Jie", "Feng", "Guan", "Chuan", "Chan", "Lin", "Zhuo", "Zhu", "Ha", "Wan", "Dan", "Wei", "Zhu", "Jing", "Li", "Ju", "Pie", "Fu", "Yi", "Yi", "Nai", "Shime", "Jiu", "Jiu", "Zhe", "Me", "Yi", , "Zhi", "Wu", "Zha", "Hu", "Fa", "Le", "Zhong", "Ping", "Pang", "Qiao", "Hu", "Guai", "Cheng", "Cheng", "Yi", "Yin", , "Mie", "Jiu", "Qi", "Ye", "Xi", "Xiang", "Gai", "Diu", "Hal", , "Shu", "Twul", "Shi", "Ji", "Nang", "Jia", "Kel", "Shi", , "Ol", "Mai", "Luan", "Cal", "Ru", "Xue", "Yan", "Fu", "Sha", "Na", "Gan", "Sol", "El", "Cwul", , "Gan", "Chi", "Gui", "Gan", "Luan", "Lin", "Yi", "Jue", "Liao", "Ma", "Yu", "Zheng", "Shi", "Shi", "Er", "Chu", "Yu", "Yu", "Yu", "Yun", "Hu", "Qi", "Wu", "Jing", "Si", "Sui", "Gen", "Gen", "Ya", "Xie", "Ya", "Qi", "Ya", "Ji", "Tou", "Wang", "Kang", "Ta", "Jiao", "Hai", "Yi", "Chan", "Heng", "Mu", , "Xiang", "Jing", "Ting", "Liang", "Xiang", "Jing", "Ye", "Qin", "Bo", "You", "Xie", "Dan", "Lian", "Duo", "Wei", "Ren", "Ren", "Ji", "La", "Wang", "Yi", "Shi", "Ren", "Le", "Ding", "Ze", "Jin", "Pu", "Chou", "Ba", "Zhang", "Jin", "Jie", "Bing", "Reng", "Cong", "Fo", "San", "Lun", "Sya", "Cang", "Zi", "Shi", "Ta", "Zhang", "Fu", "Xian", "Xian", "Tuo", "Hong", "Tong", "Ren", "Qian", "Gan", "Yi", "Di", "Dai", "Ling", "Yi", "Chao", "Chang", "Sa", , "Yi", "Mu", "Men", "Ren", "Jia", "Chao", "Yang", "Qian", "Zhong", "Pi", "Wan", "Wu", "Jian", "Jie", "Yao", "Feng", "Cang", "Ren", "Wang", "Fen", "Di", "Fang"], ["Zhong", "Qi", "Pei", "Yu", "Diao", "Dun", "Wen", "Yi", "Xin", "Kang", "Yi", "Ji", "Ai", "Wu", "Ji", "Fu", "Fa", "Xiu", "Jin", "Bei", "Dan", "Fu", "Tang", "Zhong", "You", "Huo", "Hui", "Yu", "Cui", "Chuan", "San", "Wei", "Chuan", "Che", "Ya", "Xian", "Shang", "Chang", "Lun", "Cang", "Xun", "Xin", "Wei", "Zhu", , "Xuan", "Nu", "Bo", "Gu", "Ni", "Ni", "Xie", "Ban", "Xu", "Ling", "Zhou", "Shen", "Qu", "Si", "Beng", "Si", "Jia", "Pi", "Yi", "Si", "Ai", "Zheng", "Dian", "Han", "Mai", "Dan", "Zhu", "Bu", "Qu", "Bi", "Shao", "Ci", "Wei", "Di", "Zhu", "Zuo", "You", "Yang", "Ti", "Zhan", "He", "Bi", "Tuo", "She", "Yu", "Yi", "Fo", "Zuo", "Kou", "Ning", "Tong", "Ni", "Xuan", "Qu", "Yong", "Wa", "Qian", , "Ka", , "Pei", "Huai", "He", "Lao", "Xiang", "Ge", "Yang", "Bai", "Fa", "Ming", "Jia", "Er", "Bing", "Ji", "Hen", "Huo", "Gui", "Quan", "Tiao", "Jiao", "Ci", "Yi", "Shi", "Xing", "Shen", "Tuo", "Kan", "Zhi", "Gai", "Lai", "Yi", "Chi", "Kua", "Guang", "Li", "Yin", "Shi", "Mi", "Zhu", "Xu", "You", "An", "Lu", "Mou", "Er", "Lun", "Tong", "Cha", "Chi", "Xun", "Gong", "Zhou", "Yi", "Ru", "Jian", "Xia", "Jia", "Zai", "Lu", "Ko", "Jiao", "Zhen", "Ce", "Qiao", "Kuai", "Chai", "Ning", "Nong", "Jin", "Wu", "Hou", "Jiong", "Cheng", "Zhen", "Zuo", "Chou", "Qin", "Lu", "Ju", "Shu", "Ting", "Shen", "Tuo", "Bo", "Nan", "Hao", "Bian", "Tui", "Yu", "Xi", "Cu", "E", "Qiu", "Xu", "Kuang", "Ku", "Wu", "Jun", "Yi", "Fu", "Lang", "Zu", "Qiao", "Li", "Yong", "Hun", "Jing", "Xian", "San", "Pai", "Su", "Fu", "Xi", "Li", "Fu", "Ping", "Bao", "Yu", "Si", "Xia", "Xin", "Xiu", "Yu", "Ti", "Che", "Chou", , "Yan", "Lia", "Li", "Lai", , "Jian", "Xiu", "Fu", "He", "Ju", "Xiao", "Pai", "Jian", "Biao", "Chu", "Fei", "Feng", "Ya", "An", "Bei", "Yu", "Xin", "Bi", "Jian"], ["Chang", "Chi", "Bing", "Zan", "Yao", "Cui", "Lia", "Wan", "Lai", "Cang", "Zong", "Ge", "Guan", "Bei", "Tian", "Shu", "Shu", "Men", "Dao", "Tan", "Jue", "Chui", "Xing", "Peng", "Tang", "Hou", "Yi", "Qi", "Ti", "Gan", "Jing", "Jie", "Sui", "Chang", "Jie", "Fang", "Zhi", "Kong", "Juan", "Zong", "Ju", "Qian", "Ni", "Lun", "Zhuo", "Wei", "Luo", "Song", "Leng", "Hun", "Dong", "Zi", "Ben", "Wu", "Ju", "Nai", "Cai", "Jian", "Zhai", "Ye", "Zhi", "Sha", "Qing", , "Ying", "Cheng", "Jian", "Yan", "Nuan", "Zhong", "Chun", "Jia", "Jie", "Wei", "Yu", "Bing", "Ruo", "Ti", "Wei", "Pian", "Yan", "Feng", "Tang", "Wo", "E", "Xie", "Che", "Sheng", "Kan", "Di", "Zuo", "Cha", "Ting", "Bei", "Ye", "Huang", "Yao", "Zhan", "Chou", "Yan", "You", "Jian", "Xu", "Zha", "Ci", "Fu", "Bi", "Zhi", "Zong", "Mian", "Ji", "Yi", "Xie", "Xun", "Si", "Duan", "Ce", "Zhen", "Ou", "Tou", "Tou", "Bei", "Za", "Lu", "Jie", "Wei", "Fen", "Chang", "Gui", "Sou", "Zhi", "Su", "Xia", "Fu", "Yuan", "Rong", "Li", "Ru", "Yun", "Gou", "Ma", "Bang", "Dian", "Tang", "Hao", "Jie", "Xi", "Shan", "Qian", "Jue", "Cang", "Chu", "San", "Bei", "Xiao", "Yong", "Yao", "Tan", "Suo", "Yang", "Fa", "Bing", "Jia", "Dai", "Zai", "Tang", , "Bin", "Chu", "Nuo", "Can", "Lei", "Cui", "Yong", "Zao", "Zong", "Peng", "Song", "Ao", "Chuan", "Yu", "Zhai", "Cou", "Shang", "Qiang", "Jing", "Chi", "Sha", "Han", "Zhang", "Qing", "Yan", "Di", "Xi", "Lu", "Bei", "Piao", "Jin", "Lian", "Lu", "Man", "Qian", "Xian", "Tan", "Ying", "Dong", "Zhuan", "Xiang", "Shan", "Qiao", "Jiong", "Tui", "Zun", "Pu", "Xi", "Lao", "Chang", "Guang", "Liao", "Qi", "Deng", "Chan", "Wei", "Ji", "Fan", "Hui", "Chuan", "Jian", "Dan", "Jiao", "Jiu", "Seng", "Fen", "Xian", "Jue", "E", "Jiao", "Jian", "Tong", "Lin", "Bo", "Gu", , "Su", "Xian", "Jiang", "Min", "Ye", "Jin", "Jia", "Qiao", "Pi", "Feng", "Zhou", "Ai", "Sai"], ["Yi", "Jun", "Nong", "Chan", "Yi", "Dang", "Jing", "Xuan", "Kuai", "Jian", "Chu", "Dan", "Jiao", "Sha", "Zai", , "Bin", "An", "Ru", "Tai", "Chou", "Chai", "Lan", "Ni", "Jin", "Qian", "Meng", "Wu", "Ning", "Qiong", "Ni", "Chang", "Lie", "Lei", "Lu", "Kuang", "Bao", "Du", "Biao", "Zan", "Zhi", "Si", "You", "Hao", "Chen", "Chen", "Li", "Teng", "Wei", "Long", "Chu", "Chan", "Rang", "Shu", "Hui", "Li", "Luo", "Zan", "Nuo", "Tang", "Yan", "Lei", "Nang", "Er", "Wu", "Yun", "Zan", "Yuan", "Xiong", "Chong", "Zhao", "Xiong", "Xian", "Guang", "Dui", "Ke", "Dui", "Mian", "Tu", "Chang", "Er", "Dui", "Er", "Xin", "Tu", "Si", "Yan", "Yan", "Shi", "Shi", "Dang", "Qian", "Dou", "Fen", "Mao", "Shen", "Dou", "Bai", "Jing", "Li", "Huang", "Ru", "Wang", "Nei", "Quan", "Liang", "Yu", "Ba", "Gong", "Liu", "Xi", , "Lan", "Gong", "Tian", "Guan", "Xing", "Bing", "Qi", "Ju", "Dian", "Zi", "Ppwun", "Yang", "Jian", "Shou", "Ji", "Yi", "Ji", "Chan", "Jiong", "Mao", "Ran", "Nei", "Yuan", "Mao", "Gang", "Ran", "Ce", "Jiong", "Ce", "Zai", "Gua", "Jiong", "Mao", "Zhou", "Mou", "Gou", "Xu", "Mian", "Mi", "Rong", "Yin", "Xie", "Kan", "Jun", "Nong", "Yi", "Mi", "Shi", "Guan", "Meng", "Zhong", "Ju", "Yuan", "Ming", "Kou", "Lam", "Fu", "Xie", "Mi", "Bing", "Dong", "Tai", "Gang", "Feng", "Bing", "Hu", "Chong", "Jue", "Hu", "Kuang", "Ye", "Leng", "Pan", "Fu", "Min", "Dong", "Xian", "Lie", "Xia", "Jian", "Jing", "Shu", "Mei", "Tu", "Qi", "Gu", "Zhun", "Song", "Jing", "Liang", "Qing", "Diao", "Ling", "Dong", "Gan", "Jian", "Yin", "Cou", "Yi", "Li", "Cang", "Ming", "Zhuen", "Cui", "Si", "Duo", "Jin", "Lin", "Lin", "Ning", "Xi", "Du", "Ji", "Fan", "Fan", "Fan", "Feng", "Ju", "Chu", "Tako", "Feng", "Mok", "Ci", "Fu", "Feng", "Ping", "Feng", "Kai", "Huang", "Kai", "Gan", "Deng", "Ping", "Qu", "Xiong", "Kuai", "Tu", "Ao", "Chu", "Ji", "Dang", "Han", "Han", "Zao"], ["Dao", "Diao", "Dao", "Ren", "Ren", "Chuang", "Fen", "Qie", "Yi", "Ji", "Kan", "Qian", "Cun", "Chu", "Wen", "Ji", "Dan", "Xing", "Hua", "Wan", "Jue", "Li", "Yue", "Lie", "Liu", "Ze", "Gang", "Chuang", "Fu", "Chu", "Qu", "Ju", "Shan", "Min", "Ling", "Zhong", "Pan", "Bie", "Jie", "Jie", "Bao", "Li", "Shan", "Bie", "Chan", "Jing", "Gua", "Gen", "Dao", "Chuang", "Kui", "Ku", "Duo", "Er", "Zhi", "Shua", "Quan", "Cha", "Ci", "Ke", "Jie", "Gui", "Ci", "Gui", "Kai", "Duo", "Ji", "Ti", "Jing", "Lou", "Gen", "Ze", "Yuan", "Cuo", "Xue", "Ke", "La", "Qian", "Cha", "Chuang", "Gua", "Jian", "Cuo", "Li", "Ti", "Fei", "Pou", "Chan", "Qi", "Chuang", "Zi", "Gang", "Wan", "Bo", "Ji", "Duo", "Qing", "Yan", "Zhuo", "Jian", "Ji", "Bo", "Yan", "Ju", "Huo", "Sheng", "Jian", "Duo", "Duan", "Wu", "Gua", "Fu", "Sheng", "Jian", "Ge", "Zha", "Kai", "Chuang", "Juan", "Chan", "Tuan", "Lu", "Li", "Fou", "Shan", "Piao", "Kou", "Jiao", "Gua", "Qiao", "Jue", "Hua", "Zha", "Zhuo", "Lian", "Ju", "Pi", "Liu", "Gui", "Jiao", "Gui", "Jian", "Jian", "Tang", "Huo", "Ji", "Jian", "Yi", "Jian", "Zhi", "Chan", "Cuan", "Mo", "Li", "Zhu", "Li", "Ya", "Quan", "Ban", "Gong", "Jia", "Wu", "Mai", "Lie", "Jin", "Keng", "Xie", "Zhi", "Dong", "Zhu", "Nu", "Jie", "Qu", "Shao", "Yi", "Zhu", "Miao", "Li", "Jing", "Lao", "Lao", "Juan", "Kou", "Yang", "Wa", "Xiao", "Mou", "Kuang", "Jie", "Lie", "He", "Shi", "Ke", "Jing", "Hao", "Bo", "Min", "Chi", "Lang", "Yong", "Yong", "Mian", "Ke", "Xun", "Juan", "Qing", "Lu", "Pou", "Meng", "Lai", "Le", "Kai", "Mian", "Dong", "Xu", "Xu", "Kan", "Wu", "Yi", "Xun", "Weng", "Sheng", "Lao", "Mu", "Lu", "Piao", "Shi", "Ji", "Qin", "Qiang", "Jiao", "Quan", "Yang", "Yi", "Jue", "Fan", "Juan", "Tong", "Ju", "Dan", "Xie", "Mai", "Xun", "Xun", "Lu", "Li", "Che", "Rang", "Quan", "Bao", "Shao", "Yun", "Jiu", "Bao", "Gou", "Wu"], ["Yun", "Mwun", "Nay", "Gai", "Gai", "Bao", "Cong", , "Xiong", "Peng", "Ju", "Tao", "Ge", "Pu", "An", "Pao", "Fu", "Gong", "Da", "Jiu", "Qiong", "Bi", "Hua", "Bei", "Nao", "Chi", "Fang", "Jiu", "Yi", "Za", "Jiang", "Kang", "Jiang", "Kuang", "Hu", "Xia", "Qu", "Bian", "Gui", "Qie", "Zang", "Kuang", "Fei", "Hu", "Tou", "Gui", "Gui", "Hui", "Dan", "Gui", "Lian", "Lian", "Suan", "Du", "Jiu", "Qu", "Xi", "Pi", "Qu", "Yi", "Qia", "Yan", "Bian", "Ni", "Qu", "Shi", "Xin", "Qian", "Nian", "Sa", "Zu", "Sheng", "Wu", "Hui", "Ban", "Shi", "Xi", "Wan", "Hua", "Xie", "Wan", "Bei", "Zu", "Zhuo", "Xie", "Dan", "Mai", "Nan", "Dan", "Ji", "Bo", "Shuai", "Bu", "Kuang", "Bian", "Bu", "Zhan", "Qia", "Lu", "You", "Lu", "Xi", "Gua", "Wo", "Xie", "Jie", "Jie", "Wei", "Ang", "Qiong", "Zhi", "Mao", "Yin", "Wei", "Shao", "Ji", "Que", "Luan", "Shi", "Juan", "Xie", "Xu", "Jin", "Que", "Wu", "Ji", "E", "Qing", "Xi", , "Han", "Zhan", "E", "Ting", "Li", "Zhe", "Han", "Li", "Ya", "Ya", "Yan", "She", "Zhi", "Zha", "Pang", , "He", "Ya", "Zhi", "Ce", "Pang", "Ti", "Li", "She", "Hou", "Ting", "Zui", "Cuo", "Fei", "Yuan", "Ce", "Yuan", "Xiang", "Yan", "Li", "Jue", "Sha", "Dian", "Chu", "Jiu", "Qin", "Ao", "Gui", "Yan", "Si", "Li", "Chang", "Lan", "Li", "Yan", "Yan", "Yuan", "Si", "Gong", "Lin", "Qiu", "Qu", "Qu", "Uk", "Lei", "Du", "Xian", "Zhuan", "San", "Can", "Can", "Can", "Can", "Ai", "Dai", "You", "Cha", "Ji", "You", "Shuang", "Fan", "Shou", "Guai", "Ba", "Fa", "Ruo", "Shi", "Shu", "Zhuo", "Qu", "Shou", "Bian", "Xu", "Jia", "Pan", "Sou", "Gao", "Wei", "Sou", "Die", "Rui", "Cong", "Kou", "Gu", "Ju", "Ling", "Gua", "Tao", "Kou", "Zhi", "Jiao", "Zhao", "Ba", "Ding", "Ke", "Tai", "Chi", "Shi", "You", "Qiu", "Po", "Ye", "Hao", "Si", "Tan", "Chi", "Le", "Diao", "Ji", , "Hong"], ["Mie", "Xu", "Mang", "Chi", "Ge", "Xuan", "Yao", "Zi", "He", "Ji", "Diao", "Cun", "Tong", "Ming", "Hou", "Li", "Tu", "Xiang", "Zha", "Xia", "Ye", "Lu", "A", "Ma", "Ou", "Xue", "Yi", "Jun", "Chou", "Lin", "Tun", "Yin", "Fei", "Bi", "Qin", "Qin", "Jie", "Bu", "Fou", "Ba", "Dun", "Fen", "E", "Han", "Ting", "Hang", "Shun", "Qi", "Hong", "Zhi", "Shen", "Wu", "Wu", "Chao", "Ne", "Xue", "Xi", "Chui", "Dou", "Wen", "Hou", "Ou", "Wu", "Gao", "Ya", "Jun", "Lu", "E", "Ge", "Mei", "Ai", "Qi", "Cheng", "Wu", "Gao", "Fu", "Jiao", "Hong", "Chi", "Sheng", "Ne", "Tun", "Fu", "Yi", "Dai", "Ou", "Li", "Bai", "Yuan", "Kuai", , "Qiang", "Wu", "E", "Shi", "Quan", "Pen", "Wen", "Ni", "M", "Ling", "Ran", "You", "Di", "Zhou", "Shi", "Zhou", "Tie", "Xi", "Yi", "Qi", "Ping", "Zi", "Gu", "Zi", "Wei", "Xu", "He", "Nao", "Xia", "Pei", "Yi", "Xiao", "Shen", "Hu", "Ming", "Da", "Qu", "Ju", "Gem", "Za", "Tuo", "Duo", "Pou", "Pao", "Bi", "Fu", "Yang", "He", "Zha", "He", "Hai", "Jiu", "Yong", "Fu", "Que", "Zhou", "Wa", "Ka", "Gu", "Ka", "Zuo", "Bu", "Long", "Dong", "Ning", "Tha", "Si", "Xian", "Huo", "Qi", "Er", "E", "Guang", "Zha", "Xi", "Yi", "Lie", "Zi", "Mie", "Mi", "Zhi", "Yao", "Ji", "Zhou", "Ge", "Shuai", "Zan", "Xiao", "Ke", "Hui", "Kua", "Huai", "Tao", "Xian", "E", "Xuan", "Xiu", "Wai", "Yan", "Lao", "Yi", "Ai", "Pin", "Shen", "Tong", "Hong", "Xiong", "Chi", "Wa", "Ha", "Zai", "Yu", "Di", "Pai", "Xiang", "Ai", "Hen", "Kuang", "Ya", "Da", "Xiao", "Bi", "Yue", , "Hua", "Sasou", "Kuai", "Duo", , "Ji", "Nong", "Mou", "Yo", "Hao", "Yuan", "Long", "Pou", "Mang", "Ge", "E", "Chi", "Shao", "Li", "Na", "Zu", "He", "Ku", "Xiao", "Xian", "Lao", "Bo", "Zhe", "Zha", "Liang", "Ba", "Mie", "Le", "Sui", "Fou", "Bu", "Han", "Heng", "Geng", "Shuo", "Ge"], ["You", "Yan", "Gu", "Gu", "Bai", "Han", "Suo", "Chun", "Yi", "Ai", "Jia", "Tu", "Xian", "Huan", "Li", "Xi", "Tang", "Zuo", "Qiu", "Che", "Wu", "Zao", "Ya", "Dou", "Qi", "Di", "Qin", "Ma", "Mal", "Hong", "Dou", "Kes", "Lao", "Liang", "Suo", "Zao", "Huan", "Lang", "Sha", "Ji", "Zuo", "Wo", "Feng", "Yin", "Hu", "Qi", "Shou", "Wei", "Shua", "Chang", "Er", "Li", "Qiang", "An", "Jie", "Yo", "Nian", "Yu", "Tian", "Lai", "Sha", "Xi", "Tuo", "Hu", "Ai", "Zhou", "Nou", "Ken", "Zhuo", "Zhuo", "Shang", "Di", "Heng", "Lan", "A", "Xiao", "Xiang", "Tun", "Wu", "Wen", "Cui", "Sha", "Hu", "Qi", "Qi", "Tao", "Dan", "Dan", "Ye", "Zi", "Bi", "Cui", "Chuo", "He", "Ya", "Qi", "Zhe", "Pei", "Liang", "Xian", "Pi", "Sha", "La", "Ze", "Qing", "Gua", "Pa", "Zhe", "Se", "Zhuan", "Nie", "Guo", "Luo", "Yan", "Di", "Quan", "Tan", "Bo", "Ding", "Lang", "Xiao", , "Tang", "Chi", "Ti", "An", "Jiu", "Dan", "Ke", "Yong", "Wei", "Nan", "Shan", "Yu", "Zhe", "La", "Jie", "Hou", "Han", "Die", "Zhou", "Chai", "Wai", "Re", "Yu", "Yin", "Zan", "Yao", "Wo", "Mian", "Hu", "Yun", "Chuan", "Hui", "Huan", "Huan", "Xi", "He", "Ji", "Kui", "Zhong", "Wei", "Sha", "Xu", "Huang", "Du", "Nie", "Xuan", "Liang", "Yu", "Sang", "Chi", "Qiao", "Yan", "Dan", "Pen", "Can", "Li", "Yo", "Zha", "Wei", "Miao", "Ying", "Pen", "Phos", "Kui", "Xi", "Yu", "Jie", "Lou", "Ku", "Sao", "Huo", "Ti", "Yao", "He", "A", "Xiu", "Qiang", "Se", "Yong", "Su", "Hong", "Xie", "Yi", "Suo", "Ma", "Cha", "Hai", "Ke", "Ta", "Sang", "Tian", "Ru", "Sou", "Wa", "Ji", "Pang", "Wu", "Xian", "Shi", "Ge", "Zi", "Jie", "Luo", "Weng", "Wa", "Si", "Chi", "Hao", "Suo", "Jia", "Hai", "Suo", "Qin", "Nie", "He", "Cis", "Sai", "Ng", "Ge", "Na", "Dia", "Ai", , "Tong", "Bi", "Ao", "Ao", "Lian", "Cui", "Zhe", "Mo", "Sou", "Sou", "Tan"], ["Di", "Qi", "Jiao", "Chong", "Jiao", "Kai", "Tan", "San", "Cao", "Jia", "Ai", "Xiao", "Piao", "Lou", "Ga", "Gu", "Xiao", "Hu", "Hui", "Guo", "Ou", "Xian", "Ze", "Chang", "Xu", "Po", "De", "Ma", "Ma", "Hu", "Lei", "Du", "Ga", "Tang", "Ye", "Beng", "Ying", "Saai", "Jiao", "Mi", "Xiao", "Hua", "Mai", "Ran", "Zuo", "Peng", "Lao", "Xiao", "Ji", "Zhu", "Chao", "Kui", "Zui", "Xiao", "Si", "Hao", "Fu", "Liao", "Qiao", "Xi", "Xiu", "Tan", "Tan", "Mo", "Xun", "E", "Zun", "Fan", "Chi", "Hui", "Zan", "Chuang", "Cu", "Dan", "Yu", "Tun", "Cheng", "Jiao", "Ye", "Xi", "Qi", "Hao", "Lian", "Xu", "Deng", "Hui", "Yin", "Pu", "Jue", "Qin", "Xun", "Nie", "Lu", "Si", "Yan", "Ying", "Da", "Dan", "Yu", "Zhou", "Jin", "Nong", "Yue", "Hui", "Qi", "E", "Zao", "Yi", "Shi", "Jiao", "Yuan", "Ai", "Yong", "Jue", "Kuai", "Yu", "Pen", "Dao", "Ge", "Xin", "Dun", "Dang", "Sin", "Sai", "Pi", "Pi", "Yin", "Zui", "Ning", "Di", "Lan", "Ta", "Huo", "Ru", "Hao", "Xia", "Ya", "Duo", "Xi", "Chou", "Ji", "Jin", "Hao", "Ti", "Chang", , , "Ca", "Ti", "Lu", "Hui", "Bo", "You", "Nie", "Yin", "Hu", "Mo", "Huang", "Zhe", "Li", "Liu", "Haai", "Nang", "Xiao", "Mo", "Yan", "Li", "Lu", "Long", "Fu", "Dan", "Chen", "Pin", "Pi", "Xiang", "Huo", "Mo", "Xi", "Duo", "Ku", "Yan", "Chan", "Ying", "Rang", "Dian", "La", "Ta", "Xiao", "Jiao", "Chuo", "Huan", "Huo", "Zhuan", "Nie", "Xiao", "Ca", "Li", "Chan", "Chai", "Li", "Yi", "Luo", "Nang", "Zan", "Su", "Xi", "So", "Jian", "Za", "Zhu", "Lan", "Nie", "Nang", , , "Wei", "Hui", "Yin", "Qiu", "Si", "Nin", "Jian", "Hui", "Xin", "Yin", "Nan", "Tuan", "Tuan", "Dun", "Kang", "Yuan", "Jiong", "Pian", "Yun", "Cong", "Hu", "Hui", "Yuan", "You", "Guo", "Kun", "Cong", "Wei", "Tu", "Wei", "Lun", "Guo", "Qun", "Ri", "Ling", "Gu", "Guo", "Tai", "Guo", "Tu", "You"], ["Guo", "Yin", "Hun", "Pu", "Yu", "Han", "Yuan", "Lun", "Quan", "Yu", "Qing", "Guo", "Chuan", "Wei", "Yuan", "Quan", "Ku", "Fu", "Yuan", "Yuan", "E", "Tu", "Tu", "Tu", "Tuan", "Lue", "Hui", "Yi", "Yuan", "Luan", "Luan", "Tu", "Ya", "Tu", "Ting", "Sheng", "Pu", "Lu", "Iri", "Ya", "Zai", "Wei", "Ge", "Yu", "Wu", "Gui", "Pi", "Yi", "Di", "Qian", "Qian", "Zhen", "Zhuo", "Dang", "Qia", "Akutsu", "Yama", "Kuang", "Chang", "Qi", "Nie", "Mo", "Ji", "Jia", "Zhi", "Zhi", "Ban", "Xun", "Tou", "Qin", "Fen", "Jun", "Keng", "Tun", "Fang", "Fen", "Ben", "Tan", "Kan", "Pi", "Zuo", "Keng", "Bi", "Xing", "Di", "Jing", "Ji", "Kuai", "Di", "Jing", "Jian", "Tan", "Li", "Ba", "Wu", "Fen", "Zhui", "Po", "Pan", "Tang", "Kun", "Qu", "Tan", "Zhi", "Tuo", "Gan", "Ping", "Dian", "Gua", "Ni", "Tai", "Pi", "Jiong", "Yang", "Fo", "Ao", "Liu", "Qiu", "Mu", "Ke", "Gou", "Xue", "Ba", "Chi", "Che", "Ling", "Zhu", "Fu", "Hu", "Zhi", "Chui", "La", "Long", "Long", "Lu", "Ao", "Tay", "Pao", , "Xing", "Dong", "Ji", "Ke", "Lu", "Ci", "Chi", "Lei", "Gai", "Yin", "Hou", "Dui", "Zhao", "Fu", "Guang", "Yao", "Duo", "Duo", "Gui", "Cha", "Yang", "Yin", "Fa", "Gou", "Yuan", "Die", "Xie", "Ken", "Jiong", "Shou", "E", "Ha", "Dian", "Hong", "Wu", "Kua", , "Tao", "Dang", "Kai", "Gake", "Nao", "An", "Xing", "Xian", "Huan", "Bang", "Pei", "Ba", "Yi", "Yin", "Han", "Xu", "Chui", "Cen", "Geng", "Ai", "Peng", "Fang", "Que", "Yong", "Xun", "Jia", "Di", "Mai", "Lang", "Xuan", "Cheng", "Yan", "Jin", "Zhe", "Lei", "Lie", "Bu", "Cheng", "Gomi", "Bu", "Shi", "Xun", "Guo", "Jiong", "Ye", "Nian", "Di", "Yu", "Bu", "Ya", "Juan", "Sui", "Pi", "Cheng", "Wan", "Ju", "Lun", "Zheng", "Kong", "Chong", "Dong", "Dai", "Tan", "An", "Cai", "Shu", "Beng", "Kan", "Zhi", "Duo", "Yi", "Zhi", "Yi", "Pei", "Ji", "Zhun", "Qi", "Sao", "Ju", "Ni"], ["Ku", "Ke", "Tang", "Kun", "Ni", "Jian", "Dui", "Jin", "Gang", "Yu", "E", "Peng", "Gu", "Tu", "Leng", , "Ya", "Qian", , "An", , "Duo", "Nao", "Tu", "Cheng", "Yin", "Hun", "Bi", "Lian", "Guo", "Die", "Zhuan", "Hou", "Bao", "Bao", "Yu", "Di", "Mao", "Jie", "Ruan", "E", "Geng", "Kan", "Zong", "Yu", "Huang", "E", "Yao", "Yan", "Bao", "Ji", "Mei", "Chang", "Du", "Tuo", "Yin", "Feng", "Zhong", "Jie", "Zhen", "Feng", "Gang", "Chuan", "Jian", "Pyeng", "Toride", "Xiang", "Huang", "Leng", "Duan", , "Xuan", "Ji", "Ji", "Kuai", "Ying", "Ta", "Cheng", "Yong", "Kai", "Su", "Su", "Shi", "Mi", "Ta", "Weng", "Cheng", "Tu", "Tang", "Que", "Zhong", "Li", "Peng", "Bang", "Sai", "Zang", "Dui", "Tian", "Wu", "Cheng", "Xun", "Ge", "Zhen", "Ai", "Gong", "Yan", "Kan", "Tian", "Yuan", "Wen", "Xie", "Liu", "Ama", "Lang", "Chang", "Peng", "Beng", "Chen", "Cu", "Lu", "Ou", "Qian", "Mei", "Mo", "Zhuan", "Shuang", "Shu", "Lou", "Chi", "Man", "Biao", "Jing", "Qi", "Shu", "Di", "Zhang", "Kan", "Yong", "Dian", "Chen", "Zhi", "Xi", "Guo", "Qiang", "Jin", "Di", "Shang", "Mu", "Cui", "Yan", "Ta", "Zeng", "Qi", "Qiang", "Liang", , "Zhui", "Qiao", "Zeng", "Xu", "Shan", "Shan", "Ba", "Pu", "Kuai", "Dong", "Fan", "Que", "Mo", "Dun", "Dun", "Dun", "Di", "Sheng", "Duo", "Duo", "Tan", "Deng", "Wu", "Fen", "Huang", "Tan", "Da", "Ye", "Sho", "Mama", "Yu", "Qiang", "Ji", "Qiao", "Ken", "Yi", "Pi", "Bi", "Dian", "Jiang", "Ye", "Yong", "Bo", "Tan", "Lan", "Ju", "Huai", "Dang", "Rang", "Qian", "Xun", "Lan", "Xi", "He", "Ai", "Ya", "Dao", "Hao", "Ruan", "Mama", "Lei", "Kuang", "Lu", "Yan", "Tan", "Wei", "Huai", "Long", "Long", "Rui", "Li", "Lin", "Rang", "Ten", "Xun", "Yan", "Lei", "Ba", , "Shi", "Ren", , "Zhuang", "Zhuang", "Sheng", "Yi", "Mai", "Ke", "Zhu", "Zhuang", "Hu", "Hu", "Kun", "Yi", "Hu", "Xu", "Kun", "Shou", "Mang", "Zun"], ["Shou", "Yi", "Zhi", "Gu", "Chu", "Jiang", "Feng", "Bei", "Cay", "Bian", "Sui", "Qun", "Ling", "Fu", "Zuo", "Xia", "Xiong", , "Nao", "Xia", "Kui", "Xi", "Wai", "Yuan", "Mao", "Su", "Duo", "Duo", "Ye", "Qing", "Uys", "Gou", "Gou", "Qi", "Meng", "Meng", "Yin", "Huo", "Chen", "Da", "Ze", "Tian", "Tai", "Fu", "Guai", "Yao", "Yang", "Hang", "Gao", "Shi", "Ben", "Tai", "Tou", "Yan", "Bi", "Yi", "Kua", "Jia", "Duo", "Kwu", "Kuang", "Yun", "Jia", "Pa", "En", "Lian", "Huan", "Di", "Yan", "Pao", "Quan", "Qi", "Nai", "Feng", "Xie", "Fen", "Dian", , "Kui", "Zou", "Huan", "Qi", "Kai", "Zha", "Ben", "Yi", "Jiang", "Tao", "Zang", "Ben", "Xi", "Xiang", "Fei", "Diao", "Xun", "Keng", "Dian", "Ao", "She", "Weng", "Pan", "Ao", "Wu", "Ao", "Jiang", "Lian", "Duo", "Yun", "Jiang", "Shi", "Fen", "Huo", "Bi", "Lian", "Duo", "Nu", "Nu", "Ding", "Nai", "Qian", "Jian", "Ta", "Jiu", "Nan", "Cha", "Hao", "Xian", "Fan", "Ji", "Shuo", "Ru", "Fei", "Wang", "Hong", "Zhuang", "Fu", "Ma", "Dan", "Ren", "Fu", "Jing", "Yan", "Xie", "Wen", "Zhong", "Pa", "Du", "Ji", "Keng", "Zhong", "Yao", "Jin", "Yun", "Miao", "Pei", "Shi", "Yue", "Zhuang", "Niu", "Yan", "Na", "Xin", "Fen", "Bi", "Yu", "Tuo", "Feng", "Yuan", "Fang", "Wu", "Yu", "Gui", "Du", "Ba", "Ni", "Zhou", "Zhuo", "Zhao", "Da", "Nai", "Yuan", "Tou", "Xuan", "Zhi", "E", "Mei", "Mo", "Qi", "Bi", "Shen", "Qie", "E", "He", "Xu", "Fa", "Zheng", "Min", "Ban", "Mu", "Fu", "Ling", "Zi", "Zi", "Shi", "Ran", "Shan", "Yang", "Man", "Jie", "Gu", "Si", "Xing", "Wei", "Zi", "Ju", "Shan", "Pin", "Ren", "Yao", "Tong", "Jiang", "Shu", "Ji", "Gai", "Shang", "Kuo", "Juan", "Jiao", "Gou", "Mu", "Jian", "Jian", "Yi", "Nian", "Zhi", "Ji", "Ji", "Xian", "Heng", "Guang", "Jun", "Kua", "Yan", "Ming", "Lie", "Pei", "Yan", "You", "Yan", "Cha", "Shen", "Yin", "Chi", "Gui", "Quan", "Zi"], ["Song", "Wei", "Hong", "Wa", "Lou", "Ya", "Rao", "Jiao", "Luan", "Ping", "Xian", "Shao", "Li", "Cheng", "Xiao", "Mang", "Fu", "Suo", "Wu", "Wei", "Ke", "Lai", "Chuo", "Ding", "Niang", "Xing", "Nan", "Yu", "Nuo", "Pei", "Nei", "Juan", "Shen", "Zhi", "Han", "Di", "Zhuang", "E", "Pin", "Tui", "Han", "Mian", "Wu", "Yan", "Wu", "Xi", "Yan", "Yu", "Si", "Yu", "Wa", , "Xian", "Ju", "Qu", "Shui", "Qi", "Xian", "Zhui", "Dong", "Chang", "Lu", "Ai", "E", "E", "Lou", "Mian", "Cong", "Pou", "Ju", "Po", "Cai", "Ding", "Wan", "Biao", "Xiao", "Shu", "Qi", "Hui", "Fu", "E", "Wo", "Tan", "Fei", "Wei", "Jie", "Tian", "Ni", "Quan", "Jing", "Hun", "Jing", "Qian", "Dian", "Xing", "Hu", "Wa", "Lai", "Bi", "Yin", "Chou", "Chuo", "Fu", "Jing", "Lun", "Yan", "Lan", "Kun", "Yin", "Ya", "Ju", "Li", "Dian", "Xian", "Hwa", "Hua", "Ying", "Chan", "Shen", "Ting", "Dang", "Yao", "Wu", "Nan", "Ruo", "Jia", "Tou", "Xu", "Yu", "Wei", "Ti", "Rou", "Mei", "Dan", "Ruan", "Qin", "Hui", "Wu", "Qian", "Chun", "Mao", "Fu", "Jie", "Duan", "Xi", "Zhong", "Mei", "Huang", "Mian", "An", "Ying", "Xuan", "Jie", "Wei", "Mei", "Yuan", "Zhen", "Qiu", "Ti", "Xie", "Tuo", "Lian", "Mao", "Ran", "Si", "Pian", "Wei", "Wa", "Jiu", "Hu", "Ao", , "Bou", "Xu", "Tou", "Gui", "Zou", "Yao", "Pi", "Xi", "Yuan", "Ying", "Rong", "Ru", "Chi", "Liu", "Mei", "Pan", "Ao", "Ma", "Gou", "Kui", "Qin", "Jia", "Sao", "Zhen", "Yuan", "Cha", "Yong", "Ming", "Ying", "Ji", "Su", "Niao", "Xian", "Tao", "Pang", "Lang", "Nao", "Bao", "Ai", "Pi", "Pin", "Yi", "Piao", "Yu", "Lei", "Xuan", "Man", "Yi", "Zhang", "Kang", "Yong", "Ni", "Li", "Di", "Gui", "Yan", "Jin", "Zhuan", "Chang", "Ce", "Han", "Nen", "Lao", "Mo", "Zhe", "Hu", "Hu", "Ao", "Nen", "Qiang", "Ma", "Pie", "Gu", "Wu", "Jiao", "Tuo", "Zhan", "Mao", "Xian", "Xian", "Mo", "Liao", "Lian", "Hua"], ["Gui", "Deng", "Zhi", "Xu", "Yi", "Hua", "Xi", "Hui", "Rao", "Xi", "Yan", "Chan", "Jiao", "Mei", "Fan", "Fan", "Xian", "Yi", "Wei", "Jiao", "Fu", "Shi", "Bi", "Shan", "Sui", "Qiang", "Lian", "Huan", "Xin", "Niao", "Dong", "Yi", "Can", "Ai", "Niang", "Neng", "Ma", "Tiao", "Chou", "Jin", "Ci", "Yu", "Pin", "Yong", "Xu", "Nai", "Yan", "Tai", "Ying", "Can", "Niao", "Wo", "Ying", "Mian", "Kaka", "Ma", "Shen", "Xing", "Ni", "Du", "Liu", "Yuan", "Lan", "Yan", "Shuang", "Ling", "Jiao", "Niang", "Lan", "Xian", "Ying", "Shuang", "Shuai", "Quan", "Mi", "Li", "Luan", "Yan", "Zhu", "Lan", "Zi", "Jie", "Jue", "Jue", "Kong", "Yun", "Zi", "Zi", "Cun", "Sun", "Fu", "Bei", "Zi", "Xiao", "Xin", "Meng", "Si", "Tai", "Bao", "Ji", "Gu", "Nu", "Xue", , "Zhuan", "Hai", "Luan", "Sun", "Huai", "Mie", "Cong", "Qian", "Shu", "Chan", "Ya", "Zi", "Ni", "Fu", "Zi", "Li", "Xue", "Bo", "Ru", "Lai", "Nie", "Nie", "Ying", "Luan", "Mian", "Ning", "Rong", "Ta", "Gui", "Zhai", "Qiong", "Yu", "Shou", "An", "Tu", "Song", "Wan", "Rou", "Yao", "Hong", "Yi", "Jing", "Zhun", "Mi", "Zhu", "Dang", "Hong", "Zong", "Guan", "Zhou", "Ding", "Wan", "Yi", "Bao", "Shi", "Shi", "Chong", "Shen", "Ke", "Xuan", "Shi", "You", "Huan", "Yi", "Tiao", "Shi", "Xian", "Gong", "Cheng", "Qun", "Gong", "Xiao", "Zai", "Zha", "Bao", "Hai", "Yan", "Xiao", "Jia", "Shen", "Chen", "Rong", "Huang", "Mi", "Kou", "Kuan", "Bin", "Su", "Cai", "Zan", "Ji", "Yuan", "Ji", "Yin", "Mi", "Kou", "Qing", "Que", "Zhen", "Jian", "Fu", "Ning", "Bing", "Huan", "Mei", "Qin", "Han", "Yu", "Shi", "Ning", "Qin", "Ning", "Zhi", "Yu", "Bao", "Kuan", "Ning", "Qin", "Mo", "Cha", "Ju", "Gua", "Qin", "Hu", "Wu", "Liao", "Shi", "Zhu", "Zhai", "Shen", "Wei", "Xie", "Kuan", "Hui", "Liao", "Jun", "Huan", "Yi", "Yi", "Bao", "Qin", "Chong", "Bao", "Feng", "Cun", "Dui", "Si", "Xun", "Dao", "Lu", "Dui", "Shou"], ["Po", "Feng", "Zhuan", "Fu", "She", "Ke", "Jiang", "Jiang", "Zhuan", "Wei", "Zun", "Xun", "Shu", "Dui", "Dao", "Xiao", "Ji", "Shao", "Er", "Er", "Er", "Ga", "Jian", "Shu", "Chen", "Shang", "Shang", "Mo", "Ga", "Chang", "Liao", "Xian", "Xian", , "Wang", "Wang", "You", "Liao", "Liao", "Yao", "Mang", "Wang", "Wang", "Wang", "Ga", "Yao", "Duo", "Kui", "Zhong", "Jiu", "Gan", "Gu", "Gan", "Tui", "Gan", "Gan", "Shi", "Yin", "Chi", "Kao", "Ni", "Jin", "Wei", "Niao", "Ju", "Pi", "Ceng", "Xi", "Bi", "Ju", "Jie", "Tian", "Qu", "Ti", "Jie", "Wu", "Diao", "Shi", "Shi", "Ping", "Ji", "Xie", "Chen", "Xi", "Ni", "Zhan", "Xi", , "Man", "E", "Lou", "Ping", "Ti", "Fei", "Shu", "Xie", "Tu", "Lu", "Lu", "Xi", "Ceng", "Lu", "Ju", "Xie", "Ju", "Jue", "Liao", "Jue", "Shu", "Xi", "Che", "Tun", "Ni", "Shan", , "Xian", "Li", "Xue", "Nata", , "Long", "Yi", "Qi", "Ren", "Wu", "Han", "Shen", "Yu", "Chu", "Sui", "Qi", , "Yue", "Ban", "Yao", "Ang", "Ya", "Wu", "Jie", "E", "Ji", "Qian", "Fen", "Yuan", "Qi", "Cen", "Qian", "Qi", "Cha", "Jie", "Qu", "Gang", "Xian", "Ao", "Lan", "Dao", "Ba", "Zuo", "Zuo", "Yang", "Ju", "Gang", "Ke", "Gou", "Xue", "Bei", "Li", "Tiao", "Ju", "Yan", "Fu", "Xiu", "Jia", "Ling", "Tuo", "Pei", "You", "Dai", "Kuang", "Yue", "Qu", "Hu", "Po", "Min", "An", "Tiao", "Ling", "Chi", "Yuri", "Dong", "Cem", "Kui", "Xiu", "Mao", "Tong", "Xue", "Yi", "Kura", "He", "Ke", "Luo", "E", "Fu", "Xun", "Die", "Lu", "An", "Er", "Gai", "Quan", "Tong", "Yi", "Mu", "Shi", "An", "Wei", "Hu", "Zhi", "Mi", "Li", "Ji", "Tong", "Wei", "You", "Sang", "Xia", "Li", "Yao", "Jiao", "Zheng", "Luan", "Jiao", "E", "E", "Yu", "Ye", "Bu", "Qiao", "Qun", "Feng", "Feng", "Nao", "Li", "You", "Xian", "Hong", "Dao", "Shen", "Cheng", "Tu", "Geng", "Jun", "Hao", "Xia", "Yin", "Yu"], ["Lang", "Kan", "Lao", "Lai", "Xian", "Que", "Kong", "Chong", "Chong", "Ta", "Lin", "Hua", "Ju", "Lai", "Qi", "Min", "Kun", "Kun", "Zu", "Gu", "Cui", "Ya", "Ya", "Gang", "Lun", "Lun", "Leng", "Jue", "Duo", "Zheng", "Guo", "Yin", "Dong", "Han", "Zheng", "Wei", "Yao", "Pi", "Yan", "Song", "Jie", "Beng", "Zu", "Jue", "Dong", "Zhan", "Gu", "Yin", , "Ze", "Huang", "Yu", "Wei", "Yang", "Feng", "Qiu", "Dun", "Ti", "Yi", "Zhi", "Shi", "Zai", "Yao", "E", "Zhu", "Kan", "Lu", "Yan", "Mei", "Gan", "Ji", "Ji", "Huan", "Ting", "Sheng", "Mei", "Qian", "Wu", "Yu", "Zong", "Lan", "Jue", "Yan", "Yan", "Wei", "Zong", "Cha", "Sui", "Rong", "Yamashina", "Qin", "Yu", "Kewashii", "Lou", "Tu", "Dui", "Xi", "Weng", "Cang", "Dang", "Hong", "Jie", "Ai", "Liu", "Wu", "Song", "Qiao", "Zi", "Wei", "Beng", "Dian", "Cuo", "Qian", "Yong", "Nie", "Cuo", "Ji", , "Tao", "Song", "Zong", "Jiang", "Liao", "Kang", "Chan", "Die", "Cen", "Ding", "Tu", "Lou", "Zhang", "Zhan", "Zhan", "Ao", "Cao", "Qu", "Qiang", "Zui", "Zui", "Dao", "Dao", "Xi", "Yu", "Bo", "Long", "Xiang", "Ceng", "Bo", "Qin", "Jiao", "Yan", "Lao", "Zhan", "Lin", "Liao", "Liao", "Jin", "Deng", "Duo", "Zun", "Jiao", "Gui", "Yao", "Qiao", "Yao", "Jue", "Zhan", "Yi", "Xue", "Nao", "Ye", "Ye", "Yi", "E", "Xian", "Ji", "Xie", "Ke", "Xi", "Di", "Ao", "Zui", , "Ni", "Rong", "Dao", "Ling", "Za", "Yu", "Yue", "Yin", , "Jie", "Li", "Sui", "Long", "Long", "Dian", "Ying", "Xi", "Ju", "Chan", "Ying", "Kui", "Yan", "Wei", "Nao", "Quan", "Chao", "Cuan", "Luan", "Dian", "Dian", , "Yan", "Yan", "Yan", "Nao", "Yan", "Chuan", "Gui", "Chuan", "Zhou", "Huang", "Jing", "Xun", "Chao", "Chao", "Lie", "Gong", "Zuo", "Qiao", "Ju", "Gong", "Kek", "Wu", "Pwu", "Pwu", "Chai", "Qiu", "Qiu", "Ji", "Yi", "Si", "Ba", "Zhi", "Zhao", "Xiang", "Yi", "Jin", "Xun", "Juan", "Phas", "Xun", "Jin", "Fu"], ["Za", "Bi", "Shi", "Bu", "Ding", "Shuai", "Fan", "Nie", "Shi", "Fen", "Pa", "Zhi", "Xi", "Hu", "Dan", "Wei", "Zhang", "Tang", "Dai", "Ma", "Pei", "Pa", "Tie", "Fu", "Lian", "Zhi", "Zhou", "Bo", "Zhi", "Di", "Mo", "Yi", "Yi", "Ping", "Qia", "Juan", "Ru", "Shuai", "Dai", "Zheng", "Shui", "Qiao", "Zhen", "Shi", "Qun", "Xi", "Bang", "Dai", "Gui", "Chou", "Ping", "Zhang", "Sha", "Wan", "Dai", "Wei", "Chang", "Sha", "Qi", "Ze", "Guo", "Mao", "Du", "Hou", "Zheng", "Xu", "Mi", "Wei", "Wo", "Fu", "Yi", "Bang", "Ping", "Tazuna", "Gong", "Pan", "Huang", "Dao", "Mi", "Jia", "Teng", "Hui", "Zhong", "Shan", "Man", "Mu", "Biao", "Guo", "Ze", "Mu", "Bang", "Zhang", "Jiong", "Chan", "Fu", "Zhi", "Hu", "Fan", "Chuang", "Bi", "Hei", , "Mi", "Qiao", "Chan", "Fen", "Meng", "Bang", "Chou", "Mie", "Chu", "Jie", "Xian", "Lan", "Gan", "Ping", "Nian", "Qian", "Bing", "Bing", "Xing", "Gan", "Yao", "Huan", "You", "You", "Ji", "Guang", "Pi", "Ting", "Ze", "Guang", "Zhuang", "Mo", "Qing", "Bi", "Qin", "Dun", "Chuang", "Gui", "Ya", "Bai", "Jie", "Xu", "Lu", "Wu", , "Ku", "Ying", "Di", "Pao", "Dian", "Ya", "Miao", "Geng", "Ci", "Fu", "Tong", "Pang", "Fei", "Xiang", "Yi", "Zhi", "Tiao", "Zhi", "Xiu", "Du", "Zuo", "Xiao", "Tu", "Gui", "Ku", "Pang", "Ting", "You", "Bu", "Ding", "Cheng", "Lai", "Bei", "Ji", "An", "Shu", "Kang", "Yong", "Tuo", "Song", "Shu", "Qing", "Yu", "Yu", "Miao", "Sou", "Ce", "Xiang", "Fei", "Jiu", "He", "Hui", "Liu", "Sha", "Lian", "Lang", "Sou", "Jian", "Pou", "Qing", "Jiu", "Jiu", "Qin", "Ao", "Kuo", "Lou", "Yin", "Liao", "Dai", "Lu", "Yi", "Chu", "Chan", "Tu", "Si", "Xin", "Miao", "Chang", "Wu", "Fei", "Guang", "Koc", "Kuai", "Bi", "Qiang", "Xie", "Lin", "Lin", "Liao", "Lu", , "Ying", "Xian", "Ting", "Yong", "Li", "Ting", "Yin", "Xun", "Yan", "Ting", "Di", "Po", "Jian", "Hui", "Nai", "Hui", "Gong", "Nian"], ["Kai", "Bian", "Yi", "Qi", "Nong", "Fen", "Ju", "Yan", "Yi", "Zang", "Bi", "Yi", "Yi", "Er", "San", "Shi", "Er", "Shi", "Shi", "Gong", "Diao", "Yin", "Hu", "Fu", "Hong", "Wu", "Tui", "Chi", "Jiang", "Ba", "Shen", "Di", "Zhang", "Jue", "Tao", "Fu", "Di", "Mi", "Xian", "Hu", "Chao", "Nu", "Jing", "Zhen", "Yi", "Mi", "Quan", "Wan", "Shao", "Ruo", "Xuan", "Jing", "Dun", "Zhang", "Jiang", "Qiang", "Peng", "Dan", "Qiang", "Bi", "Bi", "She", "Dan", "Jian", "Gou", "Sei", "Fa", "Bi", "Kou", "Nagi", "Bie", "Xiao", "Dan", "Kuo", "Qiang", "Hong", "Mi", "Kuo", "Wan", "Jue", "Ji", "Ji", "Gui", "Dang", "Lu", "Lu", "Tuan", "Hui", "Zhi", "Hui", "Hui", "Yi", "Yi", "Yi", "Yi", "Huo", "Huo", "Shan", "Xing", "Wen", "Tong", "Yan", "Yan", "Yu", "Chi", "Cai", "Biao", "Diao", "Bin", "Peng", "Yong", "Piao", "Zhang", "Ying", "Chi", "Chi", "Zhuo", "Tuo", "Ji", "Pang", "Zhong", "Yi", "Wang", "Che", "Bi", "Chi", "Ling", "Fu", "Wang", "Zheng", "Cu", "Wang", "Jing", "Dai", "Xi", "Xun", "Hen", "Yang", "Huai", "Lu", "Hou", "Wa", "Cheng", "Zhi", "Xu", "Jing", "Tu", "Cong", , "Lai", "Cong", "De", "Pai", "Xi", , "Qi", "Chang", "Zhi", "Cong", "Zhou", "Lai", "Yu", "Xie", "Jie", "Jian", "Chi", "Jia", "Bian", "Huang", "Fu", "Xun", "Wei", "Pang", "Yao", "Wei", "Xi", "Zheng", "Piao", "Chi", "De", "Zheng", "Zheng", "Bie", "De", "Chong", "Che", "Jiao", "Wei", "Jiao", "Hui", "Mei", "Long", "Xiang", "Bao", "Qu", "Xin", "Shu", "Bi", "Yi", "Le", "Ren", "Dao", "Ding", "Gai", "Ji", "Ren", "Ren", "Chan", "Tan", "Te", "Te", "Gan", "Qi", "Shi", "Cun", "Zhi", "Wang", "Mang", "Xi", "Fan", "Ying", "Tian", "Min", "Min", "Zhong", "Chong", "Wu", "Ji", "Wu", "Xi", "Ye", "You", "Wan", "Cong", "Zhong", "Kuai", "Yu", "Bian", "Zhi", "Qi", "Cui", "Chen", "Tai", "Tun", "Qian", "Nian", "Hun", "Xiong", "Niu", "Wang", "Xian", "Xin", "Kang", "Hu", "Kai", "Fen"], ["Huai", "Tai", "Song", "Wu", "Ou", "Chang", "Chuang", "Ju", "Yi", "Bao", "Chao", "Min", "Pei", "Zuo", "Zen", "Yang", "Kou", "Ban", "Nu", "Nao", "Zheng", "Pa", "Bu", "Tie", "Gu", "Hu", "Ju", "Da", "Lian", "Si", "Chou", "Di", "Dai", "Yi", "Tu", "You", "Fu", "Ji", "Peng", "Xing", "Yuan", "Ni", "Guai", "Fu", "Xi", "Bi", "You", "Qie", "Xuan", "Cong", "Bing", "Huang", "Xu", "Chu", "Pi", "Xi", "Xi", "Tan", "Koraeru", "Zong", "Dui", , "Ki", "Yi", "Chi", "Ren", "Xun", "Shi", "Xi", "Lao", "Heng", "Kuang", "Mu", "Zhi", "Xie", "Lian", "Tiao", "Huang", "Die", "Hao", "Kong", "Gui", "Heng", "Xi", "Xiao", "Shu", "S", "Kua", "Qiu", "Yang", "Hui", "Hui", "Chi", "Jia", "Yi", "Xiong", "Guai", "Lin", "Hui", "Zi", "Xu", "Chi", "Xiang", "Nu", "Hen", "En", "Ke", "Tong", "Tian", "Gong", "Quan", "Xi", "Qia", "Yue", "Peng", "Ken", "De", "Hui", "E", "Kyuu", "Tong", "Yan", "Kai", "Ce", "Nao", "Yun", "Mang", "Yong", "Yong", "Yuan", "Pi", "Kun", "Qiao", "Yue", "Yu", "Yu", "Jie", "Xi", "Zhe", "Lin", "Ti", "Han", "Hao", "Qie", "Ti", "Bu", "Yi", "Qian", "Hui", "Xi", "Bei", "Man", "Yi", "Heng", "Song", "Quan", "Cheng", "Hui", "Wu", "Wu", "You", "Li", "Liang", "Huan", "Cong", "Yi", "Yue", "Li", "Nin", "Nao", "E", "Que", "Xuan", "Qian", "Wu", "Min", "Cong", "Fei", "Bei", "Duo", "Cui", "Chang", "Men", "Li", "Ji", "Guan", "Guan", "Xing", "Dao", "Qi", "Kong", "Tian", "Lun", "Xi", "Kan", "Kun", "Ni", "Qing", "Chou", "Dun", "Guo", "Chan", "Liang", "Wan", "Yuan", "Jin", "Ji", "Lin", "Yu", "Huo", "He", "Quan", "Tan", "Ti", "Ti", "Nie", "Wang", "Chuo", "Bu", "Hun", "Xi", "Tang", "Xin", "Wei", "Hui", "E", "Rui", "Zong", "Jian", "Yong", "Dian", "Ju", "Can", "Cheng", "De", "Bei", "Qie", "Can", "Dan", "Guan", "Duo", "Nao", "Yun", "Xiang", "Zhui", "Die", "Huang", "Chun", "Qiong", "Re", "Xing", "Ce", "Bian", "Hun", "Zong", "Ti"], ["Qiao", "Chou", "Bei", "Xuan", "Wei", "Ge", "Qian", "Wei", "Yu", "Yu", "Bi", "Xuan", "Huan", "Min", "Bi", "Yi", "Mian", "Yong", "Kai", "Dang", "Yin", "E", "Chen", "Mou", "Ke", "Ke", "Yu", "Ai", "Qie", "Yan", "Nuo", "Gan", "Yun", "Zong", "Sai", "Leng", "Fen", , "Kui", "Kui", "Que", "Gong", "Yun", "Su", "Su", "Qi", "Yao", "Song", "Huang", "Ji", "Gu", "Ju", "Chuang", "Ni", "Xie", "Kai", "Zheng", "Yong", "Cao", "Sun", "Shen", "Bo", "Kai", "Yuan", "Xie", "Hun", "Yong", "Yang", "Li", "Sao", "Tao", "Yin", "Ci", "Xu", "Qian", "Tai", "Huang", "Yun", "Shen", "Ming", , "She", "Cong", "Piao", "Mo", "Mu", "Guo", "Chi", "Can", "Can", "Can", "Cui", "Min", "Te", "Zhang", "Tong", "Ao", "Shuang", "Man", "Guan", "Que", "Zao", "Jiu", "Hui", "Kai", "Lian", "Ou", "Song", "Jin", "Yin", "Lu", "Shang", "Wei", "Tuan", "Man", "Qian", "She", "Yong", "Qing", "Kang", "Di", "Zhi", "Lou", "Juan", "Qi", "Qi", "Yu", "Ping", "Liao", "Cong", "You", "Chong", "Zhi", "Tong", "Cheng", "Qi", "Qu", "Peng", "Bei", "Bie", "Chun", "Jiao", "Zeng", "Chi", "Lian", "Ping", "Kui", "Hui", "Qiao", "Cheng", "Yin", "Yin", "Xi", "Xi", "Dan", "Tan", "Duo", "Dui", "Dui", "Su", "Jue", "Ce", "Xiao", "Fan", "Fen", "Lao", "Lao", "Chong", "Han", "Qi", "Xian", "Min", "Jing", "Liao", "Wu", "Can", "Jue", "Cu", "Xian", "Tan", "Sheng", "Pi", "Yi", "Chu", "Xian", "Nao", "Dan", "Tan", "Jing", "Song", "Han", "Jiao", "Wai", "Huan", "Dong", "Qin", "Qin", "Qu", "Cao", "Ken", "Xie", "Ying", "Ao", "Mao", "Yi", "Lin", "Se", "Jun", "Huai", "Men", "Lan", "Ai", "Lin", "Yan", "Gua", "Xia", "Chi", "Yu", "Yin", "Dai", "Meng", "Ai", "Meng", "Dui", "Qi", "Mo", "Lan", "Men", "Chou", "Zhi", "Nuo", "Nuo", "Yan", "Yang", "Bo", "Zhi", "Kuang", "Kuang", "You", "Fu", "Liu", "Mie", "Cheng", , "Chan", "Meng", "Lan", "Huai", "Xuan", "Rang", "Chan", "Ji", "Ju", "Huan", "She", "Yi"], ["Lian", "Nan", "Mi", "Tang", "Jue", "Gang", "Gang", "Gang", "Ge", "Yue", "Wu", "Jian", "Xu", "Shu", "Rong", "Xi", "Cheng", "Wo", "Jie", "Ge", "Jian", "Qiang", "Huo", "Qiang", "Zhan", "Dong", "Qi", "Jia", "Die", "Zei", "Jia", "Ji", "Shi", "Kan", "Ji", "Kui", "Gai", "Deng", "Zhan", "Chuang", "Ge", "Jian", "Jie", "Yu", "Jian", "Yan", "Lu", "Xi", "Zhan", "Xi", "Xi", "Chuo", "Dai", "Qu", "Hu", "Hu", "Hu", "E", "Shi", "Li", "Mao", "Hu", "Li", "Fang", "Suo", "Bian", "Dian", "Jiong", "Shang", "Yi", "Yi", "Shan", "Hu", "Fei", "Yan", "Shou", "T", "Cai", "Zha", "Qiu", "Le", "Bu", "Ba", "Da", "Reng", "Fu", "Hameru", "Zai", "Tuo", "Zhang", "Diao", "Kang", "Yu", "Ku", "Han", "Shen", "Cha", "Yi", "Gu", "Kou", "Wu", "Tuo", "Qian", "Zhi", "Ren", "Kuo", "Men", "Sao", "Yang", "Niu", "Ban", "Che", "Rao", "Xi", "Qian", "Ban", "Jia", "Yu", "Fu", "Ao", "Xi", "Pi", "Zhi", "Zi", "E", "Dun", "Zhao", "Cheng", "Ji", "Yan", "Kuang", "Bian", "Chao", "Ju", "Wen", "Hu", "Yue", "Jue", "Ba", "Qin", "Zhen", "Zheng", "Yun", "Wan", "Nu", "Yi", "Shu", "Zhua", "Pou", "Tou", "Dou", "Kang", "Zhe", "Pou", "Fu", "Pao", "Ba", "Ao", "Ze", "Tuan", "Kou", "Lun", "Qiang", , "Hu", "Bao", "Bing", "Zhi", "Peng", "Tan", "Pu", "Pi", "Tai", "Yao", "Zhen", "Zha", "Yang", "Bao", "He", "Ni", "Yi", "Di", "Chi", "Pi", "Za", "Mo", "Mo", "Shen", "Ya", "Chou", "Qu", "Min", "Chu", "Jia", "Fu", "Zhan", "Zhu", "Dan", "Chai", "Mu", "Nian", "La", "Fu", "Pao", "Ban", "Pai", "Ling", "Na", "Guai", "Qian", "Ju", "Tuo", "Ba", "Tuo", "Tuo", "Ao", "Ju", "Zhuo", "Pan", "Zhao", "Bai", "Bai", "Di", "Ni", "Ju", "Kuo", "Long", "Jian", , "Yong", "Lan", "Ning", "Bo", "Ze", "Qian", "Hen", "Gua", "Shi", "Jie", "Zheng", "Nin", "Gong", "Gong", "Quan", "Shuan", "Cun", "Zan", "Kao", "Chi", "Xie", "Ce", "Hui", "Pin", "Zhuai", "Shi", "Na"], ["Bo", "Chi", "Gua", "Zhi", "Kuo", "Duo", "Duo", "Zhi", "Qie", "An", "Nong", "Zhen", "Ge", "Jiao", "Ku", "Dong", "Ru", "Tiao", "Lie", "Zha", "Lu", "Die", "Wa", "Jue", "Mushiru", "Ju", "Zhi", "Luan", "Ya", "Zhua", "Ta", "Xie", "Nao", "Dang", "Jiao", "Zheng", "Ji", "Hui", "Xun", "Ku", "Ai", "Tuo", "Nuo", "Cuo", "Bo", "Geng", "Ti", "Zhen", "Cheng", "Suo", "Suo", "Keng", "Mei", "Long", "Ju", "Peng", "Jian", "Yi", "Ting", "Shan", "Nuo", "Wan", "Xie", "Cha", "Feng", "Jiao", "Wu", "Jun", "Jiu", "Tong", "Kun", "Huo", "Tu", "Zhuo", "Pou", "Le", "Ba", "Han", "Shao", "Nie", "Juan", "Ze", "Song", "Ye", "Jue", "Bu", "Huan", "Bu", "Zun", "Yi", "Zhai", "Lu", "Sou", "Tuo", "Lao", "Sun", "Bang", "Jian", "Huan", "Dao", , "Wan", "Qin", "Peng", "She", "Lie", "Min", "Men", "Fu", "Bai", "Ju", "Dao", "Wo", "Ai", "Juan", "Yue", "Zong", "Chen", "Chui", "Jie", "Tu", "Ben", "Na", "Nian", "Nuo", "Zu", "Wo", "Xi", "Xian", "Cheng", "Dian", "Sao", "Lun", "Qing", "Gang", "Duo", "Shou", "Diao", "Pou", "Di", "Zhang", "Gun", "Ji", "Tao", "Qia", "Qi", "Pai", "Shu", "Qian", "Ling", "Yi", "Ya", "Jue", "Zheng", "Liang", "Gua", "Yi", "Huo", "Shan", "Zheng", "Lue", "Cai", "Tan", "Che", "Bing", "Jie", "Ti", "Kong", "Tui", "Yan", "Cuo", "Zou", "Ju", "Tian", "Qian", "Ken", "Bai", "Shou", "Jie", "Lu", "Guo", "Haba", , "Zhi", "Dan", "Mang", "Xian", "Sao", "Guan", "Peng", "Yuan", "Nuo", "Jian", "Zhen", "Jiu", "Jian", "Yu", "Yan", "Kui", "Nan", "Hong", "Rou", "Pi", "Wei", "Sai", "Zou", "Xuan", "Miao", "Ti", "Nie", "Cha", "Shi", "Zong", "Zhen", "Yi", "Shun", "Heng", "Bian", "Yang", "Huan", "Yan", "Zuan", "An", "Xu", "Ya", "Wo", "Ke", "Chuai", "Ji", "Ti", "La", "La", "Cheng", "Kai", "Jiu", "Jiu", "Tu", "Jie", "Hui", "Geng", "Chong", "Shuo", "She", "Xie", "Yuan", "Qian", "Ye", "Cha", "Zha", "Bei", "Yao", , , "Lan", "Wen", "Qin"], ["Chan", "Ge", "Lou", "Zong", "Geng", "Jiao", "Gou", "Qin", "Yong", "Que", "Chou", "Chi", "Zhan", "Sun", "Sun", "Bo", "Chu", "Rong", "Beng", "Cuo", "Sao", "Ke", "Yao", "Dao", "Zhi", "Nu", "Xie", "Jian", "Sou", "Qiu", "Gao", "Xian", "Shuo", "Sang", "Jin", "Mie", "E", "Chui", "Nuo", "Shan", "Ta", "Jie", "Tang", "Pan", "Ban", "Da", "Li", "Tao", "Hu", "Zhi", "Wa", "Xia", "Qian", "Wen", "Qiang", "Tian", "Zhen", "E", "Xi", "Nuo", "Quan", "Cha", "Zha", "Ge", "Wu", "En", "She", "Kang", "She", "Shu", "Bai", "Yao", "Bin", "Sou", "Tan", "Sa", "Chan", "Suo", "Liao", "Chong", "Chuang", "Guo", "Bing", "Feng", "Shuai", "Di", "Qi", "Sou", "Zhai", "Lian", "Tang", "Chi", "Guan", "Lu", "Luo", "Lou", "Zong", "Gai", "Hu", "Zha", "Chuang", "Tang", "Hua", "Cui", "Nai", "Mo", "Jiang", "Gui", "Ying", "Zhi", "Ao", "Zhi", "Nie", "Man", "Shan", "Kou", "Shu", "Suo", "Tuan", "Jiao", "Mo", "Mo", "Zhe", "Xian", "Keng", "Piao", "Jiang", "Yin", "Gou", "Qian", "Lue", "Ji", "Ying", "Jue", "Pie", "Pie", "Lao", "Dun", "Xian", "Ruan", "Kui", "Zan", "Yi", "Xun", "Cheng", "Cheng", "Sa", "Nao", "Heng", "Si", "Qian", "Huang", "Da", "Zun", "Nian", "Lin", "Zheng", "Hui", "Zhuang", "Jiao", "Ji", "Cao", "Dan", "Dan", "Che", "Bo", "Che", "Jue", "Xiao", "Liao", "Ben", "Fu", "Qiao", "Bo", "Cuo", "Zhuo", "Zhuan", "Tuo", "Pu", "Qin", "Dun", "Nian", , "Xie", "Lu", "Jiao", "Cuan", "Ta", "Han", "Qiao", "Zhua", "Jian", "Gan", "Yong", "Lei", "Kuo", "Lu", "Shan", "Zhuo", "Ze", "Pu", "Chuo", "Ji", "Dang", "Suo", "Cao", "Qing", "Jing", "Huan", "Jie", "Qin", "Kuai", "Dan", "Xi", "Ge", "Pi", "Bo", "Ao", "Ju", "Ye", , "Mang", "Sou", "Mi", "Ji", "Tai", "Zhuo", "Dao", "Xing", "Lan", "Ca", "Ju", "Ye", "Ru", "Ye", "Ye", "Ni", "Hu", "Ji", "Bin", "Ning", "Ge", "Zhi", "Jie", "Kuo", "Mo", "Jian", "Xie", "Lie", "Tan", "Bai", "Sou", "Lu", "Lue", "Rao", "Zhi"], ["Pan", "Yang", "Lei", "Sa", "Shu", "Zan", "Nian", "Xian", "Jun", "Huo", "Li", "La", "Han", "Ying", "Lu", "Long", "Qian", "Qian", "Zan", "Qian", "Lan", "San", "Ying", "Mei", "Rang", "Chan", , "Cuan", "Xi", "She", "Luo", "Jun", "Mi", "Li", "Zan", "Luan", "Tan", "Zuan", "Li", "Dian", "Wa", "Dang", "Jiao", "Jue", "Lan", "Li", "Nang", "Zhi", "Gui", "Gui", "Qi", "Xin", "Pu", "Sui", "Shou", "Kao", "You", "Gai", "Yi", "Gong", "Gan", "Ban", "Fang", "Zheng", "Bo", "Dian", "Kou", "Min", "Wu", "Gu", "He", "Ce", "Xiao", "Mi", "Chu", "Ge", "Di", "Xu", "Jiao", "Min", "Chen", "Jiu", "Zhen", "Duo", "Yu", "Chi", "Ao", "Bai", "Xu", "Jiao", "Duo", "Lian", "Nie", "Bi", "Chang", "Dian", "Duo", "Yi", "Gan", "San", "Ke", "Yan", "Dun", "Qi", "Dou", "Xiao", "Duo", "Jiao", "Jing", "Yang", "Xia", "Min", "Shu", "Ai", "Qiao", "Ai", "Zheng", "Di", "Zhen", "Fu", "Shu", "Liao", "Qu", "Xiong", "Xi", "Jiao", "Sen", "Jiao", "Zhuo", "Yi", "Lian", "Bi", "Li", "Xiao", "Xiao", "Wen", "Xue", "Qi", "Qi", "Zhai", "Bin", "Jue", "Zhai", , "Fei", "Ban", "Ban", "Lan", "Yu", "Lan", "Wei", "Dou", "Sheng", "Liao", "Jia", "Hu", "Xie", "Jia", "Yu", "Zhen", "Jiao", "Wo", "Tou", "Chu", "Jin", "Chi", "Yin", "Fu", "Qiang", "Zhan", "Qu", "Zhuo", "Zhan", "Duan", "Zhuo", "Si", "Xin", "Zhuo", "Zhuo", "Qin", "Lin", "Zhuo", "Chu", "Duan", "Zhu", "Fang", "Xie", "Hang", "Yu", "Shi", "Pei", "You", "Mye", "Pang", "Qi", "Zhan", "Mao", "Lu", "Pei", "Pi", "Liu", "Fu", "Fang", "Xuan", "Jing", "Jing", "Ni", "Zu", "Zhao", "Yi", "Liu", "Shao", "Jian", "Es", "Yi", "Qi", "Zhi", "Fan", "Piao", "Fan", "Zhan", "Guai", "Sui", "Yu", "Wu", "Ji", "Ji", "Ji", "Huo", "Ri", "Dan", "Jiu", "Zhi", "Zao", "Xie", "Tiao", "Xun", "Xu", "Xu", "Xu", "Gan", "Han", "Tai", "Di", "Xu", "Chan", "Shi", "Kuang", "Yang", "Shi", "Wang", "Min", "Min", "Tun", "Chun", "Wu"], ["Yun", "Bei", "Ang", "Ze", "Ban", "Jie", "Kun", "Sheng", "Hu", "Fang", "Hao", "Gui", "Chang", "Xuan", "Ming", "Hun", "Fen", "Qin", "Hu", "Yi", "Xi", "Xin", "Yan", "Ze", "Fang", "Tan", "Shen", "Ju", "Yang", "Zan", "Bing", "Xing", "Ying", "Xuan", "Pei", "Zhen", "Ling", "Chun", "Hao", "Mei", "Zuo", "Mo", "Bian", "Xu", "Hun", "Zhao", "Zong", "Shi", "Shi", "Yu", "Fei", "Die", "Mao", "Ni", "Chang", "Wen", "Dong", "Ai", "Bing", "Ang", "Zhou", "Long", "Xian", "Kuang", "Tiao", "Chao", "Shi", "Huang", "Huang", "Xuan", "Kui", "Xu", "Jiao", "Jin", "Zhi", "Jin", "Shang", "Tong", "Hong", "Yan", "Gai", "Xiang", "Shai", "Xiao", "Ye", "Yun", "Hui", "Han", "Han", "Jun", "Wan", "Xian", "Kun", "Zhou", "Xi", "Cheng", "Sheng", "Bu", "Zhe", "Zhe", "Wu", "Han", "Hui", "Hao", "Chen", "Wan", "Tian", "Zhuo", "Zui", "Zhou", "Pu", "Jing", "Xi", "Shan", "Yi", "Xi", "Qing", "Qi", "Jing", "Gui", "Zhen", "Yi", "Zhi", "An", "Wan", "Lin", "Liang", "Chang", "Wang", "Xiao", "Zan", "Hi", "Xuan", "Xuan", "Yi", "Xia", "Yun", "Hui", "Fu", "Min", "Kui", "He", "Ying", "Du", "Wei", "Shu", "Qing", "Mao", "Nan", "Jian", "Nuan", "An", "Yang", "Chun", "Yao", "Suo", "Jin", "Ming", "Jiao", "Kai", "Gao", "Weng", "Chang", "Qi", "Hao", "Yan", "Li", "Ai", "Ji", "Gui", "Men", "Zan", "Xie", "Hao", "Mu", "Mo", "Cong", "Ni", "Zhang", "Hui", "Bao", "Han", "Xuan", "Chuan", "Liao", "Xian", "Dan", "Jing", "Pie", "Lin", "Tun", "Xi", "Yi", "Ji", "Huang", "Tai", "Ye", "Ye", "Li", "Tan", "Tong", "Xiao", "Fei", "Qin", "Zhao", "Hao", "Yi", "Xiang", "Xing", "Sen", "Jiao", "Bao", "Jing", "Yian", "Ai", "Ye", "Ru", "Shu", "Meng", "Xun", "Yao", "Pu", "Li", "Chen", "Kuang", "Die", , "Yan", "Huo", "Lu", "Xi", "Rong", "Long", "Nang", "Luo", "Luan", "Shai", "Tang", "Yan", "Chu", "Yue", "Yue", "Qu", "Yi", "Geng", "Ye", "Hu", "He", "Shu", "Cao", "Cao", "Noboru", "Man", "Ceng", "Ceng", "Ti"], ["Zui", "Can", "Xu", "Hui", "Yin", "Qie", "Fen", "Pi", "Yue", "You", "Ruan", "Peng", "Ban", "Fu", "Ling", "Fei", "Qu", , "Nu", "Tiao", "Shuo", "Zhen", "Lang", "Lang", "Juan", "Ming", "Huang", "Wang", "Tun", "Zhao", "Ji", "Qi", "Ying", "Zong", "Wang", "Tong", "Lang", , "Meng", "Long", "Mu", "Deng", "Wei", "Mo", "Ben", "Zha", "Zhu", "Shu", , "Zhu", "Ren", "Ba", "Po", "Duo", "Duo", "Dao", "Li", "Qiu", "Ji", "Jiu", "Bi", "Xiu", "Ting", "Ci", "Sha", "Eburi", "Za", "Quan", "Qian", "Yu", "Gan", "Wu", "Cha", "Shan", "Xun", "Fan", "Wu", "Zi", "Li", "Xing", "Cai", "Cun", "Ren", "Shao", "Tuo", "Di", "Zhang", "Mang", "Chi", "Yi", "Gu", "Gong", "Du", "Yi", "Qi", "Shu", "Gang", "Tiao", "Moku", "Soma", "Tochi", "Lai", "Sugi", "Mang", "Yang", "Ma", "Miao", "Si", "Yuan", "Hang", "Fei", "Bei", "Jie", "Dong", "Gao", "Yao", "Xian", "Chu", "Qun", "Pa", "Shu", "Hua", "Xin", "Chou", "Zhu", "Chou", "Song", "Ban", "Song", "Ji", "Yue", "Jin", "Gou", "Ji", "Mao", "Pi", "Bi", "Wang", "Ang", "Fang", "Fen", "Yi", "Fu", "Nan", "Xi", "Hu", "Ya", "Dou", "Xun", "Zhen", "Yao", "Lin", "Rui", "E", "Mei", "Zhao", "Guo", "Zhi", "Cong", "Yun", "Waku", "Dou", "Shu", "Zao", , "Li", "Haze", "Jian", "Cheng", "Matsu", "Qiang", "Feng", "Nan", "Xiao", "Xian", "Ku", "Ping", "Yi", "Xi", "Zhi", "Guai", "Xiao", "Jia", "Jia", "Gou", "Fu", "Mo", "Yi", "Ye", "Ye", "Shi", "Nie", "Bi", "Duo", "Yi", "Ling", "Bing", "Ni", "La", "He", "Pan", "Fan", "Zhong", "Dai", "Ci", "Yang", "Fu", "Bo", "Mou", "Gan", "Qi", "Ran", "Rou", "Mao", "Zhao", "Song", "Zhe", "Xia", "You", "Shen", "Ju", "Tuo", "Zuo", "Nan", "Ning", "Yong", "Di", "Zhi", "Zha", "Cha", "Dan", "Gu", "Pu", "Jiu", "Ao", "Fu", "Jian", "Bo", "Duo", "Ke", "Nai", "Zhu", "Bi", "Liu", "Chai", "Zha", "Si", "Zhu", "Pei", "Shi", "Guai", "Cha", "Yao", "Jue", "Jiu", "Shi"], ["Zhi", "Liu", "Mei", "Hoy", "Rong", "Zha", , "Biao", "Zhan", "Jie", "Long", "Dong", "Lu", "Sayng", "Li", "Lan", "Yong", "Shu", "Xun", "Shuan", "Qi", "Zhen", "Qi", "Li", "Yi", "Xiang", "Zhen", "Li", "Su", "Gua", "Kan", "Bing", "Ren", "Xiao", "Bo", "Ren", "Bing", "Zi", "Chou", "Yi", "Jie", "Xu", "Zhu", "Jian", "Zui", "Er", "Er", "You", "Fa", "Gong", "Kao", "Lao", "Zhan", "Li", "Yin", "Yang", "He", "Gen", "Zhi", "Chi", "Ge", "Zai", "Luan", "Fu", "Jie", "Hang", "Gui", "Tao", "Guang", "Wei", "Kuang", "Ru", "An", "An", "Juan", "Yi", "Zhuo", "Ku", "Zhi", "Qiong", "Tong", "Sang", "Sang", "Huan", "Jie", "Jiu", "Xue", "Duo", "Zhui", "Yu", "Zan", "Kasei", "Ying", "Masu", , "Zhan", "Ya", "Nao", "Zhen", "Dang", "Qi", "Qiao", "Hua", "Kuai", "Jiang", "Zhuang", "Xun", "Suo", "Sha", "Zhen", "Bei", "Ting", "Gua", "Jing", "Bo", "Ben", "Fu", "Rui", "Tong", "Jue", "Xi", "Lang", "Liu", "Feng", "Qi", "Wen", "Jun", "Gan", "Cu", "Liang", "Qiu", "Ting", "You", "Mei", "Bang", "Long", "Peng", "Zhuang", "Di", "Xuan", "Tu", "Zao", "Ao", "Gu", "Bi", "Di", "Han", "Zi", "Zhi", "Ren", "Bei", "Geng", "Jian", "Huan", "Wan", "Nuo", "Jia", "Tiao", "Ji", "Xiao", "Lu", "Huan", "Shao", "Cen", "Fen", "Song", "Meng", "Wu", "Li", "Li", "Dou", "Cen", "Ying", "Suo", "Ju", "Ti", "Jie", "Kun", "Zhuo", "Shu", "Chan", "Fan", "Wei", "Jing", "Li", "Bing", "Fumoto", "Shikimi", "Tao", "Zhi", "Lai", "Lian", "Jian", "Zhuo", "Ling", "Li", "Qi", "Bing", "Zhun", "Cong", "Qian", "Mian", "Qi", "Qi", "Cai", "Gun", "Chan", "Te", "Fei", "Pai", "Bang", "Pou", "Hun", "Zong", "Cheng", "Zao", "Ji", "Li", "Peng", "Yu", "Yu", "Gu", "Hun", "Dong", "Tang", "Gang", "Wang", "Di", "Xi", "Fan", "Cheng", "Zhan", "Qi", "Yuan", "Yan", "Yu", "Quan", "Yi", "Sen", "Ren", "Chui", "Leng", "Qi", "Zhuo", "Fu", "Ke", "Lai", "Zou", "Zou", "Zhuo", "Guan", "Fen", "Fen", "Chen", "Qiong", "Nie"], ["Wan", "Guo", "Lu", "Hao", "Jie", "Yi", "Chou", "Ju", "Ju", "Cheng", "Zuo", "Liang", "Qiang", "Zhi", "Zhui", "Ya", "Ju", "Bei", "Jiao", "Zhuo", "Zi", "Bin", "Peng", "Ding", "Chu", "Chang", "Kunugi", "Momiji", "Jian", "Gui", "Xi", "Du", "Qian", "Kunugi", "Soko", "Shide", "Luo", "Zhi", "Ken", "Myeng", "Tafu", , "Peng", "Zhan", , "Tuo", "Sen", "Duo", "Ye", "Fou", "Wei", "Wei", "Duan", "Jia", "Zong", "Jian", "Yi", "Shen", "Xi", "Yan", "Yan", "Chuan", "Zhan", "Chun", "Yu", "He", "Zha", "Wo", "Pian", "Bi", "Yao", "Huo", "Xu", "Ruo", "Yang", "La", "Yan", "Ben", "Hun", "Kui", "Jie", "Kui", "Si", "Feng", "Xie", "Tuo", "Zhi", "Jian", "Mu", "Mao", "Chu", "Hu", "Hu", "Lian", "Leng", "Ting", "Nan", "Yu", "You", "Mei", "Song", "Xuan", "Xuan", "Ying", "Zhen", "Pian", "Ye", "Ji", "Jie", "Ye", "Chu", "Shun", "Yu", "Cou", "Wei", "Mei", "Di", "Ji", "Jie", "Kai", "Qiu", "Ying", "Rou", "Heng", "Lou", "Le", "Hazou", "Katsura", "Pin", "Muro", "Gai", "Tan", "Lan", "Yun", "Yu", "Chen", "Lu", "Ju", "Sakaki", , "Pi", "Xie", "Jia", "Yi", "Zhan", "Fu", "Nai", "Mi", "Lang", "Rong", "Gu", "Jian", "Ju", "Ta", "Yao", "Zhen", "Bang", "Sha", "Yuan", "Zi", "Ming", "Su", "Jia", "Yao", "Jie", "Huang", "Gan", "Fei", "Zha", "Qian", "Ma", "Sun", "Yuan", "Xie", "Rong", "Shi", "Zhi", "Cui", "Yun", "Ting", "Liu", "Rong", "Tang", "Que", "Zhai", "Si", "Sheng", "Ta", "Ke", "Xi", "Gu", "Qi", "Kao", "Gao", "Sun", "Pan", "Tao", "Ge", "Xun", "Dian", "Nou", "Ji", "Shuo", "Gou", "Chui", "Qiang", "Cha", "Qian", "Huai", "Mei", "Xu", "Gang", "Gao", "Zhuo", "Tuo", "Hashi", "Yang", "Dian", "Jia", "Jian", "Zui", "Kashi", "Ori", "Bin", "Zhu", , "Xi", "Qi", "Lian", "Hui", "Yong", "Qian", "Guo", "Gai", "Gai", "Tuan", "Hua", "Cu", "Sen", "Cui", "Beng", "You", "Hu", "Jiang", "Hu", "Huan", "Kui", "Yi", "Nie", "Gao", "Kang", "Gui", "Gui", "Cao", "Man", "Jin"], ["Di", "Zhuang", "Le", "Lang", "Chen", "Cong", "Li", "Xiu", "Qing", "Shuang", "Fan", "Tong", "Guan", "Ji", "Suo", "Lei", "Lu", "Liang", "Mi", "Lou", "Chao", "Su", "Ke", "Shu", "Tang", "Biao", "Lu", "Jiu", "Shu", "Zha", "Shu", "Zhang", "Men", "Mo", "Niao", "Yang", "Tiao", "Peng", "Zhu", "Sha", "Xi", "Quan", "Heng", "Jian", "Cong", , "Hokuso", "Qiang", "Tara", "Ying", "Er", "Xin", "Zhi", "Qiao", "Zui", "Cong", "Pu", "Shu", "Hua", "Kui", "Zhen", "Zun", "Yue", "Zhan", "Xi", "Xun", "Dian", "Fa", "Gan", "Mo", "Wu", "Qiao", "Nao", "Lin", "Liu", "Qiao", "Xian", "Run", "Fan", "Zhan", "Tuo", "Lao", "Yun", "Shun", "Tui", "Cheng", "Tang", "Meng", "Ju", "Cheng", "Su", "Jue", "Jue", "Tan", "Hui", "Ji", "Nuo", "Xiang", "Tuo", "Ning", "Rui", "Zhu", "Chuang", "Zeng", "Fen", "Qiong", "Ran", "Heng", "Cen", "Gu", "Liu", "Lao", "Gao", "Chu", "Zusa", "Nude", "Ca", "San", "Ji", "Dou", "Shou", "Lu", , , "Yuan", "Ta", "Shu", "Jiang", "Tan", "Lin", "Nong", "Yin", "Xi", "Sui", "Shan", "Zui", "Xuan", "Cheng", "Gan", "Ju", "Zui", "Yi", "Qin", "Pu", "Yan", "Lei", "Feng", "Hui", "Dang", "Ji", "Sui", "Bo", "Bi", "Ding", "Chu", "Zhua", "Kuai", "Ji", "Jie", "Jia", "Qing", "Zhe", "Jian", "Qiang", "Dao", "Yi", "Biao", "Song", "She", "Lin", "Kunugi", "Cha", "Meng", "Yin", "Tao", "Tai", "Mian", "Qi", "Toan", "Bin", "Huo", "Ji", "Qian", "Mi", "Ning", "Yi", "Gao", "Jian", "Yin", "Er", "Qing", "Yan", "Qi", "Mi", "Zhao", "Gui", "Chun", "Ji", "Kui", "Po", "Deng", "Chu", , "Mian", "You", "Zhi", "Guang", "Qian", "Lei", "Lei", "Sa", "Lu", "Li", "Cuan", "Lu", "Mie", "Hui", "Ou", "Lu", "Jie", "Gao", "Du", "Yuan", "Li", "Fei", "Zhuo", "Sou", "Lian", "Tamo", "Chu", , "Zhu", "Lu", "Yan", "Li", "Zhu", "Chen", "Jie", "E", "Su", "Huai", "Nie", "Yu", "Long", "Lai", , "Xian", "Kwi", "Ju", "Xiao", "Ling", "Ying", "Jian", "Yin", "You", "Ying"], ["Xiang", "Nong", "Bo", "Chan", "Lan", "Ju", "Shuang", "She", "Wei", "Cong", "Quan", "Qu", "Cang", , "Yu", "Luo", "Li", "Zan", "Luan", "Dang", "Jue", "Em", "Lan", "Lan", "Zhu", "Lei", "Li", "Ba", "Nang", "Yu", "Ling", "Tsuki", "Qian", "Ci", "Huan", "Xin", "Yu", "Yu", "Qian", "Ou", "Xu", "Chao", "Chu", "Chi", "Kai", "Yi", "Jue", "Xi", "Xu", "Xia", "Yu", "Kuai", "Lang", "Kuan", "Shuo", "Xi", "Ai", "Yi", "Qi", "Hu", "Chi", "Qin", "Kuan", "Kan", "Kuan", "Kan", "Chuan", "Sha", "Gua", "Yin", "Xin", "Xie", "Yu", "Qian", "Xiao", "Yi", "Ge", "Wu", "Tan", "Jin", "Ou", "Hu", "Ti", "Huan", "Xu", "Pen", "Xi", "Xiao", "Xu", "Xi", "Sen", "Lian", "Chu", "Yi", "Kan", "Yu", "Chuo", "Huan", "Zhi", "Zheng", "Ci", "Bu", "Wu", "Qi", "Bu", "Bu", "Wai", "Ju", "Qian", "Chi", "Se", "Chi", "Se", "Zhong", "Sui", "Sui", "Li", "Cuo", "Yu", "Li", "Gui", "Dai", "Dai", "Si", "Jian", "Zhe", "Mo", "Mo", "Yao", "Mo", "Cu", "Yang", "Tian", "Sheng", "Dai", "Shang", "Xu", "Xun", "Shu", "Can", "Jue", "Piao", "Qia", "Qiu", "Su", "Qing", "Yun", "Lian", "Yi", "Fou", "Zhi", "Ye", "Can", "Hun", "Dan", "Ji", "Ye", "Zhen", "Yun", "Wen", "Chou", "Bin", "Ti", "Jin", "Shang", "Yin", "Diao", "Cu", "Hui", "Cuan", "Yi", "Dan", "Du", "Jiang", "Lian", "Bin", "Du", "Tsukusu", "Jian", "Shu", "Ou", "Duan", "Zhu", "Yin", "Qing", "Yi", "Sha", "Que", "Ke", "Yao", "Jun", "Dian", "Hui", "Hui", "Gu", "Que", "Ji", "Yi", "Ou", "Hui", "Duan", "Yi", "Xiao", "Wu", "Guan", "Mu", "Mei", "Mei", "Ai", "Zuo", "Du", "Yu", "Bi", "Bi", "Bi", "Pi", "Pi", "Bi", "Chan", "Mao", , , "Pu", "Mushiru", "Jia", "Zhan", "Sai", "Mu", "Tuo", "Xun", "Er", "Rong", "Xian", "Ju", "Mu", "Hao", "Qiu", "Dou", "Mushiru", "Tan", "Pei", "Ju", "Duo", "Cui", "Bi", "San", , "Mao", "Sui", "Yu", "Yu", "Tuo", "He", "Jian", "Ta", "San"], ["Lu", "Mu", "Li", "Tong", "Rong", "Chang", "Pu", "Luo", "Zhan", "Sao", "Zhan", "Meng", "Luo", "Qu", "Die", "Shi", "Di", "Min", "Jue", "Mang", "Qi", "Pie", "Nai", "Qi", "Dao", "Xian", "Chuan", "Fen", "Ri", "Nei", , "Fu", "Shen", "Dong", "Qing", "Qi", "Yin", "Xi", "Hai", "Yang", "An", "Ya", "Ke", "Qing", "Ya", "Dong", "Dan", "Lu", "Qing", "Yang", "Yun", "Yun", "Shui", "San", "Zheng", "Bing", "Yong", "Dang", "Shitamizu", "Le", "Ni", "Tun", "Fan", "Gui", "Ting", "Zhi", "Qiu", "Bin", "Ze", "Mian", "Cuan", "Hui", "Diao", "Han", "Cha", "Zhuo", "Chuan", "Wan", "Fan", "Dai", "Xi", "Tuo", "Mang", "Qiu", "Qi", "Shan", "Pai", "Han", "Qian", "Wu", "Wu", "Xun", "Si", "Ru", "Gong", "Jiang", "Chi", "Wu", "Tsuchi", , "Tang", "Zhi", "Chi", "Qian", "Mi", "Yu", "Wang", "Qing", "Jing", "Rui", "Jun", "Hong", "Tai", "Quan", "Ji", "Bian", "Bian", "Gan", "Wen", "Zhong", "Fang", "Xiong", "Jue", "Hang", "Niou", "Qi", "Fen", "Xu", "Xu", "Qin", "Yi", "Wo", "Yun", "Yuan", "Hang", "Yan", "Shen", "Chen", "Dan", "You", "Dun", "Hu", "Huo", "Qie", "Mu", "Rou", "Mei", "Ta", "Mian", "Wu", "Chong", "Tian", "Bi", "Sha", "Zhi", "Pei", "Pan", "Zhui", "Za", "Gou", "Liu", "Mei", "Ze", "Feng", "Ou", "Li", "Lun", "Cang", "Feng", "Wei", "Hu", "Mo", "Mei", "Shu", "Ju", "Zan", "Tuo", "Tuo", "Tuo", "He", "Li", "Mi", "Yi", "Fa", "Fei", "You", "Tian", "Zhi", "Zhao", "Gu", "Zhan", "Yan", "Si", "Kuang", "Jiong", "Ju", "Xie", "Qiu", "Yi", "Jia", "Zhong", "Quan", "Bo", "Hui", "Mi", "Ben", "Zhuo", "Chu", "Le", "You", "Gu", "Hong", "Gan", "Fa", "Mao", "Si", "Hu", "Ping", "Ci", "Fan", "Chi", "Su", "Ning", "Cheng", "Ling", "Pao", "Bo", "Qi", "Si", "Ni", "Ju", "Yue", "Zhu", "Sheng", "Lei", "Xuan", "Xue", "Fu", "Pan", "Min", "Tai", "Yang", "Ji", "Yong", "Guan", "Beng", "Xue", "Long", "Lu", , "Bo", "Xie", "Po", "Ze", "Jing", "Yin"], ["Zhou", "Ji", "Yi", "Hui", "Hui", "Zui", "Cheng", "Yin", "Wei", "Hou", "Jian", "Yang", "Lie", "Si", "Ji", "Er", "Xing", "Fu", "Sa", "Suo", "Zhi", "Yin", "Wu", "Xi", "Kao", "Zhu", "Jiang", "Luo", , "An", "Dong", "Yi", "Mou", "Lei", "Yi", "Mi", "Quan", "Jin", "Mo", "Wei", "Xiao", "Xie", "Hong", "Xu", "Shuo", "Kuang", "Tao", "Qie", "Ju", "Er", "Zhou", "Ru", "Ping", "Xun", "Xiong", "Zhi", "Guang", "Huan", "Ming", "Huo", "Wa", "Qia", "Pai", "Wu", "Qu", "Liu", "Yi", "Jia", "Jing", "Qian", "Jiang", "Jiao", "Cheng", "Shi", "Zhuo", "Ce", "Pal", "Kuai", "Ji", "Liu", "Chan", "Hun", "Hu", "Nong", "Xun", "Jin", "Lie", "Qiu", "Wei", "Zhe", "Jun", "Han", "Bang", "Mang", "Zhuo", "You", "Xi", "Bo", "Dou", "Wan", "Hong", "Yi", "Pu", "Ying", "Lan", "Hao", "Lang", "Han", "Li", "Geng", "Fu", "Wu", "Lian", "Chun", "Feng", "Yi", "Yu", "Tong", "Lao", "Hai", "Jin", "Jia", "Chong", "Weng", "Mei", "Sui", "Cheng", "Pei", "Xian", "Shen", "Tu", "Kun", "Pin", "Nie", "Han", "Jing", "Xiao", "She", "Nian", "Tu", "Yong", "Xiao", "Xian", "Ting", "E", "Su", "Tun", "Juan", "Cen", "Ti", "Li", "Shui", "Si", "Lei", "Shui", "Tao", "Du", "Lao", "Lai", "Lian", "Wei", "Wo", "Yun", "Huan", "Di", , "Run", "Jian", "Zhang", "Se", "Fu", "Guan", "Xing", "Shou", "Shuan", "Ya", "Chuo", "Zhang", "Ye", "Kong", "Wo", "Han", "Tuo", "Dong", "He", "Wo", "Ju", "Gan", "Liang", "Hun", "Ta", "Zhuo", "Dian", "Qie", "De", "Juan", "Zi", "Xi", "Yao", "Qi", "Gu", "Guo", "Han", "Lin", "Tang", "Zhou", "Peng", "Hao", "Chang", "Shu", "Qi", "Fang", "Chi", "Lu", "Nao", "Ju", "Tao", "Cong", "Lei", "Zhi", "Peng", "Fei", "Song", "Tian", "Pi", "Dan", "Yu", "Ni", "Yu", "Lu", "Gan", "Mi", "Jing", "Ling", "Lun", "Yin", "Cui", "Qu", "Huai", "Yu", "Nian", "Shen", "Piao", "Chun", "Wa", "Yuan", "Lai", "Hun", "Qing", "Yan", "Qian", "Tian", "Miao", "Zhi", "Yin", "Mi"], ["Ben", "Yuan", "Wen", "Re", "Fei", "Qing", "Yuan", "Ke", "Ji", "She", "Yuan", "Shibui", "Lu", "Zi", "Du", , "Jian", "Min", "Pi", "Tani", "Yu", "Yuan", "Shen", "Shen", "Rou", "Huan", "Zhu", "Jian", "Nuan", "Yu", "Qiu", "Ting", "Qu", "Du", "Feng", "Zha", "Bo", "Wo", "Wo", "Di", "Wei", "Wen", "Ru", "Xie", "Ce", "Wei", "Ge", "Gang", "Yan", "Hong", "Xuan", "Mi", "Ke", "Mao", "Ying", "Yan", "You", "Hong", "Miao", "Xing", "Mei", "Zai", "Hun", "Nai", "Kui", "Shi", "E", "Pai", "Mei", "Lian", "Qi", "Qi", "Mei", "Tian", "Cou", "Wei", "Can", "Tuan", "Mian", "Hui", "Mo", "Xu", "Ji", "Pen", "Jian", "Jian", "Hu", "Feng", "Xiang", "Yi", "Yin", "Zhan", "Shi", "Jie", "Cheng", "Huang", "Tan", "Yu", "Bi", "Min", "Shi", "Tu", "Sheng", "Yong", "Qu", "Zhong", "Suei", "Jiu", "Jiao", "Qiou", "Yin", "Tang", "Long", "Huo", "Yuan", "Nan", "Ban", "You", "Quan", "Chui", "Liang", "Chan", "Yan", "Chun", "Nie", "Zi", "Wan", "Shi", "Man", "Ying", "Ratsu", "Kui", , "Jian", "Xu", "Lu", "Gui", "Gai", , , "Po", "Jin", "Gui", "Tang", "Yuan", "Suo", "Yuan", "Lian", "Yao", "Meng", "Zhun", "Sheng", "Ke", "Tai", "Da", "Wa", "Liu", "Gou", "Sao", "Ming", "Zha", "Shi", "Yi", "Lun", "Ma", "Pu", "Wei", "Li", "Cai", "Wu", "Xi", "Wen", "Qiang", "Ze", "Shi", "Su", "Yi", "Zhen", "Sou", "Yun", "Xiu", "Yin", "Rong", "Hun", "Su", "Su", "Ni", "Ta", "Shi", "Ru", "Wei", "Pan", "Chu", "Chu", "Pang", "Weng", "Cang", "Mie", "He", "Dian", "Hao", "Huang", "Xi", "Zi", "Di", "Zhi", "Ying", "Fu", "Jie", "Hua", "Ge", "Zi", "Tao", "Teng", "Sui", "Bi", "Jiao", "Hui", "Gun", "Yin", "Gao", "Long", "Zhi", "Yan", "She", "Man", "Ying", "Chun", "Lu", "Lan", "Luan", , "Bin", "Tan", "Yu", "Sou", "Hu", "Bi", "Biao", "Zhi", "Jiang", "Kou", "Shen", "Shang", "Di", "Mi", "Ao", "Lu", "Hu", "Hu", "You", "Chan", "Fan", "Yong", "Gun", "Man"], ["Qing", "Yu", "Piao", "Ji", "Ya", "Jiao", "Qi", "Xi", "Ji", "Lu", "Lu", "Long", "Jin", "Guo", "Cong", "Lou", "Zhi", "Gai", "Qiang", "Li", "Yan", "Cao", "Jiao", "Cong", "Qun", "Tuan", "Ou", "Teng", "Ye", "Xi", "Mi", "Tang", "Mo", "Shang", "Han", "Lian", "Lan", "Wa", "Li", "Qian", "Feng", "Xuan", "Yi", "Man", "Zi", "Mang", "Kang", "Lei", "Peng", "Shu", "Zhang", "Zhang", "Chong", "Xu", "Huan", "Kuo", "Jian", "Yan", "Chuang", "Liao", "Cui", "Ti", "Yang", "Jiang", "Cong", "Ying", "Hong", "Xun", "Shu", "Guan", "Ying", "Xiao", , , "Xu", "Lian", "Zhi", "Wei", "Pi", "Jue", "Jiao", "Po", "Dang", "Hui", "Jie", "Wu", "Pa", "Ji", "Pan", "Gui", "Xiao", "Qian", "Qian", "Xi", "Lu", "Xi", "Xuan", "Dun", "Huang", "Min", "Run", "Su", "Liao", "Zhen", "Zhong", "Yi", "Di", "Wan", "Dan", "Tan", "Chao", "Xun", "Kui", "Yie", "Shao", "Tu", "Zhu", "San", "Hei", "Bi", "Shan", "Chan", "Chan", "Shu", "Tong", "Pu", "Lin", "Wei", "Se", "Se", "Cheng", "Jiong", "Cheng", "Hua", "Jiao", "Lao", "Che", "Gan", "Cun", "Heng", "Si", "Shu", "Peng", "Han", "Yun", "Liu", "Hong", "Fu", "Hao", "He", "Xian", "Jian", "Shan", "Xi", "Oki", , "Lan", , "Yu", "Lin", "Min", "Zao", "Dang", "Wan", "Ze", "Xie", "Yu", "Li", "Shi", "Xue", "Ling", "Man", "Zi", "Yong", "Kuai", "Can", "Lian", "Dian", "Ye", "Ao", "Huan", "Zhen", "Chan", "Man", "Dan", "Dan", "Yi", "Sui", "Pi", "Ju", "Ta", "Qin", "Ji", "Zhuo", "Lian", "Nong", "Guo", "Jin", "Fen", "Se", "Ji", "Sui", "Hui", "Chu", "Ta", "Song", "Ding", , "Zhu", "Lai", "Bin", "Lian", "Mi", "Shi", "Shu", "Mi", "Ning", "Ying", "Ying", "Meng", "Jin", "Qi", "Pi", "Ji", "Hao", "Ru", "Zui", "Wo", "Tao", "Yin", "Yin", "Dui", "Ci", "Huo", "Jing", "Lan", "Jun", "Ai", "Pu", "Zhuo", "Wei", "Bin", "Gu", "Qian", "Xing", "Hama", "Kuo", "Fei", , "Boku", "Jian", "Wei", "Luo", "Zan", "Lu", "Li"], ["You", "Yang", "Lu", "Si", "Jie", "Ying", "Du", "Wang", "Hui", "Xie", "Pan", "Shen", "Biao", "Chan", "Mo", "Liu", "Jian", "Pu", "Se", "Cheng", "Gu", "Bin", "Huo", "Xian", "Lu", "Qin", "Han", "Ying", "Yong", "Li", "Jing", "Xiao", "Ying", "Sui", "Wei", "Xie", "Huai", "Hao", "Zhu", "Long", "Lai", "Dui", "Fan", "Hu", "Lai", , , "Ying", "Mi", "Ji", "Lian", "Jian", "Ying", "Fen", "Lin", "Yi", "Jian", "Yue", "Chan", "Dai", "Rang", "Jian", "Lan", "Fan", "Shuang", "Yuan", "Zhuo", "Feng", "She", "Lei", "Lan", "Cong", "Qu", "Yong", "Qian", "Fa", "Guan", "Que", "Yan", "Hao", "Hyeng", "Sa", "Zan", "Luan", "Yan", "Li", "Mi", "Shan", "Tan", "Dang", "Jiao", "Chan", , "Hao", "Ba", "Zhu", "Lan", "Lan", "Nang", "Wan", "Luan", "Xun", "Xian", "Yan", "Gan", "Yan", "Yu", "Huo", "Si", "Mie", "Guang", "Deng", "Hui", "Xiao", "Xiao", "Hu", "Hong", "Ling", "Zao", "Zhuan", "Jiu", "Zha", "Xie", "Chi", "Zhuo", "Zai", "Zai", "Can", "Yang", "Qi", "Zhong", "Fen", "Niu", "Jiong", "Wen", "Po", "Yi", "Lu", "Chui", "Pi", "Kai", "Pan", "Yan", "Kai", "Pang", "Mu", "Chao", "Liao", "Gui", "Kang", "Tun", "Guang", "Xin", "Zhi", "Guang", "Guang", "Wei", "Qiang", , "Da", "Xia", "Zheng", "Zhu", "Ke", "Zhao", "Fu", "Ba", "Duo", "Duo", "Ling", "Zhuo", "Xuan", "Ju", "Tan", "Pao", "Jiong", "Pao", "Tai", "Tai", "Bing", "Yang", "Tong", "Han", "Zhu", "Zha", "Dian", "Wei", "Shi", "Lian", "Chi", "Huang", , "Hu", "Shuo", "Lan", "Jing", "Jiao", "Xu", "Xing", "Quan", "Lie", "Huan", "Yang", "Xiao", "Xiu", "Xian", "Yin", "Wu", "Zhou", "Yao", "Shi", "Wei", "Tong", "Xue", "Zai", "Kai", "Hong", "Luo", "Xia", "Zhu", "Xuan", "Zheng", "Po", "Yan", "Hui", "Guang", "Zhe", "Hui", "Kao", , "Fan", "Shao", "Ye", "Hui", , "Tang", "Jin", "Re", , "Xi", "Fu", "Jiong", "Che", "Pu", "Jing", "Zhuo", "Ting", "Wan", "Hai", "Peng", "Lang", "Shan", "Hu", "Feng", "Chi", "Rong"], ["Hu", "Xi", "Shu", "He", "Xun", "Ku", "Jue", "Xiao", "Xi", "Yan", "Han", "Zhuang", "Jun", "Di", "Xie", "Ji", "Wu", , , "Han", "Yan", "Huan", "Men", "Ju", "Chou", "Bei", "Fen", "Lin", "Kun", "Hun", "Tun", "Xi", "Cui", "Wu", "Hong", "Ju", "Fu", "Wo", "Jiao", "Cong", "Feng", "Ping", "Qiong", "Ruo", "Xi", "Qiong", "Xin", "Zhuo", "Yan", "Yan", "Yi", "Jue", "Yu", "Gang", "Ran", "Pi", "Gu", , "Sheng", "Chang", "Shao", , , , , "Chen", "He", "Kui", "Zhong", "Duan", "Xia", "Hui", "Feng", "Lian", "Xuan", "Xing", "Huang", "Jiao", "Jian", "Bi", "Ying", "Zhu", "Wei", "Tuan", "Tian", "Xi", "Nuan", "Nuan", "Chan", "Yan", "Jiong", "Jiong", "Yu", "Mei", "Sha", "Wei", "Ye", "Xin", "Qiong", "Rou", "Mei", "Huan", "Xu", "Zhao", "Wei", "Fan", "Qiu", "Sui", "Yang", "Lie", "Zhu", "Jie", "Gao", "Gua", "Bao", "Hu", "Yun", "Xia", , , "Bian", "Gou", "Tui", "Tang", "Chao", "Shan", "N", "Bo", "Huang", "Xie", "Xi", "Wu", "Xi", "Yun", "He", "He", "Xi", "Yun", "Xiong", "Nai", "Shan", "Qiong", "Yao", "Xun", "Mi", "Lian", "Ying", "Wen", "Rong", "Oozutsu", , "Qiang", "Liu", "Xi", "Bi", "Biao", "Zong", "Lu", "Jian", "Shou", "Yi", "Lou", "Feng", "Sui", "Yi", "Tong", "Jue", "Zong", "Yun", "Hu", "Yi", "Zhi", "Ao", "Wei", "Liao", "Han", "Ou", "Re", "Jiong", "Man", , "Shang", "Cuan", "Zeng", "Jian", "Xi", "Xi", "Xi", "Yi", "Xiao", "Chi", "Huang", "Chan", "Ye", "Qian", "Ran", "Yan", "Xian", "Qiao", "Zun", "Deng", "Dun", "Shen", "Jiao", "Fen", "Si", "Liao", "Yu", "Lin", "Tong", "Shao", "Fen", "Fan", "Yan", "Xun", "Lan", "Mei", "Tang", "Yi", "Jing", "Men", , , "Ying", "Yu", "Yi", "Xue", "Lan", "Tai", "Zao", "Can", "Sui", "Xi", "Que", "Cong", "Lian", "Hui", "Zhu", "Xie", "Ling", "Wei", "Yi", "Xie", "Zhao", "Hui", "Tatsu", "Nung", "Lan", "Ru", "Xian", "Kao", "Xun", "Jin", "Chou", "Chou", "Yao"], ["He", "Lan", "Biao", "Rong", "Li", "Mo", "Bao", "Ruo", "Lu", "La", "Ao", "Xun", "Kuang", "Shuo", , "Li", "Lu", "Jue", "Liao", "Yan", "Xi", "Xie", "Long", "Ye", , "Rang", "Yue", "Lan", "Cong", "Jue", "Tong", "Guan", , "Che", "Mi", "Tang", "Lan", "Zhu", , "Ling", "Cuan", "Yu", "Zhua", "Tsumekanmuri", "Pa", "Zheng", "Pao", "Cheng", "Yuan", "Ai", "Wei", , "Jue", "Jue", "Fu", "Ye", "Ba", "Die", "Ye", "Yao", "Zu", "Shuang", "Er", "Qiang", "Chuang", "Ge", "Zang", "Die", "Qiang", "Yong", "Qiang", "Pian", "Ban", "Pan", "Shao", "Jian", "Pai", "Du", "Chuang", "Tou", "Zha", "Bian", "Die", "Bang", "Bo", "Chuang", "You", , "Du", "Ya", "Cheng", "Niu", "Ushihen", "Pin", "Jiu", "Mou", "Tuo", "Mu", "Lao", "Ren", "Mang", "Fang", "Mao", "Mu", "Gang", "Wu", "Yan", "Ge", "Bei", "Si", "Jian", "Gu", "You", "Ge", "Sheng", "Mu", "Di", "Qian", "Quan", "Quan", "Zi", "Te", "Xi", "Mang", "Keng", "Qian", "Wu", "Gu", "Xi", "Li", "Li", "Pou", "Ji", "Gang", "Zhi", "Ben", "Quan", "Run", "Du", "Ju", "Jia", "Jian", "Feng", "Pian", "Ke", "Ju", "Kao", "Chu", "Xi", "Bei", "Luo", "Jie", "Ma", "San", "Wei", "Li", "Dun", "Tong", , "Jiang", "Ikenie", "Li", "Du", "Lie", "Pi", "Piao", "Bao", "Xi", "Chou", "Wei", "Kui", "Chou", "Quan", "Fan", "Ba", "Fan", "Qiu", "Ji", "Cai", "Chuo", "An", "Jie", "Zhuang", "Guang", "Ma", "You", "Kang", "Bo", "Hou", "Ya", "Yin", "Huan", "Zhuang", "Yun", "Kuang", "Niu", "Di", "Qing", "Zhong", "Mu", "Bei", "Pi", "Ju", "Ni", "Sheng", "Pao", "Xia", "Tuo", "Hu", "Ling", "Fei", "Pi", "Ni", "Ao", "You", "Gou", "Yue", "Ju", "Dan", "Po", "Gu", "Xian", "Ning", "Huan", "Hen", "Jiao", "He", "Zhao", "Ji", "Xun", "Shan", "Ta", "Rong", "Shou", "Tong", "Lao", "Du", "Xia", "Shi", "Hua", "Zheng", "Yu", "Sun", "Yu", "Bi", "Mang", "Xi", "Juan", "Li", "Xia", "Yin", "Suan", "Lang", "Bei", "Zhi", "Yan"], ["Sha", "Li", "Han", "Xian", "Jing", "Pai", "Fei", "Yao", "Ba", "Qi", "Ni", "Biao", "Yin", "Lai", "Xi", "Jian", "Qiang", "Kun", "Yan", "Guo", "Zong", "Mi", "Chang", "Yi", "Zhi", "Zheng", "Ya", "Meng", "Cai", "Cu", "She", "Kari", "Cen", "Luo", "Hu", "Zong", "Ji", "Wei", "Feng", "Wo", "Yuan", "Xing", "Zhu", "Mao", "Wei", "Yuan", "Xian", "Tuan", "Ya", "Nao", "Xie", "Jia", "Hou", "Bian", "You", "You", "Mei", "Zha", "Yao", "Sun", "Bo", "Ming", "Hua", "Yuan", "Sou", "Ma", "Yuan", "Dai", "Yu", "Shi", "Hao", , "Yi", "Zhen", "Chuang", "Hao", "Man", "Jing", "Jiang", "Mu", "Zhang", "Chan", "Ao", "Ao", "Hao", "Cui", "Fen", "Jue", "Bi", "Bi", "Huang", "Pu", "Lin", "Yu", "Tong", "Yao", "Liao", "Shuo", "Xiao", "Swu", "Ton", "Xi", "Ge", "Juan", "Du", "Hui", "Kuai", "Xian", "Xie", "Ta", "Xian", "Xun", "Ning", "Pin", "Huo", "Nou", "Meng", "Lie", "Nao", "Guang", "Shou", "Lu", "Ta", "Xian", "Mi", "Rang", "Huan", "Nao", "Luo", "Xian", "Qi", "Jue", "Xuan", "Miao", "Zi", "Lu", "Lu", "Yu", "Su", "Wang", "Qiu", "Ga", "Ding", "Le", "Ba", "Ji", "Hong", "Di", "Quan", "Gan", "Jiu", "Yu", "Ji", "Yu", "Yang", "Ma", "Gong", "Wu", "Fu", "Wen", "Jie", "Ya", "Fen", "Bian", "Beng", "Yue", "Jue", "Yun", "Jue", "Wan", "Jian", "Mei", "Dan", "Pi", "Wei", "Huan", "Xian", "Qiang", "Ling", "Dai", "Yi", "An", "Ping", "Dian", "Fu", "Xuan", "Xi", "Bo", "Ci", "Gou", "Jia", "Shao", "Po", "Ci", "Ke", "Ran", "Sheng", "Shen", "Yi", "Zu", "Jia", "Min", "Shan", "Liu", "Bi", "Zhen", "Zhen", "Jue", "Fa", "Long", "Jin", "Jiao", "Jian", "Li", "Guang", "Xian", "Zhou", "Gong", "Yan", "Xiu", "Yang", "Xu", "Luo", "Su", "Zhu", "Qin", "Ken", "Xun", "Bao", "Er", "Xiang", "Yao", "Xia", "Heng", "Gui", "Chong", "Xu", "Ban", "Pei", , "Dang", "Ei", "Hun", "Wen", "E", "Cheng", "Ti", "Wu", "Wu", "Cheng", "Jun", "Mei", "Bei", "Ting", "Xian", "Chuo"], ["Han", "Xuan", "Yan", "Qiu", "Quan", "Lang", "Li", "Xiu", "Fu", "Liu", "Ye", "Xi", "Ling", "Li", "Jin", "Lian", "Suo", "Chiisai", , "Wan", "Dian", "Pin", "Zhan", "Cui", "Min", "Yu", "Ju", "Chen", "Lai", "Wen", "Sheng", "Wei", "Dian", "Chu", "Zhuo", "Pei", "Cheng", "Hu", "Qi", "E", "Kun", "Chang", "Qi", "Beng", "Wan", "Lu", "Cong", "Guan", "Yan", "Diao", "Bei", "Lin", "Qin", "Pi", "Pa", "Que", "Zhuo", "Qin", "Fa", , "Qiong", "Du", "Jie", "Hun", "Yu", "Mao", "Mei", "Chun", "Xuan", "Ti", "Xing", "Dai", "Rou", "Min", "Zhen", "Wei", "Ruan", "Huan", "Jie", "Chuan", "Jian", "Zhuan", "Yang", "Lian", "Quan", "Xia", "Duan", "Yuan", "Ye", "Nao", "Hu", "Ying", "Yu", "Huang", "Rui", "Se", "Liu", "Shi", "Rong", "Suo", "Yao", "Wen", "Wu", "Jin", "Jin", "Ying", "Ma", "Tao", "Liu", "Tang", "Li", "Lang", "Gui", "Zhen", "Qiang", "Cuo", "Jue", "Zhao", "Yao", "Ai", "Bin", "Tu", "Chang", "Kun", "Zhuan", "Cong", "Jin", "Yi", "Cui", "Cong", "Qi", "Li", "Ying", "Suo", "Qiu", "Xuan", "Ao", "Lian", "Man", "Zhang", "Yin", , "Ying", "Zhi", "Lu", "Wu", "Deng", "Xiou", "Zeng", "Xun", "Qu", "Dang", "Lin", "Liao", "Qiong", "Su", "Huang", "Gui", "Pu", "Jing", "Fan", "Jin", "Liu", "Ji", , "Jing", "Ai", "Bi", "Can", "Qu", "Zao", "Dang", "Jiao", "Gun", "Tan", "Hui", "Huan", "Se", "Sui", "Tian", , "Yu", "Jin", "Lu", "Bin", "Shou", "Wen", "Zui", "Lan", "Xi", "Ji", "Xuan", "Ruan", "Huo", "Gai", "Lei", "Du", "Li", "Zhi", "Rou", "Li", "Zan", "Qiong", "Zhe", "Gui", "Sui", "La", "Long", "Lu", "Li", "Zan", "Lan", "Ying", "Mi", "Xiang", "Xi", "Guan", "Dao", "Zan", "Huan", "Gua", "Bo", "Die", "Bao", "Hu", "Zhi", "Piao", "Ban", "Rang", "Li", "Wa", "Dekaguramu", "Jiang", "Qian", "Fan", "Pen", "Fang", "Dan", "Weng", "Ou", "Deshiguramu", "Miriguramu", "Thon", "Hu", "Ling", "Yi", "Ping", "Ci", "Hekutogura", "Juan", "Chang", "Chi", "Sarake", "Dang", "Meng", "Pou"], ["Zhui", "Ping", "Bian", "Zhou", "Zhen", "Senchigura", "Ci", "Ying", "Qi", "Xian", "Lou", "Di", "Ou", "Meng", "Zhuan", "Peng", "Lin", "Zeng", "Wu", "Pi", "Dan", "Weng", "Ying", "Yan", "Gan", "Dai", "Shen", "Tian", "Tian", "Han", "Chang", "Sheng", "Qing", "Sheng", "Chan", "Chan", "Rui", "Sheng", "Su", "Sen", "Yong", "Shuai", "Lu", "Fu", "Yong", "Beng", "Feng", "Ning", "Tian", "You", "Jia", "Shen", "Zha", "Dian", "Fu", "Nan", "Dian", "Ping", "Ting", "Hua", "Ting", "Quan", "Zi", "Meng", "Bi", "Qi", "Liu", "Xun", "Liu", "Chang", "Mu", "Yun", "Fan", "Fu", "Geng", "Tian", "Jie", "Jie", "Quan", "Wei", "Fu", "Tian", "Mu", "Tap", "Pan", "Jiang", "Wa", "Da", "Nan", "Liu", "Ben", "Zhen", "Chu", "Mu", "Mu", "Ce", "Cen", "Gai", "Bi", "Da", "Zhi", "Lue", "Qi", "Lue", "Pan", "Kesa", "Fan", "Hua", "Yu", "Yu", "Mu", "Jun", "Yi", "Liu", "Yu", "Die", "Chou", "Hua", "Dang", "Chuo", "Ji", "Wan", "Jiang", "Sheng", "Chang", "Tuan", "Lei", "Ji", "Cha", "Liu", "Tatamu", "Tuan", "Lin", "Jiang", "Jiang", "Chou", "Bo", "Die", "Die", "Pi", "Nie", "Dan", "Shu", "Shu", "Zhi", "Yi", "Chuang", "Nai", "Ding", "Bi", "Jie", "Liao", "Gong", "Ge", "Jiu", "Zhou", "Xia", "Shan", "Xu", "Nue", "Li", "Yang", "Chen", "You", "Ba", "Jie", "Jue", "Zhi", "Xia", "Cui", "Bi", "Yi", "Li", "Zong", "Chuang", "Feng", "Zhu", "Pao", "Pi", "Gan", "Ke", "Ci", "Xie", "Qi", "Dan", "Zhen", "Fa", "Zhi", "Teng", "Ju", "Ji", "Fei", "Qu", "Dian", "Jia", "Xian", "Cha", "Bing", "Ni", "Zheng", "Yong", "Jing", "Quan", "Chong", "Tong", "Yi", "Kai", "Wei", "Hui", "Duo", "Yang", "Chi", "Zhi", "Hen", "Ya", "Mei", "Dou", "Jing", "Xiao", "Tong", "Tu", "Mang", "Pi", "Xiao", "Suan", "Pu", "Li", "Zhi", "Cuo", "Duo", "Wu", "Sha", "Lao", "Shou", "Huan", "Xian", "Yi", "Peng", "Zhang", "Guan", "Tan", "Fei", "Ma", "Lin", "Chi", "Ji", "Dian", "An", "Chi", "Bi", "Bei", "Min", "Gu", "Dui", "E", "Wei"], ["Yu", "Cui", "Ya", "Zhu", "Cu", "Dan", "Shen", "Zhung", "Ji", "Yu", "Hou", "Feng", "La", "Yang", "Shen", "Tu", "Yu", "Gua", "Wen", "Huan", "Ku", "Jia", "Yin", "Yi", "Lu", "Sao", "Jue", "Chi", "Xi", "Guan", "Yi", "Wen", "Ji", "Chuang", "Ban", "Lei", "Liu", "Chai", "Shou", "Nue", "Dian", "Da", "Pie", "Tan", "Zhang", "Biao", "Shen", "Cu", "Luo", "Yi", "Zong", "Chou", "Zhang", "Zhai", "Sou", "Suo", "Que", "Diao", "Lou", "Lu", "Mo", "Jin", "Yin", "Ying", "Huang", "Fu", "Liao", "Long", "Qiao", "Liu", "Lao", "Xian", "Fei", "Dan", "Yin", "He", "Ai", "Ban", "Xian", "Guan", "Guai", "Nong", "Yu", "Wei", "Yi", "Yong", "Pi", "Lei", "Li", "Shu", "Dan", "Lin", "Dian", "Lin", "Lai", "Pie", "Ji", "Chi", "Yang", "Xian", "Jie", "Zheng", , "Li", "Huo", "Lai", "Shaku", "Dian", "Xian", "Ying", "Yin", "Qu", "Yong", "Tan", "Dian", "Luo", "Luan", "Luan", "Bo", , "Gui", "Po", "Fa", "Deng", "Fa", "Bai", "Bai", "Qie", "Bi", "Zao", "Zao", "Mao", "De", "Pa", "Jie", "Huang", "Gui", "Ci", "Ling", "Gao", "Mo", "Ji", "Jiao", "Peng", "Gao", "Ai", "E", "Hao", "Han", "Bi", "Wan", "Chou", "Qian", "Xi", "Ai", "Jiong", "Hao", "Huang", "Hao", "Ze", "Cui", "Hao", "Xiao", "Ye", "Po", "Hao", "Jiao", "Ai", "Xing", "Huang", "Li", "Piao", "He", "Jiao", "Pi", "Gan", "Pao", "Zhou", "Jun", "Qiu", "Cun", "Que", "Zha", "Gu", "Jun", "Jun", "Zhou", "Zha", "Gu", "Zhan", "Du", "Min", "Qi", "Ying", "Yu", "Bei", "Zhao", "Zhong", "Pen", "He", "Ying", "He", "Yi", "Bo", "Wan", "He", "Ang", "Zhan", "Yan", "Jian", "He", "Yu", "Kui", "Fan", "Gai", "Dao", "Pan", "Fu", "Qiu", "Sheng", "Dao", "Lu", "Zhan", "Meng", "Li", "Jin", "Xu", "Jian", "Pan", "Guan", "An", "Lu", "Shu", "Zhou", "Dang", "An", "Gu", "Li", "Mu", "Cheng", "Gan", "Xu", "Mang", "Mang", "Zhi", "Qi", "Ruan", "Tian", "Xiang", "Dun", "Xin", "Xi", "Pan", "Feng", "Dun", "Min"], ["Ming", "Sheng", "Shi", "Yun", "Mian", "Pan", "Fang", "Miao", "Dan", "Mei", "Mao", "Kan", "Xian", "Ou", "Shi", "Yang", "Zheng", "Yao", "Shen", "Huo", "Da", "Zhen", "Kuang", "Ju", "Shen", "Chi", "Sheng", "Mei", "Mo", "Zhu", "Zhen", "Zhen", "Mian", "Di", "Yuan", "Die", "Yi", "Zi", "Zi", "Chao", "Zha", "Xuan", "Bing", "Mi", "Long", "Sui", "Dong", "Mi", "Die", "Yi", "Er", "Ming", "Xuan", "Chi", "Kuang", "Juan", "Mou", "Zhen", "Tiao", "Yang", "Yan", "Mo", "Zhong", "Mai", "Zhao", "Zheng", "Mei", "Jun", "Shao", "Han", "Huan", "Di", "Cheng", "Cuo", "Juan", "E", "Wan", "Xian", "Xi", "Kun", "Lai", "Jian", "Shan", "Tian", "Hun", "Wan", "Ling", "Shi", "Qiong", "Lie", "Yai", "Jing", "Zheng", "Li", "Lai", "Sui", "Juan", "Shui", "Sui", "Du", "Bi", "Bi", "Mu", "Hun", "Ni", "Lu", "Yi", "Jie", "Cai", "Zhou", "Yu", "Hun", "Ma", "Xia", "Xing", "Xi", "Gun", "Cai", "Chun", "Jian", "Mei", "Du", "Hou", "Xuan", "Ti", "Kui", "Gao", "Rui", "Mou", "Xu", "Fa", "Wen", "Miao", "Chou", "Kui", "Mi", "Weng", "Kou", "Dang", "Chen", "Ke", "Sou", "Xia", "Qiong", "Mao", "Ming", "Man", "Shui", "Ze", "Zhang", "Yi", "Diao", "Ou", "Mo", "Shun", "Cong", "Lou", "Chi", "Man", "Piao", "Cheng", "Ji", "Meng", , "Run", "Pie", "Xi", "Qiao", "Pu", "Zhu", "Deng", "Shen", "Shun", "Liao", "Che", "Xian", "Kan", "Ye", "Xu", "Tong", "Mou", "Lin", "Kui", "Xian", "Ye", "Ai", "Hui", "Zhan", "Jian", "Gu", "Zhao", "Qu", "Wei", "Chou", "Sao", "Ning", "Xun", "Yao", "Huo", "Meng", "Mian", "Bin", "Mian", "Li", "Kuang", "Jue", "Xuan", "Mian", "Huo", "Lu", "Meng", "Long", "Guan", "Man", "Xi", "Chu", "Tang", "Kan", "Zhu", "Mao", "Jin", "Lin", "Yu", "Shuo", "Ce", "Jue", "Shi", "Yi", "Shen", "Zhi", "Hou", "Shen", "Ying", "Ju", "Zhou", "Jiao", "Cuo", "Duan", "Ai", "Jiao", "Zeng", "Huo", "Bai", "Shi", "Ding", "Qi", "Ji", "Zi", "Gan", "Wu", "Tuo", "Ku", "Qiang", "Xi", "Fan", "Kuang"], ["Dang", "Ma", "Sha", "Dan", "Jue", "Li", "Fu", "Min", "Nuo", "Huo", "Kang", "Zhi", "Qi", "Kan", "Jie", "Fen", "E", "Ya", "Pi", "Zhe", "Yan", "Sui", "Zhuan", "Che", "Dun", "Pan", "Yan", , "Feng", "Fa", "Mo", "Zha", "Qu", "Yu", "Luo", "Tuo", "Tuo", "Di", "Zhai", "Zhen", "Ai", "Fei", "Mu", "Zhu", "Li", "Bian", "Nu", "Ping", "Peng", "Ling", "Pao", "Le", "Po", "Bo", "Po", "Shen", "Za", "Nuo", "Li", "Long", "Tong", , "Li", "Aragane", "Chu", "Keng", "Quan", "Zhu", "Kuang", "Huo", "E", "Nao", "Jia", "Lu", "Wei", "Ai", "Luo", "Ken", "Xing", "Yan", "Tong", "Peng", "Xi", , "Hong", "Shuo", "Xia", "Qiao", , "Wei", "Qiao", , "Keng", "Xiao", "Que", "Chan", "Lang", "Hong", "Yu", "Xiao", "Xia", "Mang", "Long", "Iong", "Che", "Che", "E", "Liu", "Ying", "Mang", "Que", "Yan", "Sha", "Kun", "Yu", , "Kaki", "Lu", "Chen", "Jian", "Nue", "Song", "Zhuo", "Keng", "Peng", "Yan", "Zhui", "Kong", "Ceng", "Qi", "Zong", "Qing", "Lin", "Jun", "Bo", "Ding", "Min", "Diao", "Jian", "He", "Lu", "Ai", "Sui", "Que", "Ling", "Bei", "Yin", "Dui", "Wu", "Qi", "Lun", "Wan", "Dian", "Gang", "Pei", "Qi", "Chen", "Ruan", "Yan", "Die", "Ding", "Du", "Tuo", "Jie", "Ying", "Bian", "Ke", "Bi", "Wei", "Shuo", "Zhen", "Duan", "Xia", "Dang", "Ti", "Nao", "Peng", "Jian", "Di", "Tan", "Cha", "Seki", "Qi", , "Feng", "Xuan", "Que", "Que", "Ma", "Gong", "Nian", "Su", "E", "Ci", "Liu", "Si", "Tang", "Bang", "Hua", "Pi", "Wei", "Sang", "Lei", "Cuo", "Zhen", "Xia", "Qi", "Lian", "Pan", "Wei", "Yun", "Dui", "Zhe", "Ke", "La", , "Qing", "Gun", "Zhuan", "Chan", "Qi", "Ao", "Peng", "Lu", "Lu", "Kan", "Qiang", "Chen", "Yin", "Lei", "Biao", "Qi", "Mo", "Qi", "Cui", "Zong", "Qing", "Chuo", , "Ji", "Shan", "Lao", "Qu", "Zeng", "Deng", "Jian", "Xi", "Lin", "Ding", "Dian", "Huang", "Pan", "Za", "Qiao", "Di", "Li"], ["Tani", "Jiao", , "Zhang", "Qiao", "Dun", "Xian", "Yu", "Zhui", "He", "Huo", "Zhai", "Lei", "Ke", "Chu", "Ji", "Que", "Dang", "Yi", "Jiang", "Pi", "Pi", "Yu", "Pin", "Qi", "Ai", "Kai", "Jian", "Yu", "Ruan", "Meng", "Pao", "Ci", , , "Mie", "Ca", "Xian", "Kuang", "Lei", "Lei", "Zhi", "Li", "Li", "Fan", "Que", "Pao", "Ying", "Li", "Long", "Long", "Mo", "Bo", "Shuang", "Guan", "Lan", "Zan", "Yan", "Shi", "Shi", "Li", "Reng", "She", "Yue", "Si", "Qi", "Ta", "Ma", "Xie", "Xian", "Xian", "Zhi", "Qi", "Zhi", "Beng", "Dui", "Zhong", , "Yi", "Shi", "You", "Zhi", "Tiao", "Fu", "Fu", "Mi", "Zu", "Zhi", "Suan", "Mei", "Zuo", "Qu", "Hu", "Zhu", "Shen", "Sui", "Ci", "Chai", "Mi", "Lu", "Yu", "Xiang", "Wu", "Tiao", "Piao", "Zhu", "Gui", "Xia", "Zhi", "Ji", "Gao", "Zhen", "Gao", "Shui", "Jin", "Chen", "Gai", "Kun", "Di", "Dao", "Huo", "Tao", "Qi", "Gu", "Guan", "Zui", "Ling", "Lu", "Bing", "Jin", "Dao", "Zhi", "Lu", "Shan", "Bei", "Zhe", "Hui", "You", "Xi", "Yin", "Zi", "Huo", "Zhen", "Fu", "Yuan", "Wu", "Xian", "Yang", "Ti", "Yi", "Mei", "Si", "Di", , "Zhuo", "Zhen", "Yong", "Ji", "Gao", "Tang", "Si", "Ma", "Ta", , "Xuan", "Qi", "Yu", "Xi", "Ji", "Si", "Chan", "Tan", "Kuai", "Sui", "Li", "Nong", "Ni", "Dao", "Li", "Rang", "Yue", "Ti", "Zan", "Lei", "Rou", "Yu", "Yu", "Chi", "Xie", "Qin", "He", "Tu", "Xiu", "Si", "Ren", "Tu", "Zi", "Cha", "Gan", "Yi", "Xian", "Bing", "Nian", "Qiu", "Qiu", "Zhong", "Fen", "Hao", "Yun", "Ke", "Miao", "Zhi", "Geng", "Bi", "Zhi", "Yu", "Mi", "Ku", "Ban", "Pi", "Ni", "Li", "You", "Zu", "Pi", "Ba", "Ling", "Mo", "Cheng", "Nian", "Qin", "Yang", "Zuo", "Zhi", "Zhi", "Shu", "Ju", "Zi", "Huo", "Ji", "Cheng", "Tong", "Zhi", "Huo", "He", "Yin", "Zi", "Zhi", "Jie", "Ren", "Du", "Yi", "Zhu", "Hui", "Nong", "Fu"], ["Xi", "Kao", "Lang", "Fu", "Ze", "Shui", "Lu", "Kun", "Gan", "Geng", "Ti", "Cheng", "Tu", "Shao", "Shui", "Ya", "Lun", "Lu", "Gu", "Zuo", "Ren", "Zhun", "Bang", "Bai", "Ji", "Zhi", "Zhi", "Kun", "Leng", "Peng", "Ke", "Bing", "Chou", "Zu", "Yu", "Su", "Lue", , "Yi", "Xi", "Bian", "Ji", "Fu", "Bi", "Nuo", "Jie", "Zhong", "Zong", "Xu", "Cheng", "Dao", "Wen", "Lian", "Zi", "Yu", "Ji", "Xu", "Zhen", "Zhi", "Dao", "Jia", "Ji", "Gao", "Gao", "Gu", "Rong", "Sui", "You", "Ji", "Kang", "Mu", "Shan", "Men", "Zhi", "Ji", "Lu", "Su", "Ji", "Ying", "Wen", "Qiu", "Se", , "Yi", "Huang", "Qie", "Ji", "Sui", "Xiao", "Pu", "Jiao", "Zhuo", "Tong", "Sai", "Lu", "Sui", "Nong", "Se", "Hui", "Rang", "Nuo", "Yu", "Bin", "Ji", "Tui", "Wen", "Cheng", "Huo", "Gong", "Lu", "Biao", , "Rang", "Zhuo", "Li", "Zan", "Xue", "Wa", "Jiu", "Qiong", "Xi", "Qiong", "Kong", "Yu", "Sen", "Jing", "Yao", "Chuan", "Zhun", "Tu", "Lao", "Qie", "Zhai", "Yao", "Bian", "Bao", "Yao", "Bing", "Wa", "Zhu", "Jiao", "Qiao", "Diao", "Wu", "Gui", "Yao", "Zhi", "Chuang", "Yao", "Tiao", "Jiao", "Chuang", "Jiong", "Xiao", "Cheng", "Kou", "Cuan", "Wo", "Dan", "Ku", "Ke", "Zhui", "Xu", "Su", "Guan", "Kui", "Dou", , "Yin", "Wo", "Wa", "Ya", "Yu", "Ju", "Qiong", "Yao", "Yao", "Tiao", "Chao", "Yu", "Tian", "Diao", "Ju", "Liao", "Xi", "Wu", "Kui", "Chuang", "Zhao", , "Kuan", "Long", "Cheng", "Cui", "Piao", "Zao", "Cuan", "Qiao", "Qiong", "Dou", "Zao", "Long", "Qie", "Li", "Chu", "Shi", "Fou", "Qian", "Chu", "Hong", "Qi", "Qian", "Gong", "Shi", "Shu", "Miao", "Ju", "Zhan", "Zhu", "Ling", "Long", "Bing", "Jing", "Jing", "Zhang", "Yi", "Si", "Jun", "Hong", "Tong", "Song", "Jing", "Diao", "Yi", "Shu", "Jing", "Qu", "Jie", "Ping", "Duan", "Shao", "Zhuan", "Ceng", "Deng", "Cui", "Huai", "Jing", "Kan", "Jing", "Zhu", "Zhu", "Le", "Peng", "Yu", "Chi", "Gan"], ["Mang", "Zhu", "Utsubo", "Du", "Ji", "Xiao", "Ba", "Suan", "Ji", "Zhen", "Zhao", "Sun", "Ya", "Zhui", "Yuan", "Hu", "Gang", "Xiao", "Cen", "Pi", "Bi", "Jian", "Yi", "Dong", "Shan", "Sheng", "Xia", "Di", "Zhu", "Na", "Chi", "Gu", "Li", "Qie", "Min", "Bao", "Tiao", "Si", "Fu", "Ce", "Ben", "Pei", "Da", "Zi", "Di", "Ling", "Ze", "Nu", "Fu", "Gou", "Fan", "Jia", "Ge", "Fan", "Shi", "Mao", "Po", "Sey", "Jian", "Qiong", "Long", "Souke", "Bian", "Luo", "Gui", "Qu", "Chi", "Yin", "Yao", "Xian", "Bi", "Qiong", "Gua", "Deng", "Jiao", "Jin", "Quan", "Sun", "Ru", "Fa", "Kuang", "Zhu", "Tong", "Ji", "Da", "Xing", "Ce", "Zhong", "Kou", "Lai", "Bi", "Shai", "Dang", "Zheng", "Ce", "Fu", "Yun", "Tu", "Pa", "Li", "Lang", "Ju", "Guan", "Jian", "Han", "Tong", "Xia", "Zhi", "Cheng", "Suan", "Shi", "Zhu", "Zuo", "Xiao", "Shao", "Ting", "Ce", "Yan", "Gao", "Kuai", "Gan", "Chou", "Kago", "Gang", "Yun", "O", "Qian", "Xiao", "Jian", "Pu", "Lai", "Zou", "Bi", "Bi", "Bi", "Ge", "Chi", "Guai", "Yu", "Jian", "Zhao", "Gu", "Chi", "Zheng", "Jing", "Sha", "Zhou", "Lu", "Bo", "Ji", "Lin", "Suan", "Jun", "Fu", "Zha", "Gu", "Kong", "Qian", "Quan", "Jun", "Chui", "Guan", "Yuan", "Ce", "Ju", "Bo", "Ze", "Qie", "Tuo", "Luo", "Dan", "Xiao", "Ruo", "Jian", "Xuan", "Bian", "Sun", "Xiang", "Xian", "Ping", "Zhen", "Sheng", "Hu", "Shi", "Zhu", "Yue", "Chun", "Lu", "Wu", "Dong", "Xiao", "Ji", "Jie", "Huang", "Xing", "Mei", "Fan", "Chui", "Zhuan", "Pian", "Feng", "Zhu", "Hong", "Qie", "Hou", "Qiu", "Miao", "Qian", , "Kui", "Sik", "Lou", "Yun", "He", "Tang", "Yue", "Chou", "Gao", "Fei", "Ruo", "Zheng", "Gou", "Nie", "Qian", "Xiao", "Cuan", "Gong", "Pang", "Du", "Li", "Bi", "Zhuo", "Chu", "Shai", "Chi", "Zhu", "Qiang", "Long", "Lan", "Jian", "Bu", "Li", "Hui", "Bi", "Di", "Cong", "Yan", "Peng", "Sen", "Zhuan", "Pai", "Piao", "Dou", "Yu", "Mie", "Zhuan"], ["Ze", "Xi", "Guo", "Yi", "Hu", "Chan", "Kou", "Cu", "Ping", "Chou", "Ji", "Gui", "Su", "Lou", "Zha", "Lu", "Nian", "Suo", "Cuan", "Sasara", "Suo", "Le", "Duan", "Yana", "Xiao", "Bo", "Mi", "Si", "Dang", "Liao", "Dan", "Dian", "Fu", "Jian", "Min", "Kui", "Dai", "Qiao", "Deng", "Huang", "Sun", "Lao", "Zan", "Xiao", "Du", "Shi", "Zan", , "Pai", "Hata", "Pai", "Gan", "Ju", "Du", "Lu", "Yan", "Bo", "Dang", "Sai", "Ke", "Long", "Qian", "Lian", "Bo", "Zhou", "Lai", , "Lan", "Kui", "Yu", "Yue", "Hao", "Zhen", "Tai", "Ti", "Mi", "Chou", "Ji", , "Hata", "Teng", "Zhuan", "Zhou", "Fan", "Sou", "Zhou", "Kuji", "Zhuo", "Teng", "Lu", "Lu", "Jian", "Tuo", "Ying", "Yu", "Lai", "Long", "Shinshi", "Lian", "Lan", "Qian", "Yue", "Zhong", "Qu", "Lian", "Bian", "Duan", "Zuan", "Li", "Si", "Luo", "Ying", "Yue", "Zhuo", "Xu", "Mi", "Di", "Fan", "Shen", "Zhe", "Shen", "Nu", "Xie", "Lei", "Xian", "Zi", "Ni", "Cun", , "Qian", "Kume", "Bi", "Ban", "Wu", "Sha", "Kang", "Rou", "Fen", "Bi", "Cui", , "Li", "Chi", "Nukamiso", "Ro", "Ba", "Li", "Gan", "Ju", "Po", "Mo", "Cu", "Nian", "Zhou", "Li", "Su", "Tiao", "Li", "Qi", "Su", "Hong", "Tong", "Zi", "Ce", "Yue", "Zhou", "Lin", "Zhuang", "Bai", , "Fen", "Ji", , "Sukumo", "Liang", "Xian", "Fu", "Liang", "Can", "Geng", "Li", "Yue", "Lu", "Ju", "Qi", "Cui", "Bai", "Zhang", "Lin", "Zong", "Jing", "Guo", "Kouji", "San", "San", "Tang", "Bian", "Rou", "Mian", "Hou", "Xu", "Zong", "Hu", "Jian", "Zan", "Ci", "Li", "Xie", "Fu", "Ni", "Bei", "Gu", "Xiu", "Gao", "Tang", "Qiu", "Sukumo", "Cao", "Zhuang", "Tang", "Mi", "San", "Fen", "Zao", "Kang", "Jiang", "Mo", "San", "San", "Nuo", "Xi", "Liang", "Jiang", "Kuai", "Bo", "Huan", , "Zong", "Xian", "Nuo", "Tuan", "Nie", "Li", "Zuo", "Di", "Nie", "Tiao", "Lan", "Mi", "Jiao", "Jiu", "Xi", "Gong", "Zheng", "Jiu", "You"], ["Ji", "Cha", "Zhou", "Xun", "Yue", "Hong", "Yu", "He", "Wan", "Ren", "Wen", "Wen", "Qiu", "Na", "Zi", "Tou", "Niu", "Fou", "Jie", "Shu", "Chun", "Pi", "Yin", "Sha", "Hong", "Zhi", "Ji", "Fen", "Yun", "Ren", "Dan", "Jin", "Su", "Fang", "Suo", "Cui", "Jiu", "Zha", "Kinu", "Jin", "Fu", "Zhi", "Ci", "Zi", "Chou", "Hong", "Zha", "Lei", "Xi", "Fu", "Xie", "Shen", "Bei", "Zhu", "Qu", "Ling", "Zhu", "Shao", "Gan", "Yang", "Fu", "Tuo", "Zhen", "Dai", "Zhuo", "Shi", "Zhong", "Xian", "Zu", "Jiong", "Ban", "Ju", "Mo", "Shu", "Zui", "Wata", "Jing", "Ren", "Heng", "Xie", "Jie", "Zhu", "Chou", "Gua", "Bai", "Jue", "Kuang", "Hu", "Ci", "Geng", "Geng", "Tao", "Xie", "Ku", "Jiao", "Quan", "Gai", "Luo", "Xuan", "Bing", "Xian", "Fu", "Gei", "Tong", "Rong", "Tiao", "Yin", "Lei", "Xie", "Quan", "Xu", "Lun", "Die", "Tong", "Si", "Jiang", "Xiang", "Hui", "Jue", "Zhi", "Jian", "Juan", "Chi", "Mian", "Zhen", "Lu", "Cheng", "Qiu", "Shu", "Bang", "Tong", "Xiao", "Wan", "Qin", "Geng", "Xiu", "Ti", "Xiu", "Xie", "Hong", "Xi", "Fu", "Ting", "Sui", "Dui", "Kun", "Fu", "Jing", "Hu", "Zhi", "Yan", "Jiong", "Feng", "Ji", "Sok", "Kase", "Zong", "Lin", "Duo", "Li", "Lu", "Liang", "Chou", "Quan", "Shao", "Qi", "Qi", "Zhun", "Qi", "Wan", "Qian", "Xian", "Shou", "Wei", "Qi", "Tao", "Wan", "Gang", "Wang", "Beng", "Zhui", "Cai", "Guo", "Cui", "Lun", "Liu", "Qi", "Zhan", "Bei", "Chuo", "Ling", "Mian", "Qi", "Qie", "Tan", "Zong", "Gun", "Zou", "Yi", "Zi", "Xing", "Liang", "Jin", "Fei", "Rui", "Min", "Yu", "Zong", "Fan", "Lu", "Xu", "Yingl", "Zhang", "Kasuri", "Xu", "Xiang", "Jian", "Ke", "Xian", "Ruan", "Mian", "Qi", "Duan", "Zhong", "Di", "Min", "Miao", "Yuan", "Xie", "Bao", "Si", "Qiu", "Bian", "Huan", "Geng", "Cong", "Mian", "Wei", "Fu", "Wei", "Yu", "Gou", "Miao", "Xie", "Lian", "Zong", "Bian", "Yun", "Yin", "Ti", "Gua", "Zhi", "Yun", "Cheng", "Chan", "Dai"], ["Xia", "Yuan", "Zong", "Xu", "Nawa", "Odoshi", "Geng", "Sen", "Ying", "Jin", "Yi", "Zhui", "Ni", "Bang", "Gu", "Pan", "Zhou", "Jian", "Cuo", "Quan", "Shuang", "Yun", "Xia", "Shuai", "Xi", "Rong", "Tao", "Fu", "Yun", "Zhen", "Gao", "Ru", "Hu", "Zai", "Teng", "Xian", "Su", "Zhen", "Zong", "Tao", "Horo", "Cai", "Bi", "Feng", "Cu", "Li", "Suo", "Yin", "Xi", "Zong", "Lei", "Zhuan", "Qian", "Man", "Zhi", "Lu", "Mo", "Piao", "Lian", "Mi", "Xuan", "Zong", "Ji", "Shan", "Sui", "Fan", "Shuai", "Beng", "Yi", "Sao", "Mou", "Zhou", "Qiang", "Hun", "Sem", "Xi", "Jung", "Xiu", "Ran", "Xuan", "Hui", "Qiao", "Zeng", "Zuo", "Zhi", "Shan", "San", "Lin", "Yu", "Fan", "Liao", "Chuo", "Zun", "Jian", "Rao", "Chan", "Rui", "Xiu", "Hui", "Hua", "Zuan", "Xi", "Qiang", "Un", "Da", "Sheng", "Hui", "Xi", "Se", "Jian", "Jiang", "Huan", "Zao", "Cong", "Jie", "Jiao", "Bo", "Chan", "Yi", "Nao", "Sui", "Yi", "Shai", "Xu", "Ji", "Bin", "Qian", "Lan", "Pu", "Xun", "Zuan", "Qi", "Peng", "Li", "Mo", "Lei", "Xie", "Zuan", "Kuang", "You", "Xu", "Lei", "Xian", "Chan", "Kou", "Lu", "Chan", "Ying", "Cai", "Xiang", "Xian", "Zui", "Zuan", "Luo", "Xi", "Dao", "Lan", "Lei", "Lian", "Si", "Jiu", "Yu", "Hong", "Zhou", "Xian", "He", "Yue", "Ji", "Wan", "Kuang", "Ji", "Ren", "Wei", "Yun", "Hong", "Chun", "Pi", "Sha", "Gang", "Na", "Ren", "Zong", "Lun", "Fen", "Zhi", "Wen", "Fang", "Zhu", "Yin", "Niu", "Shu", "Xian", "Gan", "Xie", "Fu", "Lian", "Zu", "Shen", "Xi", "Zhi", "Zhong", "Zhou", "Ban", "Fu", "Zhuo", "Shao", "Yi", "Jing", "Dai", "Bang", "Rong", "Jie", "Ku", "Rao", "Die", "Heng", "Hui", "Gei", "Xuan", "Jiang", "Luo", "Jue", "Jiao", "Tong", "Geng", "Xiao", "Juan", "Xiu", "Xi", "Sui", "Tao", "Ji", "Ti", "Ji", "Xu", "Ling", , "Xu", "Qi", "Fei", "Chuo", "Zhang", "Gun", "Sheng", "Wei", "Mian", "Shou", "Beng", "Chou", "Tao", "Liu", "Quan", "Zong", "Zhan", "Wan", "Lu"], ["Zhui", "Zi", "Ke", "Xiang", "Jian", "Mian", "Lan", "Ti", "Miao", "Qi", "Yun", "Hui", "Si", "Duo", "Duan", "Bian", "Xian", "Gou", "Zhui", "Huan", "Di", "Lu", "Bian", "Min", "Yuan", "Jin", "Fu", "Ru", "Zhen", "Feng", "Shuai", "Gao", "Chan", "Li", "Yi", "Jian", "Bin", "Piao", "Man", "Lei", "Ying", "Suo", "Mou", "Sao", "Xie", "Liao", "Shan", "Zeng", "Jiang", "Qian", "Zao", "Huan", "Jiao", "Zuan", "Fou", "Xie", "Gang", "Fou", "Que", "Fou", "Kaakeru", "Bo", "Ping", "Hou", , "Gang", "Ying", "Ying", "Qing", "Xia", "Guan", "Zun", "Tan", "Chang", "Qi", "Weng", "Ying", "Lei", "Tan", "Lu", "Guan", "Wang", "Wang", "Gang", "Wang", "Han", , "Luo", "Fu", "Mi", "Fa", "Gu", "Zhu", "Ju", "Mao", "Gu", "Min", "Gang", "Ba", "Gua", "Ti", "Juan", "Fu", "Lin", "Yan", "Zhao", "Zui", "Gua", "Zhuo", "Yu", "Zhi", "An", "Fa", "Nan", "Shu", "Si", "Pi", "Ma", "Liu", "Ba", "Fa", "Li", "Chao", "Wei", "Bi", "Ji", "Zeng", "Tong", "Liu", "Ji", "Juan", "Mi", "Zhao", "Luo", "Pi", "Ji", "Ji", "Luan", "Yang", "Mie", "Qiang", "Ta", "Mei", "Yang", "You", "You", "Fen", "Ba", "Gao", "Yang", "Gu", "Qiang", "Zang", "Gao", "Ling", "Yi", "Zhu", "Di", "Xiu", "Qian", "Yi", "Xian", "Rong", "Qun", "Qun", "Qian", "Huan", "Zui", "Xian", "Yi", "Yashinau", "Qiang", "Xian", "Yu", "Geng", "Jie", "Tang", "Yuan", "Xi", "Fan", "Shan", "Fen", "Shan", "Lian", "Lei", "Geng", "Nou", "Qiang", "Chan", "Yu", "Gong", "Yi", "Chong", "Weng", "Fen", "Hong", "Chi", "Chi", "Cui", "Fu", "Xia", "Pen", "Yi", "La", "Yi", "Pi", "Ling", "Liu", "Zhi", "Qu", "Xi", "Xie", "Xiang", "Xi", "Xi", "Qi", "Qiao", "Hui", "Hui", "Xiao", "Se", "Hong", "Jiang", "Di", "Cui", "Fei", "Tao", "Sha", "Chi", "Zhu", "Jian", "Xuan", "Shi", "Pian", "Zong", "Wan", "Hui", "Hou", "He", "He", "Han", "Ao", "Piao", "Yi", "Lian", "Qu", , "Lin", "Pen", "Qiao", "Ao", "Fan", "Yi", "Hui", "Xuan", "Dao"], ["Yao", "Lao", , "Kao", "Mao", "Zhe", "Qi", "Gou", "Gou", "Gou", "Die", "Die", "Er", "Shua", "Ruan", "Er", "Nai", "Zhuan", "Lei", "Ting", "Zi", "Geng", "Chao", "Hao", "Yun", "Pa", "Pi", "Chi", "Si", "Chu", "Jia", "Ju", "He", "Chu", "Lao", "Lun", "Ji", "Tang", "Ou", "Lou", "Nou", "Gou", "Pang", "Ze", "Lou", "Ji", "Lao", "Huo", "You", "Mo", "Huai", "Er", "Zhe", "Ting", "Ye", "Da", "Song", "Qin", "Yun", "Chi", "Dan", "Dan", "Hong", "Geng", "Zhi", , "Nie", "Dan", "Zhen", "Che", "Ling", "Zheng", "You", "Wa", "Liao", "Long", "Zhi", "Ning", "Tiao", "Er", "Ya", "Die", "Gua", , "Lian", "Hao", "Sheng", "Lie", "Pin", "Jing", "Ju", "Bi", "Di", "Guo", "Wen", "Xu", "Ping", "Cong", "Shikato", , "Ting", "Yu", "Cong", "Kui", "Tsuraneru", "Kui", "Cong", "Lian", "Weng", "Kui", "Lian", "Lian", "Cong", "Ao", "Sheng", "Song", "Ting", "Kui", "Nie", "Zhi", "Dan", "Ning", "Qie", "Ji", "Ting", "Ting", "Long", "Yu", "Yu", "Zhao", "Si", "Su", "Yi", "Su", "Si", "Zhao", "Zhao", "Rou", "Yi", "Le", "Ji", "Qiu", "Ken", "Cao", "Ge", "Di", "Huan", "Huang", "Yi", "Ren", "Xiao", "Ru", "Zhou", "Yuan", "Du", "Gang", "Rong", "Gan", "Cha", "Wo", "Chang", "Gu", "Zhi", "Han", "Fu", "Fei", "Fen", "Pei", "Pang", "Jian", "Fang", "Zhun", "You", "Na", "Hang", "Ken", "Ran", "Gong", "Yu", "Wen", "Yao", "Jin", "Pi", "Qian", "Xi", "Xi", "Fei", "Ken", "Jing", "Tai", "Shen", "Zhong", "Zhang", "Xie", "Shen", "Wei", "Zhou", "Die", "Dan", "Fei", "Ba", "Bo", "Qu", "Tian", "Bei", "Gua", "Tai", "Zi", "Ku", "Zhi", "Ni", "Ping", "Zi", "Fu", "Pang", "Zhen", "Xian", "Zuo", "Pei", "Jia", "Sheng", "Zhi", "Bao", "Mu", "Qu", "Hu", "Ke", "Yi", "Yin", "Xu", "Yang", "Long", "Dong", "Ka", "Lu", "Jing", "Nu", "Yan", "Pang", "Kua", "Yi", "Guang", "Gai", "Ge", "Dong", "Zhi", "Xiao", "Xiong", "Xiong", "Er", "E", "Xing", "Pian", "Neng", "Zi", "Gui"], ["Cheng", "Tiao", "Zhi", "Cui", "Mei", "Xie", "Cui", "Xie", "Mo", "Mai", "Ji", "Obiyaakasu", , "Kuai", "Sa", "Zang", "Qi", "Nao", "Mi", "Nong", "Luan", "Wan", "Bo", "Wen", "Guan", "Qiu", "Jiao", "Jing", "Rou", "Heng", "Cuo", "Lie", "Shan", "Ting", "Mei", "Chun", "Shen", "Xie", "De", "Zui", "Cu", "Xiu", "Xin", "Tuo", "Pao", "Cheng", "Nei", "Fu", "Dou", "Tuo", "Niao", "Noy", "Pi", "Gu", "Gua", "Li", "Lian", "Zhang", "Cui", "Jie", "Liang", "Zhou", "Pi", "Biao", "Lun", "Pian", "Guo", "Kui", "Chui", "Dan", "Tian", "Nei", "Jing", "Jie", "La", "Yi", "An", "Ren", "Shen", "Chuo", "Fu", "Fu", "Ju", "Fei", "Qiang", "Wan", "Dong", "Pi", "Guo", "Zong", "Ding", "Wu", "Mei", "Ruan", "Zhuan", "Zhi", "Cou", "Gua", "Ou", "Di", "An", "Xing", "Nao", "Yu", "Chuan", "Nan", "Yun", "Zhong", "Rou", "E", "Sai", "Tu", "Yao", "Jian", "Wei", "Jiao", "Yu", "Jia", "Duan", "Bi", "Chang", "Fu", "Xian", "Ni", "Mian", "Wa", "Teng", "Tui", "Bang", "Qian", "Lu", "Wa", "Sou", "Tang", "Su", "Zhui", "Ge", "Yi", "Bo", "Liao", "Ji", "Pi", "Xie", "Gao", "Lu", "Bin", "Ou", "Chang", "Lu", "Guo", "Pang", "Chuai", "Piao", "Jiang", "Fu", "Tang", "Mo", "Xi", "Zhuan", "Lu", "Jiao", "Ying", "Lu", "Zhi", "Tara", "Chun", "Lian", "Tong", "Peng", "Ni", "Zha", "Liao", "Cui", "Gui", "Xiao", "Teng", "Fan", "Zhi", "Jiao", "Shan", "Wu", "Cui", "Run", "Xiang", "Sui", "Fen", "Ying", "Tan", "Zhua", "Dan", "Kuai", "Nong", "Tun", "Lian", "Bi", "Yong", "Jue", "Chu", "Yi", "Juan", "La", "Lian", "Sao", "Tun", "Gu", "Qi", "Cui", "Bin", "Xun", "Ru", "Huo", "Zang", "Xian", "Biao", "Xing", "Kuan", "La", "Yan", "Lu", "Huo", "Zang", "Luo", "Qu", "Zang", "Luan", "Ni", "Zang", "Chen", "Qian", "Wo", "Guang", "Zang", "Lin", "Guang", "Zi", "Jiao", "Nie", "Chou", "Ji", "Gao", "Chou", "Mian", "Nie", "Zhi", "Zhi", "Ge", "Jian", "Die", "Zhi", "Xiu", "Tai", "Zhen", "Jiu", "Xian", "Yu", "Cha"], ["Yao", "Yu", "Chong", "Xi", "Xi", "Jiu", "Yu", "Yu", "Xing", "Ju", "Jiu", "Xin", "She", "She", "Yadoru", "Jiu", "Shi", "Tan", "Shu", "Shi", "Tian", "Dan", "Pu", "Pu", "Guan", "Hua", "Tan", "Chuan", "Shun", "Xia", "Wu", "Zhou", "Dao", "Gang", "Shan", "Yi", , "Pa", "Tai", "Fan", "Ban", "Chuan", "Hang", "Fang", "Ban", "Que", "Hesaki", "Zhong", "Jian", "Cang", "Ling", "Zhu", "Ze", "Duo", "Bo", "Xian", "Ge", "Chuan", "Jia", "Lu", "Hong", "Pang", "Xi", , "Fu", "Zao", "Feng", "Li", "Shao", "Yu", "Lang", "Ting", , "Wei", "Bo", "Meng", "Nian", "Ju", "Huang", "Shou", "Zong", "Bian", "Mao", "Die", , "Bang", "Cha", "Yi", "Sao", "Cang", "Cao", "Lou", "Dai", "Sori", "Yao", "Tong", "Yofune", "Dang", "Tan", "Lu", "Yi", "Jie", "Jian", "Huo", "Meng", "Qi", "Lu", "Lu", "Chan", "Shuang", "Gen", "Liang", "Jian", "Jian", "Se", "Yan", "Fu", "Ping", "Yan", "Yan", "Cao", "Cao", "Yi", "Le", "Ting", "Qiu", "Ai", "Nai", "Tiao", "Jiao", "Jie", "Peng", "Wan", "Yi", "Chai", "Mian", "Mie", "Gan", "Qian", "Yu", "Yu", "Shuo", "Qiong", "Tu", "Xia", "Qi", "Mang", "Zi", "Hui", "Sui", "Zhi", "Xiang", "Bi", "Fu", "Tun", "Wei", "Wu", "Zhi", "Qi", "Shan", "Wen", "Qian", "Ren", "Fou", "Kou", "Jie", "Lu", "Xu", "Ji", "Qin", "Qi", "Yuan", "Fen", "Ba", "Rui", "Xin", "Ji", "Hua", "Hua", "Fang", "Wu", "Jue", "Gou", "Zhi", "Yun", "Qin", "Ao", "Chu", "Mao", "Ya", "Fei", "Reng", "Hang", "Cong", "Yin", "You", "Bian", "Yi", "Susa", "Wei", "Li", "Pi", "E", "Xian", "Chang", "Cang", "Meng", "Su", "Yi", "Yuan", "Ran", "Ling", "Tai", "Tiao", "Di", "Miao", "Qiong", "Li", "Yong", "Ke", "Mu", "Pei", "Bao", "Gou", "Min", "Yi", "Yi", "Ju", "Pi", "Ruo", "Ku", "Zhu", "Ni", "Bo", "Bing", "Shan", "Qiu", "Yao", "Xian", "Ben", "Hong", "Ying", "Zha", "Dong", "Ju", "Die", "Nie", "Gan", "Hu", "Ping", "Mei", "Fu", "Sheng", "Gu", "Bi", "Wei"], ["Fu", "Zhuo", "Mao", "Fan", "Qie", "Mao", "Mao", "Ba", "Zi", "Mo", "Zi", "Di", "Chi", "Ji", "Jing", "Long", , "Niao", , "Xue", "Ying", "Qiong", "Ge", "Ming", "Li", "Rong", "Yin", "Gen", "Qian", "Chai", "Chen", "Yu", "Xiu", "Zi", "Lie", "Wu", "Ji", "Kui", "Ce", "Chong", "Ci", "Gou", "Guang", "Mang", "Chi", "Jiao", "Jiao", "Fu", "Yu", "Zhu", "Zi", "Jiang", "Hui", "Yin", "Cha", "Fa", "Rong", "Ru", "Chong", "Mang", "Tong", "Zhong", , "Zhu", "Xun", "Huan", "Kua", "Quan", "Gai", "Da", "Jing", "Xing", "Quan", "Cao", "Jing", "Er", "An", "Shou", "Chi", "Ren", "Jian", "Ti", "Huang", "Ping", "Li", "Jin", "Lao", "Shu", "Zhuang", "Da", "Jia", "Rao", "Bi", "Ze", "Qiao", "Hui", "Qi", "Dang", , "Rong", "Hun", "Ying", "Luo", "Ying", "Xun", "Jin", "Sun", "Yin", "Mai", "Hong", "Zhou", "Yao", "Du", "Wei", "Chu", "Dou", "Fu", "Ren", "Yin", "He", "Bi", "Bu", "Yun", "Di", "Tu", "Sui", "Sui", "Cheng", "Chen", "Wu", "Bie", "Xi", "Geng", "Li", "Fu", "Zhu", "Mo", "Li", "Zhuang", "Ji", "Duo", "Qiu", "Sha", "Suo", "Chen", "Feng", "Ju", "Mei", "Meng", "Xing", "Jing", "Che", "Xin", "Jun", "Yan", "Ting", "Diao", "Cuo", "Wan", "Han", "You", "Cuo", "Jia", "Wang", "You", "Niu", "Shao", "Xian", "Lang", "Fu", "E", "Mo", "Wen", "Jie", "Nan", "Mu", "Kan", "Lai", "Lian", "Shi", "Wo", "Usagi", "Lian", "Huo", "You", "Ying", "Ying", "Nuc", "Chun", "Mang", "Mang", "Ci", "Wan", "Jing", "Di", "Qu", "Dong", "Jian", "Zou", "Gu", "La", "Lu", "Ju", "Wei", "Jun", "Nie", "Kun", "He", "Pu", "Zi", "Gao", "Guo", "Fu", "Lun", "Chang", "Chou", "Song", "Chui", "Zhan", "Men", "Cai", "Ba", "Li", "Tu", "Bo", "Han", "Bao", "Qin", "Juan", "Xi", "Qin", "Di", "Jie", "Pu", "Dang", "Jin", "Zhao", "Tai", "Geng", "Hua", "Gu", "Ling", "Fei", "Jin", "An", "Wang", "Beng", "Zhou", "Yan", "Ju", "Jian", "Lin", "Tan", "Shu", "Tian", "Dao"], ["Hu", "Qi", "He", "Cui", "Tao", "Chun", "Bei", "Chang", "Huan", "Fei", "Lai", "Qi", "Meng", "Ping", "Wei", "Dan", "Sha", "Huan", "Yan", "Yi", "Tiao", "Qi", "Wan", "Ce", "Nai", "Kutabireru", "Tuo", "Jiu", "Tie", "Luo", , , "Meng", , "Yaji", , "Ying", "Ying", "Ying", "Xiao", "Sa", "Qiu", "Ke", "Xiang", "Wan", "Yu", "Yu", "Fu", "Lian", "Xuan", "Yuan", "Nan", "Ze", "Wo", "Chun", "Xiao", "Yu", "Pian", "Mao", "An", "E", "Luo", "Ying", "Huo", "Gua", "Jiang", "Mian", "Zuo", "Zuo", "Ju", "Bao", "Rou", "Xi", "Xie", "An", "Qu", "Jian", "Fu", "Lu", "Jing", "Pen", "Feng", "Hong", "Hong", "Hou", "Yan", "Tu", "Zhu", "Zi", "Xiang", "Shen", "Ge", "Jie", "Jing", "Mi", "Huang", "Shen", "Pu", "Gai", "Dong", "Zhou", "Qian", "Wei", "Bo", "Wei", "Pa", "Ji", "Hu", "Zang", "Jia", "Duan", "Yao", "Jun", "Cong", "Quan", "Wei", "Xian", "Kui", "Ting", "Hun", "Xi", "Shi", "Qi", "Lan", "Zong", "Yao", "Yuan", "Mei", "Yun", "Shu", "Di", "Zhuan", "Guan", "Sukumo", "Xue", "Chan", "Kai", "Kui", , "Jiang", "Lou", "Wei", "Pai", , "Sou", "Yin", "Shi", "Chun", "Shi", "Yun", "Zhen", "Lang", "Nu", "Meng", "He", "Que", "Suan", "Yuan", "Li", "Ju", "Xi", "Pang", "Chu", "Xu", "Tu", "Liu", "Wo", "Zhen", "Qian", "Zu", "Po", "Cuo", "Yuan", "Chu", "Yu", "Kuai", "Pan", "Pu", "Pu", "Na", "Shuo", "Xi", "Fen", "Yun", "Zheng", "Jian", "Ji", "Ruo", "Cang", "En", "Mi", "Hao", "Sun", "Zhen", "Ming", "Sou", "Xu", "Liu", "Xi", "Gu", "Lang", "Rong", "Weng", "Gai", "Cuo", "Shi", "Tang", "Luo", "Ru", "Suo", "Xian", "Bei", "Yao", "Gui", "Bi", "Zong", "Gun", "Za", "Xiu", "Ce", "Hai", "Lan", , "Ji", "Li", "Can", "Lang", "Yu", , "Ying", "Mo", "Diao", "Tiao", "Mao", "Tong", "Zhu", "Peng", "An", "Lian", "Cong", "Xi", "Ping", "Qiu", "Jin", "Chun", "Jie", "Wei", "Tui", "Cao", "Yu", "Yi", "Ji", "Liao", "Bi", "Lu", "Su"], ["Bu", "Zhang", "Luo", "Jiang", "Man", "Yan", "Ling", "Ji", "Piao", "Gun", "Han", "Di", "Su", "Lu", "She", "Shang", "Di", "Mie", "Xun", "Man", "Bo", "Di", "Cuo", "Zhe", "Sen", "Xuan", "Wei", "Hu", "Ao", "Mi", "Lou", "Cu", "Zhong", "Cai", "Po", "Jiang", "Mi", "Cong", "Niao", "Hui", "Jun", "Yin", "Jian", "Yan", "Shu", "Yin", "Kui", "Chen", "Hu", "Sha", "Kou", "Qian", "Ma", "Zang", "Sonoko", "Qiang", "Dou", "Lian", "Lin", "Kou", "Ai", "Bi", "Li", "Wei", "Ji", "Xun", "Sheng", "Fan", "Meng", "Ou", "Chan", "Dian", "Xun", "Jiao", "Rui", "Rui", "Lei", "Yu", "Qiao", "Chu", "Hua", "Jian", "Mai", "Yun", "Bao", "You", "Qu", "Lu", "Rao", "Hui", "E", "Teng", "Fei", "Jue", "Zui", "Fa", "Ru", "Fen", "Kui", "Shun", "Rui", "Ya", "Xu", "Fu", "Jue", "Dang", "Wu", "Tong", "Si", "Xiao", "Xi", "Long", "Yun", , "Qi", "Jian", "Yun", "Sun", "Ling", "Yu", "Xia", "Yong", "Ji", "Hong", "Si", "Nong", "Lei", "Xuan", "Yun", "Yu", "Xi", "Hao", "Bo", "Hao", "Ai", "Wei", "Hui", "Wei", "Ji", "Ci", "Xiang", "Luan", "Mie", "Yi", "Leng", "Jiang", "Can", "Shen", "Qiang", "Lian", "Ke", "Yuan", "Da", "Ti", "Tang", "Xie", "Bi", "Zhan", "Sun", "Lian", "Fan", "Ding", "Jie", "Gu", "Xie", "Shu", "Jian", "Kao", "Hong", "Sa", "Xin", "Xun", "Yao", "Hie", "Sou", "Shu", "Xun", "Dui", "Pin", "Wei", "Neng", "Chou", "Mai", "Ru", "Piao", "Tai", "Qi", "Zao", "Chen", "Zhen", "Er", "Ni", "Ying", "Gao", "Cong", "Xiao", "Qi", "Fa", "Jian", "Xu", "Kui", "Jie", "Bian", "Diao", "Mi", "Lan", "Jin", "Cang", "Miao", "Qiong", "Qie", "Xian", , "Ou", "Xian", "Su", "Lu", "Yi", "Xu", "Xie", "Li", "Yi", "La", "Lei", "Xiao", "Di", "Zhi", "Bei", "Teng", "Yao", "Mo", "Huan", "Piao", "Fan", "Sou", "Tan", "Tui", "Qiong", "Qiao", "Wei", "Liu", "Hui", , "Gao", "Yun", , "Li", "Shu", "Chu", "Ai", "Lin", "Zao", "Xuan", "Chen", "Lai", "Huo"], ["Tuo", "Wu", "Rui", "Rui", "Qi", "Heng", "Lu", "Su", "Tui", "Mang", "Yun", "Pin", "Yu", "Xun", "Ji", "Jiong", "Xian", "Mo", "Hagi", "Su", "Jiong", , "Nie", "Bo", "Rang", "Yi", "Xian", "Yu", "Ju", "Lian", "Lian", "Yin", "Qiang", "Ying", "Long", "Tong", "Wei", "Yue", "Ling", "Qu", "Yao", "Fan", "Mi", "Lan", "Kui", "Lan", "Ji", "Dang", "Katsura", "Lei", "Lei", "Hua", "Feng", "Zhi", "Wei", "Kui", "Zhan", "Huai", "Li", "Ji", "Mi", "Lei", "Huai", "Luo", "Ji", "Kui", "Lu", "Jian", "San", , "Lei", "Quan", "Xiao", "Yi", "Luan", "Men", "Bie", "Hu", "Hu", "Lu", "Nue", "Lu", "Si", "Xiao", "Qian", "Chu", "Hu", "Xu", "Cuo", "Fu", "Xu", "Xu", "Lu", "Hu", "Yu", "Hao", "Jiao", "Ju", "Guo", "Bao", "Yan", "Zhan", "Zhan", "Kui", "Ban", "Xi", "Shu", "Chong", "Qiu", "Diao", "Ji", "Qiu", "Cheng", "Shi", , "Di", "Zhe", "She", "Yu", "Gan", "Zi", "Hong", "Hui", "Meng", "Ge", "Sui", "Xia", "Chai", "Shi", "Yi", "Ma", "Xiang", "Fang", "E", "Pa", "Chi", "Qian", "Wen", "Wen", "Rui", "Bang", "Bi", "Yue", "Yue", "Jun", "Qi", "Ran", "Yin", "Qi", "Tian", "Yuan", "Jue", "Hui", "Qin", "Qi", "Zhong", "Ya", "Ci", "Mu", "Wang", "Fen", "Fen", "Hang", "Gong", "Zao", "Fu", "Ran", "Jie", "Fu", "Chi", "Dou", "Piao", "Xian", "Ni", "Te", "Qiu", "You", "Zha", "Ping", "Chi", "You", "He", "Han", "Ju", "Li", "Fu", "Ran", "Zha", "Gou", "Pi", "Bo", "Xian", "Zhu", "Diao", "Bie", "Bing", "Gu", "Ran", "Qu", "She", "Tie", "Ling", "Gu", "Dan", "Gu", "Ying", "Li", "Cheng", "Qu", "Mou", "Ge", "Ci", "Hui", "Hui", "Mang", "Fu", "Yang", "Wa", "Lie", "Zhu", "Yi", "Xian", "Kuo", "Jiao", "Li", "Yi", "Ping", "Ji", "Ha", "She", "Yi", "Wang", "Mo", "Qiong", "Qie", "Gui", "Gong", "Zhi", "Man", "Ebi", "Zhi", "Jia", "Rao", "Si", "Qi", "Xing", "Lie", "Qiu", "Shao", "Yong", "Jia", "Shui", "Che", "Bai", "E", "Han"], ["Shu", "Xuan", "Feng", "Shen", "Zhen", "Fu", "Xian", "Zhe", "Wu", "Fu", "Li", "Lang", "Bi", "Chu", "Yuan", "You", "Jie", "Dan", "Yan", "Ting", "Dian", "Shui", "Hui", "Gua", "Zhi", "Song", "Fei", "Ju", "Mi", "Qi", "Qi", "Yu", "Jun", "Zha", "Meng", "Qiang", "Si", "Xi", "Lun", "Li", "Die", "Tiao", "Tao", "Kun", "Gan", "Han", "Yu", "Bang", "Fei", "Pi", "Wei", "Dun", "Yi", "Yuan", "Su", "Quan", "Qian", "Rui", "Ni", "Qing", "Wei", "Liang", "Guo", "Wan", "Dong", "E", "Ban", "Di", "Wang", "Can", "Yang", "Ying", "Guo", "Chan", , "La", "Ke", "Ji", "He", "Ting", "Mai", "Xu", "Mian", "Yu", "Jie", "Shi", "Xuan", "Huang", "Yan", "Bian", "Rou", "Wei", "Fu", "Yuan", "Mei", "Wei", "Fu", "Ruan", "Xie", "You", "Qiu", "Mao", "Xia", "Ying", "Shi", "Chong", "Tang", "Zhu", "Zong", "Ti", "Fu", "Yuan", "Hui", "Meng", "La", "Du", "Hu", "Qiu", "Die", "Li", "Gua", "Yun", "Ju", "Nan", "Lou", "Qun", "Rong", "Ying", "Jiang", , "Lang", "Pang", "Si", "Xi", "Ci", "Xi", "Yuan", "Weng", "Lian", "Sou", "Ban", "Rong", "Rong", "Ji", "Wu", "Qiu", "Han", "Qin", "Yi", "Bi", "Hua", "Tang", "Yi", "Du", "Nai", "He", "Hu", "Hui", "Ma", "Ming", "Yi", "Wen", "Ying", "Teng", "Yu", "Cang", "So", "Ebi", "Man", , "Shang", "Zhe", "Cao", "Chi", "Di", "Ao", "Lu", "Wei", "Zhi", "Tang", "Chen", "Piao", "Qu", "Pi", "Yu", "Jian", "Luo", "Lou", "Qin", "Zhong", "Yin", "Jiang", "Shuai", "Wen", "Jiao", "Wan", "Zhi", "Zhe", "Ma", "Ma", "Guo", "Liu", "Mao", "Xi", "Cong", "Li", "Man", "Xiao", "Kamakiri", "Zhang", "Mang", "Xiang", "Mo", "Zui", "Si", "Qiu", "Te", "Zhi", "Peng", "Peng", "Jiao", "Qu", "Bie", "Liao", "Pan", "Gui", "Xi", "Ji", "Zhuan", "Huang", "Fei", "Lao", "Jue", "Jue", "Hui", "Yin", "Chan", "Jiao", "Shan", "Rao", "Xiao", "Mou", "Chong", "Xun", "Si", , "Cheng", "Dang", "Li", "Xie", "Shan", "Yi", "Jing", "Da", "Chan", "Qi"], ["Ci", "Xiang", "She", "Luo", "Qin", "Ying", "Chai", "Li", "Ze", "Xuan", "Lian", "Zhu", "Ze", "Xie", "Mang", "Xie", "Qi", "Rong", "Jian", "Meng", "Hao", "Ruan", "Huo", "Zhuo", "Jie", "Bin", "He", "Mie", "Fan", "Lei", "Jie", "La", "Mi", "Li", "Chun", "Li", "Qiu", "Nie", "Lu", "Du", "Xiao", "Zhu", "Long", "Li", "Long", "Feng", "Ye", "Beng", "Shang", "Gu", "Juan", "Ying", , "Xi", "Can", "Qu", "Quan", "Du", "Can", "Man", "Jue", "Jie", "Zhu", "Zha", "Xie", "Huang", "Niu", "Pei", "Nu", "Xin", "Zhong", "Mo", "Er", "Ke", "Mie", "Xi", "Xing", "Yan", "Kan", "Yuan", , "Ling", "Xuan", "Shu", "Xian", "Tong", "Long", "Jie", "Xian", "Ya", "Hu", "Wei", "Dao", "Chong", "Wei", "Dao", "Zhun", "Heng", "Qu", "Yi", "Yi", "Bu", "Gan", "Yu", "Biao", "Cha", "Yi", "Shan", "Chen", "Fu", "Gun", "Fen", "Shuai", "Jie", "Na", "Zhong", "Dan", "Ri", "Zhong", "Zhong", "Xie", "Qi", "Xie", "Ran", "Zhi", "Ren", "Qin", "Jin", "Jun", "Yuan", "Mei", "Chai", "Ao", "Niao", "Hui", "Ran", "Jia", "Tuo", "Ling", "Dai", "Bao", "Pao", "Yao", "Zuo", "Bi", "Shao", "Tan", "Ju", "He", "Shu", "Xiu", "Zhen", "Yi", "Pa", "Bo", "Di", "Wa", "Fu", "Gun", "Zhi", "Zhi", "Ran", "Pan", "Yi", "Mao", "Tuo", "Na", "Kou", "Xian", "Chan", "Qu", "Bei", "Gun", "Xi", "Ne", "Bo", "Horo", "Fu", "Yi", "Chi", "Ku", "Ren", "Jiang", "Jia", "Cun", "Mo", "Jie", "Er", "Luo", "Ru", "Zhu", "Gui", "Yin", "Cai", "Lie", "Kamishimo", "Yuki", "Zhuang", "Dang", , "Kun", "Ken", "Niao", "Shu", "Jia", "Kun", "Cheng", "Li", "Juan", "Shen", "Pou", "Ge", "Yi", "Yu", "Zhen", "Liu", "Qiu", "Qun", "Ji", "Yi", "Bu", "Zhuang", "Shui", "Sha", "Qun", "Li", "Lian", "Lian", "Ku", "Jian", "Fou", "Chan", "Bi", "Gun", "Tao", "Yuan", "Ling", "Chi", "Chang", "Chou", "Duo", "Biao", "Liang", "Chang", "Pei", "Pei", "Fei", "Yuan", "Luo", "Guo", "Yan", "Du", "Xi", "Zhi", "Ju", "Qi"], ["Ji", "Zhi", "Gua", "Ken", "Che", "Ti", "Ti", "Fu", "Chong", "Xie", "Bian", "Die", "Kun", "Duan", "Xiu", "Xiu", "He", "Yuan", "Bao", "Bao", "Fu", "Yu", "Tuan", "Yan", "Hui", "Bei", "Chu", "Lu", "Ena", "Hitoe", "Yun", "Da", "Gou", "Da", "Huai", "Rong", "Yuan", "Ru", "Nai", "Jiong", "Suo", "Ban", "Tun", "Chi", "Sang", "Niao", "Ying", "Jie", "Qian", "Huai", "Ku", "Lian", "Bao", "Li", "Zhe", "Shi", "Lu", "Yi", "Die", "Xie", "Xian", "Wei", "Biao", "Cao", "Ji", "Jiang", "Sen", "Bao", "Xiang", "Chihaya", "Pu", "Jian", "Zhuan", "Jian", "Zui", "Ji", "Dan", "Za", "Fan", "Bo", "Xiang", "Xin", "Bie", "Rao", "Man", "Lan", "Ao", "Duo", "Gui", "Cao", "Sui", "Nong", "Chan", "Lian", "Bi", "Jin", "Dang", "Shu", "Tan", "Bi", "Lan", "Pu", "Ru", "Zhi", , "Shu", "Wa", "Shi", "Bai", "Xie", "Bo", "Chen", "Lai", "Long", "Xi", "Xian", "Lan", "Zhe", "Dai", "Tasuki", "Zan", "Shi", "Jian", "Pan", "Yi", "Ran", "Ya", "Xi", "Xi", "Yao", "Feng", "Tan", , "Biao", "Fu", "Ba", "He", "Ji", "Ji", "Jian", "Guan", "Bian", "Yan", "Gui", "Jue", "Pian", "Mao", "Mi", "Mi", "Mie", "Shi", "Si", "Zhan", "Luo", "Jue", "Mi", "Tiao", "Lian", "Yao", "Zhi", "Jun", "Xi", "Shan", "Wei", "Xi", "Tian", "Yu", "Lan", "E", "Du", "Qin", "Pang", "Ji", "Ming", "Ying", "Gou", "Qu", "Zhan", "Jin", "Guan", "Deng", "Jian", "Luo", "Qu", "Jian", "Wei", "Jue", "Qu", "Luo", "Lan", "Shen", "Di", "Guan", "Jian", "Guan", "Yan", "Gui", "Mi", "Shi", "Zhan", "Lan", "Jue", "Ji", "Xi", "Di", "Tian", "Yu", "Gou", "Jin", "Qu", "Jiao", "Jiu", "Jin", "Cu", "Jue", "Zhi", "Chao", "Ji", "Gu", "Dan", "Zui", "Di", "Shang", "Hua", "Quan", "Ge", "Chi", "Jie", "Gui", "Gong", "Chu", "Jie", "Hun", "Qiu", "Xing", "Su", "Ni", "Ji", "Lu", "Zhi", "Zha", "Bi", "Xing", "Hu", "Shang", "Gong", "Zhi", "Xue", "Chu", "Xi", "Yi", "Lu", "Jue", "Xi", "Yan", "Xi"], ["Yan", "Yan", "Ding", "Fu", "Qiu", "Qiu", "Jiao", "Hong", "Ji", "Fan", "Xun", "Diao", "Hong", "Cha", "Tao", "Xu", "Jie", "Yi", "Ren", "Xun", "Yin", "Shan", "Qi", "Tuo", "Ji", "Xun", "Yin", "E", "Fen", "Ya", "Yao", "Song", "Shen", "Yin", "Xin", "Jue", "Xiao", "Ne", "Chen", "You", "Zhi", "Xiong", "Fang", "Xin", "Chao", "She", "Xian", "Sha", "Tun", "Xu", "Yi", "Yi", "Su", "Chi", "He", "Shen", "He", "Xu", "Zhen", "Zhu", "Zheng", "Gou", "Zi", "Zi", "Zhan", "Gu", "Fu", "Quan", "Die", "Ling", "Di", "Yang", "Li", "Nao", "Pan", "Zhou", "Gan", "Yi", "Ju", "Ao", "Zha", "Tuo", "Yi", "Qu", "Zhao", "Ping", "Bi", "Xiong", "Qu", "Ba", "Da", "Zu", "Tao", "Zhu", "Ci", "Zhe", "Yong", "Xu", "Xun", "Yi", "Huang", "He", "Shi", "Cha", "Jiao", "Shi", "Hen", "Cha", "Gou", "Gui", "Quan", "Hui", "Jie", "Hua", "Gai", "Xiang", "Wei", "Shen", "Chou", "Tong", "Mi", "Zhan", "Ming", "E", "Hui", "Yan", "Xiong", "Gua", "Er", "Beng", "Tiao", "Chi", "Lei", "Zhu", "Kuang", "Kua", "Wu", "Yu", "Teng", "Ji", "Zhi", "Ren", "Su", "Lang", "E", "Kuang", "E", "Shi", "Ting", "Dan", "Bo", "Chan", "You", "Heng", "Qiao", "Qin", "Shua", "An", "Yu", "Xiao", "Cheng", "Jie", "Xian", "Wu", "Wu", "Gao", "Song", "Pu", "Hui", "Jing", "Shuo", "Zhen", "Shuo", "Du", "Yasashi", "Chang", "Shui", "Jie", "Ke", "Qu", "Cong", "Xiao", "Sui", "Wang", "Xuan", "Fei", "Chi", "Ta", "Yi", "Na", "Yin", "Diao", "Pi", "Chuo", "Chan", "Chen", "Zhun", "Ji", "Qi", "Tan", "Zhui", "Wei", "Ju", "Qing", "Jian", "Zheng", "Ze", "Zou", "Qian", "Zhuo", "Liang", "Jian", "Zhu", "Hao", "Lun", "Shen", "Biao", "Huai", "Pian", "Yu", "Die", "Xu", "Pian", "Shi", "Xuan", "Shi", "Hun", "Hua", "E", "Zhong", "Di", "Xie", "Fu", "Pu", "Ting", "Jian", "Qi", "Yu", "Zi", "Chuan", "Xi", "Hui", "Yin", "An", "Xian", "Nan", "Chen", "Feng", "Zhu", "Yang", "Yan", "Heng", "Xuan", "Ge", "Nuo", "Qi"], ["Mou", "Ye", "Wei", , "Teng", "Zou", "Shan", "Jian", "Bo", "Ku", "Huang", "Huo", "Ge", "Ying", "Mi", "Xiao", "Mi", "Xi", "Qiang", "Chen", "Nue", "Ti", "Su", "Bang", "Chi", "Qian", "Shi", "Jiang", "Yuan", "Xie", "Xue", "Tao", "Yao", "Yao", , "Yu", "Biao", "Cong", "Qing", "Li", "Mo", "Mo", "Shang", "Zhe", "Miu", "Jian", "Ze", "Jie", "Lian", "Lou", "Can", "Ou", "Guan", "Xi", "Zhuo", "Ao", "Ao", "Jin", "Zhe", "Yi", "Hu", "Jiang", "Man", "Chao", "Han", "Hua", "Chan", "Xu", "Zeng", "Se", "Xi", "She", "Dui", "Zheng", "Nao", "Lan", "E", "Ying", "Jue", "Ji", "Zun", "Jiao", "Bo", "Hui", "Zhuan", "Mu", "Zen", "Zha", "Shi", "Qiao", "Tan", "Zen", "Pu", "Sheng", "Xuan", "Zao", "Tan", "Dang", "Sui", "Qian", "Ji", "Jiao", "Jing", "Lian", "Nou", "Yi", "Ai", "Zhan", "Pi", "Hui", "Hua", "Yi", "Yi", "Shan", "Rang", "Nou", "Qian", "Zhui", "Ta", "Hu", "Zhou", "Hao", "Ye", "Ying", "Jian", "Yu", "Jian", "Hui", "Du", "Zhe", "Xuan", "Zan", "Lei", "Shen", "Wei", "Chan", "Li", "Yi", "Bian", "Zhe", "Yan", "E", "Chou", "Wei", "Chou", "Yao", "Chan", "Rang", "Yin", "Lan", "Chen", "Huo", "Zhe", "Huan", "Zan", "Yi", "Dang", "Zhan", "Yan", "Du", "Yan", "Ji", "Ding", "Fu", "Ren", "Ji", "Jie", "Hong", "Tao", "Rang", "Shan", "Qi", "Tuo", "Xun", "Yi", "Xun", "Ji", "Ren", "Jiang", "Hui", "Ou", "Ju", "Ya", "Ne", "Xu", "E", "Lun", "Xiong", "Song", "Feng", "She", "Fang", "Jue", "Zheng", "Gu", "He", "Ping", "Zu", "Shi", "Xiong", "Zha", "Su", "Zhen", "Di", "Zou", "Ci", "Qu", "Zhao", "Bi", "Yi", "Yi", "Kuang", "Lei", "Shi", "Gua", "Shi", "Jie", "Hui", "Cheng", "Zhu", "Shen", "Hua", "Dan", "Gou", "Quan", "Gui", "Xun", "Yi", "Zheng", "Gai", "Xiang", "Cha", "Hun", "Xu", "Zhou", "Jie", "Wu", "Yu", "Qiao", "Wu", "Gao", "You", "Hui", "Kuang", "Shuo", "Song", "Ai", "Qing", "Zhu", "Zou", "Nuo", "Du", "Zhuo", "Fei", "Ke", "Wei"], ["Yu", "Shui", "Shen", "Diao", "Chan", "Liang", "Zhun", "Sui", "Tan", "Shen", "Yi", "Mou", "Chen", "Die", "Huang", "Jian", "Xie", "Nue", "Ye", "Wei", "E", "Yu", "Xuan", "Chan", "Zi", "An", "Yan", "Di", "Mi", "Pian", "Xu", "Mo", "Dang", "Su", "Xie", "Yao", "Bang", "Shi", "Qian", "Mi", "Jin", "Man", "Zhe", "Jian", "Miu", "Tan", "Zen", "Qiao", "Lan", "Pu", "Jue", "Yan", "Qian", "Zhan", "Chen", "Gu", "Qian", "Hong", "Xia", "Jue", "Hong", "Han", "Hong", "Xi", "Xi", "Huo", "Liao", "Han", "Du", "Long", "Dou", "Jiang", "Qi", "Shi", "Li", "Deng", "Wan", "Bi", "Shu", "Xian", "Feng", "Zhi", "Zhi", "Yan", "Yan", "Shi", "Chu", "Hui", "Tun", "Yi", "Tun", "Yi", "Jian", "Ba", "Hou", "E", "Cu", "Xiang", "Huan", "Jian", "Ken", "Gai", "Qu", "Fu", "Xi", "Bin", "Hao", "Yu", "Zhu", "Jia", , "Xi", "Bo", "Wen", "Huan", "Bin", "Di", "Zong", "Fen", "Yi", "Zhi", "Bao", "Chai", "Han", "Pi", "Na", "Pi", "Gou", "Na", "You", "Diao", "Mo", "Si", "Xiu", "Huan", "Kun", "He", "He", "Mo", "Han", "Mao", "Li", "Ni", "Bi", "Yu", "Jia", "Tuan", "Mao", "Pi", "Xi", "E", "Ju", "Mo", "Chu", "Tan", "Huan", "Jue", "Bei", "Zhen", "Yuan", "Fu", "Cai", "Gong", "Te", "Yi", "Hang", "Wan", "Pin", "Huo", "Fan", "Tan", "Guan", "Ze", "Zhi", "Er", "Zhu", "Shi", "Bi", "Zi", "Er", "Gui", "Pian", "Bian", "Mai", "Dai", "Sheng", "Kuang", "Fei", "Tie", "Yi", "Chi", "Mao", "He", "Bi", "Lu", "Ren", "Hui", "Gai", "Pian", "Zi", "Jia", "Xu", "Zei", "Jiao", "Gai", "Zang", "Jian", "Ying", "Xun", "Zhen", "She", "Bin", "Bin", "Qiu", "She", "Chuan", "Zang", "Zhou", "Lai", "Zan", "Si", "Chen", "Shang", "Tian", "Pei", "Geng", "Xian", "Mai", "Jian", "Sui", "Fu", "Tan", "Cong", "Cong", "Zhi", "Ji", "Zhang", "Du", "Jin", "Xiong", "Shun", "Yun", "Bao", "Zai", "Lai", "Feng", "Cang", "Ji", "Sheng", "Ai", "Zhuan", "Fu", "Gou", "Sai", "Ze", "Liao"], ["Wei", "Bai", "Chen", "Zhuan", "Zhi", "Zhui", "Biao", "Yun", "Zeng", "Tan", "Zan", "Yan", , "Shan", "Wan", "Ying", "Jin", "Gan", "Xian", "Zang", "Bi", "Du", "Shu", "Yan", , "Xuan", "Long", "Gan", "Zang", "Bei", "Zhen", "Fu", "Yuan", "Gong", "Cai", "Ze", "Xian", "Bai", "Zhang", "Huo", "Zhi", "Fan", "Tan", "Pin", "Bian", "Gou", "Zhu", "Guan", "Er", "Jian", "Bi", "Shi", "Tie", "Gui", "Kuang", "Dai", "Mao", "Fei", "He", "Yi", "Zei", "Zhi", "Jia", "Hui", "Zi", "Ren", "Lu", "Zang", "Zi", "Gai", "Jin", "Qiu", "Zhen", "Lai", "She", "Fu", "Du", "Ji", "Shu", "Shang", "Si", "Bi", "Zhou", "Geng", "Pei", "Tan", "Lai", "Feng", "Zhui", "Fu", "Zhuan", "Sai", "Ze", "Yan", "Zan", "Yun", "Zeng", "Shan", "Ying", "Gan", "Chi", "Xi", "She", "Nan", "Xiong", "Xi", "Cheng", "He", "Cheng", "Zhe", "Xia", "Tang", "Zou", "Zou", "Li", "Jiu", "Fu", "Zhao", "Gan", "Qi", "Shan", "Qiong", "Qin", "Xian", "Ci", "Jue", "Qin", "Chi", "Ci", "Chen", "Chen", "Die", "Ju", "Chao", "Di", "Se", "Zhan", "Zhu", "Yue", "Qu", "Jie", "Chi", "Chu", "Gua", "Xue", "Ci", "Tiao", "Duo", "Lie", "Gan", "Suo", "Cu", "Xi", "Zhao", "Su", "Yin", "Ju", "Jian", "Que", "Tang", "Chuo", "Cui", "Lu", "Qu", "Dang", "Qiu", "Zi", "Ti", "Qu", "Chi", "Huang", "Qiao", "Qiao", "Yao", "Zao", "Ti", , "Zan", "Zan", "Zu", "Pa", "Bao", "Ku", "Ke", "Dun", "Jue", "Fu", "Chen", "Jian", "Fang", "Zhi", "Sa", "Yue", "Pa", "Qi", "Yue", "Qiang", "Tuo", "Tai", "Yi", "Nian", "Ling", "Mei", "Ba", "Die", "Ku", "Tuo", "Jia", "Ci", "Pao", "Qia", "Zhu", "Ju", "Die", "Zhi", "Fu", "Pan", "Ju", "Shan", "Bo", "Ni", "Ju", "Li", "Gen", "Yi", "Ji", "Dai", "Xian", "Jiao", "Duo", "Zhu", "Zhuan", "Kua", "Zhuai", "Gui", "Qiong", "Kui", "Xiang", "Chi", "Lu", "Beng", "Zhi", "Jia", "Tiao", "Cai", "Jian", "Ta", "Qiao", "Bi", "Xian", "Duo", "Ji", "Ju", "Ji", "Shu", "Tu"], ["Chu", "Jing", "Nie", "Xiao", "Bo", "Chi", "Qun", "Mou", "Shu", "Lang", "Yong", "Jiao", "Chou", "Qiao", , "Ta", "Jian", "Qi", "Wo", "Wei", "Zhuo", "Jie", "Ji", "Nie", "Ju", "Ju", "Lun", "Lu", "Leng", "Huai", "Ju", "Chi", "Wan", "Quan", "Ti", "Bo", "Zu", "Qie", "Ji", "Cu", "Zong", "Cai", "Zong", "Peng", "Zhi", "Zheng", "Dian", "Zhi", "Yu", "Duo", "Dun", "Chun", "Yong", "Zhong", "Di", "Zhe", "Chen", "Chuai", "Jian", "Gua", "Tang", "Ju", "Fu", "Zu", "Die", "Pian", "Rou", "Nuo", "Ti", "Cha", "Tui", "Jian", "Dao", "Cuo", "Xi", "Ta", "Qiang", "Zhan", "Dian", "Ti", "Ji", "Nie", "Man", "Liu", "Zhan", "Bi", "Chong", "Lu", "Liao", "Cu", "Tang", "Dai", "Suo", "Xi", "Kui", "Ji", "Zhi", "Qiang", "Di", "Man", "Zong", "Lian", "Beng", "Zao", "Nian", "Bie", "Tui", "Ju", "Deng", "Ceng", "Xian", "Fan", "Chu", "Zhong", "Dun", "Bo", "Cu", "Zu", "Jue", "Jue", "Lin", "Ta", "Qiao", "Qiao", "Pu", "Liao", "Dun", "Cuan", "Kuang", "Zao", "Ta", "Bi", "Bi", "Zhu", "Ju", "Chu", "Qiao", "Dun", "Chou", "Ji", "Wu", "Yue", "Nian", "Lin", "Lie", "Zhi", "Li", "Zhi", "Chan", "Chu", "Duan", "Wei", "Long", "Lin", "Xian", "Wei", "Zuan", "Lan", "Xie", "Rang", "Xie", "Nie", "Ta", "Qu", "Jie", "Cuan", "Zuan", "Xi", "Kui", "Jue", "Lin", "Shen", "Gong", "Dan", "Segare", "Qu", "Ti", "Duo", "Duo", "Gong", "Lang", "Nerau", "Luo", "Ai", "Ji", "Ju", "Tang", "Utsuke", , "Yan", "Shitsuke", "Kang", "Qu", "Lou", "Lao", "Tuo", "Zhi", "Yagate", "Ti", "Dao", "Yagate", "Yu", "Che", "Ya", "Gui", "Jun", "Wei", "Yue", "Xin", "Di", "Xuan", "Fan", "Ren", "Shan", "Qiang", "Shu", "Tun", "Chen", "Dai", "E", "Na", "Qi", "Mao", "Ruan", "Ren", "Fan", "Zhuan", "Hong", "Hu", "Qu", "Huang", "Di", "Ling", "Dai", "Ao", "Zhen", "Fan", "Kuang", "Ang", "Peng", "Bei", "Gu", "Ku", "Pao", "Zhu", "Rong", "E", "Ba", "Zhou", "Zhi", "Yao", "Ke", "Yi", "Qing", "Shi", "Ping"], ["Er", "Qiong", "Ju", "Jiao", "Guang", "Lu", "Kai", "Quan", "Zhou", "Zai", "Zhi", "She", "Liang", "Yu", "Shao", "You", "Huan", "Yun", "Zhe", "Wan", "Fu", "Qing", "Zhou", "Ni", "Ling", "Zhe", "Zhan", "Liang", "Zi", "Hui", "Wang", "Chuo", "Guo", "Kan", "Yi", "Peng", "Qian", "Gun", "Nian", "Pian", "Guan", "Bei", "Lun", "Pai", "Liang", "Ruan", "Rou", "Ji", "Yang", "Xian", "Chuan", "Cou", "Qun", "Ge", "You", "Hong", "Shu", "Fu", "Zi", "Fu", "Wen", "Ben", "Zhan", "Yu", "Wen", "Tao", "Gu", "Zhen", "Xia", "Yuan", "Lu", "Jiu", "Chao", "Zhuan", "Wei", "Hun", "Sori", "Che", "Jiao", "Zhan", "Pu", "Lao", "Fen", "Fan", "Lin", "Ge", "Se", "Kan", "Huan", "Yi", "Ji", "Dui", "Er", "Yu", "Xian", "Hong", "Lei", "Pei", "Li", "Li", "Lu", "Lin", "Che", "Ya", "Gui", "Xuan", "Di", "Ren", "Zhuan", "E", "Lun", "Ruan", "Hong", "Ku", "Ke", "Lu", "Zhou", "Zhi", "Yi", "Hu", "Zhen", "Li", "Yao", "Qing", "Shi", "Zai", "Zhi", "Jiao", "Zhou", "Quan", "Lu", "Jiao", "Zhe", "Fu", "Liang", "Nian", "Bei", "Hui", "Gun", "Wang", "Liang", "Chuo", "Zi", "Cou", "Fu", "Ji", "Wen", "Shu", "Pei", "Yuan", "Xia", "Zhan", "Lu", "Che", "Lin", "Xin", "Gu", "Ci", "Ci", "Pi", "Zui", "Bian", "La", "La", "Ci", "Xue", "Ban", "Bian", "Bian", "Bian", , "Bian", "Ban", "Ci", "Bian", "Bian", "Chen", "Ru", "Nong", "Nong", "Zhen", "Chuo", "Chuo", "Suberu", "Reng", "Bian", "Bian", "Sip", "Ip", "Liao", "Da", "Chan", "Gan", "Qian", "Yu", "Yu", "Qi", "Xun", "Yi", "Guo", "Mai", "Qi", "Za", "Wang", "Jia", "Zhun", "Ying", "Ti", "Yun", "Jin", "Hang", "Ya", "Fan", "Wu", "Da", "E", "Huan", "Zhe", "Totemo", "Jin", "Yuan", "Wei", "Lian", "Chi", "Che", "Ni", "Tiao", "Zhi", "Yi", "Jiong", "Jia", "Chen", "Dai", "Er", "Di", "Po", "Wang", "Die", "Ze", "Tao", "Shu", "Tuo", "Kep", "Jing", "Hui", "Tong", "You", "Mi", "Beng", "Ji", "Nai", "Yi", "Jie", "Zhui", "Lie", "Xun"], ["Tui", "Song", "Gua", "Tao", "Pang", "Hou", "Ni", "Dun", "Jiong", "Xuan", "Xun", "Bu", "You", "Xiao", "Qiu", "Tou", "Zhu", "Qiu", "Di", "Di", "Tu", "Jing", "Ti", "Dou", "Yi", "Zhe", "Tong", "Guang", "Wu", "Shi", "Cheng", "Su", "Zao", "Qun", "Feng", "Lian", "Suo", "Hui", "Li", "Sako", "Lai", "Ben", "Cuo", "Jue", "Beng", "Huan", "Dai", "Lu", "You", "Zhou", "Jin", "Yu", "Chuo", "Kui", "Wei", "Ti", "Yi", "Da", "Yuan", "Luo", "Bi", "Nuo", "Yu", "Dang", "Sui", "Dun", "Sui", "Yan", "Chuan", "Chi", "Ti", "Yu", "Shi", "Zhen", "You", "Yun", "E", "Bian", "Guo", "E", "Xia", "Huang", "Qiu", "Dao", "Da", "Wei", "Appare", "Yi", "Gou", "Yao", "Chu", "Liu", "Xun", "Ta", "Di", "Chi", "Yuan", "Su", "Ta", "Qian", , "Yao", "Guan", "Zhang", "Ao", "Shi", "Ce", "Chi", "Su", "Zao", "Zhe", "Dun", "Di", "Lou", "Chi", "Cuo", "Lin", "Zun", "Rao", "Qian", "Xuan", "Yu", "Yi", "Wu", "Liao", "Ju", "Shi", "Bi", "Yao", "Mai", "Xie", "Sui", "Huan", "Zhan", "Teng", "Er", "Miao", "Bian", "Bian", "La", "Li", "Yuan", "Yao", "Luo", "Li", "Yi", "Ting", "Deng", "Qi", "Yong", "Shan", "Han", "Yu", "Mang", "Ru", "Qiong", , "Kuang", "Fu", "Kang", "Bin", "Fang", "Xing", "Na", "Xin", "Shen", "Bang", "Yuan", "Cun", "Huo", "Xie", "Bang", "Wu", "Ju", "You", "Han", "Tai", "Qiu", "Bi", "Pei", "Bing", "Shao", "Bei", "Wa", "Di", "Zou", "Ye", "Lin", "Kuang", "Gui", "Zhu", "Shi", "Ku", "Yu", "Gai", "Ge", "Xi", "Zhi", "Ji", "Xun", "Hou", "Xing", "Jiao", "Xi", "Gui", "Nuo", "Lang", "Jia", "Kuai", "Zheng", "Otoko", "Yun", "Yan", "Cheng", "Dou", "Chi", "Lu", "Fu", "Wu", "Fu", "Gao", "Hao", "Lang", "Jia", "Geng", "Jun", "Ying", "Bo", "Xi", "Bei", "Li", "Yun", "Bu", "Xiao", "Qi", "Pi", "Qing", "Guo", "Zhou", "Tan", "Zou", "Ping", "Lai", "Ni", "Chen", "You", "Bu", "Xiang", "Dan", "Ju", "Yong", "Qiao", "Yi", "Du", "Yan", "Mei"], ["Ruo", "Bei", "E", "Yu", "Juan", "Yu", "Yun", "Hou", "Kui", "Xiang", "Xiang", "Sou", "Tang", "Ming", "Xi", "Ru", "Chu", "Zi", "Zou", "Ju", "Wu", "Xiang", "Yun", "Hao", "Yong", "Bi", "Mo", "Chao", "Fu", "Liao", "Yin", "Zhuan", "Hu", "Qiao", "Yan", "Zhang", "Fan", "Qiao", "Xu", "Deng", "Bi", "Xin", "Bi", "Ceng", "Wei", "Zheng", "Mao", "Shan", "Lin", "Po", "Dan", "Meng", "Ye", "Cao", "Kuai", "Feng", "Meng", "Zou", "Kuang", "Lian", "Zan", "Chan", "You", "Qi", "Yan", "Chan", "Zan", "Ling", "Huan", "Xi", "Feng", "Zan", "Li", "You", "Ding", "Qiu", "Zhuo", "Pei", "Zhou", "Yi", "Hang", "Yu", "Jiu", "Yan", "Zui", "Mao", "Dan", "Xu", "Tou", "Zhen", "Fen", "Sakenomoto", , "Yun", "Tai", "Tian", "Qia", "Tuo", "Zuo", "Han", "Gu", "Su", "Po", "Chou", "Zai", "Ming", "Luo", "Chuo", "Chou", "You", "Tong", "Zhi", "Xian", "Jiang", "Cheng", "Yin", "Tu", "Xiao", "Mei", "Ku", "Suan", "Lei", "Pu", "Zui", "Hai", "Yan", "Xi", "Niang", "Wei", "Lu", "Lan", "Yan", "Tao", "Pei", "Zhan", "Chun", "Tan", "Zui", "Chuo", "Cu", "Kun", "Ti", "Mian", "Du", "Hu", "Xu", "Xing", "Tan", "Jiu", "Chun", "Yun", "Po", "Ke", "Sou", "Mi", "Quan", "Chou", "Cuo", "Yun", "Yong", "Ang", "Zha", "Hai", "Tang", "Jiang", "Piao", "Shan", "Yu", "Li", "Zao", "Lao", "Yi", "Jiang", "Pu", "Jiao", "Xi", "Tan", "Po", "Nong", "Yi", "Li", "Ju", "Jiao", "Yi", "Niang", "Ru", "Xun", "Chou", "Yan", "Ling", "Mi", "Mi", "Niang", "Xin", "Jiao", "Xi", "Mi", "Yan", "Bian", "Cai", "Shi", "You", "Shi", "Shi", "Li", "Chong", "Ye", "Liang", "Li", "Jin", "Jin", "Qiu", "Yi", "Diao", "Dao", "Zhao", "Ding", "Po", "Qiu", "He", "Fu", "Zhen", "Zhi", "Ba", "Luan", "Fu", "Nai", "Diao", "Shan", "Qiao", "Kou", "Chuan", "Zi", "Fan", "Yu", "Hua", "Han", "Gong", "Qi", "Mang", "Ri", "Di", "Si", "Xi", "Yi", "Chai", "Shi", "Tu", "Xi", "Nu", "Qian", "Ishiyumi", "Jian", "Pi", "Ye", "Yin"], ["Ba", "Fang", "Chen", "Xing", "Tou", "Yue", "Yan", "Fu", "Pi", "Na", "Xin", "E", "Jue", "Dun", "Gou", "Yin", "Qian", "Ban", "Ji", "Ren", "Chao", "Niu", "Fen", "Yun", "Ji", "Qin", "Pi", "Guo", "Hong", "Yin", "Jun", "Shi", "Yi", "Zhong", "Nie", "Gai", "Ri", "Huo", "Tai", "Kang", "Habaki", "Irori", "Ngaak", , "Duo", "Zi", "Ni", "Tu", "Shi", "Min", "Gu", "E", "Ling", "Bing", "Yi", "Gu", "Ba", "Pi", "Yu", "Si", "Zuo", "Bu", "You", "Dian", "Jia", "Zhen", "Shi", "Shi", "Tie", "Ju", "Zhan", "Shi", "She", "Xuan", "Zhao", "Bao", "He", "Bi", "Sheng", "Chu", "Shi", "Bo", "Zhu", "Chi", "Za", "Po", "Tong", "Qian", "Fu", "Zhai", "Liu", "Qian", "Fu", "Li", "Yue", "Pi", "Yang", "Ban", "Bo", "Jie", "Gou", "Shu", "Zheng", "Mu", "Ni", "Nie", "Di", "Jia", "Mu", "Dan", "Shen", "Yi", "Si", "Kuang", "Ka", "Bei", "Jian", "Tong", "Xing", "Hong", "Jiao", "Chi", "Er", "Ge", "Bing", "Shi", "Mou", "Jia", "Yin", "Jun", "Zhou", "Chong", "Shang", "Tong", "Mo", "Lei", "Ji", "Yu", "Xu", "Ren", "Zun", "Zhi", "Qiong", "Shan", "Chi", "Xian", "Xing", "Quan", "Pi", "Tie", "Zhu", "Hou", "Ming", "Kua", "Yao", "Xian", "Xian", "Xiu", "Jun", "Cha", "Lao", "Ji", "Pi", "Ru", "Mi", "Yi", "Yin", "Guang", "An", "Diou", "You", "Se", "Kao", "Qian", "Luan", "Kasugai", "Ai", "Diao", "Han", "Rui", "Shi", "Keng", "Qiu", "Xiao", "Zhe", "Xiu", "Zang", "Ti", "Cuo", "Gua", "Gong", "Zhong", "Dou", "Lu", "Mei", "Lang", "Wan", "Xin", "Yun", "Bei", "Wu", "Su", "Yu", "Chan", "Ting", "Bo", "Han", "Jia", "Hong", "Cuan", "Feng", "Chan", "Wan", "Zhi", "Si", "Xuan", "Wu", "Wu", "Tiao", "Gong", "Zhuo", "Lue", "Xing", "Qian", "Shen", "Han", "Lue", "Xie", "Chu", "Zheng", "Ju", "Xian", "Tie", "Mang", "Pu", "Li", "Pan", "Rui", "Cheng", "Gao", "Li", "Te", "Pyeng", "Zhu", , "Tu", "Liu", "Zui", "Ju", "Chang", "Yuan", "Jian", "Gang", "Diao", "Tao", "Chang"], ["Lun", "Kua", "Ling", "Bei", "Lu", "Li", "Qiang", "Pou", "Juan", "Min", "Zui", "Peng", "An", "Pi", "Xian", "Ya", "Zhui", "Lei", "A", "Kong", "Ta", "Kun", "Du", "Wei", "Chui", "Zi", "Zheng", "Ben", "Nie", "Cong", "Qun", "Tan", "Ding", "Qi", "Qian", "Zhuo", "Qi", "Yu", "Jin", "Guan", "Mao", "Chang", "Tian", "Xi", "Lian", "Tao", "Gu", "Cuo", "Shu", "Zhen", "Lu", "Meng", "Lu", "Hua", "Biao", "Ga", "Lai", "Ken", "Kazari", "Bu", "Nai", "Wan", "Zan", , "De", "Xian", , "Huo", "Liang", , "Men", "Kai", "Ying", "Di", "Lian", "Guo", "Xian", "Du", "Tu", "Wei", "Cong", "Fu", "Rou", "Ji", "E", "Rou", "Chen", "Ti", "Zha", "Hong", "Yang", "Duan", "Xia", "Yu", "Keng", "Xing", "Huang", "Wei", "Fu", "Zhao", "Cha", "Qie", "She", "Hong", "Kui", "Tian", "Mou", "Qiao", "Qiao", "Hou", "Tou", "Cong", "Huan", "Ye", "Min", "Jian", "Duan", "Jian", "Song", "Kui", "Hu", "Xuan", "Duo", "Jie", "Zhen", "Bian", "Zhong", "Zi", "Xiu", "Ye", "Mei", "Pai", "Ai", "Jie", , "Mei", "Chuo", "Ta", "Bang", "Xia", "Lian", "Suo", "Xi", "Liu", "Zu", "Ye", "Nou", "Weng", "Rong", "Tang", "Suo", "Qiang", "Ge", "Shuo", "Chui", "Bo", "Pan", "Sa", "Bi", "Sang", "Gang", "Zi", "Wu", "Ying", "Huang", "Tiao", "Liu", "Kai", "Sun", "Sha", "Sou", "Wan", "Hao", "Zhen", "Zhen", "Luo", "Yi", "Yuan", "Tang", "Nie", "Xi", "Jia", "Ge", "Ma", "Juan", "Kasugai", "Habaki", "Suo", , , , "Na", "Lu", "Suo", "Ou", "Zu", "Tuan", "Xiu", "Guan", "Xuan", "Lian", "Shou", "Ao", "Man", "Mo", "Luo", "Bi", "Wei", "Liu", "Di", "Qiao", "Cong", "Yi", "Lu", "Ao", "Keng", "Qiang", "Cui", "Qi", "Chang", "Tang", "Man", "Yong", "Chan", "Feng", "Jing", "Biao", "Shu", "Lou", "Xiu", "Cong", "Long", "Zan", "Jian", "Cao", "Li", "Xia", "Xi", "Kang", , "Beng", , , "Zheng", "Lu", "Hua", "Ji", "Pu", "Hui", "Qiang", "Po", "Lin", "Suo", "Xiu", "San", "Cheng"], ["Kui", "Si", "Liu", "Nao", "Heng", "Pie", "Sui", "Fan", "Qiao", "Quan", "Yang", "Tang", "Xiang", "Jue", "Jiao", "Zun", "Liao", "Jie", "Lao", "Dui", "Tan", "Zan", "Ji", "Jian", "Zhong", "Deng", "Ya", "Ying", "Dui", "Jue", "Nou", "Ti", "Pu", "Tie", , , "Ding", "Shan", "Kai", "Jian", "Fei", "Sui", "Lu", "Juan", "Hui", "Yu", "Lian", "Zhuo", "Qiao", "Qian", "Zhuo", "Lei", "Bi", "Tie", "Huan", "Ye", "Duo", "Guo", "Dang", "Ju", "Fen", "Da", "Bei", "Yi", "Ai", "Zong", "Xun", "Diao", "Zhu", "Heng", "Zhui", "Ji", "Nie", "Ta", "Huo", "Qing", "Bin", "Ying", "Kui", "Ning", "Xu", "Jian", "Jian", "Yari", "Cha", "Zhi", "Mie", "Li", "Lei", "Ji", "Zuan", "Kuang", "Shang", "Peng", "La", "Du", "Shuo", "Chuo", "Lu", "Biao", "Bao", "Lu", , , "Long", "E", "Lu", "Xin", "Jian", "Lan", "Bo", "Jian", "Yao", "Chan", "Xiang", "Jian", "Xi", "Guan", "Cang", "Nie", "Lei", "Cuan", "Qu", "Pan", "Luo", "Zuan", "Luan", "Zao", "Nie", "Jue", "Tang", "Shu", "Lan", "Jin", "Qiu", "Yi", "Zhen", "Ding", "Zhao", "Po", "Diao", "Tu", "Qian", "Chuan", "Shan", "Ji", "Fan", "Diao", "Men", "Nu", "Xi", "Chai", "Xing", "Gai", "Bu", "Tai", "Ju", "Dun", "Chao", "Zhong", "Na", "Bei", "Gang", "Ban", "Qian", "Yao", "Qin", "Jun", "Wu", "Gou", "Kang", "Fang", "Huo", "Tou", "Niu", "Ba", "Yu", "Qian", "Zheng", "Qian", "Gu", "Bo", "E", "Po", "Bu", "Ba", "Yue", "Zuan", "Mu", "Dan", "Jia", "Dian", "You", "Tie", "Bo", "Ling", "Shuo", "Qian", "Liu", "Bao", "Shi", "Xuan", "She", "Bi", "Ni", "Pi", "Duo", "Xing", "Kao", "Lao", "Er", "Mang", "Ya", "You", "Cheng", "Jia", "Ye", "Nao", "Zhi", "Dang", "Tong", "Lu", "Diao", "Yin", "Kai", "Zha", "Zhu", "Xian", "Ting", "Diu", "Xian", "Hua", "Quan", "Sha", "Jia", "Yao", "Ge", "Ming", "Zheng", "Se", "Jiao", "Yi", "Chan", "Chong", "Tang", "An", "Yin", "Ru", "Zhu", "Lao", "Pu", "Wu", "Lai", "Te", "Lian", "Keng"], ["Xiao", "Suo", "Li", "Zheng", "Chu", "Guo", "Gao", "Tie", "Xiu", "Cuo", "Lue", "Feng", "Xin", "Liu", "Kai", "Jian", "Rui", "Ti", "Lang", "Qian", "Ju", "A", "Qiang", "Duo", "Tian", "Cuo", "Mao", "Ben", "Qi", "De", "Kua", "Kun", "Chang", "Xi", "Gu", "Luo", "Chui", "Zhui", "Jin", "Zhi", "Xian", "Juan", "Huo", "Pou", "Tan", "Ding", "Jian", "Ju", "Meng", "Zi", "Qie", "Ying", "Kai", "Qiang", "Song", "E", "Cha", "Qiao", "Zhong", "Duan", "Sou", "Huang", "Huan", "Ai", "Du", "Mei", "Lou", "Zi", "Fei", "Mei", "Mo", "Zhen", "Bo", "Ge", "Nie", "Tang", "Juan", "Nie", "Na", "Liu", "Hao", "Bang", "Yi", "Jia", "Bin", "Rong", "Biao", "Tang", "Man", "Luo", "Beng", "Yong", "Jing", "Di", "Zu", "Xuan", "Liu", "Tan", "Jue", "Liao", "Pu", "Lu", "Dui", "Lan", "Pu", "Cuan", "Qiang", "Deng", "Huo", "Lei", "Huan", "Zhuo", "Lian", "Yi", "Cha", "Biao", "La", "Chan", "Xiang", "Chang", "Chang", "Jiu", "Ao", "Die", "Qu", "Liao", "Mi", "Chang", "Men", "Ma", "Shuan", "Shan", "Huo", "Men", "Yan", "Bi", "Han", "Bi", "San", "Kai", "Kang", "Beng", "Hong", "Run", "San", "Xian", "Xian", "Jian", "Min", "Xia", "Yuru", "Dou", "Zha", "Nao", "Jian", "Peng", "Xia", "Ling", "Bian", "Bi", "Run", "He", "Guan", "Ge", "Ge", "Fa", "Chu", "Hong", "Gui", "Min", "Se", "Kun", "Lang", "Lu", "Ting", "Sha", "Ju", "Yue", "Yue", "Chan", "Qu", "Lin", "Chang", "Shai", "Kun", "Yan", "Min", "Yan", "E", "Hun", "Yu", "Wen", "Xiang", "Bao", "Xiang", "Qu", "Yao", "Wen", "Ban", "An", "Wei", "Yin", "Kuo", "Que", "Lan", "Du", , "Phwung", "Tian", "Nie", "Ta", "Kai", "He", "Que", "Chuang", "Guan", "Dou", "Qi", "Kui", "Tang", "Guan", "Piao", "Kan", "Xi", "Hui", "Chan", "Pi", "Dang", "Huan", "Ta", "Wen", , "Men", "Shuan", "Shan", "Yan", "Han", "Bi", "Wen", "Chuang", "Run", "Wei", "Xian", "Hong", "Jian", "Min", "Kang", "Men", "Zha", "Nao", "Gui", "Wen", "Ta", "Min", "Lu", "Kai"], ["Fa", "Ge", "He", "Kun", "Jiu", "Yue", "Lang", "Du", "Yu", "Yan", "Chang", "Xi", "Wen", "Hun", "Yan", "E", "Chan", "Lan", "Qu", "Hui", "Kuo", "Que", "Ge", "Tian", "Ta", "Que", "Kan", "Huan", "Fu", "Fu", "Le", "Dui", "Xin", "Qian", "Wu", "Yi", "Tuo", "Yin", "Yang", "Dou", "E", "Sheng", "Ban", "Pei", "Keng", "Yun", "Ruan", "Zhi", "Pi", "Jing", "Fang", "Yang", "Yin", "Zhen", "Jie", "Cheng", "E", "Qu", "Di", "Zu", "Zuo", "Dian", "Ling", "A", "Tuo", "Tuo", "Po", "Bing", "Fu", "Ji", "Lu", "Long", "Chen", "Xing", "Duo", "Lou", "Mo", "Jiang", "Shu", "Duo", "Xian", "Er", "Gui", "Yu", "Gai", "Shan", "Xun", "Qiao", "Xing", "Chun", "Fu", "Bi", "Xia", "Shan", "Sheng", "Zhi", "Pu", "Dou", "Yuan", "Zhen", "Chu", "Xian", "Tou", "Nie", "Yun", "Xian", "Pei", "Pei", "Zou", "Yi", "Dui", "Lun", "Yin", "Ju", "Chui", "Chen", "Pi", "Ling", "Tao", "Xian", "Lu", "Sheng", "Xian", "Yin", "Zhu", "Yang", "Reng", "Shan", "Chong", "Yan", "Yin", "Yu", "Ti", "Yu", "Long", "Wei", "Wei", "Nie", "Dui", "Sui", "An", "Huang", "Jie", "Sui", "Yin", "Gai", "Yan", "Hui", "Ge", "Yun", "Wu", "Wei", "Ai", "Xi", "Tang", "Ji", "Zhang", "Dao", "Ao", "Xi", "Yin", , "Rao", "Lin", "Tui", "Deng", "Pi", "Sui", "Sui", "Yu", "Xian", "Fen", "Ni", "Er", "Ji", "Dao", "Xi", "Yin", "E", "Hui", "Long", "Xi", "Li", "Li", "Li", "Zhui", "He", "Zhi", "Zhun", "Jun", "Nan", "Yi", "Que", "Yan", "Qian", "Ya", "Xiong", "Ya", "Ji", "Gu", "Huan", "Zhi", "Gou", "Jun", "Ci", "Yong", "Ju", "Chu", "Hu", "Za", "Luo", "Yu", "Chou", "Diao", "Sui", "Han", "Huo", "Shuang", "Guan", "Chu", "Za", "Yong", "Ji", "Xi", "Chou", "Liu", "Li", "Nan", "Xue", "Za", "Ji", "Ji", "Yu", "Yu", "Xue", "Na", "Fou", "Se", "Mu", "Wen", "Fen", "Pang", "Yun", "Li", "Li", "Ang", "Ling", "Lei", "An", "Bao", "Meng", "Dian", "Dang", "Xing", "Wu", "Zhao"], ["Xu", "Ji", "Mu", "Chen", "Xiao", "Zha", "Ting", "Zhen", "Pei", "Mei", "Ling", "Qi", "Chou", "Huo", "Sha", "Fei", "Weng", "Zhan", "Yin", "Ni", "Chou", "Tun", "Lin", , "Dong", "Ying", "Wu", "Ling", "Shuang", "Ling", "Xia", "Hong", "Yin", "Mo", "Mai", "Yun", "Liu", "Meng", "Bin", "Wu", "Wei", "Huo", "Yin", "Xi", "Yi", "Ai", "Dan", "Deng", "Xian", "Yu", "Lu", "Long", "Dai", "Ji", "Pang", "Yang", "Ba", "Pi", "Wei", , "Xi", "Ji", "Mai", "Meng", "Meng", "Lei", "Li", "Huo", "Ai", "Fei", "Dai", "Long", "Ling", "Ai", "Feng", "Li", "Bao", , "He", "He", "Bing", "Qing", "Qing", "Jing", "Tian", "Zhen", "Jing", "Cheng", "Qing", "Jing", "Jing", "Dian", "Jing", "Tian", "Fei", "Fei", "Kao", "Mi", "Mian", "Mian", "Pao", "Ye", "Tian", "Hui", "Ye", "Ge", "Ding", "Cha", "Jian", "Ren", "Di", "Du", "Wu", "Ren", "Qin", "Jin", "Xue", "Niu", "Ba", "Yin", "Sa", "Na", "Mo", "Zu", "Da", "Ban", "Yi", "Yao", "Tao", "Tuo", "Jia", "Hong", "Pao", "Yang", "Tomo", "Yin", "Jia", "Tao", "Ji", "Xie", "An", "An", "Hen", "Gong", "Kohaze", "Da", "Qiao", "Ting", "Wan", "Ying", "Sui", "Tiao", "Qiao", "Xuan", "Kong", "Beng", "Ta", "Zhang", "Bing", "Kuo", "Ju", "La", "Xie", "Rou", "Bang", "Yi", "Qiu", "Qiu", "He", "Xiao", "Mu", "Ju", "Jian", "Bian", "Di", "Jian", "On", "Tao", "Gou", "Ta", "Bei", "Xie", "Pan", "Ge", "Bi", "Kuo", "Tang", "Lou", "Gui", "Qiao", "Xue", "Ji", "Jian", "Jiang", "Chan", "Da", "Huo", "Xian", "Qian", "Du", "Wa", "Jian", "Lan", "Wei", "Ren", "Fu", "Mei", "Juan", "Ge", "Wei", "Qiao", "Han", "Chang", , "Rou", "Xun", "She", "Wei", "Ge", "Bei", "Tao", "Gou", "Yun", , "Bi", "Wei", "Hui", "Du", "Wa", "Du", "Wei", "Ren", "Fu", "Han", "Wei", "Yun", "Tao", "Jiu", "Jiu", "Xian", "Xie", "Xian", "Ji", "Yin", "Za", "Yun", "Shao", "Le", "Peng", "Heng", "Ying", "Yun", "Peng", "Yin", "Yin", "Xiang"], ["Hu", "Ye", "Ding", "Qing", "Pan", "Xiang", "Shun", "Han", "Xu", "Yi", "Xu", "Gu", "Song", "Kui", "Qi", "Hang", "Yu", "Wan", "Ban", "Dun", "Di", "Dan", "Pan", "Po", "Ling", "Ce", "Jing", "Lei", "He", "Qiao", "E", "E", "Wei", "Jie", "Gua", "Shen", "Yi", "Shen", "Hai", "Dui", "Pian", "Ping", "Lei", "Fu", "Jia", "Tou", "Hui", "Kui", "Jia", "Le", "Tian", "Cheng", "Ying", "Jun", "Hu", "Han", "Jing", "Tui", "Tui", "Pin", "Lai", "Tui", "Zi", "Zi", "Chui", "Ding", "Lai", "Yan", "Han", "Jian", "Ke", "Cui", "Jiong", "Qin", "Yi", "Sai", "Ti", "E", "E", "Yan", "Hun", "Kan", "Yong", "Zhuan", "Yan", "Xian", "Xin", "Yi", "Yuan", "Sang", "Dian", "Dian", "Jiang", "Ku", "Lei", "Liao", "Piao", "Yi", "Man", "Qi", "Rao", "Hao", "Qiao", "Gu", "Xun", "Qian", "Hui", "Zhan", "Ru", "Hong", "Bin", "Xian", "Pin", "Lu", "Lan", "Nie", "Quan", "Ye", "Ding", "Qing", "Han", "Xiang", "Shun", "Xu", "Xu", "Wan", "Gu", "Dun", "Qi", "Ban", "Song", "Hang", "Yu", "Lu", "Ling", "Po", "Jing", "Jie", "Jia", "Tian", "Han", "Ying", "Jiong", "Hai", "Yi", "Pin", "Hui", "Tui", "Han", "Ying", "Ying", "Ke", "Ti", "Yong", "E", "Zhuan", "Yan", "E", "Nie", "Man", "Dian", "Sang", "Hao", "Lei", "Zhan", "Ru", "Pin", "Quan", "Feng", "Biao", "Oroshi", "Fu", "Xia", "Zhan", "Biao", "Sa", "Ba", "Tai", "Lie", "Gua", "Xuan", "Shao", "Ju", "Bi", "Si", "Wei", "Yang", "Yao", "Sou", "Kai", "Sao", "Fan", "Liu", "Xi", "Liao", "Piao", "Piao", "Liu", "Biao", "Biao", "Biao", "Liao", , "Se", "Feng", "Biao", "Feng", "Yang", "Zhan", "Biao", "Sa", "Ju", "Si", "Sou", "Yao", "Liu", "Piao", "Biao", "Biao", "Fei", "Fan", "Fei", "Fei", "Shi", "Shi", "Can", "Ji", "Ding", "Si", "Tuo", "Zhan", "Sun", "Xiang", "Tun", "Ren", "Yu", "Juan", "Chi", "Yin", "Fan", "Fan", "Sun", "Yin", "Zhu", "Yi", "Zhai", "Bi", "Jie", "Tao", "Liu", "Ci", "Tie", "Si", "Bao", "Shi", "Duo"], ["Hai", "Ren", "Tian", "Jiao", "Jia", "Bing", "Yao", "Tong", "Ci", "Xiang", "Yang", "Yang", "Er", "Yan", "Le", "Yi", "Can", "Bo", "Nei", "E", "Bu", "Jun", "Dou", "Su", "Yu", "Shi", "Yao", "Hun", "Guo", "Shi", "Jian", "Zhui", "Bing", "Xian", "Bu", "Ye", "Tan", "Fei", "Zhang", "Wei", "Guan", "E", "Nuan", "Hun", "Hu", "Huang", "Tie", "Hui", "Jian", "Hou", "He", "Xing", "Fen", "Wei", "Gu", "Cha", "Song", "Tang", "Bo", "Gao", "Xi", "Kui", "Liu", "Sou", "Tao", "Ye", "Yun", "Mo", "Tang", "Man", "Bi", "Yu", "Xiu", "Jin", "San", "Kui", "Zhuan", "Shan", "Chi", "Dan", "Yi", "Ji", "Rao", "Cheng", "Yong", "Tao", "Hui", "Xiang", "Zhan", "Fen", "Hai", "Meng", "Yan", "Mo", "Chan", "Xiang", "Luo", "Zuan", "Nang", "Shi", "Ding", "Ji", "Tuo", "Xing", "Tun", "Xi", "Ren", "Yu", "Chi", "Fan", "Yin", "Jian", "Shi", "Bao", "Si", "Duo", "Yi", "Er", "Rao", "Xiang", "Jia", "Le", "Jiao", "Yi", "Bing", "Bo", "Dou", "E", "Yu", "Nei", "Jun", "Guo", "Hun", "Xian", "Guan", "Cha", "Kui", "Gu", "Sou", "Chan", "Ye", "Mo", "Bo", "Liu", "Xiu", "Jin", "Man", "San", "Zhuan", "Nang", "Shou", "Kui", "Guo", "Xiang", "Fen", "Ba", "Ni", "Bi", "Bo", "Tu", "Han", "Fei", "Jian", "An", "Ai", "Fu", "Xian", "Wen", "Xin", "Fen", "Bin", "Xing", "Ma", "Yu", "Feng", "Han", "Di", "Tuo", "Tuo", "Chi", "Xun", "Zhu", "Zhi", "Pei", "Xin", "Ri", "Sa", "Yin", "Wen", "Zhi", "Dan", "Lu", "You", "Bo", "Bao", "Kuai", "Tuo", "Yi", "Qu", , "Qu", "Jiong", "Bo", "Zhao", "Yuan", "Peng", "Zhou", "Ju", "Zhu", "Nu", "Ju", "Pi", "Zang", "Jia", "Ling", "Zhen", "Tai", "Fu", "Yang", "Shi", "Bi", "Tuo", "Tuo", "Si", "Liu", "Ma", "Pian", "Tao", "Zhi", "Rong", "Teng", "Dong", "Xun", "Quan", "Shen", "Jiong", "Er", "Hai", "Bo", "Zhu", "Yin", "Luo", "Shuu", "Dan", "Xie", "Liu", "Ju", "Song", "Qin", "Mang", "Liang", "Han", "Tu", "Xuan", "Tui", "Jun"], ["E", "Cheng", "Xin", "Ai", "Lu", "Zhui", "Zhou", "She", "Pian", "Kun", "Tao", "Lai", "Zong", "Ke", "Qi", "Qi", "Yan", "Fei", "Sao", "Yan", "Jie", "Yao", "Wu", "Pian", "Cong", "Pian", "Qian", "Fei", "Huang", "Jian", "Huo", "Yu", "Ti", "Quan", "Xia", "Zong", "Kui", "Rou", "Si", "Gua", "Tuo", "Kui", "Sou", "Qian", "Cheng", "Zhi", "Liu", "Pang", "Teng", "Xi", "Cao", "Du", "Yan", "Yuan", "Zou", "Sao", "Shan", "Li", "Zhi", "Shuang", "Lu", "Xi", "Luo", "Zhang", "Mo", "Ao", "Can", "Piao", "Cong", "Qu", "Bi", "Zhi", "Yu", "Xu", "Hua", "Bo", "Su", "Xiao", "Lin", "Chan", "Dun", "Liu", "Tuo", "Zeng", "Tan", "Jiao", "Tie", "Yan", "Luo", "Zhan", "Jing", "Yi", "Ye", "Tuo", "Bin", "Zou", "Yan", "Peng", "Lu", "Teng", "Xiang", "Ji", "Shuang", "Ju", "Xi", "Huan", "Li", "Biao", "Ma", "Yu", "Tuo", "Xun", "Chi", "Qu", "Ri", "Bo", "Lu", "Zang", "Shi", "Si", "Fu", "Ju", "Zou", "Zhu", "Tuo", "Nu", "Jia", "Yi", "Tai", "Xiao", "Ma", "Yin", "Jiao", "Hua", "Luo", "Hai", "Pian", "Biao", "Li", "Cheng", "Yan", "Xin", "Qin", "Jun", "Qi", "Qi", "Ke", "Zhui", "Zong", "Su", "Can", "Pian", "Zhi", "Kui", "Sao", "Wu", "Ao", "Liu", "Qian", "Shan", "Piao", "Luo", "Cong", "Chan", "Zou", "Ji", "Shuang", "Xiang", "Gu", "Wei", "Wei", "Wei", "Yu", "Gan", "Yi", "Ang", "Tou", "Xie", "Bao", "Bi", "Chi", "Ti", "Di", "Ku", "Hai", "Qiao", "Gou", "Kua", "Ge", "Tui", "Geng", "Pian", "Bi", "Ke", "Ka", "Yu", "Sui", "Lou", "Bo", "Xiao", "Pang", "Bo", "Ci", "Kuan", "Bin", "Mo", "Liao", "Lou", "Nao", "Du", "Zang", "Sui", "Ti", "Bin", "Kuan", "Lu", "Gao", "Gao", "Qiao", "Kao", "Qiao", "Lao", "Zao", "Biao", "Kun", "Kun", "Ti", "Fang", "Xiu", "Ran", "Mao", "Dan", "Kun", "Bin", "Fa", "Tiao", "Peng", "Zi", "Fa", "Ran", "Ti", "Pao", "Pi", "Mao", "Fu", "Er", "Rong", "Qu", "Gong", "Xiu", "Gua", "Ji", "Peng", "Zhua", "Shao", "Sha"], ["Ti", "Li", "Bin", "Zong", "Ti", "Peng", "Song", "Zheng", "Quan", "Zong", "Shun", "Jian", "Duo", "Hu", "La", "Jiu", "Qi", "Lian", "Zhen", "Bin", "Peng", "Mo", "San", "Man", "Man", "Seng", "Xu", "Lie", "Qian", "Qian", "Nong", "Huan", "Kuai", "Ning", "Bin", "Lie", "Rang", "Dou", "Dou", "Nao", "Hong", "Xi", "Dou", "Han", "Dou", "Dou", "Jiu", "Chang", "Yu", "Yu", "Li", "Juan", "Fu", "Qian", "Gui", "Zong", "Liu", "Gui", "Shang", "Yu", "Gui", "Mei", "Ji", "Qi", "Jie", "Kui", "Hun", "Ba", "Po", "Mei", "Xu", "Yan", "Xiao", "Liang", "Yu", "Tui", "Qi", "Wang", "Liang", "Wei", "Jian", "Chi", "Piao", "Bi", "Mo", "Ji", "Xu", "Chou", "Yan", "Zhan", "Yu", "Dao", "Ren", "Ji", "Eri", "Gong", "Tuo", "Diao", "Ji", "Xu", "E", "E", "Sha", "Hang", "Tun", "Mo", "Jie", "Shen", "Fan", "Yuan", "Bi", "Lu", "Wen", "Hu", "Lu", "Za", "Fang", "Fen", "Na", "You", "Namazu", "Todo", "He", "Xia", "Qu", "Han", "Pi", "Ling", "Tuo", "Bo", "Qiu", "Ping", "Fu", "Bi", "Ji", "Wei", "Ju", "Diao", "Bo", "You", "Gun", "Pi", "Nian", "Xing", "Tai", "Bao", "Fu", "Zha", "Ju", "Gu", "Kajika", "Tong", , "Ta", "Jie", "Shu", "Hou", "Xiang", "Er", "An", "Wei", "Tiao", "Zhu", "Yin", "Lie", "Luo", "Tong", "Yi", "Qi", "Bing", "Wei", "Jiao", "Bu", "Gui", "Xian", "Ge", "Hui", "Bora", "Mate", "Kao", "Gori", "Duo", "Jun", "Ti", "Man", "Xiao", "Za", "Sha", "Qin", "Yu", "Nei", "Zhe", "Gun", "Geng", "Su", "Wu", "Qiu", "Ting", "Fu", "Wan", "You", "Li", "Sha", "Sha", "Gao", "Meng", "Ugui", "Asari", "Subashiri", "Kazunoko", "Yong", "Ni", "Zi", "Qi", "Qing", "Xiang", "Nei", "Chun", "Ji", "Diao", "Qie", "Gu", "Zhou", "Dong", "Lai", "Fei", "Ni", "Yi", "Kun", "Lu", "Jiu", "Chang", "Jing", "Lun", "Ling", "Zou", "Li", "Meng", "Zong", "Zhi", "Nian", "Shachi", "Dojou", "Sukesou", "Shi", "Shen", "Hun", "Shi", "Hou", "Xing", "Zhu", "La", "Zong", "Ji", "Bian", "Bian"], ["Huan", "Quan", "Ze", "Wei", "Wei", "Yu", "Qun", "Rou", "Die", "Huang", "Lian", "Yan", "Qiu", "Qiu", "Jian", "Bi", "E", "Yang", "Fu", "Sai", "Jian", "Xia", "Tuo", "Hu", "Muroaji", "Ruo", "Haraka", "Wen", "Jian", "Hao", "Wu", "Fang", "Sao", "Liu", "Ma", "Shi", "Shi", "Yin", "Z", "Teng", "Ta", "Yao", "Ge", "Rong", "Qian", "Qi", "Wen", "Ruo", "Hatahata", "Lian", "Ao", "Le", "Hui", "Min", "Ji", "Tiao", "Qu", "Jian", "Sao", "Man", "Xi", "Qiu", "Biao", "Ji", "Ji", "Zhu", "Jiang", "Qiu", "Zhuan", "Yong", "Zhang", "Kang", "Xue", "Bie", "Jue", "Qu", "Xiang", "Bo", "Jiao", "Xun", "Su", "Huang", "Zun", "Shan", "Shan", "Fan", "Jue", "Lin", "Xun", "Miao", "Xi", "Eso", "Kyou", "Fen", "Guan", "Hou", "Kuai", "Zei", "Sao", "Zhan", "Gan", "Gui", "Sheng", "Li", "Chang", "Hatahata", "Shiira", "Mutsu", "Ru", "Ji", "Xu", "Huo", "Shiira", "Li", "Lie", "Li", "Mie", "Zhen", "Xiang", "E", "Lu", "Guan", "Li", "Xian", "Yu", "Dao", "Ji", "You", "Tun", "Lu", "Fang", "Ba", "He", "Bo", "Ping", "Nian", "Lu", "You", "Zha", "Fu", "Bo", "Bao", "Hou", "Pi", "Tai", "Gui", "Jie", "Kao", "Wei", "Er", "Tong", "Ze", "Hou", "Kuai", "Ji", "Jiao", "Xian", "Za", "Xiang", "Xun", "Geng", "Li", "Lian", "Jian", "Li", "Shi", "Tiao", "Gun", "Sha", "Wan", "Jun", "Ji", "Yong", "Qing", "Ling", "Qi", "Zou", "Fei", "Kun", "Chang", "Gu", "Ni", "Nian", "Diao", "Jing", "Shen", "Shi", "Zi", "Fen", "Die", "Bi", "Chang", "Shi", "Wen", "Wei", "Sai", "E", "Qiu", "Fu", "Huang", "Quan", "Jiang", "Bian", "Sao", "Ao", "Qi", "Ta", "Yin", "Yao", "Fang", "Jian", "Le", "Biao", "Xue", "Bie", "Man", "Min", "Yong", "Wei", "Xi", "Jue", "Shan", "Lin", "Zun", "Huo", "Gan", "Li", "Zhan", "Guan", "Niao", "Yi", "Fu", "Li", "Jiu", "Bu", "Yan", "Fu", "Diao", "Ji", "Feng", "Nio", "Gan", "Shi", "Feng", "Ming", "Bao", "Yuan", "Zhi", "Hu", "Qin", "Fu", "Fen", "Wen", "Jian", "Shi", "Yu"], ["Fou", "Yiao", "Jue", "Jue", "Pi", "Huan", "Zhen", "Bao", "Yan", "Ya", "Zheng", "Fang", "Feng", "Wen", "Ou", "Te", "Jia", "Nu", "Ling", "Mie", "Fu", "Tuo", "Wen", "Li", "Bian", "Zhi", "Ge", "Yuan", "Zi", "Qu", "Xiao", "Zhi", "Dan", "Ju", "You", "Gu", "Zhong", "Yu", "Yang", "Rong", "Ya", "Tie", "Yu", "Shigi", "Ying", "Zhui", "Wu", "Er", "Gua", "Ai", "Zhi", "Yan", "Heng", "Jiao", "Ji", "Lie", "Zhu", "Ren", "Yi", "Hong", "Luo", "Ru", "Mou", "Ge", "Ren", "Jiao", "Xiu", "Zhou", "Zhi", "Luo", "Chidori", "Toki", "Ten", "Luan", "Jia", "Ji", "Yu", "Huan", "Tuo", "Bu", "Wu", "Juan", "Yu", "Bo", "Xun", "Xun", "Bi", "Xi", "Jun", "Ju", "Tu", "Jing", "Ti", "E", "E", "Kuang", "Hu", "Wu", "Shen", "Lai", "Ikaruga", "Kakesu", "Lu", "Ping", "Shu", "Fu", "An", "Zhao", "Peng", "Qin", "Qian", "Bei", "Diao", "Lu", "Que", "Jian", "Ju", "Tu", "Ya", "Yuan", "Qi", "Li", "Ye", "Zhui", "Kong", "Zhui", "Kun", "Sheng", "Qi", "Jing", "Yi", "Yi", "Jing", "Zi", "Lai", "Dong", "Qi", "Chun", "Geng", "Ju", "Qu", "Isuka", "Kikuitadaki", "Ji", "Shu", , "Chi", "Miao", "Rou", "An", "Qiu", "Ti", "Hu", "Ti", "E", "Jie", "Mao", "Fu", "Chun", "Tu", "Yan", "He", "Yuan", "Pian", "Yun", "Mei", "Hu", "Ying", "Dun", "Mu", "Ju", "Tsugumi", "Cang", "Fang", "Gu", "Ying", "Yuan", "Xuan", "Weng", "Shi", "He", "Chu", "Tang", "Xia", "Ruo", "Liu", "Ji", "Gu", "Jian", "Zhun", "Han", "Zi", "Zi", "Ni", "Yao", "Yan", "Ji", "Li", "Tian", "Kou", "Ti", "Ti", "Ni", "Tu", "Ma", "Jiao", "Gao", "Tian", "Chen", "Li", "Zhuan", "Zhe", "Ao", "Yao", "Yi", "Ou", "Chi", "Zhi", "Liao", "Rong", "Lou", "Bi", "Shuang", "Zhuo", "Yu", "Wu", "Jue", "Yin", "Quan", "Si", "Jiao", "Yi", "Hua", "Bi", "Ying", "Su", "Huang", "Fan", "Jiao", "Liao", "Yan", "Kao", "Jiu", "Xian", "Xian", "Tu", "Mai", "Zun", "Yu", "Ying", "Lu", "Tuan", "Xian", "Xue", "Yi", "Pi"], ["Shu", "Luo", "Qi", "Yi", "Ji", "Zhe", "Yu", "Zhan", "Ye", "Yang", "Pi", "Ning", "Huo", "Mi", "Ying", "Meng", "Di", "Yue", "Yu", "Lei", "Bao", "Lu", "He", "Long", "Shuang", "Yue", "Ying", "Guan", "Qu", "Li", "Luan", "Niao", "Jiu", "Ji", "Yuan", "Ming", "Shi", "Ou", "Ya", "Cang", "Bao", "Zhen", "Gu", "Dong", "Lu", "Ya", "Xiao", "Yang", "Ling", "Zhi", "Qu", "Yuan", "Xue", "Tuo", "Si", "Zhi", "Er", "Gua", "Xiu", "Heng", "Zhou", "Ge", "Luan", "Hong", "Wu", "Bo", "Li", "Juan", "Hu", "E", "Yu", "Xian", "Ti", "Wu", "Que", "Miao", "An", "Kun", "Bei", "Peng", "Qian", "Chun", "Geng", "Yuan", "Su", "Hu", "He", "E", "Gu", "Qiu", "Zi", "Mei", "Mu", "Ni", "Yao", "Weng", "Liu", "Ji", "Ni", "Jian", "He", "Yi", "Ying", "Zhe", "Liao", "Liao", "Jiao", "Jiu", "Yu", "Lu", "Xuan", "Zhan", "Ying", "Huo", "Meng", "Guan", "Shuang", "Lu", "Jin", "Ling", "Jian", "Xian", "Cuo", "Jian", "Jian", "Yan", "Cuo", "Lu", "You", "Cu", "Ji", "Biao", "Cu", "Biao", "Zhu", "Jun", "Zhu", "Jian", "Mi", "Mi", "Wu", "Liu", "Chen", "Jun", "Lin", "Ni", "Qi", "Lu", "Jiu", "Jun", "Jing", "Li", "Xiang", "Yan", "Jia", "Mi", "Li", "She", "Zhang", "Lin", "Jing", "Ji", "Ling", "Yan", "Cu", "Mai", "Mai", "Ge", "Chao", "Fu", "Mian", "Mian", "Fu", "Pao", "Qu", "Qu", "Mou", "Fu", "Xian", "Lai", "Qu", "Mian", , "Feng", "Fu", "Qu", "Mian", "Ma", "Mo", "Mo", "Hui", "Ma", "Zou", "Nen", "Fen", "Huang", "Huang", "Jin", "Guang", "Tian", "Tou", "Heng", "Xi", "Kuang", "Heng", "Shu", "Li", "Nian", "Chi", "Hei", "Hei", "Yi", "Qian", "Dan", "Xi", "Tuan", "Mo", "Mo", "Qian", "Dai", "Chu", "You", "Dian", "Yi", "Xia", "Yan", "Qu", "Mei", "Yan", "Jing", "Yu", "Li", "Dang", "Du", "Can", "Yin", "An", "Yan", "Tan", "An", "Zhen", "Dai", "Can", "Yi", "Mei", "Dan", "Yan", "Du", "Lu", "Zhi", "Fen", "Fu", "Fu", "Min", "Min", "Yuan"], ["Cu", "Qu", "Chao", "Wa", "Zhu", "Zhi", "Mang", "Ao", "Bie", "Tuo", "Bi", "Yuan", "Chao", "Tuo", "Ding", "Mi", "Nai", "Ding", "Zi", "Gu", "Gu", "Dong", "Fen", "Tao", "Yuan", "Pi", "Chang", "Gao", "Qi", "Yuan", "Tang", "Teng", "Shu", "Shu", "Fen", "Fei", "Wen", "Ba", "Diao", "Tuo", "Tong", "Qu", "Sheng", "Shi", "You", "Shi", "Ting", "Wu", "Nian", "Jing", "Hun", "Ju", "Yan", "Tu", "Ti", "Xi", "Xian", "Yan", "Lei", "Bi", "Yao", "Qiu", "Han", "Wu", "Wu", "Hou", "Xi", "Ge", "Zha", "Xiu", "Weng", "Zha", "Nong", "Nang", "Qi", "Zhai", "Ji", "Zi", "Ji", "Ji", "Qi", "Ji", "Chi", "Chen", "Chen", "He", "Ya", "Ken", "Xie", "Pao", "Cuo", "Shi", "Zi", "Chi", "Nian", "Ju", "Tiao", "Ling", "Ling", "Chu", "Quan", "Xie", "Ken", "Nie", "Jiu", "Yao", "Chuo", "Kun", "Yu", "Chu", "Yi", "Ni", "Cuo", "Zou", "Qu", "Nen", "Xian", "Ou", "E", "Wo", "Yi", "Chuo", "Zou", "Dian", "Chu", "Jin", "Ya", "Chi", "Chen", "He", "Ken", "Ju", "Ling", "Pao", "Tiao", "Zi", "Ken", "Yu", "Chuo", "Qu", "Wo", "Long", "Pang", "Gong", "Pang", "Yan", "Long", "Long", "Gong", "Kan", "Ta", "Ling", "Ta", "Long", "Gong", "Kan", "Gui", "Qiu", "Bie", "Gui", "Yue", "Chui", "He", "Jue", "Xie", "Yu"], ["it", "ix", "i", "ip", "iet", "iex", "ie", "iep", "at", "ax", "a", "ap", "uox", "uo", "uop", "ot", "ox", "o", "op", "ex", "e", "wu", "bit", "bix", "bi", "bip", "biet", "biex", "bie", "biep", "bat", "bax", "ba", "bap", "buox", "buo", "buop", "bot", "box", "bo", "bop", "bex", "be", "bep", "but", "bux", "bu", "bup", "burx", "bur", "byt", "byx", "by", "byp", "byrx", "byr", "pit", "pix", "pi", "pip", "piex", "pie", "piep", "pat", "pax", "pa", "pap", "puox", "puo", "puop", "pot", "pox", "po", "pop", "put", "pux", "pu", "pup", "purx", "pur", "pyt", "pyx", "py", "pyp", "pyrx", "pyr", "bbit", "bbix", "bbi", "bbip", "bbiet", "bbiex", "bbie", "bbiep", "bbat", "bbax", "bba", "bbap", "bbuox", "bbuo", "bbuop", "bbot", "bbox", "bbo", "bbop", "bbex", "bbe", "bbep", "bbut", "bbux", "bbu", "bbup", "bburx", "bbur", "bbyt", "bbyx", "bby", "bbyp", "nbit", "nbix", "nbi", "nbip", "nbiex", "nbie", "nbiep", "nbat", "nbax", "nba", "nbap", "nbot", "nbox", "nbo", "nbop", "nbut", "nbux", "nbu", "nbup", "nburx", "nbur", "nbyt", "nbyx", "nby", "nbyp", "nbyrx", "nbyr", "hmit", "hmix", "hmi", "hmip", "hmiex", "hmie", "hmiep", "hmat", "hmax", "hma", "hmap", "hmuox", "hmuo", "hmuop", "hmot", "hmox", "hmo", "hmop", "hmut", "hmux", "hmu", "hmup", "hmurx", "hmur", "hmyx", "hmy", "hmyp", "hmyrx", "hmyr", "mit", "mix", "mi", "mip", "miex", "mie", "miep", "mat", "max", "ma", "map", "muot", "muox", "muo", "muop", "mot", "mox", "mo", "mop", "mex", "me", "mut", "mux", "mu", "mup", "murx", "mur", "myt", "myx", "my", "myp", "fit", "fix", "fi", "fip", "fat", "fax", "fa", "fap", "fox", "fo", "fop", "fut", "fux", "fu", "fup", "furx", "fur", "fyt", "fyx", "fy", "fyp", "vit", "vix", "vi", "vip", "viet", "viex", "vie", "viep", "vat", "vax", "va", "vap", "vot", "vox", "vo", "vop", "vex", "vep", "vut", "vux", "vu", "vup", "vurx", "vur", "vyt", "vyx", "vy", "vyp", "vyrx", "vyr"], ["dit", "dix", "di", "dip", "diex", "die", "diep", "dat", "dax", "da", "dap", "duox", "duo", "dot", "dox", "do", "dop", "dex", "de", "dep", "dut", "dux", "du", "dup", "durx", "dur", "tit", "tix", "ti", "tip", "tiex", "tie", "tiep", "tat", "tax", "ta", "tap", "tuot", "tuox", "tuo", "tuop", "tot", "tox", "to", "top", "tex", "te", "tep", "tut", "tux", "tu", "tup", "turx", "tur", "ddit", "ddix", "ddi", "ddip", "ddiex", "ddie", "ddiep", "ddat", "ddax", "dda", "ddap", "dduox", "dduo", "dduop", "ddot", "ddox", "ddo", "ddop", "ddex", "dde", "ddep", "ddut", "ddux", "ddu", "ddup", "ddurx", "ddur", "ndit", "ndix", "ndi", "ndip", "ndiex", "ndie", "ndat", "ndax", "nda", "ndap", "ndot", "ndox", "ndo", "ndop", "ndex", "nde", "ndep", "ndut", "ndux", "ndu", "ndup", "ndurx", "ndur", "hnit", "hnix", "hni", "hnip", "hniet", "hniex", "hnie", "hniep", "hnat", "hnax", "hna", "hnap", "hnuox", "hnuo", "hnot", "hnox", "hnop", "hnex", "hne", "hnep", "hnut", "nit", "nix", "ni", "nip", "niex", "nie", "niep", "nax", "na", "nap", "nuox", "nuo", "nuop", "not", "nox", "no", "nop", "nex", "ne", "nep", "nut", "nux", "nu", "nup", "nurx", "nur", "hlit", "hlix", "hli", "hlip", "hliex", "hlie", "hliep", "hlat", "hlax", "hla", "hlap", "hluox", "hluo", "hluop", "hlox", "hlo", "hlop", "hlex", "hle", "hlep", "hlut", "hlux", "hlu", "hlup", "hlurx", "hlur", "hlyt", "hlyx", "hly", "hlyp", "hlyrx", "hlyr", "lit", "lix", "li", "lip", "liet", "liex", "lie", "liep", "lat", "lax", "la", "lap", "luot", "luox", "luo", "luop", "lot", "lox", "lo", "lop", "lex", "le", "lep", "lut", "lux", "lu", "lup", "lurx", "lur", "lyt", "lyx", "ly", "lyp", "lyrx", "lyr", "git", "gix", "gi", "gip", "giet", "giex", "gie", "giep", "gat", "gax", "ga", "gap", "guot", "guox", "guo", "guop", "got", "gox", "go", "gop", "get", "gex", "ge", "gep", "gut", "gux", "gu", "gup", "gurx", "gur", "kit", "kix", "ki", "kip", "kiex", "kie", "kiep", "kat"], ["kax", "ka", "kap", "kuox", "kuo", "kuop", "kot", "kox", "ko", "kop", "ket", "kex", "ke", "kep", "kut", "kux", "ku", "kup", "kurx", "kur", "ggit", "ggix", "ggi", "ggiex", "ggie", "ggiep", "ggat", "ggax", "gga", "ggap", "gguot", "gguox", "gguo", "gguop", "ggot", "ggox", "ggo", "ggop", "gget", "ggex", "gge", "ggep", "ggut", "ggux", "ggu", "ggup", "ggurx", "ggur", "mgiex", "mgie", "mgat", "mgax", "mga", "mgap", "mguox", "mguo", "mguop", "mgot", "mgox", "mgo", "mgop", "mgex", "mge", "mgep", "mgut", "mgux", "mgu", "mgup", "mgurx", "mgur", "hxit", "hxix", "hxi", "hxip", "hxiet", "hxiex", "hxie", "hxiep", "hxat", "hxax", "hxa", "hxap", "hxuot", "hxuox", "hxuo", "hxuop", "hxot", "hxox", "hxo", "hxop", "hxex", "hxe", "hxep", "ngiex", "ngie", "ngiep", "ngat", "ngax", "nga", "ngap", "nguot", "nguox", "nguo", "ngot", "ngox", "ngo", "ngop", "ngex", "nge", "ngep", "hit", "hiex", "hie", "hat", "hax", "ha", "hap", "huot", "huox", "huo", "huop", "hot", "hox", "ho", "hop", "hex", "he", "hep", "wat", "wax", "wa", "wap", "wuox", "wuo", "wuop", "wox", "wo", "wop", "wex", "we", "wep", "zit", "zix", "zi", "zip", "ziex", "zie", "ziep", "zat", "zax", "za", "zap", "zuox", "zuo", "zuop", "zot", "zox", "zo", "zop", "zex", "ze", "zep", "zut", "zux", "zu", "zup", "zurx", "zur", "zyt", "zyx", "zy", "zyp", "zyrx", "zyr", "cit", "cix", "ci", "cip", "ciet", "ciex", "cie", "ciep", "cat", "cax", "ca", "cap", "cuox", "cuo", "cuop", "cot", "cox", "co", "cop", "cex", "ce", "cep", "cut", "cux", "cu", "cup", "curx", "cur", "cyt", "cyx", "cy", "cyp", "cyrx", "cyr", "zzit", "zzix", "zzi", "zzip", "zziet", "zziex", "zzie", "zziep", "zzat", "zzax", "zza", "zzap", "zzox", "zzo", "zzop", "zzex", "zze", "zzep", "zzux", "zzu", "zzup", "zzurx", "zzur", "zzyt", "zzyx", "zzy", "zzyp", "zzyrx", "zzyr", "nzit", "nzix", "nzi", "nzip", "nziex", "nzie", "nziep", "nzat", "nzax", "nza", "nzap", "nzuox", "nzuo", "nzox", "nzop", "nzex", "nze", "nzux", "nzu"], ["nzup", "nzurx", "nzur", "nzyt", "nzyx", "nzy", "nzyp", "nzyrx", "nzyr", "sit", "six", "si", "sip", "siex", "sie", "siep", "sat", "sax", "sa", "sap", "suox", "suo", "suop", "sot", "sox", "so", "sop", "sex", "se", "sep", "sut", "sux", "su", "sup", "surx", "sur", "syt", "syx", "sy", "syp", "syrx", "syr", "ssit", "ssix", "ssi", "ssip", "ssiex", "ssie", "ssiep", "ssat", "ssax", "ssa", "ssap", "ssot", "ssox", "sso", "ssop", "ssex", "sse", "ssep", "ssut", "ssux", "ssu", "ssup", "ssyt", "ssyx", "ssy", "ssyp", "ssyrx", "ssyr", "zhat", "zhax", "zha", "zhap", "zhuox", "zhuo", "zhuop", "zhot", "zhox", "zho", "zhop", "zhet", "zhex", "zhe", "zhep", "zhut", "zhux", "zhu", "zhup", "zhurx", "zhur", "zhyt", "zhyx", "zhy", "zhyp", "zhyrx", "zhyr", "chat", "chax", "cha", "chap", "chuot", "chuox", "chuo", "chuop", "chot", "chox", "cho", "chop", "chet", "chex", "che", "chep", "chux", "chu", "chup", "churx", "chur", "chyt", "chyx", "chy", "chyp", "chyrx", "chyr", "rrax", "rra", "rruox", "rruo", "rrot", "rrox", "rro", "rrop", "rret", "rrex", "rre", "rrep", "rrut", "rrux", "rru", "rrup", "rrurx", "rrur", "rryt", "rryx", "rry", "rryp", "rryrx", "rryr", "nrat", "nrax", "nra", "nrap", "nrox", "nro", "nrop", "nret", "nrex", "nre", "nrep", "nrut", "nrux", "nru", "nrup", "nrurx", "nrur", "nryt", "nryx", "nry", "nryp", "nryrx", "nryr", "shat", "shax", "sha", "shap", "shuox", "shuo", "shuop", "shot", "shox", "sho", "shop", "shet", "shex", "she", "shep", "shut", "shux", "shu", "shup", "shurx", "shur", "shyt", "shyx", "shy", "shyp", "shyrx", "shyr", "rat", "rax", "ra", "rap", "ruox", "ruo", "ruop", "rot", "rox", "ro", "rop", "rex", "re", "rep", "rut", "rux", "ru", "rup", "rurx", "rur", "ryt", "ryx", "ry", "ryp", "ryrx", "ryr", "jit", "jix", "ji", "jip", "jiet", "jiex", "jie", "jiep", "juot", "juox", "juo", "juop", "jot", "jox", "jo", "jop", "jut", "jux", "ju", "jup", "jurx", "jur", "jyt", "jyx", "jy", "jyp", "jyrx", "jyr", "qit", "qix", "qi", "qip"], ["qiet", "qiex", "qie", "qiep", "quot", "quox", "quo", "quop", "qot", "qox", "qo", "qop", "qut", "qux", "qu", "qup", "qurx", "qur", "qyt", "qyx", "qy", "qyp", "qyrx", "qyr", "jjit", "jjix", "jji", "jjip", "jjiet", "jjiex", "jjie", "jjiep", "jjuox", "jjuo", "jjuop", "jjot", "jjox", "jjo", "jjop", "jjut", "jjux", "jju", "jjup", "jjurx", "jjur", "jjyt", "jjyx", "jjy", "jjyp", "njit", "njix", "nji", "njip", "njiet", "njiex", "njie", "njiep", "njuox", "njuo", "njot", "njox", "njo", "njop", "njux", "nju", "njup", "njurx", "njur", "njyt", "njyx", "njy", "njyp", "njyrx", "njyr", "nyit", "nyix", "nyi", "nyip", "nyiet", "nyiex", "nyie", "nyiep", "nyuox", "nyuo", "nyuop", "nyot", "nyox", "nyo", "nyop", "nyut", "nyux", "nyu", "nyup", "xit", "xix", "xi", "xip", "xiet", "xiex", "xie", "xiep", "xuox", "xuo", "xot", "xox", "xo", "xop", "xyt", "xyx", "xy", "xyp", "xyrx", "xyr", "yit", "yix", "yi", "yip", "yiet", "yiex", "yie", "yiep", "yuot", "yuox", "yuo", "yuop", "yot", "yox", "yo", "yop", "yut", "yux", "yu", "yup", "yurx", "yur", "yyt", "yyx", "yy", "yyp", "yyrx", "yyr", , , , "Qot", "Li", "Kit", "Nyip", "Cyp", "Ssi", "Ggop", "Gep", "Mi", "Hxit", "Lyr", "Bbut", "Mop", "Yo", "Put", "Hxuo", "Tat", "Ga", , , "Ddur", "Bur", "Gguo", "Nyop", "Tu", "Op", "Jjut", "Zot", "Pyt", "Hmo", "Yit", "Vur", "Shy", "Vep", "Za", "Jo", , "Jjy", "Got", "Jjie", "Wo", "Du", "Shur", "Lie", "Cy", "Cuop", "Cip", "Hxop", "Shat", , "Shop", "Che", "Zziet", , "Ke"], [], [], [, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "A", "a", "A", "a", "HENG", "heng", "TZ", "tz", "3", "3", "4", "4", "4", "4", "F", "S", "AA", "aa", "AO", "ao", "AU", "au", "AV", "av", "AV-", "av-", "AY", "ay", "C", "c", "K", "k", "K", "k", "K", "k", "L", "l", "L", "l", "O", "o", "O", "o", "OO", "oo", "P", "p", "P", "p", "P", "p", "Q", "q", "Q", "q", "R", "r", "R", "r", "V", "v", "VY", "vy", "Z", "z", "TH", "th", "TH", "th", "Y", "y", "ET", "et", "IS", "is", "CON", "con", "US", "us", "dum", "lum", "num", "rum", "RUM", "tum", "um", "D", "d", "F", "f", "G", "G", "g", "L", "l", "R", "r", "S", "s", "T", "t", "^", ":", "=", "'", "'", "H", "l", ".", "N", "n", "C", "c", "c", "h", "B", "b", "F", "f", "AE", "ae", "OE", "oe", "UE", "ue", "G", "g", "K", "k", "N", "n", "R", "r", "S", "s", "H", "E", "G", "L", "I", "Q", "K", "T", "J", "CHI", "B", "b", "O", "o", "U", "u", , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "I", "H", "oe", "M", "F", "P", "M", "I", "M1"], [], [], [], [], ["ga", "gag", "gagg", "gags", "gan", "ganj", "ganh", "gad", "gal", "galg", "galm", "galb", "gals", "galt", "galp", "galh", "gam", "gab", "gabs", "gas", "gass", "gang", "gaj", "gac", "gak", "gat", "gap", "gah", "gae", "gaeg", "gaegg", "gaegs", "gaen", "gaenj", "gaenh", "gaed", "gael", "gaelg", "gaelm", "gaelb", "gaels", "gaelt", "gaelp", "gaelh", "gaem", "gaeb", "gaebs", "gaes", "gaess", "gaeng", "gaej", "gaec", "gaek", "gaet", "gaep", "gaeh", "gya", "gyag", "gyagg", "gyags", "gyan", "gyanj", "gyanh", "gyad", "gyal", "gyalg", "gyalm", "gyalb", "gyals", "gyalt", "gyalp", "gyalh", "gyam", "gyab", "gyabs", "gyas", "gyass", "gyang", "gyaj", "gyac", "gyak", "gyat", "gyap", "gyah", "gyae", "gyaeg", "gyaegg", "gyaegs", "gyaen", "gyaenj", "gyaenh", "gyaed", "gyael", "gyaelg", "gyaelm", "gyaelb", "gyaels", "gyaelt", "gyaelp", "gyaelh", "gyaem", "gyaeb", "gyaebs", "gyaes", "gyaess", "gyaeng", "gyaej", "gyaec", "gyaek", "gyaet", "gyaep", "gyaeh", "geo", "geog", "geogg", "geogs", "geon", "geonj", "geonh", "geod", "geol", "geolg", "geolm", "geolb", "geols", "geolt", "geolp", "geolh", "geom", "geob", "geobs", "geos", "geoss", "geong", "geoj", "geoc", "geok", "geot", "geop", "geoh", "ge", "geg", "gegg", "gegs", "gen", "genj", "genh", "ged", "gel", "gelg", "gelm", "gelb", "gels", "gelt", "gelp", "gelh", "gem", "geb", "gebs", "ges", "gess", "geng", "gej", "gec", "gek", "get", "gep", "geh", "gyeo", "gyeog", "gyeogg", "gyeogs", "gyeon", "gyeonj", "gyeonh", "gyeod", "gyeol", "gyeolg", "gyeolm", "gyeolb", "gyeols", "gyeolt", "gyeolp", "gyeolh", "gyeom", "gyeob", "gyeobs", "gyeos", "gyeoss", "gyeong", "gyeoj", "gyeoc", "gyeok", "gyeot", "gyeop", "gyeoh", "gye", "gyeg", "gyegg", "gyegs", "gyen", "gyenj", "gyenh", "gyed", "gyel", "gyelg", "gyelm", "gyelb", "gyels", "gyelt", "gyelp", "gyelh", "gyem", "gyeb", "gyebs", "gyes", "gyess", "gyeng", "gyej", "gyec", "gyek", "gyet", "gyep", "gyeh", "go", "gog", "gogg", "gogs", "gon", "gonj", "gonh", "god", "gol", "golg", "golm", "golb", "gols", "golt", "golp", "golh", "gom", "gob", "gobs", "gos", "goss", "gong", "goj", "goc", "gok", "got", "gop", "goh", "gwa", "gwag", "gwagg", "gwags"], ["gwan", "gwanj", "gwanh", "gwad", "gwal", "gwalg", "gwalm", "gwalb", "gwals", "gwalt", "gwalp", "gwalh", "gwam", "gwab", "gwabs", "gwas", "gwass", "gwang", "gwaj", "gwac", "gwak", "gwat", "gwap", "gwah", "gwae", "gwaeg", "gwaegg", "gwaegs", "gwaen", "gwaenj", "gwaenh", "gwaed", "gwael", "gwaelg", "gwaelm", "gwaelb", "gwaels", "gwaelt", "gwaelp", "gwaelh", "gwaem", "gwaeb", "gwaebs", "gwaes", "gwaess", "gwaeng", "gwaej", "gwaec", "gwaek", "gwaet", "gwaep", "gwaeh", "goe", "goeg", "goegg", "goegs", "goen", "goenj", "goenh", "goed", "goel", "goelg", "goelm", "goelb", "goels", "goelt", "goelp", "goelh", "goem", "goeb", "goebs", "goes", "goess", "goeng", "goej", "goec", "goek", "goet", "goep", "goeh", "gyo", "gyog", "gyogg", "gyogs", "gyon", "gyonj", "gyonh", "gyod", "gyol", "gyolg", "gyolm", "gyolb", "gyols", "gyolt", "gyolp", "gyolh", "gyom", "gyob", "gyobs", "gyos", "gyoss", "gyong", "gyoj", "gyoc", "gyok", "gyot", "gyop", "gyoh", "gu", "gug", "gugg", "gugs", "gun", "gunj", "gunh", "gud", "gul", "gulg", "gulm", "gulb", "guls", "gult", "gulp", "gulh", "gum", "gub", "gubs", "gus", "guss", "gung", "guj", "guc", "guk", "gut", "gup", "guh", "gweo", "gweog", "gweogg", "gweogs", "gweon", "gweonj", "gweonh", "gweod", "gweol", "gweolg", "gweolm", "gweolb", "gweols", "gweolt", "gweolp", "gweolh", "gweom", "gweob", "gweobs", "gweos", "gweoss", "gweong", "gweoj", "gweoc", "gweok", "gweot", "gweop", "gweoh", "gwe", "gweg", "gwegg", "gwegs", "gwen", "gwenj", "gwenh", "gwed", "gwel", "gwelg", "gwelm", "gwelb", "gwels", "gwelt", "gwelp", "gwelh", "gwem", "gweb", "gwebs", "gwes", "gwess", "gweng", "gwej", "gwec", "gwek", "gwet", "gwep", "gweh", "gwi", "gwig", "gwigg", "gwigs", "gwin", "gwinj", "gwinh", "gwid", "gwil", "gwilg", "gwilm", "gwilb", "gwils", "gwilt", "gwilp", "gwilh", "gwim", "gwib", "gwibs", "gwis", "gwiss", "gwing", "gwij", "gwic", "gwik", "gwit", "gwip", "gwih", "gyu", "gyug", "gyugg", "gyugs", "gyun", "gyunj", "gyunh", "gyud", "gyul", "gyulg", "gyulm", "gyulb", "gyuls", "gyult", "gyulp", "gyulh", "gyum", "gyub", "gyubs", "gyus", "gyuss", "gyung", "gyuj", "gyuc", "gyuk", "gyut", "gyup", "gyuh", "geu", "geug", "geugg", "geugs", "geun", "geunj", "geunh", "geud"], ["geul", "geulg", "geulm", "geulb", "geuls", "geult", "geulp", "geulh", "geum", "geub", "geubs", "geus", "geuss", "geung", "geuj", "geuc", "geuk", "geut", "geup", "geuh", "gyi", "gyig", "gyigg", "gyigs", "gyin", "gyinj", "gyinh", "gyid", "gyil", "gyilg", "gyilm", "gyilb", "gyils", "gyilt", "gyilp", "gyilh", "gyim", "gyib", "gyibs", "gyis", "gyiss", "gying", "gyij", "gyic", "gyik", "gyit", "gyip", "gyih", "gi", "gig", "gigg", "gigs", "gin", "ginj", "ginh", "gid", "gil", "gilg", "gilm", "gilb", "gils", "gilt", "gilp", "gilh", "gim", "gib", "gibs", "gis", "giss", "ging", "gij", "gic", "gik", "git", "gip", "gih", "gga", "ggag", "ggagg", "ggags", "ggan", "gganj", "gganh", "ggad", "ggal", "ggalg", "ggalm", "ggalb", "ggals", "ggalt", "ggalp", "ggalh", "ggam", "ggab", "ggabs", "ggas", "ggass", "ggang", "ggaj", "ggac", "ggak", "ggat", "ggap", "ggah", "ggae", "ggaeg", "ggaegg", "ggaegs", "ggaen", "ggaenj", "ggaenh", "ggaed", "ggael", "ggaelg", "ggaelm", "ggaelb", "ggaels", "ggaelt", "ggaelp", "ggaelh", "ggaem", "ggaeb", "ggaebs", "ggaes", "ggaess", "ggaeng", "ggaej", "ggaec", "ggaek", "ggaet", "ggaep", "ggaeh", "ggya", "ggyag", "ggyagg", "ggyags", "ggyan", "ggyanj", "ggyanh", "ggyad", "ggyal", "ggyalg", "ggyalm", "ggyalb", "ggyals", "ggyalt", "ggyalp", "ggyalh", "ggyam", "ggyab", "ggyabs", "ggyas", "ggyass", "ggyang", "ggyaj", "ggyac", "ggyak", "ggyat", "ggyap", "ggyah", "ggyae", "ggyaeg", "ggyaegg", "ggyaegs", "ggyaen", "ggyaenj", "ggyaenh", "ggyaed", "ggyael", "ggyaelg", "ggyaelm", "ggyaelb", "ggyaels", "ggyaelt", "ggyaelp", "ggyaelh", "ggyaem", "ggyaeb", "ggyaebs", "ggyaes", "ggyaess", "ggyaeng", "ggyaej", "ggyaec", "ggyaek", "ggyaet", "ggyaep", "ggyaeh", "ggeo", "ggeog", "ggeogg", "ggeogs", "ggeon", "ggeonj", "ggeonh", "ggeod", "ggeol", "ggeolg", "ggeolm", "ggeolb", "ggeols", "ggeolt", "ggeolp", "ggeolh", "ggeom", "ggeob", "ggeobs", "ggeos", "ggeoss", "ggeong", "ggeoj", "ggeoc", "ggeok", "ggeot", "ggeop", "ggeoh", "gge", "ggeg", "ggegg", "ggegs", "ggen", "ggenj", "ggenh", "gged", "ggel", "ggelg", "ggelm", "ggelb", "ggels", "ggelt", "ggelp", "ggelh", "ggem", "ggeb", "ggebs", "gges", "ggess", "ggeng", "ggej", "ggec", "ggek", "gget", "ggep", "ggeh", "ggyeo", "ggyeog", "ggyeogg", "ggyeogs", "ggyeon", "ggyeonj", "ggyeonh", "ggyeod", "ggyeol", "ggyeolg", "ggyeolm", "ggyeolb"], ["ggyeols", "ggyeolt", "ggyeolp", "ggyeolh", "ggyeom", "ggyeob", "ggyeobs", "ggyeos", "ggyeoss", "ggyeong", "ggyeoj", "ggyeoc", "ggyeok", "ggyeot", "ggyeop", "ggyeoh", "ggye", "ggyeg", "ggyegg", "ggyegs", "ggyen", "ggyenj", "ggyenh", "ggyed", "ggyel", "ggyelg", "ggyelm", "ggyelb", "ggyels", "ggyelt", "ggyelp", "ggyelh", "ggyem", "ggyeb", "ggyebs", "ggyes", "ggyess", "ggyeng", "ggyej", "ggyec", "ggyek", "ggyet", "ggyep", "ggyeh", "ggo", "ggog", "ggogg", "ggogs", "ggon", "ggonj", "ggonh", "ggod", "ggol", "ggolg", "ggolm", "ggolb", "ggols", "ggolt", "ggolp", "ggolh", "ggom", "ggob", "ggobs", "ggos", "ggoss", "ggong", "ggoj", "ggoc", "ggok", "ggot", "ggop", "ggoh", "ggwa", "ggwag", "ggwagg", "ggwags", "ggwan", "ggwanj", "ggwanh", "ggwad", "ggwal", "ggwalg", "ggwalm", "ggwalb", "ggwals", "ggwalt", "ggwalp", "ggwalh", "ggwam", "ggwab", "ggwabs", "ggwas", "ggwass", "ggwang", "ggwaj", "ggwac", "ggwak", "ggwat", "ggwap", "ggwah", "ggwae", "ggwaeg", "ggwaegg", "ggwaegs", "ggwaen", "ggwaenj", "ggwaenh", "ggwaed", "ggwael", "ggwaelg", "ggwaelm", "ggwaelb", "ggwaels", "ggwaelt", "ggwaelp", "ggwaelh", "ggwaem", "ggwaeb", "ggwaebs", "ggwaes", "ggwaess", "ggwaeng", "ggwaej", "ggwaec", "ggwaek", "ggwaet", "ggwaep", "ggwaeh", "ggoe", "ggoeg", "ggoegg", "ggoegs", "ggoen", "ggoenj", "ggoenh", "ggoed", "ggoel", "ggoelg", "ggoelm", "ggoelb", "ggoels", "ggoelt", "ggoelp", "ggoelh", "ggoem", "ggoeb", "ggoebs", "ggoes", "ggoess", "ggoeng", "ggoej", "ggoec", "ggoek", "ggoet", "ggoep", "ggoeh", "ggyo", "ggyog", "ggyogg", "ggyogs", "ggyon", "ggyonj", "ggyonh", "ggyod", "ggyol", "ggyolg", "ggyolm", "ggyolb", "ggyols", "ggyolt", "ggyolp", "ggyolh", "ggyom", "ggyob", "ggyobs", "ggyos", "ggyoss", "ggyong", "ggyoj", "ggyoc", "ggyok", "ggyot", "ggyop", "ggyoh", "ggu", "ggug", "ggugg", "ggugs", "ggun", "ggunj", "ggunh", "ggud", "ggul", "ggulg", "ggulm", "ggulb", "gguls", "ggult", "ggulp", "ggulh", "ggum", "ggub", "ggubs", "ggus", "gguss", "ggung", "gguj", "gguc", "gguk", "ggut", "ggup", "gguh", "ggweo", "ggweog", "ggweogg", "ggweogs", "ggweon", "ggweonj", "ggweonh", "ggweod", "ggweol", "ggweolg", "ggweolm", "ggweolb", "ggweols", "ggweolt", "ggweolp", "ggweolh", "ggweom", "ggweob", "ggweobs", "ggweos", "ggweoss", "ggweong", "ggweoj", "ggweoc", "ggweok", "ggweot", "ggweop", "ggweoh", "ggwe", "ggweg", "ggwegg", "ggwegs", "ggwen", "ggwenj", "ggwenh", "ggwed", "ggwel", "ggwelg", "ggwelm", "ggwelb", "ggwels", "ggwelt", "ggwelp", "ggwelh"], ["ggwem", "ggweb", "ggwebs", "ggwes", "ggwess", "ggweng", "ggwej", "ggwec", "ggwek", "ggwet", "ggwep", "ggweh", "ggwi", "ggwig", "ggwigg", "ggwigs", "ggwin", "ggwinj", "ggwinh", "ggwid", "ggwil", "ggwilg", "ggwilm", "ggwilb", "ggwils", "ggwilt", "ggwilp", "ggwilh", "ggwim", "ggwib", "ggwibs", "ggwis", "ggwiss", "ggwing", "ggwij", "ggwic", "ggwik", "ggwit", "ggwip", "ggwih", "ggyu", "ggyug", "ggyugg", "ggyugs", "ggyun", "ggyunj", "ggyunh", "ggyud", "ggyul", "ggyulg", "ggyulm", "ggyulb", "ggyuls", "ggyult", "ggyulp", "ggyulh", "ggyum", "ggyub", "ggyubs", "ggyus", "ggyuss", "ggyung", "ggyuj", "ggyuc", "ggyuk", "ggyut", "ggyup", "ggyuh", "ggeu", "ggeug", "ggeugg", "ggeugs", "ggeun", "ggeunj", "ggeunh", "ggeud", "ggeul", "ggeulg", "ggeulm", "ggeulb", "ggeuls", "ggeult", "ggeulp", "ggeulh", "ggeum", "ggeub", "ggeubs", "ggeus", "ggeuss", "ggeung", "ggeuj", "ggeuc", "ggeuk", "ggeut", "ggeup", "ggeuh", "ggyi", "ggyig", "ggyigg", "ggyigs", "ggyin", "ggyinj", "ggyinh", "ggyid", "ggyil", "ggyilg", "ggyilm", "ggyilb", "ggyils", "ggyilt", "ggyilp", "ggyilh", "ggyim", "ggyib", "ggyibs", "ggyis", "ggyiss", "ggying", "ggyij", "ggyic", "ggyik", "ggyit", "ggyip", "ggyih", "ggi", "ggig", "ggigg", "ggigs", "ggin", "gginj", "gginh", "ggid", "ggil", "ggilg", "ggilm", "ggilb", "ggils", "ggilt", "ggilp", "ggilh", "ggim", "ggib", "ggibs", "ggis", "ggiss", "gging", "ggij", "ggic", "ggik", "ggit", "ggip", "ggih", "na", "nag", "nagg", "nags", "nan", "nanj", "nanh", "nad", "nal", "nalg", "nalm", "nalb", "nals", "nalt", "nalp", "nalh", "nam", "nab", "nabs", "nas", "nass", "nang", "naj", "nac", "nak", "nat", "nap", "nah", "nae", "naeg", "naegg", "naegs", "naen", "naenj", "naenh", "naed", "nael", "naelg", "naelm", "naelb", "naels", "naelt", "naelp", "naelh", "naem", "naeb", "naebs", "naes", "naess", "naeng", "naej", "naec", "naek", "naet", "naep", "naeh", "nya", "nyag", "nyagg", "nyags", "nyan", "nyanj", "nyanh", "nyad", "nyal", "nyalg", "nyalm", "nyalb", "nyals", "nyalt", "nyalp", "nyalh", "nyam", "nyab", "nyabs", "nyas", "nyass", "nyang", "nyaj", "nyac", "nyak", "nyat", "nyap", "nyah", "nyae", "nyaeg", "nyaegg", "nyaegs", "nyaen", "nyaenj", "nyaenh", "nyaed", "nyael", "nyaelg", "nyaelm", "nyaelb", "nyaels", "nyaelt", "nyaelp", "nyaelh", "nyaem", "nyaeb", "nyaebs", "nyaes"], ["nyaess", "nyaeng", "nyaej", "nyaec", "nyaek", "nyaet", "nyaep", "nyaeh", "neo", "neog", "neogg", "neogs", "neon", "neonj", "neonh", "neod", "neol", "neolg", "neolm", "neolb", "neols", "neolt", "neolp", "neolh", "neom", "neob", "neobs", "neos", "neoss", "neong", "neoj", "neoc", "neok", "neot", "neop", "neoh", "ne", "neg", "negg", "negs", "nen", "nenj", "nenh", "ned", "nel", "nelg", "nelm", "nelb", "nels", "nelt", "nelp", "nelh", "nem", "neb", "nebs", "nes", "ness", "neng", "nej", "nec", "nek", "net", "nep", "neh", "nyeo", "nyeog", "nyeogg", "nyeogs", "nyeon", "nyeonj", "nyeonh", "nyeod", "nyeol", "nyeolg", "nyeolm", "nyeolb", "nyeols", "nyeolt", "nyeolp", "nyeolh", "nyeom", "nyeob", "nyeobs", "nyeos", "nyeoss", "nyeong", "nyeoj", "nyeoc", "nyeok", "nyeot", "nyeop", "nyeoh", "nye", "nyeg", "nyegg", "nyegs", "nyen", "nyenj", "nyenh", "nyed", "nyel", "nyelg", "nyelm", "nyelb", "nyels", "nyelt", "nyelp", "nyelh", "nyem", "nyeb", "nyebs", "nyes", "nyess", "nyeng", "nyej", "nyec", "nyek", "nyet", "nyep", "nyeh", "no", "nog", "nogg", "nogs", "non", "nonj", "nonh", "nod", "nol", "nolg", "nolm", "nolb", "nols", "nolt", "nolp", "nolh", "nom", "nob", "nobs", "nos", "noss", "nong", "noj", "noc", "nok", "not", "nop", "noh", "nwa", "nwag", "nwagg", "nwags", "nwan", "nwanj", "nwanh", "nwad", "nwal", "nwalg", "nwalm", "nwalb", "nwals", "nwalt", "nwalp", "nwalh", "nwam", "nwab", "nwabs", "nwas", "nwass", "nwang", "nwaj", "nwac", "nwak", "nwat", "nwap", "nwah", "nwae", "nwaeg", "nwaegg", "nwaegs", "nwaen", "nwaenj", "nwaenh", "nwaed", "nwael", "nwaelg", "nwaelm", "nwaelb", "nwaels", "nwaelt", "nwaelp", "nwaelh", "nwaem", "nwaeb", "nwaebs", "nwaes", "nwaess", "nwaeng", "nwaej", "nwaec", "nwaek", "nwaet", "nwaep", "nwaeh", "noe", "noeg", "noegg", "noegs", "noen", "noenj", "noenh", "noed", "noel", "noelg", "noelm", "noelb", "noels", "noelt", "noelp", "noelh", "noem", "noeb", "noebs", "noes", "noess", "noeng", "noej", "noec", "noek", "noet", "noep", "noeh", "nyo", "nyog", "nyogg", "nyogs", "nyon", "nyonj", "nyonh", "nyod", "nyol", "nyolg", "nyolm", "nyolb", "nyols", "nyolt", "nyolp", "nyolh", "nyom", "nyob", "nyobs", "nyos", "nyoss", "nyong", "nyoj", "nyoc"], ["nyok", "nyot", "nyop", "nyoh", "nu", "nug", "nugg", "nugs", "nun", "nunj", "nunh", "nud", "nul", "nulg", "nulm", "nulb", "nuls", "nult", "nulp", "nulh", "num", "nub", "nubs", "nus", "nuss", "nung", "nuj", "nuc", "nuk", "nut", "nup", "nuh", "nweo", "nweog", "nweogg", "nweogs", "nweon", "nweonj", "nweonh", "nweod", "nweol", "nweolg", "nweolm", "nweolb", "nweols", "nweolt", "nweolp", "nweolh", "nweom", "nweob", "nweobs", "nweos", "nweoss", "nweong", "nweoj", "nweoc", "nweok", "nweot", "nweop", "nweoh", "nwe", "nweg", "nwegg", "nwegs", "nwen", "nwenj", "nwenh", "nwed", "nwel", "nwelg", "nwelm", "nwelb", "nwels", "nwelt", "nwelp", "nwelh", "nwem", "nweb", "nwebs", "nwes", "nwess", "nweng", "nwej", "nwec", "nwek", "nwet", "nwep", "nweh", "nwi", "nwig", "nwigg", "nwigs", "nwin", "nwinj", "nwinh", "nwid", "nwil", "nwilg", "nwilm", "nwilb", "nwils", "nwilt", "nwilp", "nwilh", "nwim", "nwib", "nwibs", "nwis", "nwiss", "nwing", "nwij", "nwic", "nwik", "nwit", "nwip", "nwih", "nyu", "nyug", "nyugg", "nyugs", "nyun", "nyunj", "nyunh", "nyud", "nyul", "nyulg", "nyulm", "nyulb", "nyuls", "nyult", "nyulp", "nyulh", "nyum", "nyub", "nyubs", "nyus", "nyuss", "nyung", "nyuj", "nyuc", "nyuk", "nyut", "nyup", "nyuh", "neu", "neug", "neugg", "neugs", "neun", "neunj", "neunh", "neud", "neul", "neulg", "neulm", "neulb", "neuls", "neult", "neulp", "neulh", "neum", "neub", "neubs", "neus", "neuss", "neung", "neuj", "neuc", "neuk", "neut", "neup", "neuh", "nyi", "nyig", "nyigg", "nyigs", "nyin", "nyinj", "nyinh", "nyid", "nyil", "nyilg", "nyilm", "nyilb", "nyils", "nyilt", "nyilp", "nyilh", "nyim", "nyib", "nyibs", "nyis", "nyiss", "nying", "nyij", "nyic", "nyik", "nyit", "nyip", "nyih", "ni", "nig", "nigg", "nigs", "nin", "ninj", "ninh", "nid", "nil", "nilg", "nilm", "nilb", "nils", "nilt", "nilp", "nilh", "nim", "nib", "nibs", "nis", "niss", "ning", "nij", "nic", "nik", "nit", "nip", "nih", "da", "dag", "dagg", "dags", "dan", "danj", "danh", "dad", "dal", "dalg", "dalm", "dalb", "dals", "dalt", "dalp", "dalh", "dam", "dab", "dabs", "das", "dass", "dang", "daj", "dac", "dak", "dat", "dap", "dah"], ["dae", "daeg", "daegg", "daegs", "daen", "daenj", "daenh", "daed", "dael", "daelg", "daelm", "daelb", "daels", "daelt", "daelp", "daelh", "daem", "daeb", "daebs", "daes", "daess", "daeng", "daej", "daec", "daek", "daet", "daep", "daeh", "dya", "dyag", "dyagg", "dyags", "dyan", "dyanj", "dyanh", "dyad", "dyal", "dyalg", "dyalm", "dyalb", "dyals", "dyalt", "dyalp", "dyalh", "dyam", "dyab", "dyabs", "dyas", "dyass", "dyang", "dyaj", "dyac", "dyak", "dyat", "dyap", "dyah", "dyae", "dyaeg", "dyaegg", "dyaegs", "dyaen", "dyaenj", "dyaenh", "dyaed", "dyael", "dyaelg", "dyaelm", "dyaelb", "dyaels", "dyaelt", "dyaelp", "dyaelh", "dyaem", "dyaeb", "dyaebs", "dyaes", "dyaess", "dyaeng", "dyaej", "dyaec", "dyaek", "dyaet", "dyaep", "dyaeh", "deo", "deog", "deogg", "deogs", "deon", "deonj", "deonh", "deod", "deol", "deolg", "deolm", "deolb", "deols", "deolt", "deolp", "deolh", "deom", "deob", "deobs", "deos", "deoss", "deong", "deoj", "deoc", "deok", "deot", "deop", "deoh", "de", "deg", "degg", "degs", "den", "denj", "denh", "ded", "del", "delg", "delm", "delb", "dels", "delt", "delp", "delh", "dem", "deb", "debs", "des", "dess", "deng", "dej", "dec", "dek", "det", "dep", "deh", "dyeo", "dyeog", "dyeogg", "dyeogs", "dyeon", "dyeonj", "dyeonh", "dyeod", "dyeol", "dyeolg", "dyeolm", "dyeolb", "dyeols", "dyeolt", "dyeolp", "dyeolh", "dyeom", "dyeob", "dyeobs", "dyeos", "dyeoss", "dyeong", "dyeoj", "dyeoc", "dyeok", "dyeot", "dyeop", "dyeoh", "dye", "dyeg", "dyegg", "dyegs", "dyen", "dyenj", "dyenh", "dyed", "dyel", "dyelg", "dyelm", "dyelb", "dyels", "dyelt", "dyelp", "dyelh", "dyem", "dyeb", "dyebs", "dyes", "dyess", "dyeng", "dyej", "dyec", "dyek", "dyet", "dyep", "dyeh", "do", "dog", "dogg", "dogs", "don", "donj", "donh", "dod", "dol", "dolg", "dolm", "dolb", "dols", "dolt", "dolp", "dolh", "dom", "dob", "dobs", "dos", "doss", "dong", "doj", "doc", "dok", "dot", "dop", "doh", "dwa", "dwag", "dwagg", "dwags", "dwan", "dwanj", "dwanh", "dwad", "dwal", "dwalg", "dwalm", "dwalb", "dwals", "dwalt", "dwalp", "dwalh", "dwam", "dwab", "dwabs", "dwas", "dwass", "dwang", "dwaj", "dwac", "dwak", "dwat", "dwap", "dwah", "dwae", "dwaeg", "dwaegg", "dwaegs"], ["dwaen", "dwaenj", "dwaenh", "dwaed", "dwael", "dwaelg", "dwaelm", "dwaelb", "dwaels", "dwaelt", "dwaelp", "dwaelh", "dwaem", "dwaeb", "dwaebs", "dwaes", "dwaess", "dwaeng", "dwaej", "dwaec", "dwaek", "dwaet", "dwaep", "dwaeh", "doe", "doeg", "doegg", "doegs", "doen", "doenj", "doenh", "doed", "doel", "doelg", "doelm", "doelb", "doels", "doelt", "doelp", "doelh", "doem", "doeb", "doebs", "does", "doess", "doeng", "doej", "doec", "doek", "doet", "doep", "doeh", "dyo", "dyog", "dyogg", "dyogs", "dyon", "dyonj", "dyonh", "dyod", "dyol", "dyolg", "dyolm", "dyolb", "dyols", "dyolt", "dyolp", "dyolh", "dyom", "dyob", "dyobs", "dyos", "dyoss", "dyong", "dyoj", "dyoc", "dyok", "dyot", "dyop", "dyoh", "du", "dug", "dugg", "dugs", "dun", "dunj", "dunh", "dud", "dul", "dulg", "dulm", "dulb", "duls", "dult", "dulp", "dulh", "dum", "dub", "dubs", "dus", "duss", "dung", "duj", "duc", "duk", "dut", "dup", "duh", "dweo", "dweog", "dweogg", "dweogs", "dweon", "dweonj", "dweonh", "dweod", "dweol", "dweolg", "dweolm", "dweolb", "dweols", "dweolt", "dweolp", "dweolh", "dweom", "dweob", "dweobs", "dweos", "dweoss", "dweong", "dweoj", "dweoc", "dweok", "dweot", "dweop", "dweoh", "dwe", "dweg", "dwegg", "dwegs", "dwen", "dwenj", "dwenh", "dwed", "dwel", "dwelg", "dwelm", "dwelb", "dwels", "dwelt", "dwelp", "dwelh", "dwem", "dweb", "dwebs", "dwes", "dwess", "dweng", "dwej", "dwec", "dwek", "dwet", "dwep", "dweh", "dwi", "dwig", "dwigg", "dwigs", "dwin", "dwinj", "dwinh", "dwid", "dwil", "dwilg", "dwilm", "dwilb", "dwils", "dwilt", "dwilp", "dwilh", "dwim", "dwib", "dwibs", "dwis", "dwiss", "dwing", "dwij", "dwic", "dwik", "dwit", "dwip", "dwih", "dyu", "dyug", "dyugg", "dyugs", "dyun", "dyunj", "dyunh", "dyud", "dyul", "dyulg", "dyulm", "dyulb", "dyuls", "dyult", "dyulp", "dyulh", "dyum", "dyub", "dyubs", "dyus", "dyuss", "dyung", "dyuj", "dyuc", "dyuk", "dyut", "dyup", "dyuh", "deu", "deug", "deugg", "deugs", "deun", "deunj", "deunh", "deud", "deul", "deulg", "deulm", "deulb", "deuls", "deult", "deulp", "deulh", "deum", "deub", "deubs", "deus", "deuss", "deung", "deuj", "deuc", "deuk", "deut", "deup", "deuh", "dyi", "dyig", "dyigg", "dyigs", "dyin", "dyinj", "dyinh", "dyid"], ["dyil", "dyilg", "dyilm", "dyilb", "dyils", "dyilt", "dyilp", "dyilh", "dyim", "dyib", "dyibs", "dyis", "dyiss", "dying", "dyij", "dyic", "dyik", "dyit", "dyip", "dyih", "di", "dig", "digg", "digs", "din", "dinj", "dinh", "did", "dil", "dilg", "dilm", "dilb", "dils", "dilt", "dilp", "dilh", "dim", "dib", "dibs", "dis", "diss", "ding", "dij", "dic", "dik", "dit", "dip", "dih", "dda", "ddag", "ddagg", "ddags", "ddan", "ddanj", "ddanh", "ddad", "ddal", "ddalg", "ddalm", "ddalb", "ddals", "ddalt", "ddalp", "ddalh", "ddam", "ddab", "ddabs", "ddas", "ddass", "ddang", "ddaj", "ddac", "ddak", "ddat", "ddap", "ddah", "ddae", "ddaeg", "ddaegg", "ddaegs", "ddaen", "ddaenj", "ddaenh", "ddaed", "ddael", "ddaelg", "ddaelm", "ddaelb", "ddaels", "ddaelt", "ddaelp", "ddaelh", "ddaem", "ddaeb", "ddaebs", "ddaes", "ddaess", "ddaeng", "ddaej", "ddaec", "ddaek", "ddaet", "ddaep", "ddaeh", "ddya", "ddyag", "ddyagg", "ddyags", "ddyan", "ddyanj", "ddyanh", "ddyad", "ddyal", "ddyalg", "ddyalm", "ddyalb", "ddyals", "ddyalt", "ddyalp", "ddyalh", "ddyam", "ddyab", "ddyabs", "ddyas", "ddyass", "ddyang", "ddyaj", "ddyac", "ddyak", "ddyat", "ddyap", "ddyah", "ddyae", "ddyaeg", "ddyaegg", "ddyaegs", "ddyaen", "ddyaenj", "ddyaenh", "ddyaed", "ddyael", "ddyaelg", "ddyaelm", "ddyaelb", "ddyaels", "ddyaelt", "ddyaelp", "ddyaelh", "ddyaem", "ddyaeb", "ddyaebs", "ddyaes", "ddyaess", "ddyaeng", "ddyaej", "ddyaec", "ddyaek", "ddyaet", "ddyaep", "ddyaeh", "ddeo", "ddeog", "ddeogg", "ddeogs", "ddeon", "ddeonj", "ddeonh", "ddeod", "ddeol", "ddeolg", "ddeolm", "ddeolb", "ddeols", "ddeolt", "ddeolp", "ddeolh", "ddeom", "ddeob", "ddeobs", "ddeos", "ddeoss", "ddeong", "ddeoj", "ddeoc", "ddeok", "ddeot", "ddeop", "ddeoh", "dde", "ddeg", "ddegg", "ddegs", "dden", "ddenj", "ddenh", "dded", "ddel", "ddelg", "ddelm", "ddelb", "ddels", "ddelt", "ddelp", "ddelh", "ddem", "ddeb", "ddebs", "ddes", "ddess", "ddeng", "ddej", "ddec", "ddek", "ddet", "ddep", "ddeh", "ddyeo", "ddyeog", "ddyeogg", "ddyeogs", "ddyeon", "ddyeonj", "ddyeonh", "ddyeod", "ddyeol", "ddyeolg", "ddyeolm", "ddyeolb", "ddyeols", "ddyeolt", "ddyeolp", "ddyeolh", "ddyeom", "ddyeob", "ddyeobs", "ddyeos", "ddyeoss", "ddyeong", "ddyeoj", "ddyeoc", "ddyeok", "ddyeot", "ddyeop", "ddyeoh", "ddye", "ddyeg", "ddyegg", "ddyegs", "ddyen", "ddyenj", "ddyenh", "ddyed", "ddyel", "ddyelg", "ddyelm", "ddyelb"], ["ddyels", "ddyelt", "ddyelp", "ddyelh", "ddyem", "ddyeb", "ddyebs", "ddyes", "ddyess", "ddyeng", "ddyej", "ddyec", "ddyek", "ddyet", "ddyep", "ddyeh", "ddo", "ddog", "ddogg", "ddogs", "ddon", "ddonj", "ddonh", "ddod", "ddol", "ddolg", "ddolm", "ddolb", "ddols", "ddolt", "ddolp", "ddolh", "ddom", "ddob", "ddobs", "ddos", "ddoss", "ddong", "ddoj", "ddoc", "ddok", "ddot", "ddop", "ddoh", "ddwa", "ddwag", "ddwagg", "ddwags", "ddwan", "ddwanj", "ddwanh", "ddwad", "ddwal", "ddwalg", "ddwalm", "ddwalb", "ddwals", "ddwalt", "ddwalp", "ddwalh", "ddwam", "ddwab", "ddwabs", "ddwas", "ddwass", "ddwang", "ddwaj", "ddwac", "ddwak", "ddwat", "ddwap", "ddwah", "ddwae", "ddwaeg", "ddwaegg", "ddwaegs", "ddwaen", "ddwaenj", "ddwaenh", "ddwaed", "ddwael", "ddwaelg", "ddwaelm", "ddwaelb", "ddwaels", "ddwaelt", "ddwaelp", "ddwaelh", "ddwaem", "ddwaeb", "ddwaebs", "ddwaes", "ddwaess", "ddwaeng", "ddwaej", "ddwaec", "ddwaek", "ddwaet", "ddwaep", "ddwaeh", "ddoe", "ddoeg", "ddoegg", "ddoegs", "ddoen", "ddoenj", "ddoenh", "ddoed", "ddoel", "ddoelg", "ddoelm", "ddoelb", "ddoels", "ddoelt", "ddoelp", "ddoelh", "ddoem", "ddoeb", "ddoebs", "ddoes", "ddoess", "ddoeng", "ddoej", "ddoec", "ddoek", "ddoet", "ddoep", "ddoeh", "ddyo", "ddyog", "ddyogg", "ddyogs", "ddyon", "ddyonj", "ddyonh", "ddyod", "ddyol", "ddyolg", "ddyolm", "ddyolb", "ddyols", "ddyolt", "ddyolp", "ddyolh", "ddyom", "ddyob", "ddyobs", "ddyos", "ddyoss", "ddyong", "ddyoj", "ddyoc", "ddyok", "ddyot", "ddyop", "ddyoh", "ddu", "ddug", "ddugg", "ddugs", "ddun", "ddunj", "ddunh", "ddud", "ddul", "ddulg", "ddulm", "ddulb", "dduls", "ddult", "ddulp", "ddulh", "ddum", "ddub", "ddubs", "ddus", "dduss", "ddung", "dduj", "dduc", "dduk", "ddut", "ddup", "dduh", "ddweo", "ddweog", "ddweogg", "ddweogs", "ddweon", "ddweonj", "ddweonh", "ddweod", "ddweol", "ddweolg", "ddweolm", "ddweolb", "ddweols", "ddweolt", "ddweolp", "ddweolh", "ddweom", "ddweob", "ddweobs", "ddweos", "ddweoss", "ddweong", "ddweoj", "ddweoc", "ddweok", "ddweot", "ddweop", "ddweoh", "ddwe", "ddweg", "ddwegg", "ddwegs", "ddwen", "ddwenj", "ddwenh", "ddwed", "ddwel", "ddwelg", "ddwelm", "ddwelb", "ddwels", "ddwelt", "ddwelp", "ddwelh", "ddwem", "ddweb", "ddwebs", "ddwes", "ddwess", "ddweng", "ddwej", "ddwec", "ddwek", "ddwet", "ddwep", "ddweh", "ddwi", "ddwig", "ddwigg", "ddwigs", "ddwin", "ddwinj", "ddwinh", "ddwid", "ddwil", "ddwilg", "ddwilm", "ddwilb", "ddwils", "ddwilt", "ddwilp", "ddwilh"], ["ddwim", "ddwib", "ddwibs", "ddwis", "ddwiss", "ddwing", "ddwij", "ddwic", "ddwik", "ddwit", "ddwip", "ddwih", "ddyu", "ddyug", "ddyugg", "ddyugs", "ddyun", "ddyunj", "ddyunh", "ddyud", "ddyul", "ddyulg", "ddyulm", "ddyulb", "ddyuls", "ddyult", "ddyulp", "ddyulh", "ddyum", "ddyub", "ddyubs", "ddyus", "ddyuss", "ddyung", "ddyuj", "ddyuc", "ddyuk", "ddyut", "ddyup", "ddyuh", "ddeu", "ddeug", "ddeugg", "ddeugs", "ddeun", "ddeunj", "ddeunh", "ddeud", "ddeul", "ddeulg", "ddeulm", "ddeulb", "ddeuls", "ddeult", "ddeulp", "ddeulh", "ddeum", "ddeub", "ddeubs", "ddeus", "ddeuss", "ddeung", "ddeuj", "ddeuc", "ddeuk", "ddeut", "ddeup", "ddeuh", "ddyi", "ddyig", "ddyigg", "ddyigs", "ddyin", "ddyinj", "ddyinh", "ddyid", "ddyil", "ddyilg", "ddyilm", "ddyilb", "ddyils", "ddyilt", "ddyilp", "ddyilh", "ddyim", "ddyib", "ddyibs", "ddyis", "ddyiss", "ddying", "ddyij", "ddyic", "ddyik", "ddyit", "ddyip", "ddyih", "ddi", "ddig", "ddigg", "ddigs", "ddin", "ddinj", "ddinh", "ddid", "ddil", "ddilg", "ddilm", "ddilb", "ddils", "ddilt", "ddilp", "ddilh", "ddim", "ddib", "ddibs", "ddis", "ddiss", "dding", "ddij", "ddic", "ddik", "ddit", "ddip", "ddih", "ra", "rag", "ragg", "rags", "ran", "ranj", "ranh", "rad", "ral", "ralg", "ralm", "ralb", "rals", "ralt", "ralp", "ralh", "ram", "rab", "rabs", "ras", "rass", "rang", "raj", "rac", "rak", "rat", "rap", "rah", "rae", "raeg", "raegg", "raegs", "raen", "raenj", "raenh", "raed", "rael", "raelg", "raelm", "raelb", "raels", "raelt", "raelp", "raelh", "raem", "raeb", "raebs", "raes", "raess", "raeng", "raej", "raec", "raek", "raet", "raep", "raeh", "rya", "ryag", "ryagg", "ryags", "ryan", "ryanj", "ryanh", "ryad", "ryal", "ryalg", "ryalm", "ryalb", "ryals", "ryalt", "ryalp", "ryalh", "ryam", "ryab", "ryabs", "ryas", "ryass", "ryang", "ryaj", "ryac", "ryak", "ryat", "ryap", "ryah", "ryae", "ryaeg", "ryaegg", "ryaegs", "ryaen", "ryaenj", "ryaenh", "ryaed", "ryael", "ryaelg", "ryaelm", "ryaelb", "ryaels", "ryaelt", "ryaelp", "ryaelh", "ryaem", "ryaeb", "ryaebs", "ryaes", "ryaess", "ryaeng", "ryaej", "ryaec", "ryaek", "ryaet", "ryaep", "ryaeh", "reo", "reog", "reogg", "reogs", "reon", "reonj", "reonh", "reod", "reol", "reolg", "reolm", "reolb", "reols", "reolt", "reolp", "reolh", "reom", "reob", "reobs", "reos"], ["reoss", "reong", "reoj", "reoc", "reok", "reot", "reop", "reoh", "re", "reg", "regg", "regs", "ren", "renj", "renh", "red", "rel", "relg", "relm", "relb", "rels", "relt", "relp", "relh", "rem", "reb", "rebs", "res", "ress", "reng", "rej", "rec", "rek", "ret", "rep", "reh", "ryeo", "ryeog", "ryeogg", "ryeogs", "ryeon", "ryeonj", "ryeonh", "ryeod", "ryeol", "ryeolg", "ryeolm", "ryeolb", "ryeols", "ryeolt", "ryeolp", "ryeolh", "ryeom", "ryeob", "ryeobs", "ryeos", "ryeoss", "ryeong", "ryeoj", "ryeoc", "ryeok", "ryeot", "ryeop", "ryeoh", "rye", "ryeg", "ryegg", "ryegs", "ryen", "ryenj", "ryenh", "ryed", "ryel", "ryelg", "ryelm", "ryelb", "ryels", "ryelt", "ryelp", "ryelh", "ryem", "ryeb", "ryebs", "ryes", "ryess", "ryeng", "ryej", "ryec", "ryek", "ryet", "ryep", "ryeh", "ro", "rog", "rogg", "rogs", "ron", "ronj", "ronh", "rod", "rol", "rolg", "rolm", "rolb", "rols", "rolt", "rolp", "rolh", "rom", "rob", "robs", "ros", "ross", "rong", "roj", "roc", "rok", "rot", "rop", "roh", "rwa", "rwag", "rwagg", "rwags", "rwan", "rwanj", "rwanh", "rwad", "rwal", "rwalg", "rwalm", "rwalb", "rwals", "rwalt", "rwalp", "rwalh", "rwam", "rwab", "rwabs", "rwas", "rwass", "rwang", "rwaj", "rwac", "rwak", "rwat", "rwap", "rwah", "rwae", "rwaeg", "rwaegg", "rwaegs", "rwaen", "rwaenj", "rwaenh", "rwaed", "rwael", "rwaelg", "rwaelm", "rwaelb", "rwaels", "rwaelt", "rwaelp", "rwaelh", "rwaem", "rwaeb", "rwaebs", "rwaes", "rwaess", "rwaeng", "rwaej", "rwaec", "rwaek", "rwaet", "rwaep", "rwaeh", "roe", "roeg", "roegg", "roegs", "roen", "roenj", "roenh", "roed", "roel", "roelg", "roelm", "roelb", "roels", "roelt", "roelp", "roelh", "roem", "roeb", "roebs", "roes", "roess", "roeng", "roej", "roec", "roek", "roet", "roep", "roeh", "ryo", "ryog", "ryogg", "ryogs", "ryon", "ryonj", "ryonh", "ryod", "ryol", "ryolg", "ryolm", "ryolb", "ryols", "ryolt", "ryolp", "ryolh", "ryom", "ryob", "ryobs", "ryos", "ryoss", "ryong", "ryoj", "ryoc", "ryok", "ryot", "ryop", "ryoh", "ru", "rug", "rugg", "rugs", "run", "runj", "runh", "rud", "rul", "rulg", "rulm", "rulb", "ruls", "rult", "rulp", "rulh", "rum", "rub", "rubs", "rus", "russ", "rung", "ruj", "ruc"], ["ruk", "rut", "rup", "ruh", "rweo", "rweog", "rweogg", "rweogs", "rweon", "rweonj", "rweonh", "rweod", "rweol", "rweolg", "rweolm", "rweolb", "rweols", "rweolt", "rweolp", "rweolh", "rweom", "rweob", "rweobs", "rweos", "rweoss", "rweong", "rweoj", "rweoc", "rweok", "rweot", "rweop", "rweoh", "rwe", "rweg", "rwegg", "rwegs", "rwen", "rwenj", "rwenh", "rwed", "rwel", "rwelg", "rwelm", "rwelb", "rwels", "rwelt", "rwelp", "rwelh", "rwem", "rweb", "rwebs", "rwes", "rwess", "rweng", "rwej", "rwec", "rwek", "rwet", "rwep", "rweh", "rwi", "rwig", "rwigg", "rwigs", "rwin", "rwinj", "rwinh", "rwid", "rwil", "rwilg", "rwilm", "rwilb", "rwils", "rwilt", "rwilp", "rwilh", "rwim", "rwib", "rwibs", "rwis", "rwiss", "rwing", "rwij", "rwic", "rwik", "rwit", "rwip", "rwih", "ryu", "ryug", "ryugg", "ryugs", "ryun", "ryunj", "ryunh", "ryud", "ryul", "ryulg", "ryulm", "ryulb", "ryuls", "ryult", "ryulp", "ryulh", "ryum", "ryub", "ryubs", "ryus", "ryuss", "ryung", "ryuj", "ryuc", "ryuk", "ryut", "ryup", "ryuh", "reu", "reug", "reugg", "reugs", "reun", "reunj", "reunh", "reud", "reul", "reulg", "reulm", "reulb", "reuls", "reult", "reulp", "reulh", "reum", "reub", "reubs", "reus", "reuss", "reung", "reuj", "reuc", "reuk", "reut", "reup", "reuh", "ryi", "ryig", "ryigg", "ryigs", "ryin", "ryinj", "ryinh", "ryid", "ryil", "ryilg", "ryilm", "ryilb", "ryils", "ryilt", "ryilp", "ryilh", "ryim", "ryib", "ryibs", "ryis", "ryiss", "rying", "ryij", "ryic", "ryik", "ryit", "ryip", "ryih", "ri", "rig", "rigg", "rigs", "rin", "rinj", "rinh", "rid", "ril", "rilg", "rilm", "rilb", "rils", "rilt", "rilp", "rilh", "rim", "rib", "ribs", "ris", "riss", "ring", "rij", "ric", "rik", "rit", "rip", "rih", "ma", "mag", "magg", "mags", "man", "manj", "manh", "mad", "mal", "malg", "malm", "malb", "mals", "malt", "malp", "malh", "mam", "mab", "mabs", "mas", "mass", "mang", "maj", "mac", "mak", "mat", "map", "mah", "mae", "maeg", "maegg", "maegs", "maen", "maenj", "maenh", "maed", "mael", "maelg", "maelm", "maelb", "maels", "maelt", "maelp", "maelh", "maem", "maeb", "maebs", "maes", "maess", "maeng", "maej", "maec", "maek", "maet", "maep", "maeh"], ["mya", "myag", "myagg", "myags", "myan", "myanj", "myanh", "myad", "myal", "myalg", "myalm", "myalb", "myals", "myalt", "myalp", "myalh", "myam", "myab", "myabs", "myas", "myass", "myang", "myaj", "myac", "myak", "myat", "myap", "myah", "myae", "myaeg", "myaegg", "myaegs", "myaen", "myaenj", "myaenh", "myaed", "myael", "myaelg", "myaelm", "myaelb", "myaels", "myaelt", "myaelp", "myaelh", "myaem", "myaeb", "myaebs", "myaes", "myaess", "myaeng", "myaej", "myaec", "myaek", "myaet", "myaep", "myaeh", "meo", "meog", "meogg", "meogs", "meon", "meonj", "meonh", "meod", "meol", "meolg", "meolm", "meolb", "meols", "meolt", "meolp", "meolh", "meom", "meob", "meobs", "meos", "meoss", "meong", "meoj", "meoc", "meok", "meot", "meop", "meoh", "me", "meg", "megg", "megs", "men", "menj", "menh", "med", "mel", "melg", "melm", "melb", "mels", "melt", "melp", "melh", "mem", "meb", "mebs", "mes", "mess", "meng", "mej", "mec", "mek", "met", "mep", "meh", "myeo", "myeog", "myeogg", "myeogs", "myeon", "myeonj", "myeonh", "myeod", "myeol", "myeolg", "myeolm", "myeolb", "myeols", "myeolt", "myeolp", "myeolh", "myeom", "myeob", "myeobs", "myeos", "myeoss", "myeong", "myeoj", "myeoc", "myeok", "myeot", "myeop", "myeoh", "mye", "myeg", "myegg", "myegs", "myen", "myenj", "myenh", "myed", "myel", "myelg", "myelm", "myelb", "myels", "myelt", "myelp", "myelh", "myem", "myeb", "myebs", "myes", "myess", "myeng", "myej", "myec", "myek", "myet", "myep", "myeh", "mo", "mog", "mogg", "mogs", "mon", "monj", "monh", "mod", "mol", "molg", "molm", "molb", "mols", "molt", "molp", "molh", "mom", "mob", "mobs", "mos", "moss", "mong", "moj", "moc", "mok", "mot", "mop", "moh", "mwa", "mwag", "mwagg", "mwags", "mwan", "mwanj", "mwanh", "mwad", "mwal", "mwalg", "mwalm", "mwalb", "mwals", "mwalt", "mwalp", "mwalh", "mwam", "mwab", "mwabs", "mwas", "mwass", "mwang", "mwaj", "mwac", "mwak", "mwat", "mwap", "mwah", "mwae", "mwaeg", "mwaegg", "mwaegs", "mwaen", "mwaenj", "mwaenh", "mwaed", "mwael", "mwaelg", "mwaelm", "mwaelb", "mwaels", "mwaelt", "mwaelp", "mwaelh", "mwaem", "mwaeb", "mwaebs", "mwaes", "mwaess", "mwaeng", "mwaej", "mwaec", "mwaek", "mwaet", "mwaep", "mwaeh", "moe", "moeg", "moegg", "moegs"], ["moen", "moenj", "moenh", "moed", "moel", "moelg", "moelm", "moelb", "moels", "moelt", "moelp", "moelh", "moem", "moeb", "moebs", "moes", "moess", "moeng", "moej", "moec", "moek", "moet", "moep", "moeh", "myo", "myog", "myogg", "myogs", "myon", "myonj", "myonh", "myod", "myol", "myolg", "myolm", "myolb", "myols", "myolt", "myolp", "myolh", "myom", "myob", "myobs", "myos", "myoss", "myong", "myoj", "myoc", "myok", "myot", "myop", "myoh", "mu", "mug", "mugg", "mugs", "mun", "munj", "munh", "mud", "mul", "mulg", "mulm", "mulb", "muls", "mult", "mulp", "mulh", "mum", "mub", "mubs", "mus", "muss", "mung", "muj", "muc", "muk", "mut", "mup", "muh", "mweo", "mweog", "mweogg", "mweogs", "mweon", "mweonj", "mweonh", "mweod", "mweol", "mweolg", "mweolm", "mweolb", "mweols", "mweolt", "mweolp", "mweolh", "mweom", "mweob", "mweobs", "mweos", "mweoss", "mweong", "mweoj", "mweoc", "mweok", "mweot", "mweop", "mweoh", "mwe", "mweg", "mwegg", "mwegs", "mwen", "mwenj", "mwenh", "mwed", "mwel", "mwelg", "mwelm", "mwelb", "mwels", "mwelt", "mwelp", "mwelh", "mwem", "mweb", "mwebs", "mwes", "mwess", "mweng", "mwej", "mwec", "mwek", "mwet", "mwep", "mweh", "mwi", "mwig", "mwigg", "mwigs", "mwin", "mwinj", "mwinh", "mwid", "mwil", "mwilg", "mwilm", "mwilb", "mwils", "mwilt", "mwilp", "mwilh", "mwim", "mwib", "mwibs", "mwis", "mwiss", "mwing", "mwij", "mwic", "mwik", "mwit", "mwip", "mwih", "myu", "myug", "myugg", "myugs", "myun", "myunj", "myunh", "myud", "myul", "myulg", "myulm", "myulb", "myuls", "myult", "myulp", "myulh", "myum", "myub", "myubs", "myus", "myuss", "myung", "myuj", "myuc", "myuk", "myut", "myup", "myuh", "meu", "meug", "meugg", "meugs", "meun", "meunj", "meunh", "meud", "meul", "meulg", "meulm", "meulb", "meuls", "meult", "meulp", "meulh", "meum", "meub", "meubs", "meus", "meuss", "meung", "meuj", "meuc", "meuk", "meut", "meup", "meuh", "myi", "myig", "myigg", "myigs", "myin", "myinj", "myinh", "myid", "myil", "myilg", "myilm", "myilb", "myils", "myilt", "myilp", "myilh", "myim", "myib", "myibs", "myis", "myiss", "mying", "myij", "myic", "myik", "myit", "myip", "myih", "mi", "mig", "migg", "migs", "min", "minj", "minh", "mid"], ["mil", "milg", "milm", "milb", "mils", "milt", "milp", "milh", "mim", "mib", "mibs", "mis", "miss", "ming", "mij", "mic", "mik", "mit", "mip", "mih", "ba", "bag", "bagg", "bags", "ban", "banj", "banh", "bad", "bal", "balg", "balm", "balb", "bals", "balt", "balp", "balh", "bam", "bab", "babs", "bas", "bass", "bang", "baj", "bac", "bak", "bat", "bap", "bah", "bae", "baeg", "baegg", "baegs", "baen", "baenj", "baenh", "baed", "bael", "baelg", "baelm", "baelb", "baels", "baelt", "baelp", "baelh", "baem", "baeb", "baebs", "baes", "baess", "baeng", "baej", "baec", "baek", "baet", "baep", "baeh", "bya", "byag", "byagg", "byags", "byan", "byanj", "byanh", "byad", "byal", "byalg", "byalm", "byalb", "byals", "byalt", "byalp", "byalh", "byam", "byab", "byabs", "byas", "byass", "byang", "byaj", "byac", "byak", "byat", "byap", "byah", "byae", "byaeg", "byaegg", "byaegs", "byaen", "byaenj", "byaenh", "byaed", "byael", "byaelg", "byaelm", "byaelb", "byaels", "byaelt", "byaelp", "byaelh", "byaem", "byaeb", "byaebs", "byaes", "byaess", "byaeng", "byaej", "byaec", "byaek", "byaet", "byaep", "byaeh", "beo", "beog", "beogg", "beogs", "beon", "beonj", "beonh", "beod", "beol", "beolg", "beolm", "beolb", "beols", "beolt", "beolp", "beolh", "beom", "beob", "beobs", "beos", "beoss", "beong", "beoj", "beoc", "beok", "beot", "beop", "beoh", "be", "beg", "begg", "begs", "ben", "benj", "benh", "bed", "bel", "belg", "belm", "belb", "bels", "belt", "belp", "belh", "bem", "beb", "bebs", "bes", "bess", "beng", "bej", "bec", "bek", "bet", "bep", "beh", "byeo", "byeog", "byeogg", "byeogs", "byeon", "byeonj", "byeonh", "byeod", "byeol", "byeolg", "byeolm", "byeolb", "byeols", "byeolt", "byeolp", "byeolh", "byeom", "byeob", "byeobs", "byeos", "byeoss", "byeong", "byeoj", "byeoc", "byeok", "byeot", "byeop", "byeoh", "bye", "byeg", "byegg", "byegs", "byen", "byenj", "byenh", "byed", "byel", "byelg", "byelm", "byelb", "byels", "byelt", "byelp", "byelh", "byem", "byeb", "byebs", "byes", "byess", "byeng", "byej", "byec", "byek", "byet", "byep", "byeh", "bo", "bog", "bogg", "bogs", "bon", "bonj", "bonh", "bod", "bol", "bolg", "bolm", "bolb"], ["bols", "bolt", "bolp", "bolh", "bom", "bob", "bobs", "bos", "boss", "bong", "boj", "boc", "bok", "bot", "bop", "boh", "bwa", "bwag", "bwagg", "bwags", "bwan", "bwanj", "bwanh", "bwad", "bwal", "bwalg", "bwalm", "bwalb", "bwals", "bwalt", "bwalp", "bwalh", "bwam", "bwab", "bwabs", "bwas", "bwass", "bwang", "bwaj", "bwac", "bwak", "bwat", "bwap", "bwah", "bwae", "bwaeg", "bwaegg", "bwaegs", "bwaen", "bwaenj", "bwaenh", "bwaed", "bwael", "bwaelg", "bwaelm", "bwaelb", "bwaels", "bwaelt", "bwaelp", "bwaelh", "bwaem", "bwaeb", "bwaebs", "bwaes", "bwaess", "bwaeng", "bwaej", "bwaec", "bwaek", "bwaet", "bwaep", "bwaeh", "boe", "boeg", "boegg", "boegs", "boen", "boenj", "boenh", "boed", "boel", "boelg", "boelm", "boelb", "boels", "boelt", "boelp", "boelh", "boem", "boeb", "boebs", "boes", "boess", "boeng", "boej", "boec", "boek", "boet", "boep", "boeh", "byo", "byog", "byogg", "byogs", "byon", "byonj", "byonh", "byod", "byol", "byolg", "byolm", "byolb", "byols", "byolt", "byolp", "byolh", "byom", "byob", "byobs", "byos", "byoss", "byong", "byoj", "byoc", "byok", "byot", "byop", "byoh", "bu", "bug", "bugg", "bugs", "bun", "bunj", "bunh", "bud", "bul", "bulg", "bulm", "bulb", "buls", "bult", "bulp", "bulh", "bum", "bub", "bubs", "bus", "buss", "bung", "buj", "buc", "buk", "but", "bup", "buh", "bweo", "bweog", "bweogg", "bweogs", "bweon", "bweonj", "bweonh", "bweod", "bweol", "bweolg", "bweolm", "bweolb", "bweols", "bweolt", "bweolp", "bweolh", "bweom", "bweob", "bweobs", "bweos", "bweoss", "bweong", "bweoj", "bweoc", "bweok", "bweot", "bweop", "bweoh", "bwe", "bweg", "bwegg", "bwegs", "bwen", "bwenj", "bwenh", "bwed", "bwel", "bwelg", "bwelm", "bwelb", "bwels", "bwelt", "bwelp", "bwelh", "bwem", "bweb", "bwebs", "bwes", "bwess", "bweng", "bwej", "bwec", "bwek", "bwet", "bwep", "bweh", "bwi", "bwig", "bwigg", "bwigs", "bwin", "bwinj", "bwinh", "bwid", "bwil", "bwilg", "bwilm", "bwilb", "bwils", "bwilt", "bwilp", "bwilh", "bwim", "bwib", "bwibs", "bwis", "bwiss", "bwing", "bwij", "bwic", "bwik", "bwit", "bwip", "bwih", "byu", "byug", "byugg", "byugs", "byun", "byunj", "byunh", "byud", "byul", "byulg", "byulm", "byulb", "byuls", "byult", "byulp", "byulh"], ["byum", "byub", "byubs", "byus", "byuss", "byung", "byuj", "byuc", "byuk", "byut", "byup", "byuh", "beu", "beug", "beugg", "beugs", "beun", "beunj", "beunh", "beud", "beul", "beulg", "beulm", "beulb", "beuls", "beult", "beulp", "beulh", "beum", "beub", "beubs", "beus", "beuss", "beung", "beuj", "beuc", "beuk", "beut", "beup", "beuh", "byi", "byig", "byigg", "byigs", "byin", "byinj", "byinh", "byid", "byil", "byilg", "byilm", "byilb", "byils", "byilt", "byilp", "byilh", "byim", "byib", "byibs", "byis", "byiss", "bying", "byij", "byic", "byik", "byit", "byip", "byih", "bi", "big", "bigg", "bigs", "bin", "binj", "binh", "bid", "bil", "bilg", "bilm", "bilb", "bils", "bilt", "bilp", "bilh", "bim", "bib", "bibs", "bis", "biss", "bing", "bij", "bic", "bik", "bit", "bip", "bih", "bba", "bbag", "bbagg", "bbags", "bban", "bbanj", "bbanh", "bbad", "bbal", "bbalg", "bbalm", "bbalb", "bbals", "bbalt", "bbalp", "bbalh", "bbam", "bbab", "bbabs", "bbas", "bbass", "bbang", "bbaj", "bbac", "bbak", "bbat", "bbap", "bbah", "bbae", "bbaeg", "bbaegg", "bbaegs", "bbaen", "bbaenj", "bbaenh", "bbaed", "bbael", "bbaelg", "bbaelm", "bbaelb", "bbaels", "bbaelt", "bbaelp", "bbaelh", "bbaem", "bbaeb", "bbaebs", "bbaes", "bbaess", "bbaeng", "bbaej", "bbaec", "bbaek", "bbaet", "bbaep", "bbaeh", "bbya", "bbyag", "bbyagg", "bbyags", "bbyan", "bbyanj", "bbyanh", "bbyad", "bbyal", "bbyalg", "bbyalm", "bbyalb", "bbyals", "bbyalt", "bbyalp", "bbyalh", "bbyam", "bbyab", "bbyabs", "bbyas", "bbyass", "bbyang", "bbyaj", "bbyac", "bbyak", "bbyat", "bbyap", "bbyah", "bbyae", "bbyaeg", "bbyaegg", "bbyaegs", "bbyaen", "bbyaenj", "bbyaenh", "bbyaed", "bbyael", "bbyaelg", "bbyaelm", "bbyaelb", "bbyaels", "bbyaelt", "bbyaelp", "bbyaelh", "bbyaem", "bbyaeb", "bbyaebs", "bbyaes", "bbyaess", "bbyaeng", "bbyaej", "bbyaec", "bbyaek", "bbyaet", "bbyaep", "bbyaeh", "bbeo", "bbeog", "bbeogg", "bbeogs", "bbeon", "bbeonj", "bbeonh", "bbeod", "bbeol", "bbeolg", "bbeolm", "bbeolb", "bbeols", "bbeolt", "bbeolp", "bbeolh", "bbeom", "bbeob", "bbeobs", "bbeos", "bbeoss", "bbeong", "bbeoj", "bbeoc", "bbeok", "bbeot", "bbeop", "bbeoh", "bbe", "bbeg", "bbegg", "bbegs", "bben", "bbenj", "bbenh", "bbed", "bbel", "bbelg", "bbelm", "bbelb", "bbels", "bbelt", "bbelp", "bbelh", "bbem", "bbeb", "bbebs", "bbes"], ["bbess", "bbeng", "bbej", "bbec", "bbek", "bbet", "bbep", "bbeh", "bbyeo", "bbyeog", "bbyeogg", "bbyeogs", "bbyeon", "bbyeonj", "bbyeonh", "bbyeod", "bbyeol", "bbyeolg", "bbyeolm", "bbyeolb", "bbyeols", "bbyeolt", "bbyeolp", "bbyeolh", "bbyeom", "bbyeob", "bbyeobs", "bbyeos", "bbyeoss", "bbyeong", "bbyeoj", "bbyeoc", "bbyeok", "bbyeot", "bbyeop", "bbyeoh", "bbye", "bbyeg", "bbyegg", "bbyegs", "bbyen", "bbyenj", "bbyenh", "bbyed", "bbyel", "bbyelg", "bbyelm", "bbyelb", "bbyels", "bbyelt", "bbyelp", "bbyelh", "bbyem", "bbyeb", "bbyebs", "bbyes", "bbyess", "bbyeng", "bbyej", "bbyec", "bbyek", "bbyet", "bbyep", "bbyeh", "bbo", "bbog", "bbogg", "bbogs", "bbon", "bbonj", "bbonh", "bbod", "bbol", "bbolg", "bbolm", "bbolb", "bbols", "bbolt", "bbolp", "bbolh", "bbom", "bbob", "bbobs", "bbos", "bboss", "bbong", "bboj", "bboc", "bbok", "bbot", "bbop", "bboh", "bbwa", "bbwag", "bbwagg", "bbwags", "bbwan", "bbwanj", "bbwanh", "bbwad", "bbwal", "bbwalg", "bbwalm", "bbwalb", "bbwals", "bbwalt", "bbwalp", "bbwalh", "bbwam", "bbwab", "bbwabs", "bbwas", "bbwass", "bbwang", "bbwaj", "bbwac", "bbwak", "bbwat", "bbwap", "bbwah", "bbwae", "bbwaeg", "bbwaegg", "bbwaegs", "bbwaen", "bbwaenj", "bbwaenh", "bbwaed", "bbwael", "bbwaelg", "bbwaelm", "bbwaelb", "bbwaels", "bbwaelt", "bbwaelp", "bbwaelh", "bbwaem", "bbwaeb", "bbwaebs", "bbwaes", "bbwaess", "bbwaeng", "bbwaej", "bbwaec", "bbwaek", "bbwaet", "bbwaep", "bbwaeh", "bboe", "bboeg", "bboegg", "bboegs", "bboen", "bboenj", "bboenh", "bboed", "bboel", "bboelg", "bboelm", "bboelb", "bboels", "bboelt", "bboelp", "bboelh", "bboem", "bboeb", "bboebs", "bboes", "bboess", "bboeng", "bboej", "bboec", "bboek", "bboet", "bboep", "bboeh", "bbyo", "bbyog", "bbyogg", "bbyogs", "bbyon", "bbyonj", "bbyonh", "bbyod", "bbyol", "bbyolg", "bbyolm", "bbyolb", "bbyols", "bbyolt", "bbyolp", "bbyolh", "bbyom", "bbyob", "bbyobs", "bbyos", "bbyoss", "bbyong", "bbyoj", "bbyoc", "bbyok", "bbyot", "bbyop", "bbyoh", "bbu", "bbug", "bbugg", "bbugs", "bbun", "bbunj", "bbunh", "bbud", "bbul", "bbulg", "bbulm", "bbulb", "bbuls", "bbult", "bbulp", "bbulh", "bbum", "bbub", "bbubs", "bbus", "bbuss", "bbung", "bbuj", "bbuc", "bbuk", "bbut", "bbup", "bbuh", "bbweo", "bbweog", "bbweogg", "bbweogs", "bbweon", "bbweonj", "bbweonh", "bbweod", "bbweol", "bbweolg", "bbweolm", "bbweolb", "bbweols", "bbweolt", "bbweolp", "bbweolh", "bbweom", "bbweob", "bbweobs", "bbweos", "bbweoss", "bbweong", "bbweoj", "bbweoc"], ["bbweok", "bbweot", "bbweop", "bbweoh", "bbwe", "bbweg", "bbwegg", "bbwegs", "bbwen", "bbwenj", "bbwenh", "bbwed", "bbwel", "bbwelg", "bbwelm", "bbwelb", "bbwels", "bbwelt", "bbwelp", "bbwelh", "bbwem", "bbweb", "bbwebs", "bbwes", "bbwess", "bbweng", "bbwej", "bbwec", "bbwek", "bbwet", "bbwep", "bbweh", "bbwi", "bbwig", "bbwigg", "bbwigs", "bbwin", "bbwinj", "bbwinh", "bbwid", "bbwil", "bbwilg", "bbwilm", "bbwilb", "bbwils", "bbwilt", "bbwilp", "bbwilh", "bbwim", "bbwib", "bbwibs", "bbwis", "bbwiss", "bbwing", "bbwij", "bbwic", "bbwik", "bbwit", "bbwip", "bbwih", "bbyu", "bbyug", "bbyugg", "bbyugs", "bbyun", "bbyunj", "bbyunh", "bbyud", "bbyul", "bbyulg", "bbyulm", "bbyulb", "bbyuls", "bbyult", "bbyulp", "bbyulh", "bbyum", "bbyub", "bbyubs", "bbyus", "bbyuss", "bbyung", "bbyuj", "bbyuc", "bbyuk", "bbyut", "bbyup", "bbyuh", "bbeu", "bbeug", "bbeugg", "bbeugs", "bbeun", "bbeunj", "bbeunh", "bbeud", "bbeul", "bbeulg", "bbeulm", "bbeulb", "bbeuls", "bbeult", "bbeulp", "bbeulh", "bbeum", "bbeub", "bbeubs", "bbeus", "bbeuss", "bbeung", "bbeuj", "bbeuc", "bbeuk", "bbeut", "bbeup", "bbeuh", "bbyi", "bbyig", "bbyigg", "bbyigs", "bbyin", "bbyinj", "bbyinh", "bbyid", "bbyil", "bbyilg", "bbyilm", "bbyilb", "bbyils", "bbyilt", "bbyilp", "bbyilh", "bbyim", "bbyib", "bbyibs", "bbyis", "bbyiss", "bbying", "bbyij", "bbyic", "bbyik", "bbyit", "bbyip", "bbyih", "bbi", "bbig", "bbigg", "bbigs", "bbin", "bbinj", "bbinh", "bbid", "bbil", "bbilg", "bbilm", "bbilb", "bbils", "bbilt", "bbilp", "bbilh", "bbim", "bbib", "bbibs", "bbis", "bbiss", "bbing", "bbij", "bbic", "bbik", "bbit", "bbip", "bbih", "sa", "sag", "sagg", "sags", "san", "sanj", "sanh", "sad", "sal", "salg", "salm", "salb", "sals", "salt", "salp", "salh", "sam", "sab", "sabs", "sas", "sass", "sang", "saj", "sac", "sak", "sat", "sap", "sah", "sae", "saeg", "saegg", "saegs", "saen", "saenj", "saenh", "saed", "sael", "saelg", "saelm", "saelb", "saels", "saelt", "saelp", "saelh", "saem", "saeb", "saebs", "saes", "saess", "saeng", "saej", "saec", "saek", "saet", "saep", "saeh", "sya", "syag", "syagg", "syags", "syan", "syanj", "syanh", "syad", "syal", "syalg", "syalm", "syalb", "syals", "syalt", "syalp", "syalh", "syam", "syab", "syabs", "syas", "syass", "syang", "syaj", "syac", "syak", "syat", "syap", "syah"], ["syae", "syaeg", "syaegg", "syaegs", "syaen", "syaenj", "syaenh", "syaed", "syael", "syaelg", "syaelm", "syaelb", "syaels", "syaelt", "syaelp", "syaelh", "syaem", "syaeb", "syaebs", "syaes", "syaess", "syaeng", "syaej", "syaec", "syaek", "syaet", "syaep", "syaeh", "seo", "seog", "seogg", "seogs", "seon", "seonj", "seonh", "seod", "seol", "seolg", "seolm", "seolb", "seols", "seolt", "seolp", "seolh", "seom", "seob", "seobs", "seos", "seoss", "seong", "seoj", "seoc", "seok", "seot", "seop", "seoh", "se", "seg", "segg", "segs", "sen", "senj", "senh", "sed", "sel", "selg", "selm", "selb", "sels", "selt", "selp", "selh", "sem", "seb", "sebs", "ses", "sess", "seng", "sej", "sec", "sek", "set", "sep", "seh", "syeo", "syeog", "syeogg", "syeogs", "syeon", "syeonj", "syeonh", "syeod", "syeol", "syeolg", "syeolm", "syeolb", "syeols", "syeolt", "syeolp", "syeolh", "syeom", "syeob", "syeobs", "syeos", "syeoss", "syeong", "syeoj", "syeoc", "syeok", "syeot", "syeop", "syeoh", "sye", "syeg", "syegg", "syegs", "syen", "syenj", "syenh", "syed", "syel", "syelg", "syelm", "syelb", "syels", "syelt", "syelp", "syelh", "syem", "syeb", "syebs", "syes", "syess", "syeng", "syej", "syec", "syek", "syet", "syep", "syeh", "so", "sog", "sogg", "sogs", "son", "sonj", "sonh", "sod", "sol", "solg", "solm", "solb", "sols", "solt", "solp", "solh", "som", "sob", "sobs", "sos", "soss", "song", "soj", "soc", "sok", "sot", "sop", "soh", "swa", "swag", "swagg", "swags", "swan", "swanj", "swanh", "swad", "swal", "swalg", "swalm", "swalb", "swals", "swalt", "swalp", "swalh", "swam", "swab", "swabs", "swas", "swass", "swang", "swaj", "swac", "swak", "swat", "swap", "swah", "swae", "swaeg", "swaegg", "swaegs", "swaen", "swaenj", "swaenh", "swaed", "swael", "swaelg", "swaelm", "swaelb", "swaels", "swaelt", "swaelp", "swaelh", "swaem", "swaeb", "swaebs", "swaes", "swaess", "swaeng", "swaej", "swaec", "swaek", "swaet", "swaep", "swaeh", "soe", "soeg", "soegg", "soegs", "soen", "soenj", "soenh", "soed", "soel", "soelg", "soelm", "soelb", "soels", "soelt", "soelp", "soelh", "soem", "soeb", "soebs", "soes", "soess", "soeng", "soej", "soec", "soek", "soet", "soep", "soeh", "syo", "syog", "syogg", "syogs"], ["syon", "syonj", "syonh", "syod", "syol", "syolg", "syolm", "syolb", "syols", "syolt", "syolp", "syolh", "syom", "syob", "syobs", "syos", "syoss", "syong", "syoj", "syoc", "syok", "syot", "syop", "syoh", "su", "sug", "sugg", "sugs", "sun", "sunj", "sunh", "sud", "sul", "sulg", "sulm", "sulb", "suls", "sult", "sulp", "sulh", "sum", "sub", "subs", "sus", "suss", "sung", "suj", "suc", "suk", "sut", "sup", "suh", "sweo", "sweog", "sweogg", "sweogs", "sweon", "sweonj", "sweonh", "sweod", "sweol", "sweolg", "sweolm", "sweolb", "sweols", "sweolt", "sweolp", "sweolh", "sweom", "sweob", "sweobs", "sweos", "sweoss", "sweong", "sweoj", "sweoc", "sweok", "sweot", "sweop", "sweoh", "swe", "sweg", "swegg", "swegs", "swen", "swenj", "swenh", "swed", "swel", "swelg", "swelm", "swelb", "swels", "swelt", "swelp", "swelh", "swem", "sweb", "swebs", "swes", "swess", "sweng", "swej", "swec", "swek", "swet", "swep", "sweh", "swi", "swig", "swigg", "swigs", "swin", "swinj", "swinh", "swid", "swil", "swilg", "swilm", "swilb", "swils", "swilt", "swilp", "swilh", "swim", "swib", "swibs", "swis", "swiss", "swing", "swij", "swic", "swik", "swit", "swip", "swih", "syu", "syug", "syugg", "syugs", "syun", "syunj", "syunh", "syud", "syul", "syulg", "syulm", "syulb", "syuls", "syult", "syulp", "syulh", "syum", "syub", "syubs", "syus", "syuss", "syung", "syuj", "syuc", "syuk", "syut", "syup", "syuh", "seu", "seug", "seugg", "seugs", "seun", "seunj", "seunh", "seud", "seul", "seulg", "seulm", "seulb", "seuls", "seult", "seulp", "seulh", "seum", "seub", "seubs", "seus", "seuss", "seung", "seuj", "seuc", "seuk", "seut", "seup", "seuh", "syi", "syig", "syigg", "syigs", "syin", "syinj", "syinh", "syid", "syil", "syilg", "syilm", "syilb", "syils", "syilt", "syilp", "syilh", "syim", "syib", "syibs", "syis", "syiss", "sying", "syij", "syic", "syik", "syit", "syip", "syih", "si", "sig", "sigg", "sigs", "sin", "sinj", "sinh", "sid", "sil", "silg", "silm", "silb", "sils", "silt", "silp", "silh", "sim", "sib", "sibs", "sis", "siss", "sing", "sij", "sic", "sik", "sit", "sip", "sih", "ssa", "ssag", "ssagg", "ssags", "ssan", "ssanj", "ssanh", "ssad"], ["ssal", "ssalg", "ssalm", "ssalb", "ssals", "ssalt", "ssalp", "ssalh", "ssam", "ssab", "ssabs", "ssas", "ssass", "ssang", "ssaj", "ssac", "ssak", "ssat", "ssap", "ssah", "ssae", "ssaeg", "ssaegg", "ssaegs", "ssaen", "ssaenj", "ssaenh", "ssaed", "ssael", "ssaelg", "ssaelm", "ssaelb", "ssaels", "ssaelt", "ssaelp", "ssaelh", "ssaem", "ssaeb", "ssaebs", "ssaes", "ssaess", "ssaeng", "ssaej", "ssaec", "ssaek", "ssaet", "ssaep", "ssaeh", "ssya", "ssyag", "ssyagg", "ssyags", "ssyan", "ssyanj", "ssyanh", "ssyad", "ssyal", "ssyalg", "ssyalm", "ssyalb", "ssyals", "ssyalt", "ssyalp", "ssyalh", "ssyam", "ssyab", "ssyabs", "ssyas", "ssyass", "ssyang", "ssyaj", "ssyac", "ssyak", "ssyat", "ssyap", "ssyah", "ssyae", "ssyaeg", "ssyaegg", "ssyaegs", "ssyaen", "ssyaenj", "ssyaenh", "ssyaed", "ssyael", "ssyaelg", "ssyaelm", "ssyaelb", "ssyaels", "ssyaelt", "ssyaelp", "ssyaelh", "ssyaem", "ssyaeb", "ssyaebs", "ssyaes", "ssyaess", "ssyaeng", "ssyaej", "ssyaec", "ssyaek", "ssyaet", "ssyaep", "ssyaeh", "sseo", "sseog", "sseogg", "sseogs", "sseon", "sseonj", "sseonh", "sseod", "sseol", "sseolg", "sseolm", "sseolb", "sseols", "sseolt", "sseolp", "sseolh", "sseom", "sseob", "sseobs", "sseos", "sseoss", "sseong", "sseoj", "sseoc", "sseok", "sseot", "sseop", "sseoh", "sse", "sseg", "ssegg", "ssegs", "ssen", "ssenj", "ssenh", "ssed", "ssel", "sselg", "sselm", "sselb", "ssels", "sselt", "sselp", "sselh", "ssem", "sseb", "ssebs", "sses", "ssess", "sseng", "ssej", "ssec", "ssek", "sset", "ssep", "sseh", "ssyeo", "ssyeog", "ssyeogg", "ssyeogs", "ssyeon", "ssyeonj", "ssyeonh", "ssyeod", "ssyeol", "ssyeolg", "ssyeolm", "ssyeolb", "ssyeols", "ssyeolt", "ssyeolp", "ssyeolh", "ssyeom", "ssyeob", "ssyeobs", "ssyeos", "ssyeoss", "ssyeong", "ssyeoj", "ssyeoc", "ssyeok", "ssyeot", "ssyeop", "ssyeoh", "ssye", "ssyeg", "ssyegg", "ssyegs", "ssyen", "ssyenj", "ssyenh", "ssyed", "ssyel", "ssyelg", "ssyelm", "ssyelb", "ssyels", "ssyelt", "ssyelp", "ssyelh", "ssyem", "ssyeb", "ssyebs", "ssyes", "ssyess", "ssyeng", "ssyej", "ssyec", "ssyek", "ssyet", "ssyep", "ssyeh", "sso", "ssog", "ssogg", "ssogs", "sson", "ssonj", "ssonh", "ssod", "ssol", "ssolg", "ssolm", "ssolb", "ssols", "ssolt", "ssolp", "ssolh", "ssom", "ssob", "ssobs", "ssos", "ssoss", "ssong", "ssoj", "ssoc", "ssok", "ssot", "ssop", "ssoh", "sswa", "sswag", "sswagg", "sswags", "sswan", "sswanj", "sswanh", "sswad", "sswal", "sswalg", "sswalm", "sswalb"], ["sswals", "sswalt", "sswalp", "sswalh", "sswam", "sswab", "sswabs", "sswas", "sswass", "sswang", "sswaj", "sswac", "sswak", "sswat", "sswap", "sswah", "sswae", "sswaeg", "sswaegg", "sswaegs", "sswaen", "sswaenj", "sswaenh", "sswaed", "sswael", "sswaelg", "sswaelm", "sswaelb", "sswaels", "sswaelt", "sswaelp", "sswaelh", "sswaem", "sswaeb", "sswaebs", "sswaes", "sswaess", "sswaeng", "sswaej", "sswaec", "sswaek", "sswaet", "sswaep", "sswaeh", "ssoe", "ssoeg", "ssoegg", "ssoegs", "ssoen", "ssoenj", "ssoenh", "ssoed", "ssoel", "ssoelg", "ssoelm", "ssoelb", "ssoels", "ssoelt", "ssoelp", "ssoelh", "ssoem", "ssoeb", "ssoebs", "ssoes", "ssoess", "ssoeng", "ssoej", "ssoec", "ssoek", "ssoet", "ssoep", "ssoeh", "ssyo", "ssyog", "ssyogg", "ssyogs", "ssyon", "ssyonj", "ssyonh", "ssyod", "ssyol", "ssyolg", "ssyolm", "ssyolb", "ssyols", "ssyolt", "ssyolp", "ssyolh", "ssyom", "ssyob", "ssyobs", "ssyos", "ssyoss", "ssyong", "ssyoj", "ssyoc", "ssyok", "ssyot", "ssyop", "ssyoh", "ssu", "ssug", "ssugg", "ssugs", "ssun", "ssunj", "ssunh", "ssud", "ssul", "ssulg", "ssulm", "ssulb", "ssuls", "ssult", "ssulp", "ssulh", "ssum", "ssub", "ssubs", "ssus", "ssuss", "ssung", "ssuj", "ssuc", "ssuk", "ssut", "ssup", "ssuh", "ssweo", "ssweog", "ssweogg", "ssweogs", "ssweon", "ssweonj", "ssweonh", "ssweod", "ssweol", "ssweolg", "ssweolm", "ssweolb", "ssweols", "ssweolt", "ssweolp", "ssweolh", "ssweom", "ssweob", "ssweobs", "ssweos", "ssweoss", "ssweong", "ssweoj", "ssweoc", "ssweok", "ssweot", "ssweop", "ssweoh", "sswe", "ssweg", "sswegg", "sswegs", "sswen", "sswenj", "sswenh", "sswed", "sswel", "sswelg", "sswelm", "sswelb", "sswels", "sswelt", "sswelp", "sswelh", "sswem", "ssweb", "sswebs", "sswes", "sswess", "ssweng", "sswej", "sswec", "sswek", "sswet", "sswep", "ssweh", "sswi", "sswig", "sswigg", "sswigs", "sswin", "sswinj", "sswinh", "sswid", "sswil", "sswilg", "sswilm", "sswilb", "sswils", "sswilt", "sswilp", "sswilh", "sswim", "sswib", "sswibs", "sswis", "sswiss", "sswing", "sswij", "sswic", "sswik", "sswit", "sswip", "sswih", "ssyu", "ssyug", "ssyugg", "ssyugs", "ssyun", "ssyunj", "ssyunh", "ssyud", "ssyul", "ssyulg", "ssyulm", "ssyulb", "ssyuls", "ssyult", "ssyulp", "ssyulh", "ssyum", "ssyub", "ssyubs", "ssyus", "ssyuss", "ssyung", "ssyuj", "ssyuc", "ssyuk", "ssyut", "ssyup", "ssyuh", "sseu", "sseug", "sseugg", "sseugs", "sseun", "sseunj", "sseunh", "sseud", "sseul", "sseulg", "sseulm", "sseulb", "sseuls", "sseult", "sseulp", "sseulh"], ["sseum", "sseub", "sseubs", "sseus", "sseuss", "sseung", "sseuj", "sseuc", "sseuk", "sseut", "sseup", "sseuh", "ssyi", "ssyig", "ssyigg", "ssyigs", "ssyin", "ssyinj", "ssyinh", "ssyid", "ssyil", "ssyilg", "ssyilm", "ssyilb", "ssyils", "ssyilt", "ssyilp", "ssyilh", "ssyim", "ssyib", "ssyibs", "ssyis", "ssyiss", "ssying", "ssyij", "ssyic", "ssyik", "ssyit", "ssyip", "ssyih", "ssi", "ssig", "ssigg", "ssigs", "ssin", "ssinj", "ssinh", "ssid", "ssil", "ssilg", "ssilm", "ssilb", "ssils", "ssilt", "ssilp", "ssilh", "ssim", "ssib", "ssibs", "ssis", "ssiss", "ssing", "ssij", "ssic", "ssik", "ssit", "ssip", "ssih", "a", "ag", "agg", "ags", "an", "anj", "anh", "ad", "al", "alg", "alm", "alb", "als", "alt", "alp", "alh", "am", "ab", "abs", "as", "ass", "ang", "aj", "ac", "ak", "at", "ap", "ah", "ae", "aeg", "aegg", "aegs", "aen", "aenj", "aenh", "aed", "ael", "aelg", "aelm", "aelb", "aels", "aelt", "aelp", "aelh", "aem", "aeb", "aebs", "aes", "aess", "aeng", "aej", "aec", "aek", "aet", "aep", "aeh", "ya", "yag", "yagg", "yags", "yan", "yanj", "yanh", "yad", "yal", "yalg", "yalm", "yalb", "yals", "yalt", "yalp", "yalh", "yam", "yab", "yabs", "yas", "yass", "yang", "yaj", "yac", "yak", "yat", "yap", "yah", "yae", "yaeg", "yaegg", "yaegs", "yaen", "yaenj", "yaenh", "yaed", "yael", "yaelg", "yaelm", "yaelb", "yaels", "yaelt", "yaelp", "yaelh", "yaem", "yaeb", "yaebs", "yaes", "yaess", "yaeng", "yaej", "yaec", "yaek", "yaet", "yaep", "yaeh", "eo", "eog", "eogg", "eogs", "eon", "eonj", "eonh", "eod", "eol", "eolg", "eolm", "eolb", "eols", "eolt", "eolp", "eolh", "eom", "eob", "eobs", "eos", "eoss", "eong", "eoj", "eoc", "eok", "eot", "eop", "eoh", "e", "eg", "egg", "egs", "en", "enj", "enh", "ed", "el", "elg", "elm", "elb", "els", "elt", "elp", "elh", "em", "eb", "ebs", "es", "ess", "eng", "ej", "ec", "ek", "et", "ep", "eh", "yeo", "yeog", "yeogg", "yeogs", "yeon", "yeonj", "yeonh", "yeod", "yeol", "yeolg", "yeolm", "yeolb", "yeols", "yeolt", "yeolp", "yeolh", "yeom", "yeob", "yeobs", "yeos"], ["yeoss", "yeong", "yeoj", "yeoc", "yeok", "yeot", "yeop", "yeoh", "ye", "yeg", "yegg", "yegs", "yen", "yenj", "yenh", "yed", "yel", "yelg", "yelm", "yelb", "yels", "yelt", "yelp", "yelh", "yem", "yeb", "yebs", "yes", "yess", "yeng", "yej", "yec", "yek", "yet", "yep", "yeh", "o", "og", "ogg", "ogs", "on", "onj", "onh", "od", "ol", "olg", "olm", "olb", "ols", "olt", "olp", "olh", "om", "ob", "obs", "os", "oss", "ong", "oj", "oc", "ok", "ot", "op", "oh", "wa", "wag", "wagg", "wags", "wan", "wanj", "wanh", "wad", "wal", "walg", "walm", "walb", "wals", "walt", "walp", "walh", "wam", "wab", "wabs", "was", "wass", "wang", "waj", "wac", "wak", "wat", "wap", "wah", "wae", "waeg", "waegg", "waegs", "waen", "waenj", "waenh", "waed", "wael", "waelg", "waelm", "waelb", "waels", "waelt", "waelp", "waelh", "waem", "waeb", "waebs", "waes", "waess", "waeng", "waej", "waec", "waek", "waet", "waep", "waeh", "oe", "oeg", "oegg", "oegs", "oen", "oenj", "oenh", "oed", "oel", "oelg", "oelm", "oelb", "oels", "oelt", "oelp", "oelh", "oem", "oeb", "oebs", "oes", "oess", "oeng", "oej", "oec", "oek", "oet", "oep", "oeh", "yo", "yog", "yogg", "yogs", "yon", "yonj", "yonh", "yod", "yol", "yolg", "yolm", "yolb", "yols", "yolt", "yolp", "yolh", "yom", "yob", "yobs", "yos", "yoss", "yong", "yoj", "yoc", "yok", "yot", "yop", "yoh", "u", "ug", "ugg", "ugs", "un", "unj", "unh", "ud", "ul", "ulg", "ulm", "ulb", "uls", "ult", "ulp", "ulh", "um", "ub", "ubs", "us", "uss", "ung", "uj", "uc", "uk", "ut", "up", "uh", "weo", "weog", "weogg", "weogs", "weon", "weonj", "weonh", "weod", "weol", "weolg", "weolm", "weolb", "weols", "weolt", "weolp", "weolh", "weom", "weob", "weobs", "weos", "weoss", "weong", "weoj", "weoc", "weok", "weot", "weop", "weoh", "we", "weg", "wegg", "wegs", "wen", "wenj", "wenh", "wed", "wel", "welg", "welm", "welb", "wels", "welt", "welp", "welh", "wem", "web", "webs", "wes", "wess", "weng", "wej", "wec"], ["wek", "wet", "wep", "weh", "wi", "wig", "wigg", "wigs", "win", "winj", "winh", "wid", "wil", "wilg", "wilm", "wilb", "wils", "wilt", "wilp", "wilh", "wim", "wib", "wibs", "wis", "wiss", "wing", "wij", "wic", "wik", "wit", "wip", "wih", "yu", "yug", "yugg", "yugs", "yun", "yunj", "yunh", "yud", "yul", "yulg", "yulm", "yulb", "yuls", "yult", "yulp", "yulh", "yum", "yub", "yubs", "yus", "yuss", "yung", "yuj", "yuc", "yuk", "yut", "yup", "yuh", "eu", "eug", "eugg", "eugs", "eun", "eunj", "eunh", "eud", "eul", "eulg", "eulm", "eulb", "euls", "eult", "eulp", "eulh", "eum", "eub", "eubs", "eus", "euss", "eung", "euj", "euc", "euk", "eut", "eup", "euh", "yi", "yig", "yigg", "yigs", "yin", "yinj", "yinh", "yid", "yil", "yilg", "yilm", "yilb", "yils", "yilt", "yilp", "yilh", "yim", "yib", "yibs", "yis", "yiss", "ying", "yij", "yic", "yik", "yit", "yip", "yih", "i", "ig", "igg", "igs", "in", "inj", "inh", "id", "il", "ilg", "ilm", "ilb", "ils", "ilt", "ilp", "ilh", "im", "ib", "ibs", "is", "iss", "ing", "ij", "ic", "ik", "it", "ip", "ih", "ja", "jag", "jagg", "jags", "jan", "janj", "janh", "jad", "jal", "jalg", "jalm", "jalb", "jals", "jalt", "jalp", "jalh", "jam", "jab", "jabs", "jas", "jass", "jang", "jaj", "jac", "jak", "jat", "jap", "jah", "jae", "jaeg", "jaegg", "jaegs", "jaen", "jaenj", "jaenh", "jaed", "jael", "jaelg", "jaelm", "jaelb", "jaels", "jaelt", "jaelp", "jaelh", "jaem", "jaeb", "jaebs", "jaes", "jaess", "jaeng", "jaej", "jaec", "jaek", "jaet", "jaep", "jaeh", "jya", "jyag", "jyagg", "jyags", "jyan", "jyanj", "jyanh", "jyad", "jyal", "jyalg", "jyalm", "jyalb", "jyals", "jyalt", "jyalp", "jyalh", "jyam", "jyab", "jyabs", "jyas", "jyass", "jyang", "jyaj", "jyac", "jyak", "jyat", "jyap", "jyah", "jyae", "jyaeg", "jyaegg", "jyaegs", "jyaen", "jyaenj", "jyaenh", "jyaed", "jyael", "jyaelg", "jyaelm", "jyaelb", "jyaels", "jyaelt", "jyaelp", "jyaelh", "jyaem", "jyaeb", "jyaebs", "jyaes", "jyaess", "jyaeng", "jyaej", "jyaec", "jyaek", "jyaet", "jyaep", "jyaeh"], ["jeo", "jeog", "jeogg", "jeogs", "jeon", "jeonj", "jeonh", "jeod", "jeol", "jeolg", "jeolm", "jeolb", "jeols", "jeolt", "jeolp", "jeolh", "jeom", "jeob", "jeobs", "jeos", "jeoss", "jeong", "jeoj", "jeoc", "jeok", "jeot", "jeop", "jeoh", "je", "jeg", "jegg", "jegs", "jen", "jenj", "jenh", "jed", "jel", "jelg", "jelm", "jelb", "jels", "jelt", "jelp", "jelh", "jem", "jeb", "jebs", "jes", "jess", "jeng", "jej", "jec", "jek", "jet", "jep", "jeh", "jyeo", "jyeog", "jyeogg", "jyeogs", "jyeon", "jyeonj", "jyeonh", "jyeod", "jyeol", "jyeolg", "jyeolm", "jyeolb", "jyeols", "jyeolt", "jyeolp", "jyeolh", "jyeom", "jyeob", "jyeobs", "jyeos", "jyeoss", "jyeong", "jyeoj", "jyeoc", "jyeok", "jyeot", "jyeop", "jyeoh", "jye", "jyeg", "jyegg", "jyegs", "jyen", "jyenj", "jyenh", "jyed", "jyel", "jyelg", "jyelm", "jyelb", "jyels", "jyelt", "jyelp", "jyelh", "jyem", "jyeb", "jyebs", "jyes", "jyess", "jyeng", "jyej", "jyec", "jyek", "jyet", "jyep", "jyeh", "jo", "jog", "jogg", "jogs", "jon", "jonj", "jonh", "jod", "jol", "jolg", "jolm", "jolb", "jols", "jolt", "jolp", "jolh", "jom", "job", "jobs", "jos", "joss", "jong", "joj", "joc", "jok", "jot", "jop", "joh", "jwa", "jwag", "jwagg", "jwags", "jwan", "jwanj", "jwanh", "jwad", "jwal", "jwalg", "jwalm", "jwalb", "jwals", "jwalt", "jwalp", "jwalh", "jwam", "jwab", "jwabs", "jwas", "jwass", "jwang", "jwaj", "jwac", "jwak", "jwat", "jwap", "jwah", "jwae", "jwaeg", "jwaegg", "jwaegs", "jwaen", "jwaenj", "jwaenh", "jwaed", "jwael", "jwaelg", "jwaelm", "jwaelb", "jwaels", "jwaelt", "jwaelp", "jwaelh", "jwaem", "jwaeb", "jwaebs", "jwaes", "jwaess", "jwaeng", "jwaej", "jwaec", "jwaek", "jwaet", "jwaep", "jwaeh", "joe", "joeg", "joegg", "joegs", "joen", "joenj", "joenh", "joed", "joel", "joelg", "joelm", "joelb", "joels", "joelt", "joelp", "joelh", "joem", "joeb", "joebs", "joes", "joess", "joeng", "joej", "joec", "joek", "joet", "joep", "joeh", "jyo", "jyog", "jyogg", "jyogs", "jyon", "jyonj", "jyonh", "jyod", "jyol", "jyolg", "jyolm", "jyolb", "jyols", "jyolt", "jyolp", "jyolh", "jyom", "jyob", "jyobs", "jyos", "jyoss", "jyong", "jyoj", "jyoc", "jyok", "jyot", "jyop", "jyoh", "ju", "jug", "jugg", "jugs"], ["jun", "junj", "junh", "jud", "jul", "julg", "julm", "julb", "juls", "jult", "julp", "julh", "jum", "jub", "jubs", "jus", "juss", "jung", "juj", "juc", "juk", "jut", "jup", "juh", "jweo", "jweog", "jweogg", "jweogs", "jweon", "jweonj", "jweonh", "jweod", "jweol", "jweolg", "jweolm", "jweolb", "jweols", "jweolt", "jweolp", "jweolh", "jweom", "jweob", "jweobs", "jweos", "jweoss", "jweong", "jweoj", "jweoc", "jweok", "jweot", "jweop", "jweoh", "jwe", "jweg", "jwegg", "jwegs", "jwen", "jwenj", "jwenh", "jwed", "jwel", "jwelg", "jwelm", "jwelb", "jwels", "jwelt", "jwelp", "jwelh", "jwem", "jweb", "jwebs", "jwes", "jwess", "jweng", "jwej", "jwec", "jwek", "jwet", "jwep", "jweh", "jwi", "jwig", "jwigg", "jwigs", "jwin", "jwinj", "jwinh", "jwid", "jwil", "jwilg", "jwilm", "jwilb", "jwils", "jwilt", "jwilp", "jwilh", "jwim", "jwib", "jwibs", "jwis", "jwiss", "jwing", "jwij", "jwic", "jwik", "jwit", "jwip", "jwih", "jyu", "jyug", "jyugg", "jyugs", "jyun", "jyunj", "jyunh", "jyud", "jyul", "jyulg", "jyulm", "jyulb", "jyuls", "jyult", "jyulp", "jyulh", "jyum", "jyub", "jyubs", "jyus", "jyuss", "jyung", "jyuj", "jyuc", "jyuk", "jyut", "jyup", "jyuh", "jeu", "jeug", "jeugg", "jeugs", "jeun", "jeunj", "jeunh", "jeud", "jeul", "jeulg", "jeulm", "jeulb", "jeuls", "jeult", "jeulp", "jeulh", "jeum", "jeub", "jeubs", "jeus", "jeuss", "jeung", "jeuj", "jeuc", "jeuk", "jeut", "jeup", "jeuh", "jyi", "jyig", "jyigg", "jyigs", "jyin", "jyinj", "jyinh", "jyid", "jyil", "jyilg", "jyilm", "jyilb", "jyils", "jyilt", "jyilp", "jyilh", "jyim", "jyib", "jyibs", "jyis", "jyiss", "jying", "jyij", "jyic", "jyik", "jyit", "jyip", "jyih", "ji", "jig", "jigg", "jigs", "jin", "jinj", "jinh", "jid", "jil", "jilg", "jilm", "jilb", "jils", "jilt", "jilp", "jilh", "jim", "jib", "jibs", "jis", "jiss", "jing", "jij", "jic", "jik", "jit", "jip", "jih", "jja", "jjag", "jjagg", "jjags", "jjan", "jjanj", "jjanh", "jjad", "jjal", "jjalg", "jjalm", "jjalb", "jjals", "jjalt", "jjalp", "jjalh", "jjam", "jjab", "jjabs", "jjas", "jjass", "jjang", "jjaj", "jjac", "jjak", "jjat", "jjap", "jjah", "jjae", "jjaeg", "jjaegg", "jjaegs", "jjaen", "jjaenj", "jjaenh", "jjaed"], ["jjael", "jjaelg", "jjaelm", "jjaelb", "jjaels", "jjaelt", "jjaelp", "jjaelh", "jjaem", "jjaeb", "jjaebs", "jjaes", "jjaess", "jjaeng", "jjaej", "jjaec", "jjaek", "jjaet", "jjaep", "jjaeh", "jjya", "jjyag", "jjyagg", "jjyags", "jjyan", "jjyanj", "jjyanh", "jjyad", "jjyal", "jjyalg", "jjyalm", "jjyalb", "jjyals", "jjyalt", "jjyalp", "jjyalh", "jjyam", "jjyab", "jjyabs", "jjyas", "jjyass", "jjyang", "jjyaj", "jjyac", "jjyak", "jjyat", "jjyap", "jjyah", "jjyae", "jjyaeg", "jjyaegg", "jjyaegs", "jjyaen", "jjyaenj", "jjyaenh", "jjyaed", "jjyael", "jjyaelg", "jjyaelm", "jjyaelb", "jjyaels", "jjyaelt", "jjyaelp", "jjyaelh", "jjyaem", "jjyaeb", "jjyaebs", "jjyaes", "jjyaess", "jjyaeng", "jjyaej", "jjyaec", "jjyaek", "jjyaet", "jjyaep", "jjyaeh", "jjeo", "jjeog", "jjeogg", "jjeogs", "jjeon", "jjeonj", "jjeonh", "jjeod", "jjeol", "jjeolg", "jjeolm", "jjeolb", "jjeols", "jjeolt", "jjeolp", "jjeolh", "jjeom", "jjeob", "jjeobs", "jjeos", "jjeoss", "jjeong", "jjeoj", "jjeoc", "jjeok", "jjeot", "jjeop", "jjeoh", "jje", "jjeg", "jjegg", "jjegs", "jjen", "jjenj", "jjenh", "jjed", "jjel", "jjelg", "jjelm", "jjelb", "jjels", "jjelt", "jjelp", "jjelh", "jjem", "jjeb", "jjebs", "jjes", "jjess", "jjeng", "jjej", "jjec", "jjek", "jjet", "jjep", "jjeh", "jjyeo", "jjyeog", "jjyeogg", "jjyeogs", "jjyeon", "jjyeonj", "jjyeonh", "jjyeod", "jjyeol", "jjyeolg", "jjyeolm", "jjyeolb", "jjyeols", "jjyeolt", "jjyeolp", "jjyeolh", "jjyeom", "jjyeob", "jjyeobs", "jjyeos", "jjyeoss", "jjyeong", "jjyeoj", "jjyeoc", "jjyeok", "jjyeot", "jjyeop", "jjyeoh", "jjye", "jjyeg", "jjyegg", "jjyegs", "jjyen", "jjyenj", "jjyenh", "jjyed", "jjyel", "jjyelg", "jjyelm", "jjyelb", "jjyels", "jjyelt", "jjyelp", "jjyelh", "jjyem", "jjyeb", "jjyebs", "jjyes", "jjyess", "jjyeng", "jjyej", "jjyec", "jjyek", "jjyet", "jjyep", "jjyeh", "jjo", "jjog", "jjogg", "jjogs", "jjon", "jjonj", "jjonh", "jjod", "jjol", "jjolg", "jjolm", "jjolb", "jjols", "jjolt", "jjolp", "jjolh", "jjom", "jjob", "jjobs", "jjos", "jjoss", "jjong", "jjoj", "jjoc", "jjok", "jjot", "jjop", "jjoh", "jjwa", "jjwag", "jjwagg", "jjwags", "jjwan", "jjwanj", "jjwanh", "jjwad", "jjwal", "jjwalg", "jjwalm", "jjwalb", "jjwals", "jjwalt", "jjwalp", "jjwalh", "jjwam", "jjwab", "jjwabs", "jjwas", "jjwass", "jjwang", "jjwaj", "jjwac", "jjwak", "jjwat", "jjwap", "jjwah", "jjwae", "jjwaeg", "jjwaegg", "jjwaegs", "jjwaen", "jjwaenj", "jjwaenh", "jjwaed", "jjwael", "jjwaelg", "jjwaelm", "jjwaelb"], ["jjwaels", "jjwaelt", "jjwaelp", "jjwaelh", "jjwaem", "jjwaeb", "jjwaebs", "jjwaes", "jjwaess", "jjwaeng", "jjwaej", "jjwaec", "jjwaek", "jjwaet", "jjwaep", "jjwaeh", "jjoe", "jjoeg", "jjoegg", "jjoegs", "jjoen", "jjoenj", "jjoenh", "jjoed", "jjoel", "jjoelg", "jjoelm", "jjoelb", "jjoels", "jjoelt", "jjoelp", "jjoelh", "jjoem", "jjoeb", "jjoebs", "jjoes", "jjoess", "jjoeng", "jjoej", "jjoec", "jjoek", "jjoet", "jjoep", "jjoeh", "jjyo", "jjyog", "jjyogg", "jjyogs", "jjyon", "jjyonj", "jjyonh", "jjyod", "jjyol", "jjyolg", "jjyolm", "jjyolb", "jjyols", "jjyolt", "jjyolp", "jjyolh", "jjyom", "jjyob", "jjyobs", "jjyos", "jjyoss", "jjyong", "jjyoj", "jjyoc", "jjyok", "jjyot", "jjyop", "jjyoh", "jju", "jjug", "jjugg", "jjugs", "jjun", "jjunj", "jjunh", "jjud", "jjul", "jjulg", "jjulm", "jjulb", "jjuls", "jjult", "jjulp", "jjulh", "jjum", "jjub", "jjubs", "jjus", "jjuss", "jjung", "jjuj", "jjuc", "jjuk", "jjut", "jjup", "jjuh", "jjweo", "jjweog", "jjweogg", "jjweogs", "jjweon", "jjweonj", "jjweonh", "jjweod", "jjweol", "jjweolg", "jjweolm", "jjweolb", "jjweols", "jjweolt", "jjweolp", "jjweolh", "jjweom", "jjweob", "jjweobs", "jjweos", "jjweoss", "jjweong", "jjweoj", "jjweoc", "jjweok", "jjweot", "jjweop", "jjweoh", "jjwe", "jjweg", "jjwegg", "jjwegs", "jjwen", "jjwenj", "jjwenh", "jjwed", "jjwel", "jjwelg", "jjwelm", "jjwelb", "jjwels", "jjwelt", "jjwelp", "jjwelh", "jjwem", "jjweb", "jjwebs", "jjwes", "jjwess", "jjweng", "jjwej", "jjwec", "jjwek", "jjwet", "jjwep", "jjweh", "jjwi", "jjwig", "jjwigg", "jjwigs", "jjwin", "jjwinj", "jjwinh", "jjwid", "jjwil", "jjwilg", "jjwilm", "jjwilb", "jjwils", "jjwilt", "jjwilp", "jjwilh", "jjwim", "jjwib", "jjwibs", "jjwis", "jjwiss", "jjwing", "jjwij", "jjwic", "jjwik", "jjwit", "jjwip", "jjwih", "jjyu", "jjyug", "jjyugg", "jjyugs", "jjyun", "jjyunj", "jjyunh", "jjyud", "jjyul", "jjyulg", "jjyulm", "jjyulb", "jjyuls", "jjyult", "jjyulp", "jjyulh", "jjyum", "jjyub", "jjyubs", "jjyus", "jjyuss", "jjyung", "jjyuj", "jjyuc", "jjyuk", "jjyut", "jjyup", "jjyuh", "jjeu", "jjeug", "jjeugg", "jjeugs", "jjeun", "jjeunj", "jjeunh", "jjeud", "jjeul", "jjeulg", "jjeulm", "jjeulb", "jjeuls", "jjeult", "jjeulp", "jjeulh", "jjeum", "jjeub", "jjeubs", "jjeus", "jjeuss", "jjeung", "jjeuj", "jjeuc", "jjeuk", "jjeut", "jjeup", "jjeuh", "jjyi", "jjyig", "jjyigg", "jjyigs", "jjyin", "jjyinj", "jjyinh", "jjyid", "jjyil", "jjyilg", "jjyilm", "jjyilb", "jjyils", "jjyilt", "jjyilp", "jjyilh"], ["jjyim", "jjyib", "jjyibs", "jjyis", "jjyiss", "jjying", "jjyij", "jjyic", "jjyik", "jjyit", "jjyip", "jjyih", "jji", "jjig", "jjigg", "jjigs", "jjin", "jjinj", "jjinh", "jjid", "jjil", "jjilg", "jjilm", "jjilb", "jjils", "jjilt", "jjilp", "jjilh", "jjim", "jjib", "jjibs", "jjis", "jjiss", "jjing", "jjij", "jjic", "jjik", "jjit", "jjip", "jjih", "ca", "cag", "cagg", "cags", "can", "canj", "canh", "cad", "cal", "calg", "calm", "calb", "cals", "calt", "calp", "calh", "cam", "cab", "cabs", "cas", "cass", "cang", "caj", "cac", "cak", "cat", "cap", "cah", "cae", "caeg", "caegg", "caegs", "caen", "caenj", "caenh", "caed", "cael", "caelg", "caelm", "caelb", "caels", "caelt", "caelp", "caelh", "caem", "caeb", "caebs", "caes", "caess", "caeng", "caej", "caec", "caek", "caet", "caep", "caeh", "cya", "cyag", "cyagg", "cyags", "cyan", "cyanj", "cyanh", "cyad", "cyal", "cyalg", "cyalm", "cyalb", "cyals", "cyalt", "cyalp", "cyalh", "cyam", "cyab", "cyabs", "cyas", "cyass", "cyang", "cyaj", "cyac", "cyak", "cyat", "cyap", "cyah", "cyae", "cyaeg", "cyaegg", "cyaegs", "cyaen", "cyaenj", "cyaenh", "cyaed", "cyael", "cyaelg", "cyaelm", "cyaelb", "cyaels", "cyaelt", "cyaelp", "cyaelh", "cyaem", "cyaeb", "cyaebs", "cyaes", "cyaess", "cyaeng", "cyaej", "cyaec", "cyaek", "cyaet", "cyaep", "cyaeh", "ceo", "ceog", "ceogg", "ceogs", "ceon", "ceonj", "ceonh", "ceod", "ceol", "ceolg", "ceolm", "ceolb", "ceols", "ceolt", "ceolp", "ceolh", "ceom", "ceob", "ceobs", "ceos", "ceoss", "ceong", "ceoj", "ceoc", "ceok", "ceot", "ceop", "ceoh", "ce", "ceg", "cegg", "cegs", "cen", "cenj", "cenh", "ced", "cel", "celg", "celm", "celb", "cels", "celt", "celp", "celh", "cem", "ceb", "cebs", "ces", "cess", "ceng", "cej", "cec", "cek", "cet", "cep", "ceh", "cyeo", "cyeog", "cyeogg", "cyeogs", "cyeon", "cyeonj", "cyeonh", "cyeod", "cyeol", "cyeolg", "cyeolm", "cyeolb", "cyeols", "cyeolt", "cyeolp", "cyeolh", "cyeom", "cyeob", "cyeobs", "cyeos", "cyeoss", "cyeong", "cyeoj", "cyeoc", "cyeok", "cyeot", "cyeop", "cyeoh", "cye", "cyeg", "cyegg", "cyegs", "cyen", "cyenj", "cyenh", "cyed", "cyel", "cyelg", "cyelm", "cyelb", "cyels", "cyelt", "cyelp", "cyelh", "cyem", "cyeb", "cyebs", "cyes"], ["cyess", "cyeng", "cyej", "cyec", "cyek", "cyet", "cyep", "cyeh", "co", "cog", "cogg", "cogs", "con", "conj", "conh", "cod", "col", "colg", "colm", "colb", "cols", "colt", "colp", "colh", "com", "cob", "cobs", "cos", "coss", "cong", "coj", "coc", "cok", "cot", "cop", "coh", "cwa", "cwag", "cwagg", "cwags", "cwan", "cwanj", "cwanh", "cwad", "cwal", "cwalg", "cwalm", "cwalb", "cwals", "cwalt", "cwalp", "cwalh", "cwam", "cwab", "cwabs", "cwas", "cwass", "cwang", "cwaj", "cwac", "cwak", "cwat", "cwap", "cwah", "cwae", "cwaeg", "cwaegg", "cwaegs", "cwaen", "cwaenj", "cwaenh", "cwaed", "cwael", "cwaelg", "cwaelm", "cwaelb", "cwaels", "cwaelt", "cwaelp", "cwaelh", "cwaem", "cwaeb", "cwaebs", "cwaes", "cwaess", "cwaeng", "cwaej", "cwaec", "cwaek", "cwaet", "cwaep", "cwaeh", "coe", "coeg", "coegg", "coegs", "coen", "coenj", "coenh", "coed", "coel", "coelg", "coelm", "coelb", "coels", "coelt", "coelp", "coelh", "coem", "coeb", "coebs", "coes", "coess", "coeng", "coej", "coec", "coek", "coet", "coep", "coeh", "cyo", "cyog", "cyogg", "cyogs", "cyon", "cyonj", "cyonh", "cyod", "cyol", "cyolg", "cyolm", "cyolb", "cyols", "cyolt", "cyolp", "cyolh", "cyom", "cyob", "cyobs", "cyos", "cyoss", "cyong", "cyoj", "cyoc", "cyok", "cyot", "cyop", "cyoh", "cu", "cug", "cugg", "cugs", "cun", "cunj", "cunh", "cud", "cul", "culg", "culm", "culb", "culs", "cult", "culp", "culh", "cum", "cub", "cubs", "cus", "cuss", "cung", "cuj", "cuc", "cuk", "cut", "cup", "cuh", "cweo", "cweog", "cweogg", "cweogs", "cweon", "cweonj", "cweonh", "cweod", "cweol", "cweolg", "cweolm", "cweolb", "cweols", "cweolt", "cweolp", "cweolh", "cweom", "cweob", "cweobs", "cweos", "cweoss", "cweong", "cweoj", "cweoc", "cweok", "cweot", "cweop", "cweoh", "cwe", "cweg", "cwegg", "cwegs", "cwen", "cwenj", "cwenh", "cwed", "cwel", "cwelg", "cwelm", "cwelb", "cwels", "cwelt", "cwelp", "cwelh", "cwem", "cweb", "cwebs", "cwes", "cwess", "cweng", "cwej", "cwec", "cwek", "cwet", "cwep", "cweh", "cwi", "cwig", "cwigg", "cwigs", "cwin", "cwinj", "cwinh", "cwid", "cwil", "cwilg", "cwilm", "cwilb", "cwils", "cwilt", "cwilp", "cwilh", "cwim", "cwib", "cwibs", "cwis", "cwiss", "cwing", "cwij", "cwic"], ["cwik", "cwit", "cwip", "cwih", "cyu", "cyug", "cyugg", "cyugs", "cyun", "cyunj", "cyunh", "cyud", "cyul", "cyulg", "cyulm", "cyulb", "cyuls", "cyult", "cyulp", "cyulh", "cyum", "cyub", "cyubs", "cyus", "cyuss", "cyung", "cyuj", "cyuc", "cyuk", "cyut", "cyup", "cyuh", "ceu", "ceug", "ceugg", "ceugs", "ceun", "ceunj", "ceunh", "ceud", "ceul", "ceulg", "ceulm", "ceulb", "ceuls", "ceult", "ceulp", "ceulh", "ceum", "ceub", "ceubs", "ceus", "ceuss", "ceung", "ceuj", "ceuc", "ceuk", "ceut", "ceup", "ceuh", "cyi", "cyig", "cyigg", "cyigs", "cyin", "cyinj", "cyinh", "cyid", "cyil", "cyilg", "cyilm", "cyilb", "cyils", "cyilt", "cyilp", "cyilh", "cyim", "cyib", "cyibs", "cyis", "cyiss", "cying", "cyij", "cyic", "cyik", "cyit", "cyip", "cyih", "ci", "cig", "cigg", "cigs", "cin", "cinj", "cinh", "cid", "cil", "cilg", "cilm", "cilb", "cils", "cilt", "cilp", "cilh", "cim", "cib", "cibs", "cis", "ciss", "cing", "cij", "cic", "cik", "cit", "cip", "cih", "ka", "kag", "kagg", "kags", "kan", "kanj", "kanh", "kad", "kal", "kalg", "kalm", "kalb", "kals", "kalt", "kalp", "kalh", "kam", "kab", "kabs", "kas", "kass", "kang", "kaj", "kac", "kak", "kat", "kap", "kah", "kae", "kaeg", "kaegg", "kaegs", "kaen", "kaenj", "kaenh", "kaed", "kael", "kaelg", "kaelm", "kaelb", "kaels", "kaelt", "kaelp", "kaelh", "kaem", "kaeb", "kaebs", "kaes", "kaess", "kaeng", "kaej", "kaec", "kaek", "kaet", "kaep", "kaeh", "kya", "kyag", "kyagg", "kyags", "kyan", "kyanj", "kyanh", "kyad", "kyal", "kyalg", "kyalm", "kyalb", "kyals", "kyalt", "kyalp", "kyalh", "kyam", "kyab", "kyabs", "kyas", "kyass", "kyang", "kyaj", "kyac", "kyak", "kyat", "kyap", "kyah", "kyae", "kyaeg", "kyaegg", "kyaegs", "kyaen", "kyaenj", "kyaenh", "kyaed", "kyael", "kyaelg", "kyaelm", "kyaelb", "kyaels", "kyaelt", "kyaelp", "kyaelh", "kyaem", "kyaeb", "kyaebs", "kyaes", "kyaess", "kyaeng", "kyaej", "kyaec", "kyaek", "kyaet", "kyaep", "kyaeh", "keo", "keog", "keogg", "keogs", "keon", "keonj", "keonh", "keod", "keol", "keolg", "keolm", "keolb", "keols", "keolt", "keolp", "keolh", "keom", "keob", "keobs", "keos", "keoss", "keong", "keoj", "keoc", "keok", "keot", "keop", "keoh"], ["ke", "keg", "kegg", "kegs", "ken", "kenj", "kenh", "ked", "kel", "kelg", "kelm", "kelb", "kels", "kelt", "kelp", "kelh", "kem", "keb", "kebs", "kes", "kess", "keng", "kej", "kec", "kek", "ket", "kep", "keh", "kyeo", "kyeog", "kyeogg", "kyeogs", "kyeon", "kyeonj", "kyeonh", "kyeod", "kyeol", "kyeolg", "kyeolm", "kyeolb", "kyeols", "kyeolt", "kyeolp", "kyeolh", "kyeom", "kyeob", "kyeobs", "kyeos", "kyeoss", "kyeong", "kyeoj", "kyeoc", "kyeok", "kyeot", "kyeop", "kyeoh", "kye", "kyeg", "kyegg", "kyegs", "kyen", "kyenj", "kyenh", "kyed", "kyel", "kyelg", "kyelm", "kyelb", "kyels", "kyelt", "kyelp", "kyelh", "kyem", "kyeb", "kyebs", "kyes", "kyess", "kyeng", "kyej", "kyec", "kyek", "kyet", "kyep", "kyeh", "ko", "kog", "kogg", "kogs", "kon", "konj", "konh", "kod", "kol", "kolg", "kolm", "kolb", "kols", "kolt", "kolp", "kolh", "kom", "kob", "kobs", "kos", "koss", "kong", "koj", "koc", "kok", "kot", "kop", "koh", "kwa", "kwag", "kwagg", "kwags", "kwan", "kwanj", "kwanh", "kwad", "kwal", "kwalg", "kwalm", "kwalb", "kwals", "kwalt", "kwalp", "kwalh", "kwam", "kwab", "kwabs", "kwas", "kwass", "kwang", "kwaj", "kwac", "kwak", "kwat", "kwap", "kwah", "kwae", "kwaeg", "kwaegg", "kwaegs", "kwaen", "kwaenj", "kwaenh", "kwaed", "kwael", "kwaelg", "kwaelm", "kwaelb", "kwaels", "kwaelt", "kwaelp", "kwaelh", "kwaem", "kwaeb", "kwaebs", "kwaes", "kwaess", "kwaeng", "kwaej", "kwaec", "kwaek", "kwaet", "kwaep", "kwaeh", "koe", "koeg", "koegg", "koegs", "koen", "koenj", "koenh", "koed", "koel", "koelg", "koelm", "koelb", "koels", "koelt", "koelp", "koelh", "koem", "koeb", "koebs", "koes", "koess", "koeng", "koej", "koec", "koek", "koet", "koep", "koeh", "kyo", "kyog", "kyogg", "kyogs", "kyon", "kyonj", "kyonh", "kyod", "kyol", "kyolg", "kyolm", "kyolb", "kyols", "kyolt", "kyolp", "kyolh", "kyom", "kyob", "kyobs", "kyos", "kyoss", "kyong", "kyoj", "kyoc", "kyok", "kyot", "kyop", "kyoh", "ku", "kug", "kugg", "kugs", "kun", "kunj", "kunh", "kud", "kul", "kulg", "kulm", "kulb", "kuls", "kult", "kulp", "kulh", "kum", "kub", "kubs", "kus", "kuss", "kung", "kuj", "kuc", "kuk", "kut", "kup", "kuh", "kweo", "kweog", "kweogg", "kweogs"], ["kweon", "kweonj", "kweonh", "kweod", "kweol", "kweolg", "kweolm", "kweolb", "kweols", "kweolt", "kweolp", "kweolh", "kweom", "kweob", "kweobs", "kweos", "kweoss", "kweong", "kweoj", "kweoc", "kweok", "kweot", "kweop", "kweoh", "kwe", "kweg", "kwegg", "kwegs", "kwen", "kwenj", "kwenh", "kwed", "kwel", "kwelg", "kwelm", "kwelb", "kwels", "kwelt", "kwelp", "kwelh", "kwem", "kweb", "kwebs", "kwes", "kwess", "kweng", "kwej", "kwec", "kwek", "kwet", "kwep", "kweh", "kwi", "kwig", "kwigg", "kwigs", "kwin", "kwinj", "kwinh", "kwid", "kwil", "kwilg", "kwilm", "kwilb", "kwils", "kwilt", "kwilp", "kwilh", "kwim", "kwib", "kwibs", "kwis", "kwiss", "kwing", "kwij", "kwic", "kwik", "kwit", "kwip", "kwih", "kyu", "kyug", "kyugg", "kyugs", "kyun", "kyunj", "kyunh", "kyud", "kyul", "kyulg", "kyulm", "kyulb", "kyuls", "kyult", "kyulp", "kyulh", "kyum", "kyub", "kyubs", "kyus", "kyuss", "kyung", "kyuj", "kyuc", "kyuk", "kyut", "kyup", "kyuh", "keu", "keug", "keugg", "keugs", "keun", "keunj", "keunh", "keud", "keul", "keulg", "keulm", "keulb", "keuls", "keult", "keulp", "keulh", "keum", "keub", "keubs", "keus", "keuss", "keung", "keuj", "keuc", "keuk", "keut", "keup", "keuh", "kyi", "kyig", "kyigg", "kyigs", "kyin", "kyinj", "kyinh", "kyid", "kyil", "kyilg", "kyilm", "kyilb", "kyils", "kyilt", "kyilp", "kyilh", "kyim", "kyib", "kyibs", "kyis", "kyiss", "kying", "kyij", "kyic", "kyik", "kyit", "kyip", "kyih", "ki", "kig", "kigg", "kigs", "kin", "kinj", "kinh", "kid", "kil", "kilg", "kilm", "kilb", "kils", "kilt", "kilp", "kilh", "kim", "kib", "kibs", "kis", "kiss", "king", "kij", "kic", "kik", "kit", "kip", "kih", "ta", "tag", "tagg", "tags", "tan", "tanj", "tanh", "tad", "tal", "talg", "talm", "talb", "tals", "talt", "talp", "talh", "tam", "tab", "tabs", "tas", "tass", "tang", "taj", "tac", "tak", "tat", "tap", "tah", "tae", "taeg", "taegg", "taegs", "taen", "taenj", "taenh", "taed", "tael", "taelg", "taelm", "taelb", "taels", "taelt", "taelp", "taelh", "taem", "taeb", "taebs", "taes", "taess", "taeng", "taej", "taec", "taek", "taet", "taep", "taeh", "tya", "tyag", "tyagg", "tyags", "tyan", "tyanj", "tyanh", "tyad"], ["tyal", "tyalg", "tyalm", "tyalb", "tyals", "tyalt", "tyalp", "tyalh", "tyam", "tyab", "tyabs", "tyas", "tyass", "tyang", "tyaj", "tyac", "tyak", "tyat", "tyap", "tyah", "tyae", "tyaeg", "tyaegg", "tyaegs", "tyaen", "tyaenj", "tyaenh", "tyaed", "tyael", "tyaelg", "tyaelm", "tyaelb", "tyaels", "tyaelt", "tyaelp", "tyaelh", "tyaem", "tyaeb", "tyaebs", "tyaes", "tyaess", "tyaeng", "tyaej", "tyaec", "tyaek", "tyaet", "tyaep", "tyaeh", "teo", "teog", "teogg", "teogs", "teon", "teonj", "teonh", "teod", "teol", "teolg", "teolm", "teolb", "teols", "teolt", "teolp", "teolh", "teom", "teob", "teobs", "teos", "teoss", "teong", "teoj", "teoc", "teok", "teot", "teop", "teoh", "te", "teg", "tegg", "tegs", "ten", "tenj", "tenh", "ted", "tel", "telg", "telm", "telb", "tels", "telt", "telp", "telh", "tem", "teb", "tebs", "tes", "tess", "teng", "tej", "tec", "tek", "tet", "tep", "teh", "tyeo", "tyeog", "tyeogg", "tyeogs", "tyeon", "tyeonj", "tyeonh", "tyeod", "tyeol", "tyeolg", "tyeolm", "tyeolb", "tyeols", "tyeolt", "tyeolp", "tyeolh", "tyeom", "tyeob", "tyeobs", "tyeos", "tyeoss", "tyeong", "tyeoj", "tyeoc", "tyeok", "tyeot", "tyeop", "tyeoh", "tye", "tyeg", "tyegg", "tyegs", "tyen", "tyenj", "tyenh", "tyed", "tyel", "tyelg", "tyelm", "tyelb", "tyels", "tyelt", "tyelp", "tyelh", "tyem", "tyeb", "tyebs", "tyes", "tyess", "tyeng", "tyej", "tyec", "tyek", "tyet", "tyep", "tyeh", "to", "tog", "togg", "togs", "ton", "tonj", "tonh", "tod", "tol", "tolg", "tolm", "tolb", "tols", "tolt", "tolp", "tolh", "tom", "tob", "tobs", "tos", "toss", "tong", "toj", "toc", "tok", "tot", "top", "toh", "twa", "twag", "twagg", "twags", "twan", "twanj", "twanh", "twad", "twal", "twalg", "twalm", "twalb", "twals", "twalt", "twalp", "twalh", "twam", "twab", "twabs", "twas", "twass", "twang", "twaj", "twac", "twak", "twat", "twap", "twah", "twae", "twaeg", "twaegg", "twaegs", "twaen", "twaenj", "twaenh", "twaed", "twael", "twaelg", "twaelm", "twaelb", "twaels", "twaelt", "twaelp", "twaelh", "twaem", "twaeb", "twaebs", "twaes", "twaess", "twaeng", "twaej", "twaec", "twaek", "twaet", "twaep", "twaeh", "toe", "toeg", "toegg", "toegs", "toen", "toenj", "toenh", "toed", "toel", "toelg", "toelm", "toelb"], ["toels", "toelt", "toelp", "toelh", "toem", "toeb", "toebs", "toes", "toess", "toeng", "toej", "toec", "toek", "toet", "toep", "toeh", "tyo", "tyog", "tyogg", "tyogs", "tyon", "tyonj", "tyonh", "tyod", "tyol", "tyolg", "tyolm", "tyolb", "tyols", "tyolt", "tyolp", "tyolh", "tyom", "tyob", "tyobs", "tyos", "tyoss", "tyong", "tyoj", "tyoc", "tyok", "tyot", "tyop", "tyoh", "tu", "tug", "tugg", "tugs", "tun", "tunj", "tunh", "tud", "tul", "tulg", "tulm", "tulb", "tuls", "tult", "tulp", "tulh", "tum", "tub", "tubs", "tus", "tuss", "tung", "tuj", "tuc", "tuk", "tut", "tup", "tuh", "tweo", "tweog", "tweogg", "tweogs", "tweon", "tweonj", "tweonh", "tweod", "tweol", "tweolg", "tweolm", "tweolb", "tweols", "tweolt", "tweolp", "tweolh", "tweom", "tweob", "tweobs", "tweos", "tweoss", "tweong", "tweoj", "tweoc", "tweok", "tweot", "tweop", "tweoh", "twe", "tweg", "twegg", "twegs", "twen", "twenj", "twenh", "twed", "twel", "twelg", "twelm", "twelb", "twels", "twelt", "twelp", "twelh", "twem", "tweb", "twebs", "twes", "twess", "tweng", "twej", "twec", "twek", "twet", "twep", "tweh", "twi", "twig", "twigg", "twigs", "twin", "twinj", "twinh", "twid", "twil", "twilg", "twilm", "twilb", "twils", "twilt", "twilp", "twilh", "twim", "twib", "twibs", "twis", "twiss", "twing", "twij", "twic", "twik", "twit", "twip", "twih", "tyu", "tyug", "tyugg", "tyugs", "tyun", "tyunj", "tyunh", "tyud", "tyul", "tyulg", "tyulm", "tyulb", "tyuls", "tyult", "tyulp", "tyulh", "tyum", "tyub", "tyubs", "tyus", "tyuss", "tyung", "tyuj", "tyuc", "tyuk", "tyut", "tyup", "tyuh", "teu", "teug", "teugg", "teugs", "teun", "teunj", "teunh", "teud", "teul", "teulg", "teulm", "teulb", "teuls", "teult", "teulp", "teulh", "teum", "teub", "teubs", "teus", "teuss", "teung", "teuj", "teuc", "teuk", "teut", "teup", "teuh", "tyi", "tyig", "tyigg", "tyigs", "tyin", "tyinj", "tyinh", "tyid", "tyil", "tyilg", "tyilm", "tyilb", "tyils", "tyilt", "tyilp", "tyilh", "tyim", "tyib", "tyibs", "tyis", "tyiss", "tying", "tyij", "tyic", "tyik", "tyit", "tyip", "tyih", "ti", "tig", "tigg", "tigs", "tin", "tinj", "tinh", "tid", "til", "tilg", "tilm", "tilb", "tils", "tilt", "tilp", "tilh"], ["tim", "tib", "tibs", "tis", "tiss", "ting", "tij", "tic", "tik", "tit", "tip", "tih", "pa", "pag", "pagg", "pags", "pan", "panj", "panh", "pad", "pal", "palg", "palm", "palb", "pals", "palt", "palp", "palh", "pam", "pab", "pabs", "pas", "pass", "pang", "paj", "pac", "pak", "pat", "pap", "pah", "pae", "paeg", "paegg", "paegs", "paen", "paenj", "paenh", "paed", "pael", "paelg", "paelm", "paelb", "paels", "paelt", "paelp", "paelh", "paem", "paeb", "paebs", "paes", "paess", "paeng", "paej", "paec", "paek", "paet", "paep", "paeh", "pya", "pyag", "pyagg", "pyags", "pyan", "pyanj", "pyanh", "pyad", "pyal", "pyalg", "pyalm", "pyalb", "pyals", "pyalt", "pyalp", "pyalh", "pyam", "pyab", "pyabs", "pyas", "pyass", "pyang", "pyaj", "pyac", "pyak", "pyat", "pyap", "pyah", "pyae", "pyaeg", "pyaegg", "pyaegs", "pyaen", "pyaenj", "pyaenh", "pyaed", "pyael", "pyaelg", "pyaelm", "pyaelb", "pyaels", "pyaelt", "pyaelp", "pyaelh", "pyaem", "pyaeb", "pyaebs", "pyaes", "pyaess", "pyaeng", "pyaej", "pyaec", "pyaek", "pyaet", "pyaep", "pyaeh", "peo", "peog", "peogg", "peogs", "peon", "peonj", "peonh", "peod", "peol", "peolg", "peolm", "peolb", "peols", "peolt", "peolp", "peolh", "peom", "peob", "peobs", "peos", "peoss", "peong", "peoj", "peoc", "peok", "peot", "peop", "peoh", "pe", "peg", "pegg", "pegs", "pen", "penj", "penh", "ped", "pel", "pelg", "pelm", "pelb", "pels", "pelt", "pelp", "pelh", "pem", "peb", "pebs", "pes", "pess", "peng", "pej", "pec", "pek", "pet", "pep", "peh", "pyeo", "pyeog", "pyeogg", "pyeogs", "pyeon", "pyeonj", "pyeonh", "pyeod", "pyeol", "pyeolg", "pyeolm", "pyeolb", "pyeols", "pyeolt", "pyeolp", "pyeolh", "pyeom", "pyeob", "pyeobs", "pyeos", "pyeoss", "pyeong", "pyeoj", "pyeoc", "pyeok", "pyeot", "pyeop", "pyeoh", "pye", "pyeg", "pyegg", "pyegs", "pyen", "pyenj", "pyenh", "pyed", "pyel", "pyelg", "pyelm", "pyelb", "pyels", "pyelt", "pyelp", "pyelh", "pyem", "pyeb", "pyebs", "pyes", "pyess", "pyeng", "pyej", "pyec", "pyek", "pyet", "pyep", "pyeh", "po", "pog", "pogg", "pogs", "pon", "ponj", "ponh", "pod", "pol", "polg", "polm", "polb", "pols", "polt", "polp", "polh", "pom", "pob", "pobs", "pos"], ["poss", "pong", "poj", "poc", "pok", "pot", "pop", "poh", "pwa", "pwag", "pwagg", "pwags", "pwan", "pwanj", "pwanh", "pwad", "pwal", "pwalg", "pwalm", "pwalb", "pwals", "pwalt", "pwalp", "pwalh", "pwam", "pwab", "pwabs", "pwas", "pwass", "pwang", "pwaj", "pwac", "pwak", "pwat", "pwap", "pwah", "pwae", "pwaeg", "pwaegg", "pwaegs", "pwaen", "pwaenj", "pwaenh", "pwaed", "pwael", "pwaelg", "pwaelm", "pwaelb", "pwaels", "pwaelt", "pwaelp", "pwaelh", "pwaem", "pwaeb", "pwaebs", "pwaes", "pwaess", "pwaeng", "pwaej", "pwaec", "pwaek", "pwaet", "pwaep", "pwaeh", "poe", "poeg", "poegg", "poegs", "poen", "poenj", "poenh", "poed", "poel", "poelg", "poelm", "poelb", "poels", "poelt", "poelp", "poelh", "poem", "poeb", "poebs", "poes", "poess", "poeng", "poej", "poec", "poek", "poet", "poep", "poeh", "pyo", "pyog", "pyogg", "pyogs", "pyon", "pyonj", "pyonh", "pyod", "pyol", "pyolg", "pyolm", "pyolb", "pyols", "pyolt", "pyolp", "pyolh", "pyom", "pyob", "pyobs", "pyos", "pyoss", "pyong", "pyoj", "pyoc", "pyok", "pyot", "pyop", "pyoh", "pu", "pug", "pugg", "pugs", "pun", "punj", "punh", "pud", "pul", "pulg", "pulm", "pulb", "puls", "pult", "pulp", "pulh", "pum", "pub", "pubs", "pus", "puss", "pung", "puj", "puc", "puk", "put", "pup", "puh", "pweo", "pweog", "pweogg", "pweogs", "pweon", "pweonj", "pweonh", "pweod", "pweol", "pweolg", "pweolm", "pweolb", "pweols", "pweolt", "pweolp", "pweolh", "pweom", "pweob", "pweobs", "pweos", "pweoss", "pweong", "pweoj", "pweoc", "pweok", "pweot", "pweop", "pweoh", "pwe", "pweg", "pwegg", "pwegs", "pwen", "pwenj", "pwenh", "pwed", "pwel", "pwelg", "pwelm", "pwelb", "pwels", "pwelt", "pwelp", "pwelh", "pwem", "pweb", "pwebs", "pwes", "pwess", "pweng", "pwej", "pwec", "pwek", "pwet", "pwep", "pweh", "pwi", "pwig", "pwigg", "pwigs", "pwin", "pwinj", "pwinh", "pwid", "pwil", "pwilg", "pwilm", "pwilb", "pwils", "pwilt", "pwilp", "pwilh", "pwim", "pwib", "pwibs", "pwis", "pwiss", "pwing", "pwij", "pwic", "pwik", "pwit", "pwip", "pwih", "pyu", "pyug", "pyugg", "pyugs", "pyun", "pyunj", "pyunh", "pyud", "pyul", "pyulg", "pyulm", "pyulb", "pyuls", "pyult", "pyulp", "pyulh", "pyum", "pyub", "pyubs", "pyus", "pyuss", "pyung", "pyuj", "pyuc"], ["pyuk", "pyut", "pyup", "pyuh", "peu", "peug", "peugg", "peugs", "peun", "peunj", "peunh", "peud", "peul", "peulg", "peulm", "peulb", "peuls", "peult", "peulp", "peulh", "peum", "peub", "peubs", "peus", "peuss", "peung", "peuj", "peuc", "peuk", "peut", "peup", "peuh", "pyi", "pyig", "pyigg", "pyigs", "pyin", "pyinj", "pyinh", "pyid", "pyil", "pyilg", "pyilm", "pyilb", "pyils", "pyilt", "pyilp", "pyilh", "pyim", "pyib", "pyibs", "pyis", "pyiss", "pying", "pyij", "pyic", "pyik", "pyit", "pyip", "pyih", "pi", "pig", "pigg", "pigs", "pin", "pinj", "pinh", "pid", "pil", "pilg", "pilm", "pilb", "pils", "pilt", "pilp", "pilh", "pim", "pib", "pibs", "pis", "piss", "ping", "pij", "pic", "pik", "pit", "pip", "pih", "ha", "hag", "hagg", "hags", "han", "hanj", "hanh", "had", "hal", "halg", "halm", "halb", "hals", "halt", "halp", "halh", "ham", "hab", "habs", "has", "hass", "hang", "haj", "hac", "hak", "hat", "hap", "hah", "hae", "haeg", "haegg", "haegs", "haen", "haenj", "haenh", "haed", "hael", "haelg", "haelm", "haelb", "haels", "haelt", "haelp", "haelh", "haem", "haeb", "haebs", "haes", "haess", "haeng", "haej", "haec", "haek", "haet", "haep", "haeh", "hya", "hyag", "hyagg", "hyags", "hyan", "hyanj", "hyanh", "hyad", "hyal", "hyalg", "hyalm", "hyalb", "hyals", "hyalt", "hyalp", "hyalh", "hyam", "hyab", "hyabs", "hyas", "hyass", "hyang", "hyaj", "hyac", "hyak", "hyat", "hyap", "hyah", "hyae", "hyaeg", "hyaegg", "hyaegs", "hyaen", "hyaenj", "hyaenh", "hyaed", "hyael", "hyaelg", "hyaelm", "hyaelb", "hyaels", "hyaelt", "hyaelp", "hyaelh", "hyaem", "hyaeb", "hyaebs", "hyaes", "hyaess", "hyaeng", "hyaej", "hyaec", "hyaek", "hyaet", "hyaep", "hyaeh", "heo", "heog", "heogg", "heogs", "heon", "heonj", "heonh", "heod", "heol", "heolg", "heolm", "heolb", "heols", "heolt", "heolp", "heolh", "heom", "heob", "heobs", "heos", "heoss", "heong", "heoj", "heoc", "heok", "heot", "heop", "heoh", "he", "heg", "hegg", "hegs", "hen", "henj", "henh", "hed", "hel", "helg", "helm", "helb", "hels", "helt", "help", "helh", "hem", "heb", "hebs", "hes", "hess", "heng", "hej", "hec", "hek", "het", "hep", "heh"], ["hyeo", "hyeog", "hyeogg", "hyeogs", "hyeon", "hyeonj", "hyeonh", "hyeod", "hyeol", "hyeolg", "hyeolm", "hyeolb", "hyeols", "hyeolt", "hyeolp", "hyeolh", "hyeom", "hyeob", "hyeobs", "hyeos", "hyeoss", "hyeong", "hyeoj", "hyeoc", "hyeok", "hyeot", "hyeop", "hyeoh", "hye", "hyeg", "hyegg", "hyegs", "hyen", "hyenj", "hyenh", "hyed", "hyel", "hyelg", "hyelm", "hyelb", "hyels", "hyelt", "hyelp", "hyelh", "hyem", "hyeb", "hyebs", "hyes", "hyess", "hyeng", "hyej", "hyec", "hyek", "hyet", "hyep", "hyeh", "ho", "hog", "hogg", "hogs", "hon", "honj", "honh", "hod", "hol", "holg", "holm", "holb", "hols", "holt", "holp", "holh", "hom", "hob", "hobs", "hos", "hoss", "hong", "hoj", "hoc", "hok", "hot", "hop", "hoh", "hwa", "hwag", "hwagg", "hwags", "hwan", "hwanj", "hwanh", "hwad", "hwal", "hwalg", "hwalm", "hwalb", "hwals", "hwalt", "hwalp", "hwalh", "hwam", "hwab", "hwabs", "hwas", "hwass", "hwang", "hwaj", "hwac", "hwak", "hwat", "hwap", "hwah", "hwae", "hwaeg", "hwaegg", "hwaegs", "hwaen", "hwaenj", "hwaenh", "hwaed", "hwael", "hwaelg", "hwaelm", "hwaelb", "hwaels", "hwaelt", "hwaelp", "hwaelh", "hwaem", "hwaeb", "hwaebs", "hwaes", "hwaess", "hwaeng", "hwaej", "hwaec", "hwaek", "hwaet", "hwaep", "hwaeh", "hoe", "hoeg", "hoegg", "hoegs", "hoen", "hoenj", "hoenh", "hoed", "hoel", "hoelg", "hoelm", "hoelb", "hoels", "hoelt", "hoelp", "hoelh", "hoem", "hoeb", "hoebs", "hoes", "hoess", "hoeng", "hoej", "hoec", "hoek", "hoet", "hoep", "hoeh", "hyo", "hyog", "hyogg", "hyogs", "hyon", "hyonj", "hyonh", "hyod", "hyol", "hyolg", "hyolm", "hyolb", "hyols", "hyolt", "hyolp", "hyolh", "hyom", "hyob", "hyobs", "hyos", "hyoss", "hyong", "hyoj", "hyoc", "hyok", "hyot", "hyop", "hyoh", "hu", "hug", "hugg", "hugs", "hun", "hunj", "hunh", "hud", "hul", "hulg", "hulm", "hulb", "huls", "hult", "hulp", "hulh", "hum", "hub", "hubs", "hus", "huss", "hung", "huj", "huc", "huk", "hut", "hup", "huh", "hweo", "hweog", "hweogg", "hweogs", "hweon", "hweonj", "hweonh", "hweod", "hweol", "hweolg", "hweolm", "hweolb", "hweols", "hweolt", "hweolp", "hweolh", "hweom", "hweob", "hweobs", "hweos", "hweoss", "hweong", "hweoj", "hweoc", "hweok", "hweot", "hweop", "hweoh", "hwe", "hweg", "hwegg", "hwegs"], ["hwen", "hwenj", "hwenh", "hwed", "hwel", "hwelg", "hwelm", "hwelb", "hwels", "hwelt", "hwelp", "hwelh", "hwem", "hweb", "hwebs", "hwes", "hwess", "hweng", "hwej", "hwec", "hwek", "hwet", "hwep", "hweh", "hwi", "hwig", "hwigg", "hwigs", "hwin", "hwinj", "hwinh", "hwid", "hwil", "hwilg", "hwilm", "hwilb", "hwils", "hwilt", "hwilp", "hwilh", "hwim", "hwib", "hwibs", "hwis", "hwiss", "hwing", "hwij", "hwic", "hwik", "hwit", "hwip", "hwih", "hyu", "hyug", "hyugg", "hyugs", "hyun", "hyunj", "hyunh", "hyud", "hyul", "hyulg", "hyulm", "hyulb", "hyuls", "hyult", "hyulp", "hyulh", "hyum", "hyub", "hyubs", "hyus", "hyuss", "hyung", "hyuj", "hyuc", "hyuk", "hyut", "hyup", "hyuh", "heu", "heug", "heugg", "heugs", "heun", "heunj", "heunh", "heud", "heul", "heulg", "heulm", "heulb", "heuls", "heult", "heulp", "heulh", "heum", "heub", "heubs", "heus", "heuss", "heung", "heuj", "heuc", "heuk", "heut", "heup", "heuh", "hyi", "hyig", "hyigg", "hyigs", "hyin", "hyinj", "hyinh", "hyid", "hyil", "hyilg", "hyilm", "hyilb", "hyils", "hyilt", "hyilp", "hyilh", "hyim", "hyib", "hyibs", "hyis", "hyiss", "hying", "hyij", "hyic", "hyik", "hyit", "hyip", "hyih", "hi", "hig", "higg", "higs", "hin", "hinj", "hinh", "hid", "hil", "hilg", "hilm", "hilb", "hils", "hilt", "hilp", "hilh", "him", "hib", "hibs", "his", "hiss", "hing", "hij", "hic", "hik", "hit", "hip", "hih"], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], ["Kay", "Kayng", "Ke", "Ko", "Kol", "Koc", "Kwi", "Kwi", "Kyun", "Kul", "Kum", "Na", "Na", "Na", "La", "Na", "Na", "Na", "Na", "Na", "Nak", "Nak", "Nak", "Nak", "Nak", "Nak", "Nak", "Nan", "Nan", "Nan", "Nan", "Nan", "Nan", "Nam", "Nam", "Nam", "Nam", "Nap", "Nap", "Nap", "Nang", "Nang", "Nang", "Nang", "Nang", "Nay", "Nayng", "No", "No", "No", "No", "No", "No", "No", "No", "No", "No", "No", "No", "Nok", "Nok", "Nok", "Nok", "Nok", "Nok", "Non", "Nong", "Nong", "Nong", "Nong", "Noy", "Noy", "Noy", "Noy", "Nwu", "Nwu", "Nwu", "Nwu", "Nwu", "Nwu", "Nwu", "Nwu", "Nuk", "Nuk", "Num", "Nung", "Nung", "Nung", "Nung", "Nung", "Twu", "La", "Lak", "Lak", "Lan", "Lyeng", "Lo", "Lyul", "Li", "Pey", "Pen", "Pyen", "Pwu", "Pwul", "Pi", "Sak", "Sak", "Sam", "Sayk", "Sayng", "Sep", "Sey", "Sway", "Sin", "Sim", "Sip", "Ya", "Yak", "Yak", "Yang", "Yang", "Yang", "Yang", "Yang", "Yang", "Yang", "Yang", "Ye", "Ye", "Ye", "Ye", "Ye", "Ye", "Ye", "Ye", "Ye", "Ye", "Ye", "Yek", "Yek", "Yek", "Yek", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yen", "Yel", "Yel", "Yel", "Yel", "Yel", "Yel", "Yem", "Yem", "Yem", "Yem", "Yem", "Yep", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yeng", "Yey", "Yey", "Yey", "Yey", "O", "Yo", "Yo", "Yo", "Yo", "Yo", "Yo", "Yo", "Yo", "Yo", "Yo", "Yong", "Wun", "Wen", "Yu", "Yu", "Yu", "Yu", "Yu", "Yu", "Yu", "Yu", "Yu", "Yu", "Yuk", "Yuk", "Yuk", "Yun", "Yun", "Yun", "Yun", "Yul", "Yul", "Yul", "Yul", "Yung", "I", "I", "I", "I", "I", "I", "I", "I", "I", "I", "I", "I", "I", "I", "Ik", "Ik", "In", "In", "In", "In", "In", "In", "In", "Im", "Im", "Im", "Ip", "Ip", "Ip", "Cang", "Cek", "Ci", "Cip", "Cha", "Chek"], ["Chey", "Thak", "Thak", "Thang", "Thayk", "Thong", "Pho", "Phok", "Hang", "Hang", "Hyen", "Hwak", "Wu", "Huo", , , "Zhong", , "Qing", , , "Xi", "Zhu", "Yi", "Li", "Shen", "Xiang", "Fu", "Jing", "Jing", "Yu", , "Hagi", , "Zhu", , , "Yi", "Du", , , , "Fan", "Si", "Guan"], ["ff", "fi", "fl", "ffi", "ffl", "st", "st", , , , , , , , , , , , , "mn", "me", "mi", "vn", "mkh", , , , , , "yi", , "ay", "`", , "d", "h", "k", "l", "m", "m", "t", "+", "sh", "s", "sh", "s", "a", "a", , "b", "g", "d", "h", "v", "z", , "t", "y", "k", "k", "l", , "l", , "n", "n", , "p", "p", , "ts", "ts", "r", "sh", "t", "vo", "b", "k", "p", "l"], [], [], [, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , "~", , , , , , , , , , , , , "..", "--", "-", "_", "_", "(", ") ", "{", "} ", "[", "] ", "[(", ")] ", "<<", ">> ", "<", "> ", "[", "] ", "{", "}", , , , , , , , , , , , ",", ",", ".", , ";", ":", "?", "!", "-", "(", ")", "{", "}", "{", "}", "#", "&", "*", "+", "-", "<", ">", "=", , "\\", "$", "%", "@"], [, "!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", , , ".", "[", "]", ",", "*", "wo", "a", "i", "u", "e", "o", "ya", "yu", "yo", "tu", "+", "a", "i", "u", "e", "o", "ka", "ki", "ku", "ke", "ko", "sa", "si", "su", "se", "so", "ta", "ti", "tu", "te", "to", "na", "ni", "nu", "ne", "no", "ha", "hi", "hu", "he", "ho", "ma", "mi", "mu", "me", "mo", "ya", "yu", "yo", "ra", "ri", "ru", "re", "ro", "wa", "n", ":", ";", , "g", "gg", "gs", "n", "nj", "nh", "d", "dd", "r", "lg", "lm", "lb", "ls", "lt", "lp", "rh", "m", "b", "bb", "bs", "s", "ss", , "j", "jj", "c", "k", "t", "p", "h", , , , "a", "ae", "ya", "yae", "eo", "e", , , "yeo", "ye", "o", "wa", "wae", "oe", , , "yo", "u", "weo", "we", "wi", "yu", , , "eu", "yi", "i", , , , "/C", "PS", "!", "-", "|", "Y=", "W=", , "|", "-", "|", "-", "|", "#", "O", , , , , , , , , , , "{", "|", "}"]];
var De = {};
for (let n3 = 0; n3 < Rn.length; n3++)
  for (let e = 0; e < Rn[n3].length; e++) {
    const i = Rn[n3][e];
    if (typeof i == "string" && i.length) {
      const u3 = String.fromCharCode((n3 << 8) + e);
      De[u3] = i;
    }
  }
function Ve(n3) {
  return (n3 || "").replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function Fi(n3) {
  return /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DBF\u4E00-\u9FFC\uF900-\uFA6D\uFA70-\uFAD9]|\uD81B[\uDFF0\uDFF1]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDD\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A]/.test(n3);
}
function ch(n3) {
  return /[\s!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDFFF]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/.test(n3);
}
function M(n3) {
  switch (true) {
    case n3 instanceof Array:
      const e = [];
      for (let u3 = 0; u3 < n3.length; u3++)
        e[u3] = M(n3[u3]);
      return e;
    case n3 instanceof Date:
      return new Date(n3.valueOf());
    case n3 instanceof RegExp:
      return new RegExp(n3.source, n3.flags);
    case n3 instanceof Object:
      const i = {};
      for (const u3 in n3)
        Object.prototype.hasOwnProperty.call(n3, u3) && (i[u3] = M(n3[u3]));
      return i;
    default:
      return n3;
  }
}
function ee(n3, e) {
  if (e.length === 0)
    return false;
  const i = Math.floor(e.length / 2);
  switch (function(u3, a) {
    switch (true) {
      case u3 < a[0]:
        return -1;
      case u3 > a[1]:
        return 1;
    }
    return 0;
  }(n3, e[i])) {
    case -1:
      return ee(n3, e.slice(0, i));
    case 1:
      return ee(n3, e.slice(i + 1));
  }
  return true;
}
function eu(n3, e, i, u3 = []) {
  const a = u3.length ? RegExp(u3.map(Ve).join("|"), "g") : null, o3 = RegExp(e.source, e.flags.replace("g", "") + "g");
  let g3 = "", s3 = 0;
  for (; ; ) {
    const h = o3.exec(n3);
    let l = "", r = 0;
    if (!h) {
      g3 += n3.substring(s3, n3.length);
      break;
    }
    for (; ; ) {
      const t = a ? a.exec(h[0]) : null;
      if (!t) {
        l += h[0].length > r ? i : "";
        break;
      }
      l += t.index > r ? i : "", l += t[0], r = a.lastIndex;
    }
    g3 += n3.substring(s3, h.index) + l, s3 = o3.lastIndex;
  }
  return g3;
}
Rn = void 0;
var Xe = { ignore: [], replace: [], replaceAfter: [], trim: false, unknown: "", fixChineseSpacing: true };
var iu = class {
  constructor(e = M(Xe), i = De) {
    this.confOptions = e, this.map = i;
  }
  get options() {
    return M(Object.assign(Object.assign({}, Xe), this.confOptions));
  }
  config(e, i = false) {
    return i && (this.confOptions = {}), e && typeof e == "object" && (this.confOptions = M(e)), this.confOptions;
  }
  codeMapReplace(e, i = [], u3) {
    let a = 0, o3 = "";
    const g3 = u3.fixChineseSpacing && Fi(e);
    let s3 = false;
    for (let h = 0; h < e.length; h++) {
      const l = /[\uD800-\uDBFF]/.test(e[h]) && /[\uDC00-\uDFFF]/.test(e[h + 1]) ? e[h] + e[h + 1] : e[h];
      let r, t = false;
      switch (true) {
        case ee(a, i):
        case (l.length === 2 && ee(a + 1, i)):
          r = l, i.find((y) => y[1] >= a && y[0] === a) || (t = true);
          break;
        default:
          r = this.map[l] || u3.unknown || "";
      }
      g3 && (!s3 || t || ch(r) || (r = " " + r), s3 = !!r && Fi(l)), o3 += r, a += l.length, h += l.length - 1;
    }
    return o3;
  }
  formatReplaceOption(e) {
    if (e instanceof Array)
      return M(e);
    const i = [];
    for (const u3 in e)
      Object.prototype.hasOwnProperty.call(e, u3) && i.push([u3, e[u3]]);
    return i;
  }
  replaceString(e, i, u3 = []) {
    const a = M(i);
    let o3 = e;
    for (let g3 = 0; g3 < a.length; g3++) {
      const s3 = a[g3];
      switch (true) {
        case s3[0] instanceof RegExp:
          s3[0] = RegExp(s3[0].source, s3[0].flags.replace("g", "") + "g");
          break;
        case (typeof s3[0] == "string" && s3[0].length > 0):
          s3[0] = RegExp(Ve(s3[0]), "g");
          break;
        default:
          s3[0] = /[^\s\S]/;
      }
      o3 = eu(o3, s3[0], s3[1], u3);
    }
    return o3;
  }
  setData(e, i = false) {
    if (i && (this.map = M(De)), e && typeof e == "object" && Object.keys(e).length) {
      this.map = M(this.map);
      for (const u3 in e)
        Object.prototype.hasOwnProperty.call(e, u3) && u3.length < 3 && u3 <= "\u{10FFFF}" && (this.map[u3] = e[u3]);
    }
    return this.map;
  }
  transliterate(e, i) {
    i = typeof i == "object" ? i : {};
    const u3 = M(Object.assign(Object.assign({}, this.options), i));
    let a = typeof e == "string" ? e : String(e);
    const o3 = this.formatReplaceOption(u3.replace);
    o3.length && (a = this.replaceString(a, o3, u3.ignore));
    const g3 = u3.ignore && u3.ignore.length > 0 ? function(h, l) {
      let r = [];
      for (let d3 = 0; d3 < l.length; d3++) {
        const c3 = l[d3];
        let w2 = -1;
        for (; (w2 = h.indexOf(c3, w2 + 1)) > -1; )
          r.push([w2, w2 + c3.length - 1]);
      }
      const t = r.sort((d3, c3) => d3[0] - c3[0] || d3[1] - c3[1]);
      let y;
      return r = [], t.forEach((d3) => !y || d3[0] > y[1] + 1 ? r.push(y = d3) : d3[1] > y[1] && (y[1] = d3[1])), r;
    }(a, u3.ignore) : [];
    a = this.codeMapReplace(a, g3, u3), u3.trim && (a = a.trim());
    const s3 = this.formatReplaceOption(u3.replaceAfter);
    return s3.length && (a = this.replaceString(a, s3)), a;
  }
};
var wh = Object.assign(Object.assign({}, M(Xe)), { allowedChars: "a-zA-Z0-9-_.~", lowercase: true, separator: "-", uppercase: false, fixChineseSpacing: true });
var cn = new iu();
var Mi = cn.transliterate.bind(cn);
Mi.config = cn.config.bind(cn), Mi.setData = cn.setData.bind(cn);
var wn = new class extends iu {
  get options() {
    return M(Object.assign(Object.assign({}, wh), this.confOptions));
  }
  config(n3, e = false) {
    return e && (this.confOptions = {}), n3 && typeof n3 == "object" && (this.confOptions = M(n3)), this.confOptions;
  }
  slugify(n3, e) {
    e = typeof e == "object" ? e : {};
    const i = M(Object.assign(Object.assign({}, this.options), e)), u3 = i.separator ? Ve(i.separator) : "";
    let a = this.transliterate(n3, i);
    return a = eu(a, RegExp(`[^${i.allowedChars}]+`, "g"), i.separator, i.ignore), u3 && (a = a.replace(RegExp(`^${u3}+|${u3}$`, "g"), "")), i.lowercase && (a = a.toLowerCase()), i.uppercase && (a = a.toUpperCase()), a;
  }
}();
var ie = wn.slugify.bind(wn);
ie.config = wn.config.bind(wn), ie.setData = wn.setData.bind(wn);
function ph(n3) {
  return n3 && n3.__esModule && Object.prototype.hasOwnProperty.call(n3, "default") ? n3.default : n3;
}
var jh = function(n3) {
  var e = 0;
  if (n3.length == 0)
    return e;
  for (var i = 0; i < n3.length; i++) {
    var u3 = n3.charCodeAt(i);
    e = (e << 5) - e + u3, e = e & e;
  }
  return e;
};
var mh = function(n3, e) {
  var i = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  e = e || 62;
  var u3 = [], a, o3 = "", g3 = n3 < 0 ? "-" : "";
  for (n3 = Math.abs(n3); n3 >= e; )
    a = n3 % e, n3 = Math.floor(n3 / e), u3.push(i[a]);
  n3 > 0 && u3.push(i[n3]);
  for (var s3 = u3.length - 1; s3 >= 0; s3--)
    o3 += u3[s3];
  return g3 + o3;
};
var Yh = function(n3) {
  var e = typeof n3;
  if (e === "string" || e === "number") {
    var i = mh(jh(String(n3)), 61);
    return i.replace("-", "Z");
  } else
    throw new Error("Unexpected input type");
};
var fh = Yh;
var Lh = /* @__PURE__ */ ph(fh);
var Zh = class {
  /**
   * 修复标题
   *
   * @param q - 输入的标题字符串
   * @param isFixTitle - 是否修复标题，默认为true
   * @returns 修复后的标题字符串
   */
  static fixTitle(e, i) {
    return e = e ?? "\u65E0\u6807\u9898", i && (e = Mn.removeTitleNumber(e).trim()), e;
  }
  /**
   * 将中文名翻译为英文别名
   *
   * @param q 中文名
   * @returns Promise<string> 英文别名
   */
  static async wordSlugify(e) {
    let a = (await (await fetch("https://api.terwer.space/api/translate?q=" + e)).json())[0][0];
    return a = a.replace(/-/g, ""), a = a.replace(/_/g, ""), a = a.replace(/#/g, ""), a = a.replace(/\./g, ""), a = a.replace(/~/g, ""), a = ie(a), a = a.replace(/@/g, ""), a;
  }
  /**
   * 将拼音转换为别名
   *
   * @param q 拼音
   * @returns string 别名
   */
  static pinyinSlugify(e) {
    return ie(e);
  }
  static hashstr(e) {
    const i = e + (/* @__PURE__ */ new Date()).toISOString();
    return ["-", Lh(i).toLowerCase()].join("");
  }
  /**
   * 获取页面原始slug
   *
   * @param q - 输入的标题字符串
   * @param isFixTitle - 是否修复标题，默认为true
   * @returns 页面的原始slug
   */
  static async getPageOriginSlug(e, i) {
    let a = this.fixTitle(e, i);
    try {
      a = await this.wordSlugify(e), this.logger.debug(`Successfully generated slug for "${e}": ${a}`);
    } catch {
      this.logger.warn(`Failed to generate slug for "${e}". Using pinyin slug: ${a}`), a = this.pinyinSlugify(e);
    }
    return a;
  }
  /**
   * 获取页面slug
   *
   * @param q - 输入的标题字符串
   * @param isFixTitle - 是否修复标题，默认为true
   * @returns 页面的slug
   */
  static async getPageSlug(e, i) {
    const u3 = this.fixTitle(e, i), a = await this.getPageOriginSlug(e, i), o3 = this.hashstr(u3);
    return this.logger.debug(`Generated slug for "${e}": ${a}`), [a, o3].join("");
  }
};
G(Zh, "logger", Qn("slug-util"));
var Sh = class {
  /**
   * 根据给定的查询参数自动生成摘要
   *
   * @param {string} q - 查询参数
   * @returns {Promise<string>} 生成的摘要
   */
  static async autoSummary(e) {
    const i = "http://kms.terwergreen.com:8888/api/summary", u3 = {
      "Content-Type": "application/json"
    }, a = JSON.stringify({
      q: e
    }), o3 = {
      method: "POST",
      headers: u3,
      body: a
    };
    try {
      const g3 = await fetch(i, o3);
      if (g3.ok) {
        const s3 = await g3.text();
        return Te.safeParse(s3, {});
      } else
        return {
          result: "",
          errMsg: "Request failed"
        };
    } catch (g3) {
      return {
        result: g3.toString(),
        errMsg: g3
      };
    }
  }
  /**
   * 自动为给定的字符串生成标签
   *
   * @param q - 要生成标签的字符串
   * @param len - 需要生成的标签的数量（可选，默认为undefined）
   * @returns 标签数组
   */
  static async autoTags(e, i) {
    const u3 = await this.cutWords(e);
    this.logger.debug("genTags=>", u3);
    const a = this.jiebaToHotWords(u3, i ?? 5);
    return this.logger.debug("hotTags=>", a), a;
  }
  /**
   * 文本分词
   *
   * @param words 文本
   */
  static async cutWords(e) {
    e = Bi.filterHtml(e), this.logger.debug("\u51C6\u5907\u5F00\u59CB\u5206\u8BCD\uFF0C\u539F\u6587=>", e);
    const u3 = await (await fetch("https://api.terwer.space/api/jieba?q=" + e)).json();
    return this.logger.debug("\u5206\u8BCD\u5B8C\u6BD5\uFF0C\u7ED3\u679C=>", u3.result), u3.result;
  }
  /**
   * 统计分词并按照次数排序
   *
   * @param words 分词数组
   * @param len 长度
   * @returns {string[]}
   */
  static countWords(e, i) {
    const u3 = ["\u9875\u9762"];
    this.logger.debug("\u6587\u672C\u6E05\u6D17\uFF0C\u7EDF\u8BA1\uFF0C\u6392\u5E8F\uFF0C\u53BB\u9664\u65E0\u610F\u4E49\u7684\u5355\u8BCDunUseWords=>", u3);
    const a = e.reduce(function(g3, s3) {
      return s3.length === 1 || u3.includes(s3) ? (g3[s3] = 0, g3) : (g3[s3] = g3.hasOwnProperty(s3) ? parseInt(g3[s3]) + 1 : 1, g3);
    }, {}), o3 = Object.keys(a).sort(function(g3, s3) {
      return a[s3] - a[g3];
    });
    return this.logger.debug("\u6587\u672C\u6E05\u6D17\u7ED3\u675Fwordarr=>", o3), !i || i === 0 ? o3 : o3.slice(0, i);
  }
  /**
   * 从分词中提取热门标签
   */
  static jiebaToHotWords(e, i) {
    let u3;
    return i ? u3 = this.countWords(e, i) : u3 = this.countWords(e, 5), this.logger.debug("jiebaToHotWords=>", u3), u3;
  }
};
G(Sh, "logger", Qn("smart-util", "zhi-common", false));

// src/lib/npmHelper.ts
var NpmPackageManager = class {
  logger;
  zhiCoreNpmPath;
  depsJsonPath;
  customCmd;
  /**
   * 构造函数，用于创建 NpmPackageManager 的实例
   *
   * @param zhiCoreNpmPath - Siyuan App 的 NPM 路径
   * @param depsJsonPath - deps.json 路径
   */
  constructor(zhiCoreNpmPath, depsJsonPath) {
    this.logger = w("npm-package-manager", "zhi", false);
    this.zhiCoreNpmPath = zhiCoreNpmPath;
    this.depsJsonPath = depsJsonPath;
    this.customCmd = new CustomCmd();
  }
  /**
   * 执行 Node 命令
   *
   * @param subCommand - 要执行的 NPM 命令
   * @param oargs - 其它参数
   * @param cwd 当前路径
   * @param env 环境变量
   * @returns 执行结果的 Promise
   */
  async nodeCmd(subCommand, oargs, cwd, env2) {
    return await this.localNodeExecCmd("node", subCommand, void 0, oargs, cwd, env2);
  }
  /**
   * 执行 NPM 命令
   *
   * @param subCommand - 要执行的 NPM 命令
   * @param path 命令路径
   * @param oargs - 其它参数
   * @param cwd 当前路径
   * @param env 环境变量
   * @returns 执行结果的 Promise
   */
  async npmCmd(subCommand, path5, oargs, cwd, env2) {
    return await this.localNodeExecCmd("npm", subCommand, path5 ?? this.zhiCoreNpmPath, oargs, cwd, env2);
  }
  /**
   * 获取 Node 的版本号
   *
   * @returns Node 版本号的 Promise
   */
  async nodeVersion() {
    return await this.nodeCmd(`-v`);
  }
  /**
   * 获取 NPM 的版本号
   *
   * @returns NPM 版本号的 Promise
   */
  async npmVersion() {
    return await this.npmCmd(`-v`);
  }
  /**
   * 获取 Electron的 NPM 的版本号
   *
   * @returns NPM 版本号的 Promise
   */
  async electronNpmVersion() {
    return await this.customCmd.getElectronNodeVersion();
  }
  /**
   * 获取系统 NPM 的版本号
   *
   * @returns NPM 版本号的 Promise
   */
  async systemNpmVersion() {
    return await this.customCmd.getSystemNodeVersion();
  }
  /**
   * 安装 NPM 依赖
   *
   * @param moduleName - 可选的模块名，不传默认安装全量
   * @param path 命令路径
   */
  async npmInstall(moduleName, path5) {
    if (!Mn.isEmptyString(moduleName)) {
      await this.npmCmd(`install ${moduleName}`, path5);
    } else {
      await this.npmCmd(`install`, path5);
    }
  }
  /**
   * 安装依赖并马上导入
   *
   * @param moduleName - 依赖名称
   * @param path 命令路径
   * @returns 导入的模块
   */
  async requireInstall(moduleName, path5) {
    try {
      const result = c.requireNpm(moduleName);
      this.logger.info(`${moduleName} already cached`);
      return result;
    } catch (e) {
      if (e && e.message && e.message.includes(`Cannot find module '${moduleName}'`)) {
        this.logger.info(`${moduleName} not found, will install once...`);
        await this.npmCmd(`install ${moduleName}`, path5);
        this.logger.info(`${moduleName} installed`);
        return c.requireNpm(moduleName);
      }
      throw e;
    }
  }
  /**
   * 检测并初始化 Node
   *
   * @param nodeVersion node版本，例如：v18.18.2
   * @param nodeInstallDir 安装路径
   */
  async checkAndInitNode(nodeVersion, nodeInstallDir) {
    let flag = false;
    const fs4 = c.requireNpm("fs");
    const nodeFolder = c.nodeFolder();
    const nodeCurrentBinFolder = c.nodeCurrentBinFolder();
    if (!fs4.existsSync(nodeCurrentBinFolder)) {
      this.logger.info("Node\u73AF\u5883\u4E0D\u5B58\u5728\uFF0C\u51C6\u5907\u5B89\u88C5Node...");
      const command = `${this.depsJsonPath}/setup.cjs`;
      const args2 = [];
      args2.push(nodeVersion ?? "v18.18.2");
      args2.push(nodeInstallDir ?? nodeFolder);
      const cwd = nodeFolder;
      if (!fs4.existsSync(cwd)) {
        fs4.mkdirSync(cwd, { recursive: true });
      }
      const result = await this.customCmd.executeCommandWithBundledNodeAsync(command, args2, cwd);
      if (result.status) {
        this.logger.info("Node\u5B89\u88C5\u6210\u529F\uFF01\u{1F604}");
      } else {
        throw new Error("Node\u5B89\u88C5\u5931\u8D25\uFF0C\u540E\u7EED\u64CD\u4F5C\u5C06\u51FA\u73B0\u5F02\u5E38\u{1F62D}: " + result.msg);
      }
      flag = true;
    } else {
      this.logger.info("Node already installed, ignore");
      flag = true;
    }
    const pkgJsonFile = import_path2.default.join(this.zhiCoreNpmPath, "package.json");
    const depsJsonFile = import_path2.default.join(this.depsJsonPath, "deps.json");
    const depsJsonStatus = updatePackageJson(depsJsonFile, pkgJsonFile);
    if (depsJsonStatus) {
      this.logger.info("Detected deps.json change.Will install node_module once if needed, please wait...");
      await this.npmInstall();
      this.logger.info("All node_module installed successfully");
      updatePackageJsonHash(depsJsonFile, pkgJsonFile);
      this.logger.info("Package hash updated successfully");
    }
    return flag;
  }
  /**
   * 本地服务的 Node 命令
   *
   * @param command 主命令
   * @param subCommand 子命令
   * @param oargs 其它参数
   * @param cwd 当前路径
   * @param env 环境变量
   * @private
   */
  async localNodeCmd(command, subCommand, oargs, cwd, env2) {
    const args2 = [subCommand, this.zhiCoreNpmPath].concat(oargs ?? []);
    const process5 = c.siyuanWindow().process;
    const NODE_PATH = c.nodeCurrentBinFolder();
    let ENV_PATH = process5.env.PATH;
    if (NODE_PATH !== "") {
      ENV_PATH = NODE_PATH + ":" + process5.env.PATH;
    }
    const options = {
      cwd: cwd ?? this.zhiCoreNpmPath,
      env: {
        PATH: ENV_PATH,
        ...env2
      }
    };
    this.logger.info("localNodeCmd spawn command =>", command);
    this.logger.info("localNodeCmd spawn args =>", args2);
    this.logger.info("localNodeCmd spawn options =>", options);
    return await this.customCmd.executeCommandWithSpawn(command, args2, options);
  }
  /**
   * 本地服务的 Node exec 命令
   *
   * @param command 主命令
   * @param subCommand 子命令
   * @param path 命令路径
   * @param oargs 其它参数
   * @param cwd 当前路径
   * @param env 环境变量
   * @private
   */
  async localNodeExecCmd(command, subCommand, path5, oargs, cwd, env2) {
    const args2 = path5 ? [`"${subCommand}"`, `"${path5}"`, ...oargs ?? []] : [`"${subCommand}"`, ...oargs ?? []];
    const process5 = c.siyuanWindow().process;
    const NODE_PATH = c.nodeCurrentBinFolder();
    let ENV_PATH = process5.env.PATH;
    if (NODE_PATH !== "") {
      ENV_PATH = NODE_PATH + ":" + process5.env.PATH;
    }
    const options = {
      cwd: cwd ?? this.zhiCoreNpmPath,
      env: {
        PATH: ENV_PATH,
        ...env2
      }
    };
    this.logger.info("localNodeExecCmd exec command =>", command);
    this.logger.info("localNodeExecCmd exec args =>", args2);
    this.logger.info("localNodeExecCmd exec options =>", options);
    return await this.customCmd.executeCommand(command, args2, options);
  }
};

// src/zhiInfra.ts
var import_fs_extra = __toESM(require_lib(), 1);
var import_path3 = __toESM(require("path"), 1);

// package.json
var package_default = {
  name: "zhi-infra",
  version: "0.20.0",
  type: "module",
  description: "basic issues for zhi",
  main: "./dist/index.cjs",
  typings: "./dist/index.d.ts",
  repository: "terwer/zhi",
  homepage: "https://github.com/terwer/zhi/tree/main/apps/zhi-server-infra",
  author: "terwer",
  license: "GPL",
  keywords: [
    "zhi",
    "server",
    "infra"
  ],
  scripts: {
    dev: "zhi-build --watch --outDir=/Users/zhangyue/Documents/terwer/SiyuanWorkspace/test/data/plugins/siyuan-plugin-local-service/libs/zhi-infra",
    build: "zhi-build --production",
    localBuild: "zhi-build --production --outDir=/Users/zhangyue/Documents/terwer/mydocs/siyuan-plugins/siyuan-plugin-local-service/public/libs/zhi-infra"
  },
  devDependencies: {
    "@terwer/esbuild-config-custom": "workspace:*",
    "@terwer/eslint-config-custom": "workspace:*",
    "@terwer/tsconfig": "workspace:*",
    "@terwer/vitest-config-custom": "workspace:*"
  },
  dependencies: {
    "fix-path": "^4.0.0",
    "zhi-cmd": "workspace:*",
    "zhi-common": "workspace:*",
    "zhi-device": "workspace:*",
    "zhi-lib-base": "workspace:*"
  },
  publishConfig: {
    access: "public"
  }
};

// src/zhiInfra.ts
var ZhiInfra = class {
  logger;
  zhiCoreNpmPath;
  zhiCoreNodeModulesPath;
  npmManager;
  constructor(depsJsonPath) {
    this.logger = w("zhi-infra", "zhi", false);
    this.zhiCoreNpmPath = c.appNpmFolder();
    this.zhiCoreNodeModulesPath = c.joinPath(this.zhiCoreNpmPath, "node_modules");
    this.npmManager = new NpmPackageManager(this.zhiCoreNpmPath, depsJsonPath);
  }
  /**
   * 修复 Mac 和 Linux 下面的 PATH 环境变量问题
   */
  fixPathEnv() {
    this.logger.debug("process.env.PATH before => ", process.env.PATH);
    fixPath();
    this.logger.debug("process.env.PATH after fix => ", process.env.PATH);
    this.logger.info("Fixed $PATH in Electron apps as GUI apps on macOS and Linux");
  }
  async hackRequire() {
    this.logger.info("Init zhi core node_modules from => ", this.zhiCoreNodeModulesPath);
    c.siyuanWindow().require.setExternalDeps(this.zhiCoreNodeModulesPath);
    const pkgJsonFile = import_path3.default.join(this.zhiCoreNpmPath, "package.json");
    if (!import_fs_extra.default.existsSync(pkgJsonFile)) {
      await import_fs_extra.default.mkdirs(this.zhiCoreNpmPath);
      createPackageJson("zhi-app-package", package_default.version, {}, pkgJsonFile);
      this.logger.warn("app package.json not exist, inited");
    }
  }
  getNpmManager() {
    return this.npmManager;
  }
};
var zhiInfra_default = ZhiInfra;

// src/lib/requireHacker.ts
var logger2 = w("require-hacker", "zhi", false);
var syWin = window;
var path4 = syWin.require("path");
var workspaceDir = syWin.siyuan ? syWin.siyuan.config.system.workspaceDir : syWin.workspaceDir;
var defaultNpmDir = path4.join(workspaceDir, "node_modules");
logger2.info("requireHacker loaded");
var re2 = null;
var realRequire = null;
if (syWin.require) {
  const fs4 = syWin.require("fs");
  if (!syWin) {
    syWin = global;
  }
  if (syWin.require.cache) {
    realRequire = syWin.require;
  }
  if (realRequire) {
    const path5 = syWin.require("path");
    re2 = function(moduleName, base) {
      if (module) {
        const _load = module.__proto__.load;
        if (!module.__proto__.load.hacked) {
          module.__proto__.load = function(filename) {
            const realfilename = filename;
            try {
              _load.bind(this)(filename);
            } catch (e) {
              if (e.message.indexOf("Cannot find module") >= 0 && e.message.indexOf(filename) >= 0) {
                if (global.ExternalDepPathes) {
                  let flag;
                  let modulePath;
                  global.ExternalDepPathes.forEach((depPath) => {
                    if (fs4.existsSync(path5.join(depPath, moduleName))) {
                      if (!flag) {
                        logger2.info(`Module ${moduleName} not found, redirect to ${path5.join(depPath, moduleName)}`);
                        filename = path5.join(depPath, filename);
                        try {
                          _load.bind(this)(filename);
                          flag = true;
                        } catch (e2) {
                          logger2.error(e2);
                        }
                      } else {
                        logger2.info(
                          `Found module ${moduleName} at ${modulePath}, please check if it is already installed ${path5.join(
                            depPath,
                            moduleName
                          )}`
                        );
                      }
                    }
                  });
                  if (!flag) {
                    logger2.error(`Cannot load module ${realfilename}`, e);
                    throw new Error(`Cannot load module ${realfilename}`);
                  }
                } else {
                  logger2.error(`Cannot load module ${realfilename}`, e);
                  throw new Error(`Cannot load module ${realfilename}`);
                }
              } else {
                throw e;
              }
            }
          };
          module.__proto__.load.hacked = true;
        }
      }
      if (!syWin.realRequire) {
        syWin.realRequire = realRequire;
      }
      let that = syWin;
      if (base) {
        moduleName = path5.resolve(base, moduleName);
      }
      if (workspaceDir) {
        if (this) {
          that = this;
        }
        try {
          if (that.realRequire) {
            return that.realRequire(moduleName);
          } else {
            return syWin.realRequire(moduleName);
          }
        } catch (e) {
          if (e.message.indexOf("Cannot find module") >= 0) {
            if (!(moduleName.startsWith("/") || moduleName.startsWith("./") || moduleName.startsWith("../"))) {
              if (global.ExternalDepPathes) {
                let flag;
                let modulePath;
                global.ExternalDepPathes.forEach((depPath) => {
                  if (fs4.existsSync(path5.join(depPath, moduleName))) {
                    if (!flag) {
                      logger2.info(`Module ${moduleName} not found, redirect to ${path5.join(depPath, moduleName)}`);
                      moduleName = path5.join(depPath, moduleName);
                      modulePath = path5.join(depPath, moduleName);
                      flag = true;
                    } else {
                      logger2.info(
                        `Found module ${moduleName} at ${modulePath}, please check if it is already installed ${path5.join(
                          depPath,
                          moduleName
                        )}`
                      );
                    }
                  }
                });
              }
            } else {
              moduleName = path5.resolve(module.path, moduleName);
            }
            return that.realRequire(moduleName);
          } else {
            throw e;
          }
        }
      } else
        return syWin.require(moduleName);
    };
  }
}
if (syWin.require && re2) {
  syWin.require = re2;
  syWin.realRequire = realRequire;
  if (syWin.realRequire && syWin.realRequire.cache) {
    syWin.realRequire.cache.electron.__proto__.realRequire = realRequire?.cache.electron.__proto__.require;
    syWin.realRequire.cache.electron.__proto__.require = re2;
  }
  syWin.require.setExternalDeps = (path5) => {
    if (!syWin.ExternalDepPathes) {
      syWin.ExternalDepPathes = [];
    }
    if (path5 && !syWin.ExternalDepPathes.indexOf(path5) >= 0) {
      syWin.ExternalDepPathes.push(path5);
      syWin.ExternalDepPathes = Array.from(new Set(syWin.ExternalDepPathes));
    }
  };
  re2.setExternalDeps(`${defaultNpmDir}`);
  syWin.require.setExternalBase = (path5) => {
    if (!syWin.ExternalDepPathes) {
      syWin.ExternalDepPathes = [];
    }
    if (!syWin.ExternalBase) {
      syWin.ExternalBase = path5;
    } else {
      logger2.error("Cannot set dependency path twice");
    }
  };
}

// src/index.ts
var main = async (args2) => {
  const logger3 = w("init-infra", "zhi", false);
  const win = c.siyuanWindow();
  win.zhi = win.zhi ?? {};
  win.zhi.status = win.zhi.status ?? {};
  if (win.zhi.status.deviceInited) {
    logger3.info("zhi device is already inited.skip");
  } else {
    win.zhi.device = c;
    win.zhi.status.deviceInited = true;
    logger3.info("zhi device inited");
  }
  if (win.zhi.status.cmdInited) {
    logger3.info("zhi cmd is already inited.skip");
  } else {
    const cmd = new CustomCmd();
    win.zhi.cmd = cmd;
    win.zhi.status.cmdInited = true;
    logger3.info("zhi cmd inited");
  }
  const depsJsonPath = D(args2, 0);
  const isFixPath = D(args2, 1);
  if (win.zhi.status.infraInited) {
    logger3.info("zhi infra is already inited.skip");
  } else {
    const infra = new zhiInfra_default(depsJsonPath);
    if (isFixPath) {
      infra.fixPathEnv();
    }
    await infra.hackRequire();
    win.zhi.npm = infra.getNpmManager();
    win.zhi.status.infraInited = true;
    logger3.info("zhi infra inited");
  }
};
var src_default = main;
/*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
