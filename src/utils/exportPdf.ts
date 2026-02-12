import { PDFDocument } from 'pdf-lib';
import { PDF_WIDTH, PDF_HEIGHT, PAGE_WIDTH, PAGE_HEIGHT } from '../constants';
import { useStore } from '../store';

export async function exportPdf(filename: string = 'layout') {
  const { pages } = useStore.getState();

  if (pages.length === 0) return;

  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    // Find the corresponding Konva stage
    const stageElements = document.querySelectorAll('.page-container');
    const pageIndex = pages.indexOf(page);
    const stageContainer = stageElements[pageIndex];

    if (!stageContainer) continue;

    // Get the Konva stage canvas
    const canvas = stageContainer.querySelector('canvas');
    if (!canvas) continue;

    // Create a high-res offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = PAGE_WIDTH;
    offscreen.height = PAGE_HEIGHT;
    const ctx = offscreen.getContext('2d');
    if (!ctx) continue;

    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

    // Draw each element at full resolution
    const store = useStore.getState();
    for (const el of page.elements) {
      const imgData = store.images.get(el.imageId);
      if (!imgData) continue;

      const img = new Image();
      img.src = imgData.dataUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        if (img.complete) resolve();
      });

      ctx.save();
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
      ctx.restore();
    }

    // Convert to PNG
    const pngDataUrl = offscreen.toDataURL('image/png');
    const pngBytes = Uint8Array.from(atob(pngDataUrl.split(',')[1]), (c) =>
      c.charCodeAt(0)
    );

    const pngImage = await pdfDoc.embedPng(pngBytes);
    const pdfPage = pdfDoc.addPage([PDF_WIDTH, PDF_HEIGHT]);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: PDF_WIDTH,
      height: PDF_HEIGHT,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  link.click();

  URL.revokeObjectURL(url);
}
