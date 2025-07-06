import Cors from "cors";
import initMiddleware from "../lib/init-middleware";
import { GoogleGenerativeAI } from "@google/generative-ai";

const cors = initMiddleware(
  Cors({
    origin: "https://agusbudbudi.github.io", // GANTI dengan frontend kamu untuk keamanan, misal: "https://agusbudbudi.github.io"
    methods: ["POST", "OPTIONS"],
  })
);

export default async function handler(req, res) {
  await cors(req, res); // Apply CORS

  console.log("Gemini Key:", process.env.GEMINI_API_KEY); // ✅ Tambahkan di sini

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(req.body);
    const response = await result.response;
    const text = response.text();
    res.status(200).json({ result: text });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Failed to call Gemini API" });
  }
}
