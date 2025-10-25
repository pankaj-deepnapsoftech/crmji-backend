const { TryCatch } = require("../../helpers/error");
const adminModel = require("../../models/admin");
const superAdminModel = require("../../models/superAdmin");
const organizationModel = require("../../models/organization");
const accountModel = require("../../models/account");
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Get all admins across all organizations (Super Admin only)
const getAllAdminsGlobally = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const admins = await adminModel.find()
    .select('-password')
    .populate('organization', 'name email phone address')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    admins: admins,
  });
});

// Get all admins with their subscription status (Super Admin only)
const getAllAdminsWithSubscriptionStatus = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const admins = await adminModel.find()
    .select('-password')
    .populate({
      path: 'organization',
      select: 'name email phone address',
      populate: {
        path: 'account',
        select: 'account_type account_status trial_started trial_start account_name'
      }
    })
    .sort({ createdAt: -1 });

  // Transform the data to include subscription status
  const adminsWithStatus = admins.map(admin => {
    const account = admin.organization?.account;
    let subscriptionStatus = 'None';
    let statusDetails = '';

    if (account) {
      if (account.account_type === 'trial' && account.trial_started) {
        subscriptionStatus = 'Free Trial';
        if (account.trial_start) {
          const trialStart = new Date(account.trial_start);
          const now = new Date();
          const daysDiff = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
          statusDetails = `Started ${daysDiff} days ago`;
        }
      } else if (account.account_type === 'subscription' && account.account_status === 'active') {
        subscriptionStatus = 'Active Subscription';
        statusDetails = account.account_name || 'Monthly Plan';
      } else if (account.account_type === 'fulltime' && account.account_status === 'active') {
        subscriptionStatus = 'Lifetime Plan';
        statusDetails = 'One-time payment';
      } else if (account.trial_started === false && account.account_type === 'trial') {
        subscriptionStatus = 'Trial Available';
        statusDetails = 'Not started';
      } else {
        subscriptionStatus = 'Inactive';
        statusDetails = account.account_status || 'inactive';
      }
    }

    return {
      ...admin.toObject(),
      subscriptionStatus,
      statusDetails,
      organizationName: admin.organization?.name || 'N/A',
      organizationEmail: admin.organization?.email || 'N/A'
    };
  });

  res.status(200).json({
    status: 200,
    success: true,
    admins: adminsWithStatus,
  });
});

// Get all organizations (Super Admin only)
const getAllOrganizations = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const organizations = await organizationModel.find()
    .populate('account')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    organizations: organizations,
  });
});

// Get admin details with password (Super Admin only)
const getAdminDetailsWithPassword = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const admin = await adminModel.findById(adminId)
    .populate('organization', 'name email phone address');

  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  res.status(200).json({
    status: 200,
    success: true,
    admin: admin,
  });
});

// Export all admin data to Excel (Super Admin only)
const exportAllAdminData = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const admins = await adminModel.find()
    .populate('organization', 'name email phone address')
    .sort({ createdAt: -1 });

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'CRM Super Admin';
  workbook.lastModifiedBy = req.user.name;
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create admins sheet
  const adminsSheet = workbook.addWorksheet('All Admins');
  
  // Add headers
  adminsSheet.addRow([
    'Name',
    'Email', 
    'Phone',
    'Designation',
    'Role',
    'Verified',
    'Organization Name',
    'Organization Email',
    'Organization Phone',
    'Organization Address',
    'Created At',
    'Last Updated'
  ]);

  // Add data rows
  admins.forEach(admin => {
    adminsSheet.addRow([
      admin.name,
      admin.email,
      admin.phone,
      admin.designation,
      admin.role,
      admin.verified ? 'Yes' : 'No',
      admin.organization?.name || 'N/A',
      admin.organization?.email || 'N/A',
      admin.organization?.phone || 'N/A',
      admin.organization?.address || 'N/A',
      admin.createdAt,
      admin.updatedAt
    ]);
  });

  // Style the header row
  adminsSheet.getRow(1).font = { bold: true };
  adminsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Auto-fit columns
  adminsSheet.columns.forEach(column => {
    column.width = 20;
  });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `Super_Admin_Export_${timestamp}.xlsx`;
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Write the workbook to response
  await workbook.xlsx.write(res);
  res.end();
});

// Get dashboard statistics (Super Admin only)
const getSuperAdminDashboard = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const totalAdmins = await adminModel.countDocuments();
  const totalOrganizations = await organizationModel.countDocuments();
  const verifiedAdmins = await adminModel.countDocuments({ verified: true });
  const superAdmins = await adminModel.countDocuments({ role: "Super Admin" });
  const regularAdmins = await adminModel.countDocuments({ role: "Admin" });

  // Get recent admins
  const recentAdmins = await adminModel.find()
    .select('name email role verified createdAt')
    .populate('organization', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    status: 200,
    success: true,
    dashboard: {
      totalAdmins,
      totalOrganizations,
      verifiedAdmins,
      superAdmins,
      regularAdmins,
      recentAdmins
    }
  });
});

