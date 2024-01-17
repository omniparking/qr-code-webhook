import { useEffect, useState } from "react";
import QRCode from "qrcode";
import moment from "moment";

const QRPage = ({ startTime, endTime, qrcodeData }) => {
  const [qrDataURL, setQRDataURL] = useState("");

  useEffect(() => {
    // Generate QR code as a data URL
    QRCode.toDataURL(qrcodeData, { errorCorrectionLevel: "L", version: 9 })
      .then((url) => setQRDataURL(url))
      .catch((error) => console.error("Error generating QR code:", error));
  }, [qrcodeData]);

  return (
    <div>
      <h1>Omni Airport Booking:</h1>
      <p>Start Time: {moment(startTime).format("MMMM Do YYYY, h:mm a")}</p>
      <p>End Time: {moment(endTime).format("MMMM Do YYYY, h:mm a")}</p>
      {qrDataURL && <img src={qrDataURL} alt="QR Code" />}
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
