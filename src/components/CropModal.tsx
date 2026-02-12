import { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';

export function CropModal() {
  const { cropTargetElementId, pages, images, setCropTarget, applyCrop } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Crop rectangle in display coordinates
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displayScale, setDisplayScale] = useState(1);

  // Find the target element and its image
  let element = null;
  if (cropTargetElementId) {
    for (const page of pages) {
      const el = page.elements.find((e) => e.id === cropTargetElementId);
      if (el) {
        element = el;
        break;
      }
    }
  }

  const imgData = element ? images.get(element.imageId) : null;

  // Compute display scale when image loads
  const handleImageLoad = useCallback(() => {
    if (!imgData) return;
    const maxW = window.innerWidth * 0.8;
    const maxH = window.innerHeight * 0.7;
    const scale = Math.min(maxW / imgData.width, maxH / imgData.height, 1);
    setDisplayScale(scale);
  }, [imgData]);

  // Reset crop state when target changes
  useEffect(() => {
    setCropStart(null);
    setCropEnd(null);
    setIsDragging(false);
  }, [cropTargetElementId]);

  const getRelativePos = useCallback((e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const rect = img.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getRelativePos(e);
    setCropStart(pos);
    setCropEnd(pos);
    setIsDragging(true);
  }, [getRelativePos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropEnd(getRelativePos(e));
  }, [isDragging, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleApply = useCallback(() => {
    if (!cropStart || !cropEnd || !element || !imgData) return;

    const x1 = Math.min(cropStart.x, cropEnd.x);
    const y1 = Math.min(cropStart.y, cropEnd.y);
    const x2 = Math.max(cropStart.x, cropEnd.x);
    const y2 = Math.max(cropStart.y, cropEnd.y);

    const displayW = x2 - x1;
    const displayH = y2 - y1;

    // Minimum crop size
    if (displayW < 5 || displayH < 5) return;

    // Convert to original image coordinates
    const cropRect = {
      x: Math.round(x1 / displayScale),
      y: Math.round(y1 / displayScale),
      w: Math.round(displayW / displayScale),
      h: Math.round(displayH / displayScale),
    };

    // Clamp to image bounds
    cropRect.x = Math.max(0, cropRect.x);
    cropRect.y = Math.max(0, cropRect.y);
    cropRect.w = Math.min(cropRect.w, imgData.width - cropRect.x);
    cropRect.h = Math.min(cropRect.h, imgData.height - cropRect.y);

    applyCrop(element.id, cropRect);
  }, [cropStart, cropEnd, element, imgData, displayScale, applyCrop]);

  const handleCancel = useCallback(() => {
    setCropTarget(null);
  }, [setCropTarget]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!cropTargetElementId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
      if (e.key === 'Enter') handleApply();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cropTargetElementId, handleCancel, handleApply]);

  if (!cropTargetElementId || !element || !imgData) return null;

  const displayW = imgData.width * displayScale;
  const displayH = imgData.height * displayScale;

  // Compute crop rectangle in display coordinates
  let cropRect = null;
  if (cropStart && cropEnd) {
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropEnd.x - cropStart.x);
    const h = Math.abs(cropEnd.y - cropStart.y);
    if (w > 2 || h > 2) {
      cropRect = { x, y, w, h };
    }
  }

  return (
    <div className="crop-overlay" onMouseUp={handleMouseUp}>
      <div className="crop-content">
        <div className="crop-header">
          <span>Drag on the image to select crop area</span>
        </div>
        <div
          ref={containerRef}
          className="crop-container"
          style={{ width: displayW, height: displayH }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <img
            ref={imgRef}
            className="crop-image"
            src={imgData.dataUrl}
            width={displayW}
            height={displayH}
            draggable={false}
            onLoad={handleImageLoad}
          />

          {cropRect && (
            <>
              {/* Dim overlays for uncropped regions */}
              {/* Top */}
              <div
                className="crop-dim"
                style={{ top: 0, left: 0, width: displayW, height: cropRect.y }}
              />
              {/* Bottom */}
              <div
                className="crop-dim"
                style={{
                  top: cropRect.y + cropRect.h,
                  left: 0,
                  width: displayW,
                  height: displayH - cropRect.y - cropRect.h,
                }}
              />
              {/* Left */}
              <div
                className="crop-dim"
                style={{
                  top: cropRect.y,
                  left: 0,
                  width: cropRect.x,
                  height: cropRect.h,
                }}
              />
              {/* Right */}
              <div
                className="crop-dim"
                style={{
                  top: cropRect.y,
                  left: cropRect.x + cropRect.w,
                  width: displayW - cropRect.x - cropRect.w,
                  height: cropRect.h,
                }}
              />
              {/* Crop selection rectangle */}
              <div
                className="crop-rect"
                style={{
                  left: cropRect.x,
                  top: cropRect.y,
                  width: cropRect.w,
                  height: cropRect.h,
                }}
              />
            </>
          )}
        </div>
        <div className="crop-actions">
          <button className="btn" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!cropRect}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
