import React from "react";
import { Helmet } from "react-helmet-async";

const Layout = ({ canonicalUrl, children }) => {
  return (
    <>
      <Helmet>
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      </Helmet>
      {children}
    </>
  );
};

export default Layout;
