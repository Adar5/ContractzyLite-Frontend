const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const common = require('oci-common');
const os = require('oci-objectstorage');

// OCI Authentication: This uses the standard ~/.oci/config file setup
const provider = new common.ConfigFileAuthenticationDetailsProvider();
const client = new os.ObjectStorageClient({ authenticationDetailsProvider: provider });

const NAMESPACE = process.env.OCI_NAMESPACE; // e.g., 'ax7bbz...'
const BUCKET_NAME = process.env.OCI_BUCKET_NAME; // e.g., 'contractzy-vault'

async function generateAndUploadContract(contractData, signatureBase64, versionStr) {
  // 1. Initialize a new blank PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 2. Write the contract text
  const contractText = `
    CONTRACTZY LITE AGREEMENT - ${versionStr}

    Title: ${contractData.title}
    Client: ${contractData.client_name}
    Value: $${contractData.value}

    Both parties agree to maintain strict confidentiality regarding
    all proprietary information.
  `;

  page.drawText(contractText, { x: 50, y: 750, size: 12, font, color: rgb(0, 0, 0) });

  // 3. Embed the digital signature if it exists
  if (signatureBase64) {
    // Strip the HTML data:image prefix if present
    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
    const signatureImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));

    // Draw it at the bottom of the page
    page.drawImage(signatureImage, {
      x: 50, y: 100, width: 150, height: 50
    });
    page.drawText(`${contractData.client_name} Representative`, { x: 50, y: 80, size: 10 });
  }

  // 4. Serialize to bytes
  const pdfBytes = await pdfDoc.save();

  // 5. Upload to Oracle Cloud Object Storage
  const fileName = `contract_${contractData.id}_${versionStr.replace(/\./g, '_')}_${Date.now()}.pdf`;

  const putObjectRequest = {
    namespaceName: NAMESPACE,
    bucketName: BUCKET_NAME,
    objectName: fileName,
    putObjectBody: Buffer.from(pdfBytes),
    contentType: 'application/pdf'
  };

  await client.putObject(putObjectRequest);

  // Return the file identifier to be saved in MySQL
  return fileName;
}

module.exports = { generateAndUploadContract };