// Delete any admin (Super Admin only)
const deleteAnyAdmin = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  
  // Prevent super admin from deleting themselves
  if (adminId === req.user._id.toString()) {
    throw new Error("Cannot delete your own account", 400);
  }

  const admin = await adminModel.findById(adminId);
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  await adminModel.deleteOne({ _id: adminId });

  res.status(200).json({
    status: 200,
    success: true,
    message: "Admin deleted successfully",
  });
});

// Update any admin (Super Admin only)
const updateAnyAdmin = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const { name, email, phone, designation, role, allowedroutes, verified } = req.body;

  const admin = await adminModel.findById(adminId);
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  // Update admin
  const updatedAdmin = await adminModel.findByIdAndUpdate(
    adminId,
    {
      name,
      email,
      phone,
      designation,
      role,
      allowedroutes,
      verified
    },
    { new: true }
  ).populate('organization', 'name email');

  res.status(200).json({
    status: 200,
    success: true,
    message: "Admin updated successfully",
    admin: updatedAdmin
  });
});

// Export comprehensive individual admin data to Excel (Super Admin only)
const exportIndividualAdminData = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  
  console.log(`Received adminId: ${adminId}`);
  
  // Find the specific admin
  const admin = await adminModel.findById(adminId)
    .populate('organization', 'name email phone address');

  if (!admin) {
    console.log(`Admin not found with ID: ${adminId}`);
    throw new Error("Admin not found", 404);
  }

  console.log(`Found admin: ${admin.name}, Role: ${admin.role}, Organization: ${admin.organization?.name}`);

  // Import required models
  const leadModel = require('../../models/lead');
  const peopleModel = require('../../models/people');
  const customerModel = require('../../models/customer');
  const invoiceModel = require('../../models/invoice');
  const paymentModel = require('../../models/payment');
  const productModel = require('../../models/product');
  const companyModel = require('../../models/company');

  // Get organization ID for filtering
  const orgId = admin.organization?._id || admin.organization;

  // First, let's check what data exists in the database
  const totalLeads = await leadModel.countDocuments();
  const totalPeople = await peopleModel.countDocuments();
  const totalCustomers = await customerModel.countDocuments();
  const totalInvoices = await invoiceModel.countDocuments();
  const totalPayments = await paymentModel.countDocuments();
  const totalProducts = await productModel.countDocuments();
  
  console.log(`Total data in database: Leads: ${totalLeads}, People: ${totalPeople}, Customers: ${totalCustomers}, Invoices: ${totalInvoices}, Payments: ${totalPayments}, Products: ${totalProducts}`);
  
  // Let's also check what organizations exist
  const organizationModel = require('../../models/organization');
  const totalOrgs = await organizationModel.countDocuments();
  console.log(`Total organizations in database: ${totalOrgs}`);
  
  // Fetch all related data with broader queries
  const [leads, people, customers, invoices, payments, products] = await Promise.all([
    // Leads created by this admin or in their organization
    leadModel.find({
      $or: [
        { creator: adminId },
        { organization: orgId }
      ]
    }).populate('products', 'name model price').populate('people', 'firstname lastname email phone').populate('company', 'name email phone address').sort({ createdAt: -1 }),
    
    // People created by this admin or in their organization
    peopleModel.find({
      $or: [
        { creator: adminId },
        { organization: orgId }
      ]
    }).sort({ createdAt: -1 }),
    
    // Customers created by this admin or in their organization
    customerModel.find({
      $or: [
        { creator: adminId },
        { organization: orgId }
      ]
    }).populate('people', 'firstname lastname email phone').populate('company', 'name email phone address').populate('products', 'name model price').sort({ createdAt: -1 }),
    
    // Invoices created by this admin or in their organization
    invoiceModel.find({
      $or: [
        { creator: adminId },
        { createdBy: adminId },
        { organization: orgId }
      ]
    }).populate('customer', 'customertype').populate('products.product', 'name model price').sort({ createdAt: -1 }),
    
    // Payments created by this admin or in their organization
    paymentModel.find({
      $or: [
        { creator: adminId },
        { createdBy: adminId },
        { organization: orgId }
      ]
    }).populate('invoice', 'invoicename total paid balance').sort({ createdAt: -1 }),
    
    // Products created by this admin or in their organization
    productModel.find({
      $or: [
        { creator: adminId },
        { organization: orgId }
      ]
    }).populate('category', 'name').sort({ createdAt: -1 })
  ]);

  // Debug logging
  console.log(`Exporting data for admin: ${admin.name} (ID: ${adminId})`);
  console.log(`Organization ID: ${orgId}`);
  console.log(`Found ${leads.length} leads`);
  console.log(`Found ${people.length} people`);
  console.log(`Found ${customers.length} customers`);
  console.log(`Found ${invoices.length} invoices`);
  console.log(`Found ${payments.length} payments`);
  console.log(`Found ${products.length} products`);
  
  // Let's also try to find any data that might be related to this admin
  const anyLeads = await leadModel.findOne().populate('creator', 'name email').populate('organization', 'name');
  const anyPeople = await peopleModel.findOne().populate('creator', 'name email').populate('organization', 'name');
  const anyCustomers = await customerModel.findOne().populate('creator', 'name email').populate('organization', 'name');
  
  console.log(`Sample lead creator: ${anyLeads?.creator?.name}, organization: ${anyLeads?.organization?.name}`);
  console.log(`Sample people creator: ${anyPeople?.creator?.name}, organization: ${anyPeople?.organization?.name}`);
  console.log(`Sample customer creator: ${anyCustomers?.creator?.name}, organization: ${anyCustomers?.organization?.name}`);

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'CRM Super Admin';
  workbook.lastModifiedBy = req.user.name;
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Admin Information Sheet
  const adminSheet = workbook.addWorksheet('Admin Information');
  adminSheet.addRow(['Field', 'Value']);
  const adminData = [
    ['Name', admin.name],
    ['Email', admin.email],
    ['Phone', admin.phone || 'N/A'],
    ['Designation', admin.designation || 'N/A'],
    ['Role', admin.role],
    ['Verified', admin.verified ? 'Yes' : 'No'],
    ['Organization Name', admin.organization?.name || 'N/A'],
    ['Organization Email', admin.organization?.email || 'N/A'],
    ['Organization Phone', admin.organization?.phone || 'N/A'],
    ['Organization Address', admin.organization?.address || 'N/A'],
    ['Created At', admin.createdAt],
    ['Last Updated', admin.updatedAt]
  ];
  adminData.forEach(row => adminSheet.addRow(row));

  // 2. Leads Sheet
  const leadsSheet = workbook.addWorksheet('Leads');
  leadsSheet.addRow([
    'Lead ID', 'Type', 'Status', 'Source', 'Lead Category', 'Products', 'Contact Person', 'Company', 
    'Notes', 'Assigned To', 'Follow Up Date', 'Follow Up Reason', 'Location', 'Created At', 'Updated At'
  ]);

  console.log(`Adding ${leads.length} leads to Excel sheet`);
  leads.forEach(lead => {
    const products = lead.products?.map(p => `${p.name} (${p.model})`).join(', ') || 'N/A';
    const contactPerson = lead.people ? `${lead.people.firstname} ${lead.people.lastname || ''}`.trim() : 'N/A';
    const company = lead.company?.name || 'N/A';
    
    leadsSheet.addRow([
      lead._id,
      lead.leadtype,
      lead.status,
      lead.source,
      lead.leadCategory || 'N/A',
      products,
      contactPerson,
      company,
      lead.notes || 'N/A',
      lead.assigned?.toString() || 'N/A',
      lead.followup_date || 'N/A',
      lead.followup_reason || 'N/A',
      lead.location || 'N/A',
      lead.createdAt,
      lead.updatedAt
    ]);
  });

  // 3. People/Contacts Sheet
  const peopleSheet = workbook.addWorksheet('People & Contacts');
  peopleSheet.addRow([
    'Contact ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Verified', 'Email Sent Date', 
    'WhatsApp Sent Date', 'Created At', 'Updated At'
  ]);

  console.log(`Adding ${people.length} people to Excel sheet`);
  people.forEach(person => {
    peopleSheet.addRow([
      person._id,
      person.firstname,
      person.lastname || '',
      person.email || 'N/A',
      person.phone || 'N/A',
      person.verify ? 'Yes' : 'No',
      person.emailSentDate || 'N/A',
      person.whatsappSentDate || 'N/A',
      person.createdAt,
      person.updatedAt
    ]);
  });

  // 4. Customers Sheet
  const customersSheet = workbook.addWorksheet('Customers');
  customersSheet.addRow([
    'Customer ID', 'Type', 'Status', 'Contact Person', 'Company', 'Products', 'Created At', 'Updated At'
  ]);

  customers.forEach(customer => {
    const contactPerson = customer.people ? `${customer.people.firstname} ${customer.people.lastname || ''}`.trim() : 'N/A';
    const company = customer.company?.name || 'N/A';
    const products = customer.products?.map(p => `${p.name} (${p.model})`).join(', ') || 'N/A';
    
    customersSheet.addRow([
      customer._id,
      customer.customertype,
      customer.status,
      contactPerson,
      company,
      products,
      customer.createdAt,
      customer.updatedAt
    ]);
  });

  // 5. Invoices Sheet
  const invoicesSheet = workbook.addWorksheet('Invoices');
  invoicesSheet.addRow([
    'Invoice ID', 'Invoice Name', 'Status', 'Payment Status', 'Customer', 'Products', 'Subtotal', 
    'Tax Amount', 'Total', 'Paid', 'Balance', 'Start Date', 'Expire Date', 'Remarks', 'Created At', 'Updated At'
  ]);

  invoices.forEach(invoice => {
    const products = invoice.products?.map(p => `${p.product?.name || 'N/A'} (Qty: ${p.quantity}, Price: ${p.price})`).join('; ') || 'N/A';
    const taxAmount = invoice.tax?.reduce((sum, tax) => sum + (tax.taxamount || 0), 0) || 0;
    
    invoicesSheet.addRow([
      invoice._id,
      invoice.invoicename,
      invoice.status,
      invoice.paymentstatus,
      invoice.customer?.customertype || 'N/A',
      products,
      invoice.subtotal,
      taxAmount,
      invoice.total,
      invoice.paid,
      invoice.balance,
      invoice.startdate,
      invoice.expiredate,
      invoice.remarks || 'N/A',
      invoice.createdAt,
      invoice.updatedAt
    ]);
  });

  // 6. Payments Sheet
  const paymentsSheet = workbook.addWorksheet('Payments');
  paymentsSheet.addRow([
    'Payment ID', 'Payment Name', 'Invoice', 'Amount', 'Mode', 'Reference', 'Description', 'Created At', 'Updated At'
  ]);

  payments.forEach(payment => {
    paymentsSheet.addRow([
      payment._id,
      payment.paymentname,
      payment.invoice?.invoicename || 'N/A',
      payment.amount,
      payment.mode || 'N/A',
      payment.reference || 'N/A',
      payment.description || 'N/A',
      payment.createdAt,
      payment.updatedAt
    ]);
  });

  // 7. Products Sheet
  const productsSheet = workbook.addWorksheet('Products');
  productsSheet.addRow([
    'Product ID', 'Name', 'Model', 'Category', 'Price', 'Description', 'Reference', 'Stock', 'Created At', 'Updated At'
  ]);

  products.forEach(product => {
    productsSheet.addRow([
      product._id,
      product.name,
      product.model,
      product.category?.name || 'N/A',
      product.price,
      product.description || 'N/A',
      product.ref || 'N/A',
      product.stock,
      product.createdAt,
      product.updatedAt
    ]);
  });

  // Style all sheets
  [adminSheet, leadsSheet, peopleSheet, customersSheet, invoicesSheet, paymentsSheet, productsSheet].forEach(sheet => {
    // Style header row
    if (sheet.rowCount > 0) {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Auto-fit columns
      sheet.columns.forEach(column => {
        column.width = 15;
      });
    }
  });

  // Generate filename with admin name and timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeName = admin.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Admin_Comprehensive_Data_${safeName}_${timestamp}.xlsx`;
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Write the workbook to response
  await workbook.xlsx.write(res);
  res.end();
});

