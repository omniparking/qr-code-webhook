import { useEffect, useState } from "react";
import QRCode from "qrcode";
import styled from "styled-components";
import moment from "moment";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  margin-left: 20px;
  gap: 12px;
  width: 100vw;
  height: 100vh;
`;

const Paragraph = styled.p`
  font-weight: 600;
  display: inline-block;
  font-size: 18px;
  margin: 0;
`;

const Span = styled.span`
  font-size: 20px;
`;

const SpanBlock = styled.span`
  display: block;
`;

const H1 = styled.h1`
  margin: 24px 0 12px 0;
`;

const Image = styled.img`
  margin-top: 20px;
`;

const QRPage = ({ startTime, endTime, qrcodeData }) => {
  const [qrDataURL, setQRDataURL] = useState("");

  useEffect(() => {
    // Generate QR code as a data URL
    QRCode.toDataURL(qrcodeData, { errorCorrectionLevel: "L", version: 9 })
      .then((url) => setQRDataURL(url))
      .catch((error) => console.error("Error generating QR code:", error));
  }, [qrcodeData]);

  return (
    <Container>
      <H1>Omni Airport Parking</H1>
      <SpanBlock>
        <Paragraph>Start Time:</Paragraph>{" "}
        <Span>{startTime && moment(startTime).format("MM/DD/YY h:mm a")}</Span>
      </SpanBlock>

      <SpanBlock>
        <Paragraph>End Time:</Paragraph>{" "}
        <Span>{moment(endTime).format("MM/DD/YY h:mm a")}</Span>
      </SpanBlock>
      {qrDataURL && <Image src={qrDataURL} alt="QR Code" />}
    </Container>
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
