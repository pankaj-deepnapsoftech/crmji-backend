const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    organization: {
      type: mongoose.Types.ObjectId,
      ref: "Organization",
      required: [true, 'organization is a required field']
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: [true, "creator is a required field"],
    },
    name: {
      type: String,
      required: [true, "Name is a required field"],
    },
    model: {
      type: String,
      // required: [true, "Model is a required field"],
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Product Category",
      required: [true, "Category is a required field"],
    },
    price: {
      type: String,
      // required: [true, "Price is a required field"],
    },
    description: {
      type: String,
    },
    // ref: {
    //   type: String,
    // },
    imageUrl: {
      type: String,
    },
    type: {
      type: String,
      enum: ['Product', 'Service'],
      default: 'Product',
      required: [true, 'Type is a required field']
    },
    // stock: {
    //   type: Number,
    //   required: [true, 'Stock is a required field']
    // }
  },
  { timestamps: true }
);

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;
