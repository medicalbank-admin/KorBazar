import { jsPDF } from 'jspdf';

export async function generateAgreementPDF(store: any) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ---------- helpers ----------
  const addPageHeaderFooter = (pageNum: number) => {
    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `KorBazar Seller Agreement — Page ${pageNum}`,
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    );
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 50) {
      addPageHeaderFooter(doc.getNumberOfPages());
      doc.addPage();
      y = margin + 20; // leave a small top pad on new pages
    }
  };

  const addParagraph = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; spaceAfter?: number; lineHeight?: number } = {}
  ) => {
    const { size = 10, bold = false, color = [30, 30, 30], indent = 0, spaceAfter = 8, lineHeight = 1.35 } = opts;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const wrapped = doc.splitTextToSize(text, contentWidth - indent);
    const blockHeight = wrapped.length * size * lineHeight;
    checkPageBreak(blockHeight + spaceAfter);
    doc.text(wrapped, margin + indent, y);
    y += blockHeight + spaceAfter;
  };

  const addHeading = (text: string, level: 1 | 2 | 3 = 1) => {
    const sizes = { 1: 14, 2: 12, 3: 11 };
    const spaceBefore = { 1: 14, 2: 10, 3: 8 };
    y += spaceBefore[level];
    addParagraph(text, { size: sizes[level], bold: true, color: [20, 20, 20], spaceAfter: 6 });
  };

  const addBullet = (text: string) => {
    addParagraph('•  ' + text, { size: 10, indent: 12, spaceAfter: 4 });
  };

  // ---------- WHITE HEADER + LOGO ----------
  // White background header strip (explicit fill)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 110, 'F');

  // Try to load the logo; if it fails, skip silently so PDF still generates
  try {
    const logoUrl = `${window.location.origin}/logo.png`;
    const img = await loadImage(logoUrl);
    const logoH = 48;
    const logoW = (img.width / img.height) * logoH;
    doc.addImage(img, 'PNG', margin, 25, logoW, logoH);
  } catch (e) {
    console.warn('Logo not added to PDF:', e);
  }

  // Title on the right of header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text('Seller Agreement', pageWidth - margin, 50, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text('KorBazar Marketplace', pageWidth - margin, 66, { align: 'right' });
  doc.text(`Issued: ${new Date().toLocaleDateString()}`, pageWidth - margin, 80, { align: 'right' });

  // Divider under header
  doc.setDrawColor(220);
  doc.setLineWidth(0.8);
  doc.line(margin, 100, pageWidth - margin, 100);

  y = 130;

  // ---------- SELLER DETAILS ----------
  addHeading('1. Seller Details', 1);
  addParagraph(`Store Name: ${store?.storeName || '-'}`, { bold: true });
  addParagraph(`Full Name: ${store?.fullName || '-'}`);
  addParagraph(`CNIC Number: ${store?.cnicNumber || '-'}`);
  addParagraph(`Phone: ${store?.phone || '-'}`);
  addParagraph(`City / Area: ${store?.city || '-'}${store?.area ? ' / ' + store.area : ''}`);
  addParagraph(`Email: ${store?.email || '-'}`);
  addParagraph(`Agreement Date: ${new Date().toLocaleString()}`);

  // ---------- TERMS & CONDITIONS ----------
  addHeading('2. Terms and Conditions', 1);

  addHeading('2.1. Definitions', 2);
  addParagraph(
    'In this Agreement, "KorBazar" refers to the KorBazar online marketplace, its owners, operators, and authorized representatives. "Seller" refers to the individual or business named in Section 1 who has registered a store on KorBazar. "Buyer" refers to any customer who purchases a product listed by the Seller on the platform. "Platform" refers to the KorBazar website, mobile interface, and all related services. "Product" refers to any item listed by the Seller for sale on KorBazar. "Order" refers to a confirmed purchase by a Buyer through the Platform.'
  );

  addHeading('2.2. Eligibility', 2);
  addParagraph(
    'To become a Seller on KorBazar, you must be at least eighteen (18) years of age, hold a valid CNIC, and be capable of entering into a legally binding contract under the laws of Pakistan. By registering, you represent and warrant that all information you provide is accurate, current, and complete. KorBazar reserves the right to verify your CNIC, phone number, and business details, and to reject or revoke any application that does not meet these requirements.'
  );

  addHeading('2.3. Seller Account and Store', 2);
  addParagraph(
    'You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify KorBazar immediately of any unauthorized use. One person or business entity may only operate one Seller store on KorBazar unless explicitly authorized in writing. Store names must not impersonate other sellers, brands, or individuals, and must not contain offensive or misleading language.'
  );

  addHeading('2.4. Product Listings', 2);
  addBullet('All listings must accurately describe the product, including size, material, color, condition, and delivery timelines.');
  addBullet('Prices must be displayed in Pakistani Rupees (PKR) and must include all applicable taxes unless stated otherwise.');
  addBullet('Product images must be original, clearly depicting the actual item for sale. Stock photos are not permitted unless they represent the exact product.');
  addBullet('Listing prohibited items — including counterfeit goods, weapons, narcotics, adult content, or items infringing third-party rights — is strictly forbidden and results in immediate store termination.');
  addBullet('KorBazar reserves the right to remove any listing that violates these Terms or applicable law, without prior notice.');

  addHeading('2.5. Order Fulfillment', 2);
  addParagraph(
    'Once an Order is placed, the Seller must accept, reject, or dispatch the Order within the timeframe specified by KorBazar (currently 48 hours). Repeated failure to respond to Orders may result in reduced visibility of the store or suspension. Sellers must package products securely and use reputable couriers for delivery. Sellers are responsible for providing accurate tracking information and for resolving delivery disputes in good faith.'
  );

  addHeading('2.6. Fees, Commissions, and Payouts', 2);
  addBullet('KorBazar charges a flat platform fee of Rs. 10 (or such other amount as may be notified) per completed Order.');
  addBullet('Additional commissions or subscription fees may apply for Premium-tier stores, as described on the Platform.');
  addBullet('Payouts are processed after delivery is confirmed by the Buyer and the applicable return window has passed.');
  addBullet('KorBazar is not responsible for any bank, wallet, or payment-gateway charges incurred by the Seller.');
  addBullet('Sellers are responsible for their own income tax and any other applicable taxes under Pakistani law.');

  addHeading('2.7. Returns, Refunds, and Disputes', 2);
  addParagraph(
    'Sellers must honor the returns policy displayed on their listing and on KorBazar generally. If a Buyer receives a damaged, incorrect, or materially misdescribed item, the Seller is obligated to offer replacement or refund in accordance with the policy. KorBazar may mediate disputes between Sellers and Buyers but is not a party to the sale contract. Repeated valid disputes against a Seller may result in account review or suspension.'
  );

  addHeading('2.8. Prohibited Conduct', 2);
  addBullet('Engaging in fraudulent, deceptive, or misleading behavior.');
  addBullet('Soliciting Buyers to transact off-platform to avoid fees.');
  addBullet('Manipulating reviews, ratings, or order counts.');
  addBullet('Harassing Buyers, other Sellers, or KorBazar staff.');
  addBullet('Using the Platform for money laundering or any unlawful purpose.');
  addBullet('Uploading malicious code, scraping data, or attempting to breach Platform security.');

  addHeading('2.9. Intellectual Property', 2);
  addParagraph(
    'By listing a product, the Seller grants KorBazar a non-exclusive, royalty-free, worldwide license to use product images, titles, and descriptions for the purpose of displaying, marketing, and promoting the listing on the Platform. The Seller represents that they own or have the right to use all content they upload and that such content does not infringe any third-party rights.'
  );

  addHeading('2.10. Suspension and Termination', 2);
  addParagraph(
    'KorBazar may suspend or terminate a Seller account at any time for violation of these Terms, receipt of repeated Buyer complaints, fraudulent activity, or any conduct that harms the reputation of the Platform. Upon termination, the Seller must fulfill any pending Orders unless otherwise instructed. Outstanding payouts may be withheld pending resolution of disputes.'
  );

  addHeading('2.11. Limitation of Liability', 2);
  addParagraph(
    'KorBazar provides the Platform on an "as is" and "as available" basis. To the maximum extent permitted by law, KorBazar disclaims all warranties and shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits or revenues, whether incurred directly or indirectly, arising out of or related to the Seller\'s use of the Platform.'
  );

  addHeading('2.12. Modifications', 2);
  addParagraph(
    'KorBazar may update these Terms from time to time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. Sellers are encouraged to review this Agreement periodically.'
  );

  addHeading('2.13. Governing Law', 2);
  addParagraph(
    'This Agreement is governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Pakistan.'
  );

  // ---------- PRIVACY POLICY ----------
  addHeading('3. Privacy Policy', 1);

  addHeading('3.1. Information We Collect', 2);
  addBullet('Identity Data: full name, CNIC number, store name, and business details.');
  addBullet('Contact Data: phone number, email address, and delivery address.');
  addBullet('Financial Data: bank account or wallet details provided for payouts.');
  addBullet('Transaction Data: details of Orders, products, payments, and delivery.');
  addBullet('Technical Data: IP address, device information, browser type, and Platform usage logs.');

  addHeading('3.2. How We Use Your Information', 2);
  addBullet('To verify your identity and enable you to operate a store on KorBazar.');
  addBullet('To process Orders and facilitate payouts to the Seller.');
  addBullet('To communicate important updates, service messages, and dispute resolutions.');
  addBullet('To detect, prevent, and investigate fraud, abuse, or security incidents.');
  addBullet('To improve the Platform, analyze usage patterns, and develop new features.');
  addBullet('To comply with legal obligations, court orders, or regulatory requests.');

  addHeading('3.3. Sharing of Information', 2);
  addParagraph(
    'We may share your information with Buyers (to the extent required to complete a transaction), payment processors, courier partners, and service providers acting on our behalf. We do not sell personal information. We may disclose information if required by law, or to protect the rights, property, or safety of KorBazar, its users, or the public.'
  );

  addHeading('3.4. Data Retention', 2);
  addParagraph(
    'We retain personal data for as long as necessary to fulfill the purposes described in this Policy, or as required by applicable law. When data is no longer needed, we securely delete or anonymize it.'
  );

  addHeading('3.5. Data Security', 2);
  addParagraph(
    'We implement reasonable technical and organizational measures to protect your information against unauthorized access, alteration, or loss. However, no method of transmission over the internet is fully secure, and we cannot guarantee absolute security.'
  );

  addHeading('3.6. Your Rights', 2);
  addParagraph(
    'You may request access to, correction of, or deletion of your personal information by contacting KorBazar support. You may also withdraw consent to processing where consent is the legal basis for such processing, though this may prevent you from using certain Platform features.'
  );

  addHeading('3.7. Cookies and Tracking', 2);
  addParagraph(
    'The Platform uses cookies and similar technologies to remember your preferences, analyze usage, and improve user experience. You can control cookies through your browser settings, though disabling them may affect Platform functionality.'
  );

  addHeading('3.8. Children\'s Privacy', 2);
  addParagraph(
    'The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we learn that we have done so, we will promptly delete such information.'
  );

  addHeading('3.9. Third-Party Links', 2);
  addParagraph(
    'The Platform may contain links to third-party websites or services. KorBazar is not responsible for the privacy practices of those third parties, and we encourage you to review their policies.'
  );

  addHeading('3.10. Changes to This Policy', 2);
  addParagraph(
    'We may update this Privacy Policy from time to time. Material changes will be communicated through the Platform or via the contact details you have provided.'
  );

  addHeading('3.11. Contact', 2);
  addParagraph(
    'For questions about this Agreement or our Privacy Policy, contact KorBazar support via the in-app chat, or WhatsApp at +92 339 0251147.'
  );

  // ---------- SIGNATURE ----------
  y += 20;
  checkPageBreak(140);
  addHeading('4. Signature', 1);
  addParagraph('By signing below, the Seller confirms that they have read, understood, and agree to be bound by this Agreement, including the Terms and Conditions and Privacy Policy above.');

  y += 20;
  doc.setDrawColor(60);
  doc.setLineWidth(0.7);
  doc.line(margin, y + 40, margin + 220, y + 40);
  doc.line(pageWidth - margin - 220, y + 40, pageWidth - margin, y + 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text('Seller Signature', margin, y + 55);
  doc.text('KorBazar Representative', pageWidth - margin - 220, y + 55);

  // ---------- FOOTER ON LAST PAGE ----------
  addPageHeaderFooter(doc.getNumberOfPages());

  doc.save(`KorBazar-Seller-Agreement-${(store?.storeName || 'Seller').replace(/\s+/g, '_')}.pdf`);
}

// helper: load image and return HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
    }
