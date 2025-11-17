const express = require("express");
const cookieParser = require('cookie-parser');
const {Server} = require('socket.io');
const {createServer} = require('http');
require("dotenv").config();
const cors = require("cors");
const cron = require('node-cron');

const connectDB = require("./utils/connectDB");
const { errorMiddleware } = require("./helpers/error");
const organizationRoutes = require("./routes/organization/routes");
const authRoutes = require("./routes/auth/routes");
const companyRoutes = require("./routes/company/routes");
const peopleRoutes = require("./routes/people/routes");
const customerRoutes = require("./routes/customer/routes");
const leadRoutes = require("./routes/lead/routes");
const productRoutes = require("./routes/product/routes");
const categoryRoutes = require("./routes/category/routes");
const expenseRoutes = require("./routes/expense/routes");
const expenseCategoryRoutes = require("./routes/expense category/routes");
const offerRoutes = require("./routes/offer/routes");
const proformaInvoiceRoutes = require("./routes/proforma invoice/routes");
const invoiceRoutes = require("./routes/invoice/routes");
const paymentRoutes = require("./routes/payment/routes");
const dashboardRoutes = require("./routes/dashboard/routes");
const adminRoutes = require("./routes/admin/routes");
const reportRoutes = require("./routes/report/routes");
const websiteCofigurationRoutes = require("./routes/website configuration/routes");
const supportRoutes = require("./routes/support/routes");
const indiamartLeadRoutes = require("./routes/indiamart lead/routes");
const settingRoutes = require("./routes/setting/routes");
const razorpayRoutes = require("./routes/razorpay/routes");
const userRoutes = require("./routes/crm users/routes");
const smsRoutes = require("./routes/sms/routes");
const socketHandler = require('./socket');
const { isAuthenticated } = require("./controllers/auth/controller");
const { checkAccess } = require("./helpers/checkAccess");
const websiteConfigurationModel = require("./models/websiteConfiguration");
const { fetchLast7Days, fetchLast5Mins } = require("./controllers/indiamart lead/controller");
// const { socketAuthenticator } = require("./helpers/socket");
const notificationRoutes = require("./routes/notification/routes");
const createNotifications = require("./helpers/createNotifications");
const { SendMail } = require("./config/nodeMailer.config");
const RenewalRecord = require("./routes/excel/routes");
const documentCenterRoutes = require("./routes/document center/routes");
const chatRoutes = require("./routes/chat/chatRoute");
const dataExportRoutes = require("./routes/dataExport/routes");
const superAdminRoutes = require("./routes/superAdmin/routes");
const superAdminAuthRoutes = require("./routes/superAdminAuth/routes");
const statusRoutes = require("./routes/status/routes");
const companyStatusRoutes = require("./routes/companyStatus/routes");

const PORT = process.env.PORT;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:8066",
  "http://localhost:9003",
  "http://localhost:8058",
  "https://crm.itsybizz.com",
  "https://crmapi.itsybizz.com",
  "https://deepnapcrm.deepmart.shop",
  "https://crmdemo.deepmart.shop",
  "https://crmdemoapi.deepmart.shop",
  "https://subscription.deepnapsoftech.com",
  "https://crminternal.itsybizz.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Authorization,Content-Type",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  exposedHeaders: ["Content-Disposition"],
  credentials: true
};

const app = express();
const server = createServer(app);
// const io = new Server(server, {cors: corsOptions});
const path = require("path");
const { SendTemplate, NavigateTowhatsapp, totalWhatsapp, GetApprovedTemplates } = require("./controllers/whatsapp/controller");

app.use(express.static("uploads"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// app.set("io", io);

const filePath = path.join(__dirname, "uploads");
app.use("/images", express.static(filePath));
app.use('/tmp/uploads', express.static(path.join(__dirname, 'tmp/uploads')));
app.use("/api/chat", chatRoutes)

app.use("/api/organization", organizationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/company", isAuthenticated, companyRoutes);
app.use("/api/people", isAuthenticated, peopleRoutes);
app.use("/api/customer", isAuthenticated, customerRoutes);
app.use("/api/lead", isAuthenticated, leadRoutes);
app.use("/api/product", isAuthenticated, productRoutes);
app.use("/api/category", isAuthenticated, categoryRoutes);
app.use("/api/expense", isAuthenticated, expenseRoutes);
app.use(
  "/api/expense-category",
  isAuthenticated,
  expenseCategoryRoutes
);
app.use("/api/offer", isAuthenticated, offerRoutes);
app.use(
  "/api/proforma-invoice",
  isAuthenticated,
  proformaInvoiceRoutes
);
app.use("/api/invoice", isAuthenticated, invoiceRoutes);
app.use("/api/payment", isAuthenticated, paymentRoutes);
app.use("/api/dashboard", isAuthenticated, dashboardRoutes);
app.use("/api/admin", isAuthenticated, adminRoutes);
app.use("/api/report", isAuthenticated, reportRoutes);
app.use("/api/website-configuration", isAuthenticated, websiteCofigurationRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/indiamart", indiamartLeadRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/notification", isAuthenticated, notificationRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sms", isAuthenticated, smsRoutes);
app.use("/api/renewal" , RenewalRecord);
app.post("/api/send-builk-Whatsapp",SendTemplate)
app.get("/NavigateTowhatsapp",NavigateTowhatsapp)
app.get("/api/totalWhatsapp",isAuthenticated, totalWhatsapp);
app.get("/api/whatsapp/templates", GetApprovedTemplates);
app.use("/api/document-center", isAuthenticated, documentCenterRoutes);
app.use("/api/data-export", isAuthenticated, dataExportRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/super-admin-auth", superAdminAuthRoutes);
app.use("/api/status", isAuthenticated, statusRoutes);
app.use("/api/company-status", isAuthenticated, companyStatusRoutes);

// Fetch Indiamart Leads
// fetchLast7Days();
// setInterval(fetchLast5Mins, 5*60*1000);

const emailToSocketId = new Map();

// io.use((socket, next)=>{
//   cookieParser()(socket.request, socket.request.res, async (err)=> await socketAuthenticator(err, socket, next));
// });

// io.on('connection', (socket)=>{
//   // console.log("A user connected", socket.id)
//   // emailToSocketId.set(socket.user.email, socket.id);
//   socketHandler(socket, io);
//   // socket.on('disconnect', () => {
//   //   console.log("User disconnected", socket.id);
//   // });
// })

app.use(errorMiddleware);

// Runs everyday at 12:00 am
cron.schedule("0 0 * * *", createNotifications)

// Connect to database first, then start server
const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log("Server is listening on Port:", PORT);
    });
    
    // Fetch Indiamart Leads after database is connected
    fetchLast7Days();
    // setInterval(fetchLast5Mins, 5*60*1000);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

exports.emailToSocketId = emailToSocketId;

