import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from('attachments').getPublicUrl(path);
  return data.publicUrl;
};

const fetchAttachmentAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  return response.arrayBuffer();
};

const addImageToPdf = async (pdfDoc: PDFDocument, imageData: ArrayBuffer, mimeType: string) => {
  let image;
  if (mimeType.includes('png')) {
    image = await pdfDoc.embedPng(imageData);
  } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    image = await pdfDoc.embedJpg(imageData);
  } else {
    // Try as JPEG for other image types
    try {
      image = await pdfDoc.embedJpg(imageData);
    } catch {
      return; // Skip unsupported image formats
    }
  }

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const imgDims = image.scale(1);
  
  // Calculate scale to fit the page with margins
  const margin = 40;
  const maxWidth = width - margin * 2;
  const maxHeight = height - margin * 2;
  const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height, 1);
  
  const scaledWidth = imgDims.width * scale;
  const scaledHeight = imgDims.height * scale;
  
  // Center the image on the page
  const x = (width - scaledWidth) / 2;
  const y = (height - scaledHeight) / 2;
  
  page.drawImage(image, {
    x,
    y,
    width: scaledWidth,
    height: scaledHeight,
  });
};

const mergePdfAttachment = async (mainPdf: PDFDocument, attachmentData: ArrayBuffer) => {
  try {
    const attachmentPdf = await PDFDocument.load(attachmentData);
    const copiedPages = await mainPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
    copiedPages.forEach((page) => mainPdf.addPage(page));
  } catch (error) {
    console.error('Failed to merge PDF:', error);
  }
};

export const exportToPdf = async (elementId: string, filename: string, attachments?: Attachment[]) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // Clone the element for PDF generation
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remove attachment preview from the clone (we'll add actual files)
  const attachmentPreview = clone.querySelector('[class*="border-t"]');
  if (attachmentPreview && attachmentPreview.querySelector('h4')?.textContent?.includes('Attachments')) {
    attachmentPreview.remove();
  }

  // Style the clone for proper PDF rendering
  clone.style.cssText = `
    background: white !important;
    color: black !important;
    width: 210mm;
    box-sizing: border-box;
    padding: 0 !important;
    margin: 0 !important;
    position: relative;
    min-height: 297mm;
    display: flex;
    flex-direction: column;
  `;

  // Fix all elements for proper alignment
  const allElements = clone.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlEl);
    
    // Fix flex containers
    if (computedStyle.display === 'flex' || htmlEl.classList.contains('flex')) {
      htmlEl.style.alignItems = 'center';
      htmlEl.style.display = 'flex';
    }
    
    // Fix inline-flex
    if (computedStyle.display === 'inline-flex') {
      htmlEl.style.alignItems = 'center';
      htmlEl.style.display = 'inline-flex';
    }
    
    // Fix text elements
    if (htmlEl.tagName === 'SPAN' || htmlEl.tagName === 'P' || htmlEl.tagName === 'DIV') {
      htmlEl.style.lineHeight = '1.5';
      htmlEl.style.verticalAlign = 'middle';
    }
    
    // Fix table cells
    if (htmlEl.tagName === 'TD' || htmlEl.tagName === 'TH') {
      htmlEl.style.verticalAlign = 'middle';
      htmlEl.style.lineHeight = '1.5';
      htmlEl.style.padding = '8px';
    }
    
    // Fix form field boxes - ensure text is centered vertically
    if (htmlEl.classList.contains('bg-tiller-field') || 
        htmlEl.style.backgroundColor?.includes('tiller') ||
        computedStyle.backgroundColor.includes('rgb')) {
      htmlEl.style.display = 'flex';
      htmlEl.style.alignItems = 'center';
      htmlEl.style.minHeight = '28px';
      htmlEl.style.lineHeight = '1.5';
    }
  });

  // Make footer stick to bottom
  const footer = clone.querySelector('[class*="bg-tiller-lime"]') as HTMLElement;
  const contentArea = clone.querySelector('.p-6, [class*="space-y"]') as HTMLElement;
  
  if (footer && contentArea) {
    // Create a wrapper structure for proper positioning
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      min-height: 297mm;
      width: 100%;
    `;
    
    // Get header
    const header = clone.querySelector('[class*="bg-tiller-header"], [class*="border-b-4"]') as HTMLElement;
    
    // Create content wrapper that grows
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
    `;
    
    // Move all children to wrapper
    while (clone.firstChild) {
      const child = clone.firstChild as HTMLElement;
      if (child === footer) {
        clone.removeChild(child);
      } else {
        contentWrapper.appendChild(child);
      }
    }
    
    wrapper.appendChild(contentWrapper);
    
    // Style footer to stay at bottom
    footer.style.cssText = `
      background: #c8e35c !important;
      padding: 8px 24px;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-top: auto;
    `;
    wrapper.appendChild(footer);
    
    clone.appendChild(wrapper);
  }

  // Temporarily add to document for rendering
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  document.body.appendChild(clone);

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: true,
  });

  // Remove the clone
  document.body.removeChild(clone);

  const imgData = canvas.toDataURL('image/png');
  const jspdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;

  jspdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    jspdf.addPage();
    jspdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // If there are attachments, merge them
  if (attachments && attachments.length > 0) {
    // Convert jsPDF to pdf-lib format
    const jspdfBytes = jspdf.output('arraybuffer');
    const pdfDoc = await PDFDocument.load(jspdfBytes);

    for (const attachment of attachments) {
      const publicUrl = getPublicUrl(attachment.url);
      try {
        const fileData = await fetchAttachmentAsArrayBuffer(publicUrl);
        
        if (attachment.type.startsWith('image/')) {
          await addImageToPdf(pdfDoc, fileData, attachment.type);
        } else if (attachment.type === 'application/pdf') {
          await mergePdfAttachment(pdfDoc, fileData);
        }
        // Other file types are skipped as they can't be embedded in PDF
      } catch (error) {
        console.error(`Failed to add attachment ${attachment.name}:`, error);
      }
    }

    const finalPdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(finalPdfBytes)], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  } else {
    jspdf.save(`${filename}.pdf`);
  }
};

export const printDocument = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  const styles = Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        return Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join('');
      } catch {
        return '';
      }
    })
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Document</title>
        <style>
          ${styles}
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            width: 210mm;
            min-height: 297mm;
          }
          #print-content {
            display: flex;
            flex-direction: column;
            min-height: 297mm;
            width: 100%;
          }
          #print-content > div:first-child {
            flex: 1;
          }
          .bg-tiller-lime {
            margin-top: auto !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .flex {
            display: flex !important;
            align-items: center !important;
          }
          td, th {
            vertical-align: middle !important;
            line-height: 1.5 !important;
          }
          @media print {
            body { 
              margin: 0 !important; 
              padding: 0 !important; 
            }
          }
        </style>
      </head>
      <body>
        <div id="print-content">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};
