import { useState } from "react";
import { sfx } from "../../lib/sound";
import "./CodeBlock.css";

const LANG_KEY = "rm.dsa.lang";

const KEYWORDS = {
  java: new Set(
    "public private protected class static final void int long double boolean char byte short float new return if else for while do break continue true false null this extends implements interface import package try catch finally throw throws var instanceof switch case default".split(
      " "
    )
  ),
  python: new Set(
    "def class return if elif else for while in not and or is None True False self import from as with lambda yield pass break continue nonlocal global try except finally raise".split(
      " "
    )
  ),
};

// Comments and strings first, so a '#' inside a Java string or a '//' used as
// Python floor division is never mistaken for a comment.
const TOKENS = {
  java: /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(@\w+)|(\b[A-Za-z_]\w*\b)/g,
  python: /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(@\w+)|(\b[A-Za-z_]\w*\b)/g,
};

function renderLine(line, lang) {
  const re = new RegExp(TOKENS[lang].source, "g");
  const keywords = KEYWORDS[lang];
  const out = [];
  let last = 0;
  let m = re.exec(line);
  while (m) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [text, comment, str, num, annotation, word] = m;
    let cls = null;
    if (comment) cls = "c";
    else if (str) cls = "s";
    else if (num) cls = "n";
    else if (annotation) cls = "a";
    else if (word) {
      if (keywords.has(word)) cls = "k";
      else if (/^[A-Z]/.test(word)) cls = "t";
      else if (line[m.index + word.length] === "(") cls = "f";
    }
    out.push(
      cls ? (
        <span key={m.index} className={"tok-" + cls}>
          {text}
        </span>
      ) : (
        text
      )
    );
    last = m.index + text.length;
    m = re.exec(line);
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

function readLang() {
  try {
    return window.localStorage.getItem(LANG_KEY) === "python" ? "python" : "java";
  } catch {
    return "java";
  }
}

/** Java and Python side by side — or Java alone, when that's all there is. */
export function CodeBlock({ java, python }) {
  const [preferred, setLang] = useState(readLang);
  const [copied, setCopied] = useState(false);
  const lang = python ? preferred : "java";
  const code = lang === "java" ? java : python;

  function choose(next) {
    setLang(next);
    sfx.click();
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      /* not remembered — fine */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      sfx.success();
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the code is still selectable */
    }
  }

  return (
    <div className="code">
      <div className="code__bar">
        {python ? (
          <div className="code__tabs" role="tablist" aria-label="Language">
            {[
              ["java", "Java"],
              ["python", "Python"],
            ].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={lang === id} className={"code__tab" + (lang === id ? " is-on" : "")} onClick={() => choose(id)}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span className="code__tab is-on">Java</span>
        )}
        <button type="button" className="code__copy" onClick={copy}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="code__pre" tabIndex={0}>
        <code>
          {code.split("\n").map((line, i) => (
            <span key={i} className="code__line">
              {renderLine(line, lang)}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
