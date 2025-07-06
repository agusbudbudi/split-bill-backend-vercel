// import Cors from "cors";
// import initMiddleware from "../lib/init-middleware";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const cors = initMiddleware(
//   Cors({
//     origin: "https://agusbudbudi.github.io", // GANTI dengan frontend kamu untuk keamanan, misal: "https://agusbudbudi.github.io"
//     methods: ["POST", "OPTIONS"],
//   })
// );

// export default async function handler(req, res) {
//   await cors(req, res); // Apply CORS

//   console.log("API Key Exists?", !!process.env.GEMINI_API_KEY);

//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//   try {
//     const result = await model.generateContent(req.body);
//     const response = await result.response;
//     const text = response.text();
//     res.status(200).json({ result: text });
//   } catch (err) {
//     console.error("Gemini API error:", err);
//     res.status(500).json({ error: "Failed to call Gemini API" });
//   }
// }

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

//   if (!GEMINI_API_KEY) {
//     return res.status(500).json({ error: "Missing Gemini API Key" });
//   }

//   const { mime_type, base64Image } = req.body;

//   const prompt = `
// Analyze this bill/receipt image and extract the following information in JSON format:
// {
//   "merchant_name": "name of the store/restaurant",
//   "date": "transaction date (YYYY-MM-DD format)",
//   "time": "transaction time (HH:MM format)",
//   "items": [
//     {
//         "name": "item name",
//         "quantity": "quantity",
//         "price": "price per item",
//         "total": "total price for this item"
//     }
//   ],
//   "subtotal": "subtotal amount",
//   "tax": "tax amount",
//   "service_charge": "service charge if any",
//   "discount": "discount amount if any",
//   "total_amount": "final total amount",
//   "payment_method": "cash/card/etc",
//   "receipt_number": "receipt/transaction number"
// }
// Please extract as much information as possible. Respond with ONLY the JSON.
// `;

//   const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

//   const payload = {
//     contents: [
//       {
//         parts: [
//           { text: prompt },
//           {
//             inline_data: {
//               mime_type,
//               data: base64Image,
//             },
//           },
//         ],
//       },
//     ],
//   };

//   try {
//     const response = await fetch(googleApiUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     const data = await response.json();

//     const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

//     const jsonMatch = textResponse?.match(/\{[\s\S]*\}/);

//     if (!jsonMatch) {
//       return res
//         .status(500)
//         .json({ error: "No JSON found in response", raw: textResponse });
//     }

//     const parsed = JSON.parse(jsonMatch[0]);

//     res.status(200).json(parsed);
//   } catch (error) {
//     console.error("Gemini scan error:", error);
//     res
//       .status(500)
//       .json({ error: "Failed to call Gemini API", details: error.message });
//   }
// }

export default async function handler(req, res) {
  // ✅ Tambahkan headers untuk CORS
  res.setHeader("Access-Control-Allow-Origin", "https://agusbudbudi.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Sukseskan preflight OPTIONS
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Missing Gemini API Key" });
  }

  const { mime_type, base64Image } = req.body;

  const prompt = `...`; // Prompt kamu tetap

  const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type,
              data: base64Image,
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(googleApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    const jsonMatch = textResponse?.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res
        .status(500)
        .json({ error: "No JSON found in response", raw: textResponse });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    res.status(200).json(parsed);
  } catch (error) {
    console.error("Gemini scan error:", error);
    res.status(500).json({
      error: "Failed to call Gemini API",
      details: error.message,
    });
  }
}