// Export all Super Admin role users comprehensive data (Super Admin only)
const exportAllSuperAdminRoleData = TryCatch(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  // Import required models
  const leadModel = require('../../models/lead');
  const peopleModel = require('../../models/people');
  const customerModel = require('../../models/customer');
  const invoiceModel = require('../../models/invoice');
  const paymentModel = require('../../models/payment');
  const productModel = require('../../models/product');
  const companyModel = require('../../models/company');

  // Find all admins with Super Admin role
  const superAdmins = await adminModel.find({ role: "Super Admin" })
    .populate('organization', 'name email phone address')
    .sort({ createdAt: -1 });

  if (!superAdmins || superAdmins.length === 0) {
    throw new Error("No Super Admin role users found", 404);
  }

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'CRM Super Admin';
  workbook.lastModifiedBy = req.user.name;
  workbook.created = new Date();
  workbook.modified = new Date();

  // For each Super Admin, create their comprehensive data
  for (let i = 0; i < superAdmins.length; i++) {
    const admin = superAdmins[i];
    const orgId = admin.organization?._id || admin.organization;

    // Fetch all related data for this Super Admin
    const [leads, people, customers, invoices, payments, products] = await Promise.all([
      // Leads created by this admin or in their organization
      leadModel.find({
        $or: [
          { creator: admin._id },
          { organization: orgId }
        ]
      }).populate('products', 'name model price').populate('people', 'firstname lastname email phone').populate('company', 'name email phone address').sort({ createdAt: -1 }),
      
      // People created by this admin or in their organization
      peopleModel.find({
        $or: [
          { creator: admin._id },
          { organization: orgId }
        ]
      }).sort({ createdAt: -1 }),
      
      // Customers created by this admin or in their organization
      customerModel.find({
        $or: [
          { creator: admin._id },
          { organization: orgId }
        ]
      }).populate('people', 'firstname lastname email phone').populate('company', 'name email phone address').populate('products', 'name model price').sort({ createdAt: -1 }),
      
      // Invoices created by this admin or in their organization
      invoiceModel.find({
        $or: [
          { creator: admin._id },
          { createdBy: admin._id },
          { organization: orgId }
        ]
      }).populate('customer', 'customertype').populate('products.product', 'name model price').sort({ createdAt: -1 }),
      
      // Payments created by this admin or in their organization
      paymentModel.find({
        $or: [
          { creator: admin._id },
          { createdBy: admin._id },
          { organization: orgId }
        ]
      }).populate('invoice', 'invoicename total paid balance').sort({ createdAt: -1 }),
      
      // Products created by this admin or in their organization
      productModel.find({
        $or: [
          { creator: admin._id },
          { organization: orgId }
        ]
      }).populate('category', 'name').sort({ createdAt: -1 })
    ]);

    // Create worksheet name (limit to 31 characters for Excel compatibility)
    const safeName = admin.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
    const sheetName = `${safeName}_Data`;

    // 1. Admin Information Sheet for this Super Admin
    const adminSheet = workbook.addWorksheet(`${sheetName}_Admin`);
    adminSheet.addRow(['Field', 'Value']);
    const adminData = [
      ['Name', admin.name],
      ['Email', admin.email],
      ['Phone', admin.phone || 'N/A'],
      ['Designation', admin.designation || 'N/A'],
      ['Role', admin.role],
      ['Verified', admin.verified ? 'Yes' : 'No'],
      ['Organization Name', admin.organization?.name || 'N/A'],
      ['Organization Email', admin.organization?.email || 'N/A'],
      ['Organization Phone', admin.organization?.phone || 'N/A'],
      ['Organization Address', admin.organization?.address || 'N/A'],
      ['Created At', admin.createdAt],
      ['Last Updated', admin.updatedAt]
    ];
    adminData.forEach(row => adminSheet.addRow(row));

    // 2. Leads Sheet for this Super Admin
    const leadsSheet = workbook.addWorksheet(`${sheetName}_Leads`);
    leadsSheet.addRow([
      'Lead ID', 'Type', 'Status', 'Source', 'Lead Category', 'Products', 'Contact Person', 'Company', 
      'Notes', 'Assigned To', 'Follow Up Date', 'Follow Up Reason', 'Location', 'Created At', 'Updated At'
    ]);

    leads.forEach(lead => {
      const products = lead.products?.map(p => `${p.name} (${p.model})`).join(', ') || 'N/A';
      const contactPerson = lead.people ? `${lead.people.firstname} ${lead.people.lastname || ''}`.trim() : 'N/A';
      const company = lead.company?.name || 'N/A';
      
      leadsSheet.addRow([
        lead._id,
        lead.leadtype,
        lead.status,
        lead.source,
        lead.leadCategory || 'N/A',
        products,
        contactPerson,
        company,
        lead.notes || 'N/A',
        lead.assigned?.toString() || 'N/A',
        lead.followup_date || 'N/A',
        lead.followup_reason || 'N/A',
        lead.location || 'N/A',
        lead.createdAt,
        lead.updatedAt
      ]);
    });

    // 3. People/Contacts Sheet for this Super Admin
    const peopleSheet = workbook.addWorksheet(`${sheetName}_Contacts`);
    peopleSheet.addRow([
      'Contact ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Verified', 'Email Sent Date', 
      'WhatsApp Sent Date', 'Created At', 'Updated At'
    ]);

    people.forEach(person => {
      peopleSheet.addRow([
        person._id,
        person.firstname,
        person.lastname || '',
        person.email || 'N/A',
        person.phone || 'N/A',
        person.verify ? 'Yes' : 'No',
        person.emailSentDate || 'N/A',
        person.whatsappSentDate || 'N/A',
        person.createdAt,
        person.updatedAt
      ]);
    });

    // 4. Customers Sheet for this Super Admin
    const customersSheet = workbook.addWorksheet(`${sheetName}_Customers`);
    customersSheet.addRow([
      'Customer ID', 'Type', 'Status', 'Contact Person', 'Company', 'Products', 'Created At', 'Updated At'
    ]);

    customers.forEach(customer => {
      const contactPerson = customer.people ? `${customer.people.firstname} ${customer.people.lastname || ''}`.trim() : 'N/A';
      const company = customer.company?.name || 'N/A';
      const products = customer.products?.map(p => `${p.name} (${p.model})`).join(', ') || 'N/A';
      
      customersSheet.addRow([
        customer._id,
        customer.customertype,
        customer.status,
        contactPerson,
        company,
        products,
        customer.createdAt,
        customer.updatedAt
      ]);
    });

    // 5. Invoices Sheet for this Super Admin
    const invoicesSheet = workbook.addWorksheet(`${sheetName}_Invoices`);
    invoicesSheet.addRow([
      'Invoice ID', 'Invoice Name', 'Status', 'Payment Status', 'Customer', 'Products', 'Subtotal', 
      'Tax Amount', 'Total', 'Paid', 'Balance', 'Start Date', 'Expire Date', 'Remarks', 'Created At', 'Updated At'
    ]);

    invoices.forEach(invoice => {
      const products = invoice.products?.map(p => `${p.product?.name || 'N/A'} (Qty: ${p.quantity}, Price: ${p.price})`).join('; ') || 'N/A';
      const taxAmount = invoice.tax?.reduce((sum, tax) => sum + (tax.taxamount || 0), 0) || 0;
      
      invoicesSheet.addRow([
        invoice._id,
        invoice.invoicename,
        invoice.status,
        invoice.paymentstatus,
        invoice.customer?.customertype || 'N/A',
        products,
        invoice.subtotal,
        taxAmount,
        invoice.total,
        invoice.paid,
        invoice.balance,
        invoice.startdate,
        invoice.expiredate,
        invoice.remarks || 'N/A',
        invoice.createdAt,
        invoice.updatedAt
      ]);
    });

    // 6. Payments Sheet for this Super Admin
    const paymentsSheet = workbook.addWorksheet(`${sheetName}_Payments`);
    paymentsSheet.addRow([
      'Payment ID', 'Payment Name', 'Invoice', 'Amount', 'Mode', 'Reference', 'Description', 'Created At', 'Updated At'
    ]);

    payments.forEach(payment => {
      paymentsSheet.addRow([
        payment._id,
        payment.paymentname,
        payment.invoice?.invoicename || 'N/A',
        payment.amount,
        payment.mode || 'N/A',
        payment.reference || 'N/A',
        payment.description || 'N/A',
        payment.createdAt,
        payment.updatedAt
      ]);
    });

    // 7. Products Sheet for this Super Admin
    const productsSheet = workbook.addWorksheet(`${sheetName}_Products`);
    productsSheet.addRow([
      'Product ID', 'Name', 'Model', 'Category', 'Price', 'Description', 'Reference', 'Stock', 'Created At', 'Updated At'
    ]);

    products.forEach(product => {
      productsSheet.addRow([
        product._id,
        product.name,
        product.model,
        product.category?.name || 'N/A',
        product.price,
        product.description || 'N/A',
        product.ref || 'N/A',
        product.stock,
        product.createdAt,
        product.updatedAt
      ]);
    });

    // Style all sheets for this Super Admin
    [adminSheet, leadsSheet, peopleSheet, customersSheet, invoicesSheet, paymentsSheet, productsSheet].forEach(sheet => {
      if (sheet.rowCount > 0) {
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        sheet.columns.forEach(column => {
          column.width = 15;
        });
      }
    });
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `All_Super_Admin_Role_Users_Data_${timestamp}.xlsx`;
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Write the workbook to response
  await workbook.xlsx.write(res);
  res.end();
});

