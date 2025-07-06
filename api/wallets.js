import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;
if (!mongoose.connection.readyState) {
  await mongoose.connect(uri);
}

const WalletSchema = new mongoose.Schema({
  name: String,
  method: String,
  bankName: String,
  accountNumber: String,
  phoneNumber: String,
});

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const wallet = new Wallet(req.body);
    await wallet.save();
    return res.status(201).json(wallet);
  } else if (req.method === "GET") {
    const wallets = await Wallet.find();
    return res.status(200).json(wallets);
  } else {
    res.status(405).end();
  }
}
