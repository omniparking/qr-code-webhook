import { useEffect, useState } from "react";
import QRCode from "qrcode";
import moment from "moment";

// SAMPLE DATA URL: https://qr-code-webhook-git-master-omniairportparking.vercel.app/view/qr?startTime=02.02.2022T02:00:00&endTime=02.02.2022T02:00:00&qrcodeData=123123123

const QRPage = ({ startTime, endTime, qrcodeData }) => {
  const [qrDataURL, setQRDataURL] = useState("");

  useEffect(() => {
    // Generate QR code as a data URL
    QRCode.toDataURL(qrcodeData, { errorCorrectionLevel: "L", version: 9 })
      .then((url) => setQRDataURL(url))
      .catch((error) => console.error("Error generating QR code:", error));
  }, [qrcodeData]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
      }}
    >
      <h1 style={{ marginTop: 24 }}>Omni Airport Parking</h1>

      <span>
        <p>Start Time:</p>{" "}
        <span>
          {<span style={{ fontWeight: 600 }}>startTime</span> && (
            <span style={{ fontSize: 20 }}>
              {moment(startTime).format("MM/DD/YY h:mm a")}
            </span>
          )}
        </span>
      </span>

      <span>
        <p style={{ fontWeight: 600 }}>End Time:</p>
        <span>
          {<span style={{ fontWeight: 600 }}>startTime</span> && (
            <span style={{ fontSize: 20 }}>
              {moment(endTime).format("MM/DD/YY h:mm a")}
            </span>
          )}
        </span>
      </span>
      {qrDataURL && (
        <img style={{ marginTop: 20 }} src={qrDataURL} alt="QR Code" />
      )}
    </div>
  );
};

export async function getServerSideProps(context) {
  // Extract start and end times from query parameters
  const { startTime, endTime, qrcodeData } = context.query;

  // Validate input (you may want to add more robust validation)
  if (!startTime || !endTime || !qrcodeData) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      startTime,
      endTime,
      qrcodeData,
    },
  };
}

export default QRPage;
