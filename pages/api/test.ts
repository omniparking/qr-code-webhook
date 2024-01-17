import axios from "axios";

const headers = { "X-Shopify-Access-Token": "your_access_token" };
const endpoint =
  "https://signature-airport-parking.myshopify.com/admin/api/2022-01/orders.json";

/* USING GRAPHQL API */
// Replace 'your_access_token' with the actual access token from your private app

const query = `
{
  products(first: 5) {
    edges {
      node {
        id
        title
        variants(first: 1) {
          edges {
            node {
              id
              title
              priceV2 {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
}
`;

// Make a request to the API
const response = axios.post(endpoint, { query }, { headers });
console.log("response:", response);

/* USING REST API */

export const placeOrder = async () => {
  const data = {
    order: {
      line_items: [
        {
          fulfillable_quantity: 1,
          name: "(MCO) SELF PARKING",
          price: "6.99",
          price_set: {
            shop_money: {
              amount: "6.99",
              currency_code: "USD",
            },
            presentment_money: {
              amount: "6.99",
              currency_code: "USD",
            },
          },
          product_exists: true,
          product_id: 408441216,
          properties: [
            {
              name: "booking-start",
              value: "2024-01-13T12:00:00",
            },
            {
              name: "booking-finish",
              value: "2024-01-14T10:00:00",
            },
            {
              name: "Units",
              value: "1",
            },
          ],
          quantity: 1,
          requires_shipping: false,
          sku: "",
          taxable: true,
          title: "(MCO) SELF PARKING",
          total_discount: "0",
          total_discount_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "USD",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "USD",
            },
          },
          variant_id: 1114378828,
          variant_inventory_management: null,
          variant_title: null,
          vendor: "OMNI Airport Parking Orlando (MCO)",
          tax_lines: [
            {
              channel_liable: false,
              price: "0.46",
              price_set: {
                shop_money: {
                  amount: "0.46",
                  currency_code: "USD",
                },
                presentment_money: {
                  amount: "0.46",
                  currency_code: "USD",
                },
              },
              rate: 0.065,
              title: "Federal Tax",
            },
            {
              channel_liable: false,
              price: "0.70",
              price_set: {
                shop_money: {
                  amount: "0.70",
                  currency_code: "USD",
                },
                presentment_money: {
                  amount: "0.70",
                  currency_code: "USD",
                },
              },
              rate: 0.1,
              title: "Privilege Fee Recovery Charge",
            },
          ],
          duties: [],
          discount_allocations: [],
        },
        {
          id: Math.floor(Math.random() * 99999999999999),
          fulfillable_quantity: 1,
          fulfillment_service: "manual",
          fulfillment_status: null,
          gift_card: false,
          grams: 0,
          name: "Facility Charge - Facility Charge",
          price: "4.99",
          price_set: {
            shop_money: {
              amount: "4.99",
              currency_code: "USD",
            },
            presentment_money: {
              amount: "4.99",
              currency_code: "USD",
            },
          },
          product_exists: true,
          product_id: 7393020674229,
          properties: [
            {
              name: "_mws_fee",
              value: {
                id: 7393020674229,
                input_type: "HIDDEN",
              },
            },
          ],
          quantity: 1,
          requires_shipping: false,
          sku: "",
          taxable: true,
          title: "Facility Charge",
          total_discount: "0.00",
          total_discount_set: {
            shop_money: {
              amount: "0.00",
              currency_code: "USD",
            },
            presentment_money: {
              amount: "0.00",
              currency_code: "USD",
            },
          },
          variant_id: 42593489387701,
          variant_inventory_management: null,
          variant_title: "Facility Charge",
          vendor: "OMNI Airport Parking",
          tax_lines: [
            {
              channel_liable: false,
              price: "", // determine => price = totalPrice * 0.065
              price_set: {
                shop_money: {
                  amount: "", // determine => price = totalPrice * 0.065
                  currency_code: "USD",
                },
                presentment_money: {
                  amount: "", // determine => price = totalPrice * 0.065
                  currency_code: "USD",
                },
              },
              rate: 0.065,
              title: "Federal Tax",
            },
            {
              channel_liable: false,
              price: "0.50",
              price_set: {
                shop_money: {
                  amount: "0.50",
                  currency_code: "USD",
                },
                presentment_money: {
                  amount: "0.50",
                  currency_code: "USD",
                },
              },
              rate: 0.1,
              title: "Privilege Fee Recovery Charge",
            },
          ],
        },
      ],
      financial_status: "pending",
    },
  };

  // Make a POST request to create the order
  axios.post(endpoint);
  const response = await axios.post(endpoint, data, { headers });
  console.log("placeOrder", response);
};

