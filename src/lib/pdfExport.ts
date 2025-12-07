import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPdf = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  // Clone the element for PDF generation to avoid affecting the preview
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = `
    background: white !important;
    color: black !important;
    width: 210mm;
    padding: 10mm;
    box-sizing: border-box;
  `;
  
  // Fix vertical alignment issues in the clone
  const allElements = clone.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.classList.contains('flex') || htmlEl.style.display === 'flex') {
      htmlEl.style.alignItems = 'center';
    }
    // Ensure text is vertically centered
    if (htmlEl.tagName === 'SPAN' || htmlEl.tagName === 'DIV') {
      htmlEl.style.lineHeight = '1.5';
      htmlEl.style.verticalAlign = 'middle';
    }
    // Fix table cells
    if (htmlEl.tagName === 'TD' || htmlEl.tagName === 'TH') {
      htmlEl.style.verticalAlign = 'middle';
      htmlEl.style.lineHeight = '1.5';
    }
  });

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
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
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
          body {
            margin: 0;
            padding: 20mm;
            background: white !important;
            color: black !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @media print {
            body { margin: 0; padding: 10mm; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
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
