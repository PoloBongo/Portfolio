import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";

const Layout = ({ canonicalUrl, children }) => {
  return (
    <HelmetProvider>
      <div>
        <Helmet>
          {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        </Helmet>
        {children}
      </div>
    </HelmetProvider>
  );
};

export default Layout;
