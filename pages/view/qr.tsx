import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { convertDateFormat } from "../../helpers";

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
        console.error("Error generating qr code image:", error);
        setError(true);
      }
    };

    generateQRCode();
  }, [qrcodeData]);

  return (
    <div className="flex flex-col justify-center items-center gap-4 w-full">
      <h1 className="mt-6 mb-4 text-4xl">Omni Airport Parking</h1>

      <p className="flex flex-row items-center justify-center m-0 p-0 gap-2">
        <span className="text-[18px] font-semibold">Start Time:</span>
        <span className="text-[22px]">{convertDateFormat(startTime)}</span>
      </p>

      <p className="flex flex-row items-center justify-center m-0 p-0 gap-2">
        <span className="text-[18px] font-semibold">End Time:</span>
        <span className="text-[22px]">{convertDateFormat(endTime)}</span>
      </p>

      {qrDataURL && (
        <div className="mt-6">
          <Image src={qrDataURL} alt="QR Code" height={200} width={200} />
        </div>
      )}

      {error && (
        <p className="text-xl text-center font-bold text-red-600">
          There was an error generating the QR code!
        </p>
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
