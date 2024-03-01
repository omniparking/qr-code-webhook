"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

import { convertDateFormat } from "../../helpers";

import QRCode from "qrcode";

// SAMPLE DATA URL: https://qr-code-webhook-git-master-omniairportparking.vercel.app/view/qr?startTime=02.02.2022T02:00:00&endTime=02.02.2022T02:00:00&qrCodeData=123123123

export default function QRPage(): JSX.Element {
  const router = useRouter();
  const { startTime, endTime, qrcodeData: qrCodeData } = router.query;
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Generate QR code as a data URL
    const generateQRCode = async () => {
      try {
        const qrUrl = await QRCode.toDataURL(qrCodeData, {
          errorCorrectionLevel: "L",
          version: 9,
        });

        setQRCodeDataURL(qrUrl);
        setError(false);
      } catch (error) {
        console.error("Error generating qr code image:", error);
        setError(true);
      }
    };

    if (qrCodeData) {
      generateQRCode();
    } else {
      setError(true);
    }
  }, [startTime, endTime, qrCodeData]);

  return (
    <div className="flex flex-col justify-center items-center gap-2 w-full">
      <h1 className="mt-6 text-4xl">Omni Airport Parking</h1>

      <p className="flex flex-row items-center justify-center m-0 p-0 gap-2">
        <span className="text-18 font-semibold">Start Time:</span>
        <span className="text-22">
          {convertDateFormat(
            Array.isArray(startTime) ? startTime[0] : startTime
          )}
        </span>
      </p>

      <p className="flex flex-row items-center justify-center m-0 p-0 gap-2">
        <span className="text-18 font-semibold">End Time:</span>
        <span className="text-22">
          {convertDateFormat(Array.isArray(endTime) ? endTime[0] : endTime)}
        </span>
      </p>

      {qrCodeDataURL && (
        <div>
          <Image src={qrCodeDataURL} alt="QR Code" height={250} width={250} />
        </div>
      )}

      {error && (
        <p className="text-xl text-center font-bold text-red-600">
          There was an error generating the QR code!
        </p>
      )}

      <div className="max-w-[400px] flex flex-col items-center justify-center gap-2 pb-2">
        <p className="text-18 text-center font-medium">
          SHUTTLE PICKUP INSTRUCTIONS:
        </p>
        <p className="text-center">
          If you have arrived at Orlando International Airport, please make your
          way to level one, ground transportation. Level one is located one
          level below baggage claim.
        </p>
        <p className="text-center">
          If you're at Terminal A, our shuttle stops are at A12 or A13. If
          you're at Terminal B, our shuttle stops are at B12 or B13. If you're
          at Terminal C, out shuttle stop are C277,C278 and or C279.
        </p>
        <p className="text-center">
          You are more than welcome to call us to verify ETA. Please make sure
          that you hop on a shuttle that says Green Motion & Omni Airport
          Parking.
        </p>
        <p className="text-center">
          Our shuttles are every 20-25 minutes, however please be advised that
          shuttles may take a little longer due to traffic at certain hours of
          the day.
        </p>
      </div>
    </div>
  );
}
