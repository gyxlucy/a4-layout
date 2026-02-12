import { useRef, useCallback, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { PAGE_WIDTH, PAGE_HEIGHT, DISPLAY_SCALE } from '../constants';
import { useStore, generateId, type Page } from '../store';
import { ImageElement } from './ImageElement';

interface A4PageProps {
  page: Page;
  pageIndex: number;
}

export function A4Page({ page, pageIndex }: A4PageProps) {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    images,
    pages,
    addElement,
    removePage,
    movePageUp,
    movePageDown,
    clearSelection,
    setActivePage,
    selectedElementIds,
    setSelection,
  } = useStore();

  // Selection box state
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const selectionStart = useRef<{ x: number; y: number } | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const imageId = e.dataTransfer.getData('text/plain');
      const img = images.get(imageId);
      if (!img || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / DISPLAY_SCALE;
      const y = (e.clientY - rect.top) / DISPLAY_SCALE;

      // Cap image size to fit page if too large
      let w = img.width;
      let h = img.height;
      const aspect = w / h;

      if (w > PAGE_WIDTH * 0.9) {
        w = PAGE_WIDTH * 0.9;
        h = w / aspect;
      }
      if (h > PAGE_HEIGHT * 0.9) {
        h = PAGE_HEIGHT * 0.9;
        w = h * aspect;
      }

      // Center the image on the drop point
      const ex = Math.max(0, Math.min(x - w / 2, PAGE_WIDTH - w));
      const ey = Math.max(0, Math.min(y - h / 2, PAGE_HEIGHT - h));

      addElement(page.id, {
        id: generateId(),
        imageId,
        x: ex,
        y: ey,
        width: w,
        height: h,
        rotation: 0,
      });
      setActivePage(page.id);
    },
    [images, addElement, page.id, setActivePage]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Clicked on empty area (the background rect)
    const clickedOnEmpty =
      e.target === e.target.getStage() ||
      e.target.attrs.name === 'page-bg';

    if (clickedOnEmpty) {
      setActivePage(page.id);
      if (!e.evt.shiftKey) {
        clearSelection();
      }
      // Start selection box
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          selectionStart.current = { x: pos.x, y: pos.y };
        }
      }
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!selectionStart.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const x = Math.min(selectionStart.current.x, pos.x);
    const y = Math.min(selectionStart.current.y, pos.y);
    const width = Math.abs(pos.x - selectionStart.current.x);
    const height = Math.abs(pos.y - selectionStart.current.y);

    setSelectionBox({ x, y, width, height });
  };

  const handleStageMouseUp = () => {
    if (selectionBox && selectionStart.current) {
      // Find elements within the selection box
      const selected = new Set<string>();
      for (const el of page.elements) {
        const elCenterX = el.x + el.width / 2;
        const elCenterY = el.y + el.height / 2;
        if (
          elCenterX >= selectionBox.x &&
          elCenterX <= selectionBox.x + selectionBox.width &&
          elCenterY >= selectionBox.y &&
          elCenterY <= selectionBox.y + selectionBox.height
        ) {
          selected.add(el.id);
        }
      }
      if (selected.size > 0) {
        setSelection(selected);
        setActivePage(page.id);
      }
    }
    selectionStart.current = null;
    setSelectionBox(null);
  };

  const handleDeletePage = () => {
    if (page.elements.length > 0) {
      if (!confirm(`Delete page ${pageIndex + 1}? It has ${page.elements.length} element(s).`)) {
        return;
      }
    }
    removePage(page.id);
  };

  const displayWidth = PAGE_WIDTH * DISPLAY_SCALE;
  const displayHeight = PAGE_HEIGHT * DISPLAY_SCALE;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <span>Page {pageIndex + 1}</span>
        <div className="page-header-actions">
          <button
            className="btn btn-small"
            onClick={() => movePageUp(page.id)}
            disabled={pageIndex === 0}
            title="Move page up"
          >
            Up
          </button>
          <button
            className="btn btn-small"
            onClick={() => movePageDown(page.id)}
            disabled={pageIndex === pages.length - 1}
            title="Move page down"
          >
            Dn
          </button>
          {pages.length > 1 && (
            <button
              className="btn btn-small btn-danger"
              onClick={handleDeletePage}
              title="Delete page"
            >
              Del
            </button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="page-container"
        style={{ width: displayWidth, height: displayHeight }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stage
          ref={stageRef}
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
          style={{
            transform: `scale(${DISPLAY_SCALE})`,
            transformOrigin: 'top left',
          }}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>
            <Rect
              name="page-bg"
              x={0}
              y={0}
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              fill="white"
            />
            {page.elements.map((el) => (
              <ImageElement
                key={el.id}
                element={el}
                pageId={page.id}
                isSelected={selectedElementIds.has(el.id)}
              />
            ))}
            {selectionBox && (
              <Rect
                x={selectionBox.x}
                y={selectionBox.y}
                width={selectionBox.width}
                height={selectionBox.height}
                fill="rgba(37, 99, 235, 0.1)"
                stroke="#2563eb"
                strokeWidth={2}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
