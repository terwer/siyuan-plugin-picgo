var w = Object.defineProperty;
var R = (r, e, i) => e in r ? w(r, e, { enumerable: !0, configurable: !0, writable: !0, value: i }) : r[e] = i;
var p = (r, e, i) => (R(r, typeof e != "symbol" ? e + "" : e, i), i);
const y = (r, e, i) => {
  const a = e ?? "zhi", s = (o) => {
    const n = o.getFullYear(), t = String(o.getMonth() + 1).padStart(2, "0"), $ = String(o.getDate()).padStart(2, "0"), u = String(o.getHours()).padStart(2, "0"), d = String(o.getMinutes()).padStart(2, "0"), f = String(o.getSeconds()).padStart(2, "0");
    return `${n}-${t}-${$} ${u}:${d}:${f}`;
  }, g = (o, n) => {
    const t = s(/* @__PURE__ */ new Date()), $ = typeof n == "boolean" ? String(n) : n;
    $ ? console.log(`[${a}] [${t}] [DEBUG] [${r}] ${o}`, $) : console.log(`[${a}] [${t}] [DEBUG] [${r}] ${o}`);
  }, c = (o, n) => {
    const t = s(/* @__PURE__ */ new Date()), $ = typeof n == "boolean" ? String(n) : n;
    $ ? console.info(`[${a}] [${t}] [INFO] [${r}] ${o}`, $) : console.info(`[${a}] [${t}] [INFO] [${r}] ${o}`);
  }, l = (o, n) => {
    const t = s(/* @__PURE__ */ new Date()), $ = typeof n == "boolean" ? String(n) : n;
    $ ? console.warn(`[${a}] [${t}] [WARN] [${r}] ${o}`, $) : console.warn(`[${a}] [${t}] [WARN] [${r}] ${o}`);
  }, S = (o, n) => {
    const t = s(/* @__PURE__ */ new Date());
    n ? console.error(`[${a}] [${t}] [ERROR] [${r}] ${o.toString()}`, n) : console.error(`[${a}] [${t}] [ERROR] [${r}] ${o.toString()}`);
  };
  return {
    debug: (o, n) => {
      i && (n ? g(o, n) : g(o));
    },
    info: (o, n) => {
      n ? c(o, n) : c(o);
    },
    warn: (o, n) => {
      n ? l(o, n) : l(o);
    },
    error: (o, n) => {
      n ? S(o, n) : S(o);
    }
  };
};
class O {
  constructor() {
    p(this, "logger", y("siyuan-picgo-api", "siyuan-picgo", !1));
    this.logger.info("siyuan-note PicGO inited");
  }
}
export {
  O as default
};