// Get leads by admin ID (Super Admin only)
const getLeadsByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const leadModel = require('../../models/lead');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const leads = await leadModel.find({
    $or: [
      { creator: adminId },
      { organization: orgId }
    ]
  }).populate('products', 'name model price')
    .populate('people', 'firstname lastname email phone')
    .populate('company', 'companyname email phone')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    leads: leads
  });
});

// Get people by admin ID (Super Admin only)
const getPeopleByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const peopleModel = require('../../models/people');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const people = await peopleModel.find({
    $or: [
      { creator: adminId },
      { organization: orgId }
    ]
  }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    people: people
  });
});

// Get customers by admin ID (Super Admin only)
const getCustomersByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const customerModel = require('../../models/customer');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const customers = await customerModel.find({
    $or: [
      { creator: adminId },
      { organization: orgId }
    ]
  }).populate('people', 'firstname lastname email phone')
    .populate('company', 'companyname email phone')
    .populate('products', 'name model price')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    customers: customers
  });
});

// Get employees by admin ID (Super Admin only)
const getEmployeesByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  // Get all employees (role: "Admin") from the same organization
  const employees = await adminModel.find({
    organization: orgId,
    role: "Admin",
    _id: { $ne: adminId } // Exclude the admin itself
  }).select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    employees: employees
  });
});

