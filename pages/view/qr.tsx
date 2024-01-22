import { CSSProperties, useEffect, useState } from "react";
import QRCode from "qrcode";
import { convertDateFormat } from "../../helpers";
import Image from "next/image";

// SAMPLE DATA URL: https://qr-code-webhook-git-master-omniairportparking.vercel.app/view/qr?startTime=02.02.2022T02:00:00&endTime=02.02.2022T02:00:00&qrcodeData=123123123

export default function QRPage({ startTime, endTime, qrcodeData }) {
  const [qrDataURL, setQRDataURL] = useState<string>("");

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
        return <p>There was an error generating the QR Code!</p>;
      }
    };

    generateQRCode();
  }, [qrcodeData]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        width: "100%",
      }}
    >
      <h1 style={{ marginTop: 24, fontSize: 32 }}>Omni Airport Parking</h1>

      <p
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: 0,
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            alignItems: "right",
          }}
        >
          Start Time:
        </span>
        <span style={{ fontSize: 20 }}>{convertDateFormat(startTime)}</span>
      </p>

      <p
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: 0,
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            alignItems: "right",
          }}
        >
          End Time:
        </span>
        <span style={{ fontSize: 20 }}>{convertDateFormat(endTime)}</span>
      </p>

      {qrDataURL && (
        <Image
          style={{ marginTop: 32 }}
          src={qrDataURL}
          alt="QR Code"
          height={200}
          width={200}
        />
      )}
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
