const mongoose = require("mongoose");
const expenseModel = require("./expense");

const expenseCategorySchema = mongoose.Schema(
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
    categoryname: {
      type: String,
      required: [true, "Name is a required field"],
    },
    description: {
      type: String,
      required: [true, "Description is a required field"],
    },
    // color: {
    //     type: String,
    //     required: [true, "Color is a required field"],
    //     enum: ["default", "magenta", "red", "volcano", "orange", "gold", "lime", "green"],
    //     default: "default"
    // },
    // enabled: {
    //     type: Boolean,
    //     required: [true, "Enabled is a required field"]
    // }
  },
  { timestamps: true }
);


expenseCategorySchema.pre(
  "deleteOne",
  { document: true, query: true },
  async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete?._id !== undefined) {
      await expenseModel.deleteMany({ category: docToDelete._id });
    }
    next();
  }
);


const expenseCategoryModel = mongoose.model(
  "Expense Category",
  expenseCategorySchema
);

module.exports = expenseCategoryModel;
