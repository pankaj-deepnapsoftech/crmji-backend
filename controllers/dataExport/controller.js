/**
 * DATA EXPORT CONTROLLER
 * 
 * API ENDPOINTS:
 * 
 * 1. GET /api/data-export/export-all
 *    - Description: Export complete CRM data (all modules)
 *    - Response: Excel file with 16 worksheets
 *    - Authentication: Required (Bearer token)
 * 
 * 2. GET /api/data-export/export/:dataType
 *    - Description: Export specific module data
 *    - Parameters: dataType (admins, leads, customers, invoices, people, companies, products, payments)
 *    - Response: Excel file with specific module data
 *    - Authentication: Required (Bearer token)
 * 
 * Available Data Types:
 * - admins: Admin users data
 * - leads: Leads data
 * - customers: Customers data (Individuals & Companies)
 * - invoices: Invoices data
 * - people: Individual contacts data
 * - companies: Company information data
 * - products: Products and categories data
 * - payments: Payment transactions data
 * 
 * Example Usage:
 * GET /api/data-export/export-all
 * GET /api/data-export/export/customers
 * GET /api/data-export/export/invoices
 * 
 * Response Format:
 * - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 * - Filename: CRM_Data_Export_YYYY-MM-DDTHH-MM-SS.xlsx
 */

const { TryCatch } = require("../../helpers/error");
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Import all models
const adminModel = require("../../models/admin");
const peopleModel = require("../../models/people");
const companyModel = require("../../models/company");
const leadModel = require("../../models/lead");
const productModel = require("../../models/product");
const productCategoryModel = require("../../models/productCategory");
const expenseModel = require("../../models/expense");
const expenseCategoryModel = require("../../models/expenseCategory");
const offerModel = require("../../models/offer");
const proformaInvoiceModel = require("../../models/proformaInvoice");
const invoiceModel = require("../../models/invoice");
const paymentModel = require("../../models/payment");
const customerModel = require("../../models/customer");
const supportModel = require("../../models/support");
const documentModel = require("../../models/document");
const excelModel = require("../../models/excel");
const whatsappLogModel = require("../../models/whatsapp");
const smsModel = require("../../models/sms");
const notificationModel = require("../../models/notification");
const chatModel = require("../../models/chat");
const settingModel = require("../../models/setting");

