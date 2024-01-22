import { CSSProperties, useEffect, useState } from "react";
import QRCode from "qrcode";
import { convertDateFormat } from "../../helpers";
import Image from "next/image";
import styles from "./qr.module.css";

// SAMPLE DATA URL: https://qr-code-webhook-git-master-omniairportparking.vercel.app/view/qr?startTime=02.02.2022T02:00:00&endTime=02.02.2022T02:00:00&qrcodeData=123123123

export default function QRPage({ startTime, endTime, qrcodeData }) {
  const [qrDataURL, setQRDataURL] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Generate QR code as a data URL
    const generateQRCode = async () => {
      try {
        const qrUrl = await QRCode.toDataURL(qrcodeData, {
          errorCorrectionLevel: "L",
          version: 9,
        });
        setQRDataURL(qrUrl);
      } catch (error) {
        setError(true);
      }
    };

    generateQRCode();
  }, [qrcodeData]);

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Omni Airport Parking</h1>

      <p className={styles.paragraph}>
        <span className={styles.span}>Start Time:</span>
        <span className={styles.date}>{convertDateFormat(startTime)}</span>
      </p>

      <p className={styles.paragraph}>
        <span className={styles.span}>End Time:</span>
        <span className={styles.date}>{convertDateFormat(endTime)}</span>
      </p>

      {qrDataURL && (
        <div className={styles.image}>
          <Image src={qrDataURL} alt="QR Code" height={200} width={200} />
        </div>
      )}

      {error && <p>There was an error generating the QR code</p>}
    </div>
  );
}

export async function getServerSideProps(context) {
  const { startTime, endTime, qrcodeData } = context.query;

  if (!startTime || !endTime || !qrcodeData) {
    return { notFound: true };
  }

  return { props: { startTime, endTime, qrcodeData } };
}