// Get invoices by admin ID (Super Admin only)
const getInvoicesByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const invoiceModel = require('../../models/invoice');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const invoices = await invoiceModel.find({
    $or: [
      { creator: adminId },
      { createdBy: adminId },
      { organization: orgId }
    ]
  }).populate('customer', 'customertype')
    .populate('products.product', 'name model price')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    invoices: invoices
  });
});

// Get payments by admin ID (Super Admin only)
const getPaymentsByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const paymentModel = require('../../models/payment');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const payments = await paymentModel.find({
    $or: [
      { creator: adminId },
      { createdBy: adminId },
      { organization: orgId }
    ]
  }).populate('invoice', 'invoicename total paid balance')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    payments: payments
  });
});

// Get products by admin ID (Super Admin only)
const getProductsByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const productModel = require('../../models/product');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const products = await productModel.find({
    $or: [
      { creator: adminId },
      { organization: orgId }
    ]
  }).populate('category', 'categoryname')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 200,
    success: true,
    products: products
  });
});

// Export leads by admin ID to Excel
const exportLeadsByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const leadModel = require('../../models/lead');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const leads = await leadModel.find({
    $or: [
      { creator: adminId },
      { organization: orgId }
    ]
  }).populate('products', 'name model price')
    .populate('people', 'firstname lastname email phone')
    .populate('company', 'companyname email phone')
    .sort({ createdAt: -1 });

  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Leads');

  // Add headers
  worksheet.columns = [
    { header: 'Lead ID', key: 'id', width: 15 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Source', key: 'source', width: 15 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Contact Person', key: 'contact', width: 25 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Follow Up Date', key: 'followup', width: 15 },
    { header: 'Created Date', key: 'created', width: 15 }
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add data
  leads.forEach(lead => {
    worksheet.addRow({
      id: lead._id.toString().substring(0, 8) + '...',
      type: lead.leadtype || 'N/A',
      status: lead.status || 'N/A',
      source: lead.source || 'N/A',
      category: lead.leadCategory || 'N/A',
      contact: lead.people ? `${lead.people.firstname} ${lead.people.lastname || ''}`.trim() : 'N/A',
      company: lead.company?.companyname || 'N/A',
      followup: lead.followup_date ? new Date(lead.followup_date).toLocaleDateString() : 'N/A',
      created: new Date(lead.createdAt).toLocaleDateString()
    });
  });

  const filename = `leads_${admin.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// Export people by admin ID to Excel
const exportPeopleByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const peopleModel = require('../../models/people');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const people = await peopleModel.find({
    $or: [
      { creator: adminId },
      { organization: orgId }
    ]
  }).sort({ createdAt: -1 });

  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('People & Contacts');

  // Add headers
  worksheet.columns = [
    { header: 'Contact ID', key: 'id', width: 15 },
    { header: 'First Name', key: 'firstname', width: 20 },
    { header: 'Last Name', key: 'lastname', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Verified', key: 'verified', width: 10 },
    { header: 'Email Sent', key: 'emailSent', width: 15 },
    { header: 'WhatsApp Sent', key: 'whatsappSent', width: 15 },
    { header: 'Created Date', key: 'created', width: 15 }
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add data
  people.forEach(person => {
    worksheet.addRow({
      id: person._id.toString().substring(0, 8) + '...',
      firstname: person.firstname || 'N/A',
      lastname: person.lastname || 'N/A',
      email: person.email || 'N/A',
      phone: person.phone || 'N/A',
      verified: person.verify ? 'Yes' : 'No',
      emailSent: person.emailSentDate ? new Date(person.emailSentDate).toLocaleDateString() : 'N/A',
      whatsappSent: person.whatsappSentDate ? new Date(person.whatsappSentDate).toLocaleDateString() : 'N/A',
      created: new Date(person.createdAt).toLocaleDateString()
    });
  });

  const filename = `people_${admin.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// Export customers by admin ID to Excel
const exportCustomersByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const customerModel = require('../../models/customer');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const customers = await customerModel.find({
    $or: [
      { creator: adminId },
      { organization: orgId }
    ]
  }).populate('people', 'firstname lastname email phone')
    .populate('company', 'companyname email phone')
    .populate('products', 'name model price')
    .sort({ createdAt: -1 });

  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Customers');

  // Add headers
  worksheet.columns = [
    { header: 'Customer ID', key: 'id', width: 15 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Contact Person', key: 'contact', width: 25 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Products', key: 'products', width: 30 },
    { header: 'Created Date', key: 'created', width: 15 }
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add data
  customers.forEach(customer => {
    worksheet.addRow({
      id: customer._id.toString().substring(0, 8) + '...',
      type: customer.customertype || 'N/A',
      status: customer.status || 'N/A',
      contact: customer.people ? `${customer.people.firstname} ${customer.people.lastname || ''}`.trim() : 'N/A',
      company: customer.company?.companyname || 'N/A',
      products: customer.products?.map(p => p.name).join(', ') || 'N/A',
      created: new Date(customer.createdAt).toLocaleDateString()
    });
  });

  const filename = `customers_${admin.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// Export invoices by admin ID to Excel
const exportInvoicesByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const invoiceModel = require('../../models/invoice');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const invoices = await invoiceModel.find({
    $or: [
      { creator: adminId },
      { createdBy: adminId },
      { organization: orgId }
    ]
  }).populate('customer', 'customertype')
    .populate('products.product', 'name model price')
    .sort({ createdAt: -1 });

  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoices');

  // Add headers
  worksheet.columns = [
    { header: 'Invoice ID', key: 'id', width: 15 },
    { header: 'Invoice Name', key: 'name', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
    { header: 'Customer', key: 'customer', width: 20 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Paid', key: 'paid', width: 15 },
    { header: 'Balance', key: 'balance', width: 15 },
    { header: 'Expire Date', key: 'expire', width: 15 },
    { header: 'Created Date', key: 'created', width: 15 }
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add data
  invoices.forEach(invoice => {
    worksheet.addRow({
      id: invoice._id.toString().substring(0, 8) + '...',
      name: invoice.invoicename || 'N/A',
      status: invoice.status || 'N/A',
      paymentStatus: invoice.paymentstatus || 'N/A',
      customer: invoice.customer?.customertype || 'N/A',
      subtotal: `₹${invoice.subtotal?.toLocaleString() || '0'}`,
      total: `₹${invoice.total?.toLocaleString() || '0'}`,
      paid: `₹${invoice.paid?.toLocaleString() || '0'}`,
      balance: `₹${invoice.balance?.toLocaleString() || '0'}`,
      expire: new Date(invoice.expiredate).toLocaleDateString(),
      created: new Date(invoice.createdAt).toLocaleDateString()
    });
  });

  const filename = `invoices_${admin.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// Export payments by admin ID to Excel
const exportPaymentsByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const paymentModel = require('../../models/payment');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const payments = await paymentModel.find({
    $or: [
      { creator: adminId },
      { createdBy: adminId },
      { organization: orgId }
    ]
  }).populate('invoice', 'invoicename total paid balance')
    .sort({ createdAt: -1 });

  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payments');

  // Add headers
  worksheet.columns = [
    { header: 'Payment ID', key: 'id', width: 15 },
    { header: 'Payment Name', key: 'name', width: 25 },
    { header: 'Invoice', key: 'invoice', width: 25 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Mode', key: 'mode', width: 15 },
    { header: 'Reference', key: 'reference', width: 20 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Created Date', key: 'created', width: 15 }
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add data
  payments.forEach(payment => {
    worksheet.addRow({
      id: payment._id.toString().substring(0, 8) + '...',
      name: payment.paymentname || 'N/A',
      invoice: payment.invoice?.invoicename || 'N/A',
      amount: `₹${payment.amount?.toLocaleString() || '0'}`,
      mode: payment.mode || 'N/A',
      reference: payment.reference || 'N/A',
      description: payment.description || 'N/A',
      created: new Date(payment.createdAt).toLocaleDateString()
    });
  });

  const filename = `payments_${admin.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// Export products by admin ID to Excel
const exportProductsByAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "Super Admin") {
    throw new Error("Access denied. Super Admin privileges required.", 403);
  }

  const { adminId } = req.params;
  const productModel = require('../../models/product');
  const admin = await adminModel.findById(adminId).populate('organization');
  
  if (!admin) {
    throw new Error("Admin not found", 404);
  }

  const orgId = admin.organization?._id || admin.organization;
  
  const products = await productModel.find({
    $or: [
      { creator: adminId },
      { organization: orgId }
    ]
  }).populate('category', 'categoryname')
    .sort({ createdAt: -1 });

  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  // Add headers
  worksheet.columns = [
    { header: 'Product ID', key: 'id', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Model', key: 'model', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Reference', key: 'reference', width: 20 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Created Date', key: 'created', width: 15 }
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add data
  products.forEach(product => {
    worksheet.addRow({
      id: product._id.toString().substring(0, 8) + '...',
      name: product.name || 'N/A',
      model: product.model || 'N/A',
      category: product.category?.categoryname || 'N/A',
      price: `₹${product.price || '0'}`,
      description: product.description || 'N/A',
      reference: product.ref || 'N/A',
      stock: product.stock || 0,
      created: new Date(product.createdAt).toLocaleDateString()
    });
  });

  const filename = `products_${admin.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  getAllAdminsGlobally,
  getAllAdminsWithSubscriptionStatus,
  getAllOrganizations,
  getAdminDetailsWithPassword,
  exportAllAdminData,
  getSuperAdminDashboard,
  deleteAnyAdmin,
  updateAnyAdmin,
  exportIndividualAdminData,
  exportAllSuperAdminRoleData,
  getLeadsByAdmin,
  getPeopleByAdmin,
  getCustomersByAdmin,
  getEmployeesByAdmin,
  getInvoicesByAdmin,
  getPaymentsByAdmin,
  getProductsByAdmin,
  exportLeadsByAdmin,
  exportPeopleByAdmin,
  exportCustomersByAdmin,
  exportInvoicesByAdmin,
  exportPaymentsByAdmin,
  exportProductsByAdmin
};
