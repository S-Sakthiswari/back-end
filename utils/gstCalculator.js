const calculateGST = (entries, taxSlabs) => {
  let totalTaxable = 0;
  let totalTax = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  entries.forEach(entry => {
    entry.items.forEach(item => {
      const slab = taxSlabs.find(s => s._id.toString() === item.taxSlabId.toString());
      const itemValue = item.quantity * item.price;
      const tax = itemValue * (slab?.rate || 0) / 100;

      totalTaxable += itemValue;
      totalTax += tax;

      if (entry.isInterState) {
        totalIGST += tax;
      } else {
        totalCGST += tax / 2;
        totalSGST += tax / 2;
      }
    });
  });

  return {
    totalTaxable,
    totalTax,
    totalCGST,
    totalSGST,
    totalIGST
  };
};

const calculateGSTReturns = (entries, returnType, gstin, month, year) => {
  const summary = {
    totalInvoices: entries.length,
    totalTaxableValue: 0,
    totalTaxAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    cess: 0
  };

  entries.forEach(entry => {
    summary.totalTaxableValue += entry.taxableValue || 0;
    summary.totalTaxAmount += entry.totalTax || 0;

    if (entry.isInterState) {
      summary.igst += entry.totalTax || 0;
    } else {
      summary.cgst += (entry.totalTax || 0) / 2;
      summary.sgst += (entry.totalTax || 0) / 2;
    }
  });

  const hsnSummary = {};
  entries.forEach(entry => {
    entry.items.forEach(item => {
      const hsn = item.hsn || 'N/A';
      const rate = item.taxSlabId?.rate || 0;
      const key = `${hsn}-${rate}`;

      if (!hsnSummary[key]) {
        hsnSummary[key] = {
          hsn,
          rate,
          quantity: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0
        };
      }

      const itemValue = item.quantity * item.price;
      const tax = itemValue * rate / 100;

      hsnSummary[key].quantity += item.quantity;
      hsnSummary[key].taxableValue += itemValue;

      if (entry.isInterState) {
        hsnSummary[key].igst += tax;
      } else {
        hsnSummary[key].cgst += tax / 2;
        hsnSummary[key].sgst += tax / 2;
      }
    });
  });

  return {
    gstin,
    returnType,
    period: `${month.toString().padStart(2, '0')}/${year}`,
    summary,
    hsnSummary: Object.values(hsnSummary),
    invoices: entries,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  calculateGST,
  calculateGSTReturns
};