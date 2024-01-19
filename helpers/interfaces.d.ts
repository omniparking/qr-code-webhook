interface MailAttachments {
  cid: string;
  filename: string;
  path: string;
}

interface BillingAddress {
  address1: string;
  address2: string;
  city: string;
  country: string;
  name: string;
  province: string;
  zip: string;
}

interface BookingTime {
  name: string;
  value: string;
}

interface DataForServer {
  end_time: string;
  first: string;
  last: string;
  order_num: string;
  start_time: string;
}

interface EmailData {
  attachments: any;
  from: string;
  html: string;
  orderNum: string;
  to: string;
  cc?: string[];
}

interface FTPServer {
  host: string;
  user: string;
  password: string;
  port: number;
  secure: boolean;
}

interface HTMLMarkupData {
  createdAt: string;
  end_time: string;
  price: string;
  name: string;
  quantity: string;
  start_time: string;
  subtotal_price: string;
  total_price: string;
  total_tax: string;
  qrcodeData: string;
}

type Vendor = "general" | "mercedes";
