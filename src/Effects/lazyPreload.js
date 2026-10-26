import React, { lazy } from "react";

// Comme React.lazy, mais le module peut être chargé à l'avance (preload). Une fois chargé, le composant s'affiche
// tout de suite, sans repasser par le Suspense : indispensable dans une View Transition, qui capture l'écran
// juste après le changement de page.
export default function lazyPreload(factory) {
  let Loaded = null;
  let promise = null;

  const load = () => {
    if (!promise) {
      promise = factory().then((module) => {
        Loaded = module.default;
        return module;
      });
    }
    return promise;
  };

  const Lazy = lazy(load);
  const Component = (props) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
  Component.preload = load;
  return Component;
}
