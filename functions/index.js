const functions = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const midtransClient = require("midtrans-client");
const path = require("path");

// Load local .env (only for local development/emulator). Do not fail if dotenv not installed.
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch (e) {
  // dotenv not installed or .env missing — ignore in production
}

// Batasi max instance
functions.setGlobalOptions({ maxInstances: 10 });

// ================================
// Midtrans Payment Endpoint (Sandbox)
// ================================
// Server key should be provided via environment variable or functions config.
// Local dev: set process.env.MIDTRANS_SERVER_KEY
// Firebase: `firebase functions:config:set midtrans.server_key="<KEY>"`
const getServerKey = () => {
  // Prefer explicit environment variable
  if (process.env.MIDTRANS_SERVER_KEY) return process.env.MIDTRANS_SERVER_KEY;

  // Then try functions config
  try {
    const cfg = functions.config();
    if (cfg && cfg.midtrans && cfg.midtrans.server_key)
      return cfg.midtrans.server_key;
  } catch (e) {
    // ignore
  }

  return null;
};

// Endpoint HTTP untuk membuat pembayaran
exports.createPayment = onRequest(async (req, res) => {
  // CORS headers (allow all origins for sandbox/dev).
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    if (req.method !== "POST") {
      return res.status(400).send({ error: "Use POST method" });
    }

    const serverKey = getServerKey();
    if (!serverKey) {
      logger.error(
        "Midtrans server key is not configured. Set MIDTRANS_SERVER_KEY or functions config."
      );
      return res.status(500).send({ error: "Server key not configured" });
    }

    // Log only prefix of server key and its source for debugging (do NOT log full key)
    let keySource = "unknown";
    if (process.env.MIDTRANS_SERVER_KEY) keySource = "env";
    else {
      try {
        const cfg = functions.config();
        if (cfg && cfg.midtrans && cfg.midtrans.server_key)
          keySource = "functions.config";
      } catch (e) {
        // ignore
      }
    }
    logger.info(
      `MIDTRANS serverKey source=${keySource} prefix=${serverKey.slice(0, 8)}`
    );

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: serverKey,
    });

    const { user_id, total, tujuan_pembayaran } = req.body;

    if (!user_id || !total || !tujuan_pembayaran) {
      return res.status(400).send({ error: "Missing required fields" });
    }

    // Generate unique order_id
    const order_id = `order-${Date.now()}`;

    // Data transaksi untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: total,
      },
      customer_details: {
        first_name: user_id, // bisa diganti nama asli mahasiswa
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return res
      .status(200)
      .send({ snapToken: transaction.token, order_id: order_id });
  } catch (error) {
    logger.error("Payment creation failed:", error);
    // Log detailed error info for debugging (Midtrans API errors, config issues, etc.)
    if (error.response && error.response.status === 401) {
      logger.error(
        "MIDTRANS 401 - Check if serverKey and clientKey are valid sandbox credentials from SAME account"
      );
      logger.error("errorResponse:", error.response.data || error.message);
    }
    return res.status(500).send({ error: error.message });
  }
});

// ================================
// (Opsional) Callback / Notification Endpoint
// ================================
exports.paymentCallback = onRequest(async (req, res) => {
  try {
    const body = req.body;

    // Di sini bisa simpan status transaksi ke Firestore
    // contoh: admin.firestore().collection("transactions").doc(body.order_id).set(body);

    logger.info("Payment callback received:", body);

    return res.status(200).send("OK");
  } catch (err) {
    logger.error("Callback error:", err);
    return res.status(500).send({ error: err.message });
  }
});
