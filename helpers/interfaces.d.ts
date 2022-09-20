interface DataForServer {
  end_time: string;
  first: string
  last: string;
  orderNum: string;
  start_time: string;
}

interface HTMLMarkupData {
  createdAt: string;
  end_time: string;
  logoImageBase64: string;
  price: string;
  name: string;
  quantity: string;
  start_time: string;
  subtotal_price: string;
  total_price: string;
  total_tax: string;
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


interface EmailInfo {
  attachments: any;
  from: string;
  html: string;
  orderNum: string;
  to: string;
}

