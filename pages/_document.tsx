import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
      </Head>
      <body style={{ display: "block !important" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
