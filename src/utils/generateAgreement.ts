import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateAgreementPDF = (sellerData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- PAGE 1: BRANDING & SELLER INFO ---
  
  // Header Banner
  doc.setFillColor(17, 138, 54); // KorBazar Brand Green
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("KorBazar", 14, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Khpal Kor, Khpal Bazar", 14, 28);
  
  doc.setFontSize(10);
  doc.text("Official Seller Agreement & Platform Guide", 14, 35);

  // Seller Details
  doc.setTextColor(26, 26, 26); // Dark text
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Seller Information", 14, 55);

  autoTable(doc, {
    startY: 60,
    head: [['Field', 'Details']],
    body: [
      ['Store Name', sellerData.storeName || 'N/A'],
      ['Owner Name', sellerData.fullName || 'N/A'],
      ['CNIC Number', sellerData.cnicNumber || 'N/A'],
      ['Phone Number', sellerData.phone || 'N/A'],
      ['City / Area', `${sellerData.city || ''}, ${sellerData.area || ''}`],
      ['Agreement Date', new Date().toLocaleDateString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [17, 138, 54] },
    styles: { fontSize: 10 },
  });

  // --- PAGE 2: FEES & COMMISSIONS ---
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Fees & Commissions Structure", 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [['Type', 'Amount', 'Description']],
    body: [
      ['Standard Plan', 'Rs. 1,000 / month', 'Basic store visibility and product listing.'],
      ['Premium Plan', 'Rs. 2,000 / month', 'Featured on homepage, higher visibility, premium badge.'],
      ['Platform Fee', 'Rs. 10 / order', 'Deducted automatically from your payout upon order delivery.'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [17, 138, 54] },
    styles: { fontSize: 10 },
  });

  // Use type casting (doc as any) to fix TypeScript errors
  const lastY = (doc as any).lastAutoTable.finalY;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("How Payouts Work:", 14, lastY + 15);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("When an order is delivered, the total amount paid by the buyer is collected.", 14, lastY + 22);
  doc.text("The Rs. 10 platform fee is deducted from this amount.", 14, lastY + 28);
  doc.text("The remaining balance (Net Payout) is owed to you by the platform.", 14, lastY + 34);

  // --- PAGE 3: PLATFORM GUIDE ---
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Platform Guide: Managing Your Store", 14, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1. Seller Dashboard", 14, 35);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("View your sales stats (Pending, Dispatched, Delivered, Cancelled) and manage your account.", 14, 42);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. Order Management", 14, 55);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("- Accept Order: Confirm the order and notify the buyer on WhatsApp.", 14, 62);
  doc.text("- Mark Dispatched: Add the courier name and tracking number for live tracking.", 14, 68);
  doc.text("- Mark Delivered: This automatically reduces your stock and deducts the platform fee.", 14, 74);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("3. Stock & Discounts", 14, 87);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Update your stock quantities and apply percentage discounts directly from the Products tab.", 14, 94);
  doc.text("If a product reaches 0 stock, it will be marked 'Out of Stock' on the website automatically.", 14, 100);

  // --- PAGE 4: TERMS & PRIVACY ---
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Terms & Conditions", 14, 20);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const termsText = doc.splitTextToSize(
    "1. Nature of the Platform: KorBazar is a technology platform connecting buyers with independent sellers. We are an intermediary and not a party to any transaction. The contract of sale is strictly between the Buyer and the Seller.\n\n" +
    "2. Seller Obligations: You must provide accurate CNIC information. You are responsible for the quality and legality of your products. You agree to fulfill orders in a timely manner.\n\n" +
    "3. Prohibited Items: You are strictly prohibited from listing illegal items, weapons, drugs, or counterfeit goods. Violation will result in immediate account termination.\n\n" +
    "4. Payments and Fees: The platform charges a monthly subscription fee and a per-order commission of Rs. 10, deducted from the seller's payout.\n\n" +
    "5. Limitation of Liability: KorBazar shall not be liable for any indirect damages, product defects, or disputes with buyers.",
    180
  );
  doc.text(termsText, 14, 30);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Privacy Policy", 14, 140); 

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const privacyText = doc.splitTextToSize(
    "1. Data Collection: We collect your name, email, phone number, CNIC number, and CNIC images for verification purposes.\n\n" +
    "2. Data Usage: Your information is used to authenticate your account, allow buyers to contact you, and process orders. We do not sell your data to third parties.\n\n" +
    "3. Security: We use industry-standard security measures (Firebase) to protect your data. However, no method of transmission over the internet is 100% secure.",
    180
  );
  doc.text(privacyText, 14, 150);

  // Footer (Using type casting to fix getNumberOfPages)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 285);
    doc.text("© 2024 KorBazar. All rights reserved.", 14, 285);
  }

  // Save the PDF
  doc.save(`KorBazar_Agreement_${sellerData.storeName.replace(/\s+/g, '_')}.pdf`);
};