const exportAllData = TryCatch(async (req, res) => {
  const organizationId = req.user.organization;
  
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'CRM System';
  workbook.lastModifiedBy = req.user.name;
  workbook.created = new Date();
  workbook.modified = new Date();

  try {
    // 1. Export Admins
    const admins = await adminModel.find({ organization: organizationId })
      .select('-password')
      .populate('organization', 'name email');
    
    const adminsSheet = workbook.addWorksheet('Admins');
    adminsSheet.addRow(['Name', 'Email', 'Phone', 'Designation', 'Role', 'Verified', 'Created At']);
    
    admins.forEach(admin => {
      adminsSheet.addRow([
        admin.name,
        admin.email,
        admin.phone,
        admin.designation,
        admin.role,
        admin.verified ? 'Yes' : 'No',
        admin.createdAt
      ]);
    });

    // 2. Export People
    const people = await peopleModel.find({ organization: organizationId });
    const peopleSheet = workbook.addWorksheet('People');
    peopleSheet.addRow(['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Designation', 'Created At']);
    
    people.forEach(person => {
      peopleSheet.addRow([
        person.firstname,
        person.lastname,
        person.email,
        person.phone,
        person.company,
        person.designation,
        person.createdAt
      ]);
    });

    // 3. Export Companies
    const companies = await companyModel.find({ organization: organizationId });
    const companiesSheet = workbook.addWorksheet('Companies');
    companiesSheet.addRow(['Company Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Country', 'Created At']);
    
    companies.forEach(company => {
      companiesSheet.addRow([
        company.companyname,
        company.email,
        company.phone,
        company.address,
        company.city,
        company.state,
        company.country,
        company.createdAt
      ]);
    });

    // 4. Export Leads
    const leads = await leadModel.find({ organization: organizationId })
      .populate('people', 'firstname lastname email phone')
      .populate('company', 'companyname email phone');
    
    const leadsSheet = workbook.addWorksheet('Leads');
    leadsSheet.addRow(['Lead Name', 'Contact Type', 'Contact Name', 'Contact Email', 'Contact Phone', 'Source', 'Status', 'Value', 'Created At']);
    
    leads.forEach(lead => {
      const contactName = lead.people ? 
        `${lead.people.firstname} ${lead.people.lastname}` : 
        lead.company ? lead.company.companyname : 'N/A';
      const contactEmail = lead.people ? lead.people.email : (lead.company ? lead.company.email : 'N/A');
      const contactPhone = lead.people ? lead.people.phone : (lead.company ? lead.company.phone : 'N/A');
      
      leadsSheet.addRow([
        lead.leadname,
        lead.people ? 'Individual' : 'Company',
        contactName,
        contactEmail,
        contactPhone,
        lead.source,
        lead.status,
        lead.value,
        lead.createdAt
      ]);
    });

    // 5. Export Products
    const products = await productModel.find({ organization: organizationId })
      .populate('category', 'categoryname');
    
    const productsSheet = workbook.addWorksheet('Products');
    productsSheet.addRow(['Product Name', 'Category', 'Description', 'Price', 'Stock', 'Created At']);
    
    products.forEach(product => {
      productsSheet.addRow([
        product.productname,
        product.category ? product.category.categoryname : 'N/A',
        product.description,
        product.price,
        product.stock,
        product.createdAt
      ]);
    });

    // 6. Export Categories
    const categories = await productCategoryModel.find({ organization: organizationId });
    const categoriesSheet = workbook.addWorksheet('Categories');
    categoriesSheet.addRow(['Category Name', 'Description', 'Created At']);
    
    categories.forEach(category => {
      categoriesSheet.addRow([
        category.categoryname,
        category.description,
        category.createdAt
      ]);
    });

    // 7. Export Expenses
    const expenses = await expenseModel.find({ organization: organizationId })
      .populate('category', 'categoryname')
      .populate('createdBy', 'name');
    
    const expensesSheet = workbook.addWorksheet('Expenses');
    expensesSheet.addRow(['Expense Name', 'Category', 'Amount', 'Description', 'Created By', 'Created At']);
    
    expenses.forEach(expense => {
      expensesSheet.addRow([
        expense.expensename,
        expense.category ? expense.category.categoryname : 'N/A',
        expense.amount,
        expense.description,
        expense.createdBy ? expense.createdBy.name : 'N/A',
        expense.createdAt
      ]);
    });

    // 8. Export Invoices
    const invoices = await invoiceModel.find({ organization: organizationId })
      .populate('customer', 'people company')
      .populate('customer.people', 'firstname lastname email phone')
      .populate('customer.company', 'companyname email phone')
      .populate('createdBy', 'name');
    
    const invoicesSheet = workbook.addWorksheet('Invoices');
    invoicesSheet.addRow(['Invoice Name', 'Customer Type', 'Customer Name', 'Customer Email', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance', 'Status', 'Created By', 'Created At']);
    
    invoices.forEach(invoice => {
      const customerType = invoice.customer ? (invoice.customer.people ? 'Individual' : 'Company') : 'N/A';
      const customerName = invoice.customer ? 
        (invoice.customer.people ? 
          `${invoice.customer.people.firstname} ${invoice.customer.people.lastname}` : 
          invoice.customer.company ? invoice.customer.company.companyname : 'N/A') : 'N/A';
      const customerEmail = invoice.customer ? 
        (invoice.customer.people ? 
          invoice.customer.people.email : 
          invoice.customer.company ? invoice.customer.company.email : 'N/A') : 'N/A';
      
      invoicesSheet.addRow([
        invoice.invoicename,
        customerType,
        customerName,
        customerEmail,
        invoice.subtotal,
        invoice.tax[0]?.taxamount || 0,
        invoice.total,
        invoice.paid,
        invoice.balance,
        invoice.paymentstatus,
        invoice.createdBy ? invoice.createdBy.name : 'N/A',
        invoice.createdAt
      ]);
    });

    // 9. Export Payments
    const payments = await paymentModel.find({ organization: organizationId })
      .populate('invoice', 'invoicename')
      .populate('creator', 'name');
    
    const paymentsSheet = workbook.addWorksheet('Payments');
    paymentsSheet.addRow(['Payment Name', 'Invoice', 'Amount', 'Mode', 'Reference', 'Description', 'Created By', 'Created At']);
    
    payments.forEach(payment => {
      paymentsSheet.addRow([
        payment.paymentname,
        payment.invoice ? payment.invoice.invoicename : 'N/A',
        payment.amount,
        payment.mode,
        payment.reference,
        payment.description,
        payment.creator ? payment.creator.name : 'N/A',
        payment.createdAt
      ]);
    });

    // 10. Export Customers
    const customers = await customerModel.find({ organization: organizationId })
      .populate('people', 'firstname lastname email phone')
      .populate('company', 'companyname email phone')
      .populate('creator', 'name');
    
    const customersSheet = workbook.addWorksheet('Customers');
    customersSheet.addRow(['Customer Type', 'Name', 'Email', 'Phone', 'Status', 'Created By', 'Created At']);
    
    customers.forEach(customer => {
      const name = customer.people ? 
        `${customer.people.firstname} ${customer.people.lastname}` : 
        customer.company ? customer.company.companyname : 'N/A';
      const email = customer.people ? customer.people.email : (customer.company ? customer.company.email : 'N/A');
      const phone = customer.people ? customer.people.phone : (customer.company ? customer.company.phone : 'N/A');
      
      customersSheet.addRow([
        customer.customertype,
        name,
        email,
        phone,
        customer.status,
        customer.creator ? customer.creator.name : 'N/A',
        customer.createdAt
      ]);
    });

    // 11. Export Support Tickets
    const supportTickets = await supportModel.find({ organization: organizationId });
    const supportSheet = workbook.addWorksheet('Support Tickets');
    supportSheet.addRow(['Name', 'Email', 'Mobile', 'Purpose', 'Description', 'Status', 'Created At']);
    
    supportTickets.forEach(support => {
      supportSheet.addRow([
        support.name,
        support.email,
        support.mobile,
        support.purpose,
        support.description,
        support.status || 'Open',
        support.createdAt
      ]);
    });

    // 12. Export Documents
    const documents = await documentModel.find();
    const documentsSheet = workbook.addWorksheet('Documents');
    documentsSheet.addRow(['Document Name', 'Category', 'File Path', 'Created At']);
    
    documents.forEach(doc => {
      documentsSheet.addRow([
        doc.documentName,
        doc.documentCategory,
        doc.documentFile,
        doc.createdAt
      ]);
    });

    // 13. Export Excel Data
    const excelData = await excelModel.find();
    const excelSheet = workbook.addWorksheet('Excel Data');
    excelSheet.addRow(['Customer Name', 'Phone Number', 'Contract Type', 'Contract Number', 'Product Name', 'Status', 'Mode', 'Renewal Date', 'Remarks', 'Created At']);
    
    excelData.forEach(excel => {
      excelSheet.addRow([
        excel.custumerName,
        excel.phnNumber,
        excel.contractType,
        excel.contractNumber,
        excel.productName,
        excel.status,
        excel.mode,
        excel.renewalDate,
        excel.remarks,
        excel.createdAt
      ]);
    });

    // 14. Export WhatsApp Messages
    const whatsappMessages = await whatsappLogModel.find({ organization: organizationId });
    const whatsappSheet = workbook.addWorksheet('WhatsApp Messages');
    whatsappSheet.addRow(['Mobiles', 'Template ID', 'Message', 'Sender ID', 'Entity ID', 'Timestamp']);
    
    whatsappMessages.forEach(msg => {
      whatsappSheet.addRow([
        msg.mobiles ? msg.mobiles.join(', ') : 'N/A',
        msg.templateId,
        msg.message,
        msg.senderId,
        msg.entityId,
        msg.timestamp
      ]);
    });

    // 15. Export SMS Messages
    const smsMessages = await smsModel.find({ organization: organizationId });
    const smsSheet = workbook.addWorksheet('SMS Messages');
    smsSheet.addRow(['Mobiles', 'Names', 'Template ID', 'Message', 'Sender ID', 'Entity ID', 'Timestamp']);
    
    smsMessages.forEach(msg => {
      smsSheet.addRow([
        msg.mobiles ? msg.mobiles.join(', ') : 'N/A',
        msg.name ? msg.name.join(', ') : 'N/A',
        msg.templateId,
        msg.message,
        msg.senderId,
        msg.entityId,
        msg.timestamp
      ]);
    });

    // 16. Export Notifications
    const notifications = await notificationModel.find({ reciever_id: organizationId })
      .populate('sender_id', 'name');
    const notificationsSheet = workbook.addWorksheet('Notifications');
    notificationsSheet.addRow(['Title', 'Message', 'Sender', 'Read Status', 'Created At']);
    
    notifications.forEach(notification => {
      notificationsSheet.addRow([
        notification.title,
        notification.message,
        notification.sender_id ? notification.sender_id.name : 'System',
        notification.read_status ? 'Read' : 'Unread',
        notification.createdAt
      ]);
    });

    // Set column widths for better formatting
    workbook.worksheets.forEach(worksheet => {
      worksheet.columns.forEach(column => {
        column.width = 20;
      });
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `CRM_Data_Export_${timestamp}.xlsx`;

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write the workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error creating Excel file:', error);
    throw new Error('Failed to export data', 500);
  }
});

const exportSpecificData = TryCatch(async (req, res) => {
  const { dataType } = req.params;
  const organizationId = req.user.organization;
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CRM System';
  workbook.lastModifiedBy = req.user.name;
  workbook.created = new Date();

  try {
    switch (dataType) {
      case 'admins':
        const admins = await adminModel.find({ organization: organizationId })
          .select('-password')
          .populate('organization', 'name email');
        
        const adminsSheet = workbook.addWorksheet('Admins');
        adminsSheet.addRow(['Name', 'Email', 'Phone', 'Designation', 'Role', 'Verified', 'Created At']);
        
        admins.forEach(admin => {
          adminsSheet.addRow([
            admin.name,
            admin.email,
            admin.phone,
            admin.designation,
            admin.role,
            admin.verified ? 'Yes' : 'No',
            admin.createdAt
          ]);
        });
        break;

      case 'leads':
        const leads = await leadModel.find({ organization: organizationId })
          .populate('people', 'firstname lastname email phone')
          .populate('company', 'companyname email phone');
        
        const leadsSheet = workbook.addWorksheet('Leads');
        leadsSheet.addRow(['Lead Name', 'Contact Type', 'Contact Name', 'Contact Email', 'Contact Phone', 'Source', 'Status', 'Value', 'Created At']);
        
        leads.forEach(lead => {
          const contactName = lead.people ? 
            `${lead.people.firstname} ${lead.people.lastname}` : 
            lead.company ? lead.company.companyname : 'N/A';
          const contactEmail = lead.people ? lead.people.email : (lead.company ? lead.company.email : 'N/A');
          const contactPhone = lead.people ? lead.people.phone : (lead.company ? lead.company.phone : 'N/A');
          
          leadsSheet.addRow([
            lead.leadname,
            lead.people ? 'Individual' : 'Company',
            contactName,
            contactEmail,
            contactPhone,
            lead.source,
            lead.status,
            lead.value,
            lead.createdAt
          ]);
        });
        break;

      case 'invoices':
        const invoices = await invoiceModel.find({ organization: organizationId })
          .populate('customer', 'people company')
          .populate('customer.people', 'firstname lastname email phone')
          .populate('customer.company', 'companyname email phone')
          .populate('createdBy', 'name');
        
        const invoicesSheet = workbook.addWorksheet('Invoices');
        invoicesSheet.addRow(['Invoice Name', 'Customer Type', 'Customer Name', 'Customer Email', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance', 'Status', 'Created By', 'Created At']);
        
        invoices.forEach(invoice => {
          const customerType = invoice.customer ? (invoice.customer.people ? 'Individual' : 'Company') : 'N/A';
          const customerName = invoice.customer ? 
            (invoice.customer.people ? 
              `${invoice.customer.people.firstname} ${invoice.customer.people.lastname}` : 
              invoice.customer.company ? invoice.customer.company.companyname : 'N/A') : 'N/A';
          const customerEmail = invoice.customer ? 
            (invoice.customer.people ? 
              invoice.customer.people.email : 
              invoice.customer.company ? invoice.customer.company.email : 'N/A') : 'N/A';
          
          invoicesSheet.addRow([
            invoice.invoicename,
            customerType,
            customerName,
            customerEmail,
            invoice.subtotal,
            invoice.tax[0]?.taxamount || 0,
            invoice.total,
            invoice.paid,
            invoice.balance,
            invoice.paymentstatus,
            invoice.createdBy ? invoice.createdBy.name : 'N/A',
            invoice.createdAt
          ]);
        });
        break;

      case 'customers':
        const customers = await customerModel.find({ organization: organizationId })
          .populate('people', 'firstname lastname email phone')
          .populate('company', 'companyname email phone')
          .populate('creator', 'name');
        
        const customersSheet = workbook.addWorksheet('Customers');
        customersSheet.addRow(['Customer Type', 'Name', 'Email', 'Phone', 'Status', 'Created By', 'Created At']);
        
        customers.forEach(customer => {
          const name = customer.people ? 
            `${customer.people.firstname} ${customer.people.lastname}` : 
            customer.company ? customer.company.companyname : 'N/A';
          const email = customer.people ? customer.people.email : (customer.company ? customer.company.email : 'N/A');
          const phone = customer.people ? customer.people.phone : (customer.company ? customer.company.phone : 'N/A');
          
          customersSheet.addRow([
            customer.customertype,
            name,
            email,
            phone,
            customer.status,
            customer.creator ? customer.creator.name : 'N/A',
            customer.createdAt
          ]);
        });
        break;

      default:
        throw new Error('Invalid data type', 400);
    }

    // Set column widths
    workbook.worksheets.forEach(worksheet => {
      worksheet.columns.forEach(column => {
        column.width = 20;
      });
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `CRM_${dataType}_Export_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error creating Excel file:', error);
    throw new Error('Failed to export data', 500);
  }
});

module.exports = {
  exportAllData,
  exportSpecificData
};
