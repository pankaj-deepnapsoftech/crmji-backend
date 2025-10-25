const { mongoose } = require("mongoose");

const totalWhatsappSchema = mongoose.Schema(
  {
    phone: {
      type: String,
      reuired: true,
    },
    date: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

const TotalWhatsapp = mongoose.model("TotalWhatsapp", totalWhatsappSchema);

module.exports = TotalWhatsapp;