const createOrder = async () => {
  // Replace {order_id} with the actual order ID
  const order_id = 123456789;

  // Make a POST request to complete the order
  const response = await axios.post(`${endpoint}?order_id=${order_id}`, {
    headers,
  });
  console.log("createOrder response", response);
};

const order = {
  app_id: 580111,
  checkout_token: "aa6ee28b58b587ffca9f03ec1a4513af",
  contact_email: "jkelley06@icloud.com",
  created_at: "2024-01-12T22:53:20-05:00",
  currency: "USD",
  current_subtotal_price: "11.98",
  current_total_discounts: "13.96",
  current_total_duties_set: null,
  current_total_price: "13.96",
  current_total_tax: "1.98",
  customer_locale: "en-US",
  device_id: null,
  discount_codes: [],
  email: "jkelley06@icloud.com",
  estimated_taxes: false,
  financial_status: "paid",
  fulfillment_status: null,
  gateway: "shopify_payments",

  subtotal_price: "11.98",
  tags: "",
  taxes_included: false,
  test: false,
  token: "7933fb6eca10eae6256b5348b8b0319e",
  total_discounts: "0.00",
  total_discounts_set: {
    shop_money: {
      amount: "0.00",
      currency_code: "USD",
    },
    presentment_money: {
      amount: "0.00",
      currency_code: "USD",
    },
  },
  total_line_items_price: "11.98",
  total_line_items_price_set: {
    shop_money: {
      amount: "11.98",
      currency_code: "USD",
    },
    presentment_money: {
      amount: "11.98",
      currency_code: "USD",
    },
  },
  total_outstanding: "0.00",
  total_price: "13.96",
  total_price_set: {
    shop_money: {
      amount: "13.96",
      currency_code: "USD",
    },
    presentment_money: {
      amount: "13.96",
      currency_code: "USD",
    },
  },
  total_shipping_price_set: {
    shop_money: {
      amount: "0.00",
      currency_code: "USD",
    },
    presentment_money: {
      amount: "0.00",
      currency_code: "USD",
    },
  },
  total_tax: "1.98",
  total_tax_set: {
    shop_money: {
      amount: "1.98",
      currency_code: "USD",
    },
    presentment_money: {
      amount: "1.98",
      currency_code: "USD",
    },
  },
  total_tip_received: "0.00",
  total_weight: 0,
  updated_at: "2024-01-12T22:53:20-05:00",
  user_id: null,
  billing_address: {
    first_name: "Jermichael",
    address1: "346 Lake Crescent Drive",
    phone: "2569199759",
    city: "DeBary",
    zip: "32713",
    province: "Florida",
    country: "United States",
    last_name: "Kelley",
    address2: null,
    company: null,
    latitude: 28.8725169,
    longitude: -81.2830279,
    name: "Jermichael Kelley",
    country_code: "US",
    province_code: "FL",
  },
  customer: {
    id: 7365376377013,
    email: "jkelley06@icloud.com",
    accepts_marketing: true,
    created_at: "2024-01-12T22:53:16-05:00",
    updated_at: "2024-01-12T22:53:21-05:00",
    first_name: "Jermichael",
    last_name: "Kelley",
    state: "disabled",
    note: null,
    verified_email: true,
    multipass_identifier: null,
    tax_exempt: false,
    phone: null,
    email_marketing_consent: {
      state: "subscribed",
      opt_in_level: "single_opt_in",
      consent_updated_at: "2024-01-12T22:53:20-05:00",
    },
    sms_marketing_consent: null,
    tags: "",
    currency: "USD",
    accepts_marketing_updated_at: "2024-01-12T22:53:20-05:00",
    marketing_opt_in_level: "single_opt_in",
    tax_exemptions: [],
    admin_graphql_api_id: "gid://shopify/Customer/7365376377013",
    default_address: {
      id: 9233053614261,
      customer_id: 7365376377013,
      first_name: "Jermichael",
      last_name: "Kelley",
      company: null,
      address1: "346 Lake Crescent Drive",
      address2: null,
      city: "DeBary",
      province: "Florida",
      country: "United States",
      zip: "32713",
      phone: "2569199759",
      name: "Jermichael Kelley",
      province_code: "FL",
      country_code: "US",
      country_name: "United States",
      default: true,
    },
  },
  discount_applications: [],
  fulfillments: [],
  line_items: [
    {
      id: 12954003800245,
      admin_graphql_api_id: "gid://shopify/LineItem/12954003800245",
      fulfillable_quantity: 1,
      fulfillment_service: "manual",
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: "(MCO) SELF PARKING",
      price: "6.99",
      price_set: {
        shop_money: {
          amount: "6.99",
          currency_code: "USD",
        },
        presentment_money: {
          amount: "6.99",
          currency_code: "USD",
        },
      },
      product_exists: true,
      product_id: 408441216,
      properties: [
        {
          name: "booking-start",
          value: "2024-01-13T12:00:00",
        },
        {
          name: "booking-finish",
          value: "2024-01-14T10:00:00",
        },
        {
          name: "Units",
          value: "1",
        },
      ],
      quantity: 1,
      requires_shipping: false,
      sku: "",
      taxable: true,
      title: "(MCO) SELF PARKING",
      total_discount: "0.00",
      total_discount_set: {
        shop_money: {
          amount: "0.00",
          currency_code: "USD",
        },
        presentment_money: {
          amount: "0.00",
          currency_code: "USD",
        },
      },
      variant_id: 1114378828,
      variant_inventory_management: null,
      variant_title: null,
      vendor: "OMNI Airport Parking Orlando (MCO)",
      tax_lines: [
        {
          channel_liable: false,
          price: "0.46",
          price_set: {
            shop_money: {
              amount: "0.46",
              currency_code: "USD",
            },
            presentment_money: {
              amount: "0.46",
              currency_code: "USD",
            },
          },
          rate: 0.065,
          title: "Federal Tax",
        },
        {
          channel_liable: false,
          price: "0.70",
          price_set: {
            shop_money: {
              amount: "0.70",
              currency_code: "USD",
            },
            presentment_money: {
              amount: "0.70",
              currency_code: "USD",
            },
          },
          rate: 0.1,
          title: "Privilege Fee Recovery Charge",
        },
      ],
      duties: [],
      discount_allocations: [],
    },
    {
      id: 12954003833013,
      admin_graphql_api_id: "gid://shopify/LineItem/12954003833013",
      fulfillable_quantity: 1,
      fulfillment_service: "manual",
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: "Facility Charge - Facility Charge",
      price: "4.99",
      price_set: {
        shop_money: {
          amount: "4.99",
          currency_code: "USD",
        },
        presentment_money: {
          amount: "4.99",
          currency_code: "USD",
        },
      },
      product_exists: true,
      product_id: 7393020674229,
      properties: [
        {
          name: "_mws_fee",
          value: {
            id: 7393020674229,
            input_type: "HIDDEN",
          },
        },
      ],
      quantity: 1,
      requires_shipping: false,
      sku: "",
      taxable: true,
      title: "Facility Charge",
      total_discount: "0.00",
      total_discount_set: {
        shop_money: {
          amount: "0.00",
          currency_code: "USD",
        },
        presentment_money: {
          amount: "0.00",
          currency_code: "USD",
        },
      },
      variant_id: 42593489387701,
      variant_inventory_management: null,
      variant_title: "Facility Charge",
      vendor: "OMNI Airport Parking",
      tax_lines: [
        {
          channel_liable: false,
          price: "0.32",
          price_set: {
            shop_money: {
              amount: "0.32",
              currency_code: "USD",
            },
            presentment_money: {
              amount: "0.32",
              currency_code: "USD",
            },
          },
          rate: 0.065,
          title: "Federal Tax",
        },
        {
          channel_liable: false,
          price: "0.50",
          price_set: {
            shop_money: {
              amount: "0.50",
              currency_code: "USD",
            },
            presentment_money: {
              amount: "0.50",
              currency_code: "USD",
            },
          },
          rate: 0.1,
          title: "Privilege Fee Recovery Charge",
        },
      ],
      duties: [],
      discount_allocations: [],
    },
  ],
  payment_details: {
    credit_card_bin: "483312",
    avs_result_code: "Y",
    cvv_result_code: "M",
    credit_card_number: "•••• •••• •••• 0359",
    credit_card_company: "Visa",
    buyer_action_info: null,
    credit_card_name: "Jermichael Kelley",
    credit_card_wallet: null,
    credit_card_expiration_month: 2,
    credit_card_expiration_year: 2028,
  },
  payment_terms: null,
  refunds: [],
  shipping_lines: [],
};
