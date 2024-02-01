import React from "react";
import { Helmet } from "react-helmet";

const Layout = ({ canonicalUrl, children }) => {
  return (
    <div>
      <Helmet>
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      </Helmet>
      {children}
    </div>
  );
};

export default Layout;
