import { useRef, useEffect, useState } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { SNAP_THRESHOLD, SNAP_ANGLES } from '../constants';
import { useStore, type PageElement } from '../store';

interface ImageElementProps {
  element: PageElement;
  pageId: string;
  isSelected: boolean;
}

export function ImageElement({ element, pageId, isSelected }: ImageElementProps) {
  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const { images, updateElement, setSelection, toggleSelection, setActivePage, setCropTarget } = useStore();

  const imgData = images.get(element.imageId);

  // Load the HTML image
  useEffect(() => {
    if (!imgData) return;
    const img = new window.Image();
    img.src = imgData.dataUrl;
    img.onload = () => setImage(img);
  }, [imgData?.dataUrl]);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!imgData || !image) return null;

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true;
    setCropTarget(element.id);
  };

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true;
    setActivePage(pageId);
    if ('shiftKey' in e.evt && e.evt.shiftKey) {
      toggleSelection(element.id);
    } else {
      setSelection(new Set([element.id]));
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(pageId, element.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = imageRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    let rotation = node.rotation() % 360;
    if (rotation < 0) rotation += 360;

    // Snap rotation
    for (const snap of SNAP_ANGLES) {
      if (Math.abs(rotation - snap) < SNAP_THRESHOLD) {
        rotation = snap % 360;
        break;
      }
    }

    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(20, node.width() * scaleX);
    const newHeight = Math.max(20, node.height() * scaleY);

    updateElement(pageId, element.id, {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
      rotation,
    });
  };

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        draggable
        onClick={handleSelect}
        onTap={handleSelect}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          rotationSnaps={[0, 90, 180, 270]}
          anchorSize={24}
          anchorCornerRadius={4}
          anchorStroke="#2563eb"
          anchorStrokeWidth={2}
          anchorFill="#fff"
          borderStroke="#2563eb"
          borderStrokeWidth={2}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size
            if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
              return oldBox;
            }
            return newBox;
          }}
          keepRatio={true}
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-right',
            'bottom-right',
            'bottom-center',
            'bottom-left',
            'middle-left',
          ]}
        />
      )}
    </>
  );
}
