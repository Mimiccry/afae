const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || "test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm";
const SDK_URL = import.meta.env.VITE_TOSS_SDK_URL || "https://js.tosspayments.com/v1";
export const TOSS_PENDING_ORDER_KEY = "toss_pending_order";

type PaymentItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

const createOrderId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `order_${crypto.randomUUID()}`;
  }
  return `order_${Date.now()}`;
};

declare global {
  interface Window {
    loadTossPayments?: (
      clientKey: string,
    ) => Promise<{ requestPayment?: (method: string, options: unknown) => Promise<void> }>;
    TossPayments?: (clientKey: string) => { requestPayment?: (method: string, options: unknown) => Promise<void> };
  }
}

let scriptPromise: Promise<void> | null = null;

const ensureTossScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is not available"));
  }
  if (window.loadTossPayments || window.TossPayments) {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load TossPayments script"));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

const getRequestPayment = async () => {
  await ensureTossScript();

  if (typeof window.loadTossPayments === "function") {
    const instance = await window.loadTossPayments(TOSS_CLIENT_KEY);
    const fn = instance?.requestPayment;
    if (typeof fn === "function") {
      return (options: unknown) => {
        if (fn.length <= 1) {
          return fn({ method: "CARD", ...(options as object) });
        }
        return fn("CARD", options);
      };
    }
  }

  if (typeof window.TossPayments === "function") {
    const instance = window.TossPayments(TOSS_CLIENT_KEY);
    const fn = instance?.requestPayment;
    if (typeof fn === "function") {
      return (options: unknown) => {
        if (fn.length <= 1) {
          return fn({ method: "CARD", ...(options as object) });
        }
        return fn("CARD", options);
      };
    }
  }

  throw new TypeError("TossPayments requestPayment is not available");
};

const savePendingOrder = (payload: {
  orderId: string;
  amount: number;
  orderName: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items: PaymentItem[];
}) => {
  try {
    sessionStorage.setItem(
      TOSS_PENDING_ORDER_KEY,
      JSON.stringify({ ...payload, savedAt: new Date().toISOString() }),
    );
  } catch (error) {
    console.error("Failed to store pending order", error);
  }
};

export const requestTossPayment = async ({
  amount,
  orderName,
  customerId,
  customerName = "고객",
  customerEmail,
  items = [],
}: {
  amount: number;
  orderName: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items?: PaymentItem[];
}) => {
  const orderId = createOrderId();

  savePendingOrder({
    orderId,
    amount,
    orderName,
    customerId,
    customerName,
    customerEmail,
    items,
  });

  const baseOptions = {
    amount,
    orderId,
    orderName,
    customerName,
    customerEmail,
    successUrl: `${window.location.origin}/payment/success`,
    failUrl: `${window.location.origin}/payment/fail`,
  };

  const requestPayment = await getRequestPayment();
  await requestPayment(baseOptions);
};

