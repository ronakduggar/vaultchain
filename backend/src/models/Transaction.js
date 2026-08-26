import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    ipfsHash: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      enum: ["STORE", "UPDATE", "DELETE"],
      required: true,
    },
    gasUsed: {
      type: Number,
      required: true,
    },
    network: {
      type: String,
      default: "Hardhat Localhost",
    },
    blockNumber: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", TransactionSchema);
