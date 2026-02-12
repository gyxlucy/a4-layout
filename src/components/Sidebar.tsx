import { useRef, useState, useCallback } from 'react';
import { useStore, generateId } from '../store';

export function Sidebar() {
  const images = useStore((s) => s.images);
  const addImage = useStore((s) => s.addImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            addImage({
              id: generateId(),
              name: file.name,
              dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    },
    [addImage]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    e.dataTransfer.setData('text/plain', imageId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const imageList = Array.from(images.values());

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>Images</h3>
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => processFiles(e.target.files)}
          />
          Drop images here or click to upload
        </div>
      </div>
      <div className="thumbnail-list">
        {imageList.map((img) => (
          <div
            key={img.id}
            className="thumbnail-item"
            draggable
            onDragStart={(e) => handleDragStart(e, img.id)}
          >
            <img src={img.dataUrl} alt={img.name} />
            <span>{img.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
