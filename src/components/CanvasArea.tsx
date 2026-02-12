import { useStore } from '../store';
import { A4Page } from './A4Page';

export function CanvasArea() {
  const pages = useStore((s) => s.pages);

  return (
    <div className="canvas-area">
      <div className="pages-container">
        {pages.map((page, index) => (
          <A4Page key={page.id} page={page} pageIndex={index} />
        ))}
      </div>
    </div>
  );
}
