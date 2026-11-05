import { useEffect, useRef, useState, Suspense } from "react";

/** Load below-the-fold tools when approached, with an explicit fallback for
 * browsers without IntersectionObserver and visitors following anchor links.
 */
export function DeferredSection({ id, label, children }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: "600px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const placeholder = (
    <section id={id} className="section deferred-section" aria-label={label}>
      <div className="container">
        <p className="eyebrow">{label}</p>
        <button type="button" className="deferred-section__load" onClick={() => setReady(true)}>Load {label.toLowerCase()} <span aria-hidden="true">↗</span></button>
      </div>
    </section>
  );
  return <div ref={ref}>{ready ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}</div>;
}
