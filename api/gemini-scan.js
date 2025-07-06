export default async function handler(req, res) {
  // ✅ Tambahkan headers untuk CORS
  res.setHeader("Access-Control-Allow-Origin", "https://agusbudbudi.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error("Missing Gemini API Key");
    return res.status(500).json({ error: "Missing Gemini API Key" });
  }

  const { mime_type, base64Image } = req.body;

  // ✅ Validasi input
  if (!mime_type || !base64Image) {
    return res.status(400).json({
      error: "Missing required fields: mime_type and base64Image",
    });
  }

  const prompt = `
Analyze this bill/receipt image and extract the following information in JSON format:
{
  "merchant_name": "name of the store/restaurant",
  "date": "transaction date (YYYY-MM-DD format)",
  "time": "transaction time (HH:MM format)",
  "items": [
    {
        "name": "item name",
        "quantity": "quantity",
        "price": "price per item",
        "total": "total price for this item"
    }
  ],
  "subtotal": "subtotal amount",
  "tax": "tax amount",
  "service_charge": "service charge if any",
  "discount": "discount amount if any",
  "total_amount": "final total amount",
  "payment_method": "cash/card/etc",
  "receipt_number": "receipt/transaction number"
}
Please extract as much information as possible. Respond with ONLY the JSON.
`;

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
    console.log("Making request to Gemini API...");

    const response = await fetch(googleApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("Gemini API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error response:", errorText);
      return res.status(response.status).json({
        error: "Gemini API request failed",
        details: errorText,
        status: response.status,
      });
    }

    const data = await response.json();
    console.log("Gemini API response data:", JSON.stringify(data, null, 2));

    // ✅ Improved error handling
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      console.error("Invalid response structure from Gemini API");
      return res.status(500).json({
        error: "Invalid response from Gemini API",
        response: data,
      });
    }

    const textResponse = data.candidates[0].content.parts[0].text;

    if (!textResponse) {
      console.error("No text response from Gemini API");
      return res.status(500).json({
        error: "No text response from Gemini API",
        response: data,
      });
    }

    console.log("Raw text response:", textResponse);

    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("No JSON found in response");
      return res.status(500).json({
        error: "No JSON found in response",
        raw: textResponse,
      });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("Successfully parsed JSON:", parsed);
      res.status(200).json(parsed);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(500).json({
        error: "Failed to parse JSON from Gemini response",
        raw: textResponse,
        parseError: parseError.message,
      });
    }
  } catch (error) {
    console.error("Gemini scan error:", error);
    res.status(500).json({
      error: "Failed to call Gemini API",
      details: error.message,
      stack: error.stack,
    });
  }
}
