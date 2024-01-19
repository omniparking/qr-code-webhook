import { CSSProperties, useEffect, useState } from "react";
import QRCode from "qrcode";
import { convertDateFormat } from "../../helpers";
import Image from "next/image";

// SAMPLE DATA URL: https://qr-code-webhook-git-master-omniairportparking.vercel.app/view/qr?startTime=02.02.2022T02:00:00&endTime=02.02.2022T02:00:00&qrcodeData=123123123

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: 20,
  width: "100%",
};
const pStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  margin: 0,
  padding: 0,
  gap: 8,
};
const h1Style = { marginTop: 24, fontSize: 32 };
const timeStyle: CSSProperties = { fontSize: 20 };
const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  alignItems: "right",
};
const imgStyle: CSSProperties = { marginTop: 32 };

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
    <div style={containerStyle}>
      <h1 style={h1Style}>Omni Airport Parking</h1>

      <p style={pStyle}>
        <span style={titleStyle}>Start Time:</span>
        <span style={timeStyle}>{convertDateFormat(startTime)}</span>
      </p>

      <p style={pStyle}>
        <span style={titleStyle}>End Time:</span>
        <span style={timeStyle}>{convertDateFormat(endTime)}</span>
      </p>

      {qrDataURL && (
        <Image
          style={imgStyle}
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
