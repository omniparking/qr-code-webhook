import "../globals.css";
import "./_document";

const MyApp = ({ Component, pageProps }): JSX.Element => {
  return <Component {...pageProps} />;
};
export default MyApp;
