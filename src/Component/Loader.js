import React from "react";

// Affiché le temps que les traductions se chargent (Suspense)
export const Loader = () => (
  <div className="route-loader" role="status" aria-live="polite">
    <span className="route-loader__bar" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

export default Loader;
