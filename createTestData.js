const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const adminModel = require('./models/admin');
const organizationModel = require('./models/organization');
const leadModel = require('./models/lead');
const peopleModel = require('./models/people');
const customerModel = require('./models/customer');
const invoiceModel = require('./models/invoice');
const paymentModel = require('./models/payment');
const productModel = require('./models/product');
const productCategoryModel = require('./models/productCategory');
const companyModel = require('./models/company');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestData = async () => {
  try {
    console.log('Creating test data...');

    // Find existing admins
    const admins = await adminModel.find().populate('organization');
    
    if (admins.length === 0) {
      console.log('No admins found. Please create some admins first.');
      return;
    }

    console.log(`Found ${admins.length} admins`);

    for (const admin of admins) {
      console.log(`Creating test data for admin: ${admin.name} (${admin.role})`);
      
      const orgId = admin.organization?._id || admin.organization;
      
      // Create a product category first
      let category = await productCategoryModel.findOne({ categoryname: 'Test Category' });
      if (!category) {
        category = new productCategoryModel({
          categoryname: 'Test Category',
          description: 'Test category for Meeting data',
          organization: orgId,
          creator: admin._id
        });
        await category.save();
      }

      // Create test products
      const products = [];
      for (let i = 1; i <= 3; i++) {
        const product = new productModel({
          name: `Test Product ${i} - ${admin.name}`,
          model: `Model-${i}`,
          category: category._id,
          price: `${1000 + i * 100}`,
          description: `Test product ${i} for ${admin.name}`,
          ref: `REF-${i}`,
          stock: 50 + i * 10,
          organization: orgId,
          creator: admin._id
        });
        await product.save();
        products.push(product);
      }

      // Create test companies
      const companies = [];
      for (let i = 1; i <= 2; i++) {
        const company = new companyModel({
          companyname: `Test Company ${i} - ${admin.name}`,
          email: `company${i}@${admin.name.toLowerCase()}.com`,
          phone: `987654321${i}`,
          contact: `Contact Person ${i}`,
          website: `www.company${i}.com`,
          gst_no: `GST${i}123456789`,
          organization: orgId,
          creator: admin._id
        });
        await company.save();
        companies.push(company);
      }

      // Create test people/contacts
      const people = [];
      for (let i = 1; i <= 3; i++) {
        const person = new peopleModel({
          firstname: `Test`,
          lastname: `Person${i}`,
          email: `person${i}@${admin.name.toLowerCase()}.com`,
          phone: `987654321${i}`,
          verify: i % 2 === 0,
          organization: orgId,
          creator: admin._id
        });
        await person.save();
        people.push(person);
      }

      // Create test leads
      for (let i = 1; i <= 5; i++) {
        const lead = new leadModel({
          leadtype: i % 2 === 0 ? 'Company' : 'People',
          status: ['Draft', 'New', 'In Negotiation', 'Completed', 'Follow Up'][i % 5],
          source: ['Linkedin', 'Website', 'Social Media', 'Friend', 'Customer Referral'][i % 5],
          leadCategory: ['Hot', 'Cold', 'Warm'][i % 3],
          products: [products[i % products.length]._id],
          people: i % 2 === 0 ? people[i % people.length]._id : null,
          company: i % 2 === 1 ? companies[i % companies.length]._id : null,
          notes: `Test lead ${i} for ${admin.name}`,
          assigned: admin._id,
          followup_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          followup_reason: `Follow up reason ${i}`,
          location: `Location ${i}`,
          organization: orgId,
          creator: admin._id
        });
        await lead.save();
      }

      // Create test customers
      for (let i = 1; i <= 3; i++) {
        const customer = new customerModel({
          customertype: i % 2 === 0 ? 'Company' : 'People',
          status: ['Deal Done', 'Proforma Invoice Sent', 'Invoice Sent', 'Payment Received'][i % 4],
          people: i % 2 === 0 ? null : people[i % people.length]._id,
          company: i % 2 === 1 ? null : companies[i % companies.length]._id,
          products: [products[i % products.length]._id],
          organization: orgId,
          creator: admin._id
        });
        await customer.save();

        // Create test invoices for customers
        const invoice = new invoiceModel({
          invoicename: `Invoice ${i} - ${admin.name}`,
          customer: customer._id,
          status: ['Draft', 'Pending', 'Sent'][i % 3],
          paymentstatus: ['Unpaid', 'Partially Paid', 'Paid'][i % 3],
          startdate: new Date(),
          expiredate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          remarks: `Test invoice ${i} for ${admin.name}`,
          products: [{
            product: products[i % products.length]._id,
            quantity: i + 1,
            price: 1000 + i * 100,
            total: (1000 + i * 100) * (i + 1)
          }],
          subtotal: (1000 + i * 100) * (i + 1),
          tax: [{
            taxpercentage: 18,
            taxamount: ((1000 + i * 100) * (i + 1)) * 0.18,
            taxname: 'GST 18%'
          }],
          total: ((1000 + i * 100) * (i + 1)) * 1.18,
          paid: i % 2 === 0 ? ((1000 + i * 100) * (i + 1)) * 1.18 : 0,
          balance: i % 2 === 0 ? 0 : ((1000 + i * 100) * (i + 1)) * 1.18,
          organization: orgId,
          creator: admin._id,
          createdBy: admin._id
        });
        await invoice.save();

        // Create test payments for invoices
        if (i % 2 === 0) {
          const payment = new paymentModel({
            paymentname: `Payment ${i} - ${admin.name}`,
            invoice: invoice._id,
            amount: invoice.total,
            mode: ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque'][i % 5],
            reference: `REF-${i}`,
            description: `Test payment ${i} for ${admin.name}`,
            organization: orgId,
            creator: admin._id,
            createdBy: admin._id
          });
          await payment.save();
        }
      }

      console.log(`✅ Created test data for ${admin.name}`);
    }

    console.log('🎉 Test data creation completed successfully!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
};

const main = async () => {
  await connectDB();
  await createTestData();
  process.exit(0);
};

main();
