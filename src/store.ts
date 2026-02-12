import { create } from 'zustand';


export interface ImageData {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface PageElement {
  id: string;
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface Page {
  id: string;
  elements: PageElement[];
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface AppState {
  images: Map<string, ImageData>;
  pages: Page[];
  selectedElementIds: Set<string>;
  activePageId: string | null;
  cropTargetElementId: string | null;

  addImage: (img: ImageData) => void;
  addPage: () => void;
  removePage: (pageId: string) => void;
  movePageUp: (pageId: string) => void;
  movePageDown: (pageId: string) => void;
  addElement: (pageId: string, element: PageElement) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<PageElement>) => void;
  removeElement: (pageId: string, elementId: string) => void;
  removeSelectedElements: () => void;
  setSelection: (ids: Set<string>) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  setActivePage: (pageId: string) => void;
  duplicateSelected: () => void;
  alignElements: (alignment: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom' | 'distributeV' | 'equalWidth') => void;
  bringToFront: () => void;
  sendToBack: () => void;
  setCropTarget: (elementId: string | null) => void;
  applyCrop: (elementId: string, cropRect: CropRect) => void;
}

let idCounter = 0;
export function generateId(): string {
  return `id-${Date.now()}-${idCounter++}`;
}

const initialPageId = generateId();

export const useStore = create<AppState>((set, get) => ({
  images: new Map(),
  pages: [{ id: initialPageId, elements: [] }],
  selectedElementIds: new Set(),
  activePageId: initialPageId,
  cropTargetElementId: null,

  addImage: (img) =>
    set((state) => {
      const images = new Map(state.images);
      images.set(img.id, img);
      return { images };
    }),

  addPage: () => {
    const id = generateId();
    set((state) => ({
      pages: [...state.pages, { id, elements: [] }],
    }));
  },

  removePage: (pageId) =>
    set((state) => {
      if (state.pages.length <= 1) return state;
      const pages = state.pages.filter((p) => p.id !== pageId);
      const activePageId =
        state.activePageId === pageId ? pages[0].id : state.activePageId;
      return { pages, activePageId };
    }),

  movePageUp: (pageId) =>
    set((state) => {
      const idx = state.pages.findIndex((p) => p.id === pageId);
      if (idx <= 0) return state;
      const pages = [...state.pages];
      [pages[idx - 1], pages[idx]] = [pages[idx], pages[idx - 1]];
      return { pages };
    }),

  movePageDown: (pageId) =>
    set((state) => {
      const idx = state.pages.findIndex((p) => p.id === pageId);
      if (idx < 0 || idx >= state.pages.length - 1) return state;
      const pages = [...state.pages];
      [pages[idx], pages[idx + 1]] = [pages[idx + 1], pages[idx]];
      return { pages };
    }),

  addElement: (pageId, element) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, elements: [...p.elements, element] } : p
      ),
    })),

  updateElement: (pageId, elementId, updates) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              elements: p.elements.map((e) =>
                e.id === elementId ? { ...e, ...updates } : e
              ),
            }
          : p
      ),
    })),

  removeElement: (pageId, elementId) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, elements: p.elements.filter((e) => e.id !== elementId) }
          : p
      ),
      selectedElementIds: (() => {
        const s = new Set(state.selectedElementIds);
        s.delete(elementId);
        return s;
      })(),
    })),

  removeSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.size === 0) return;
    set({
      pages: state.pages.map((p) => ({
        ...p,
        elements: p.elements.filter((e) => !state.selectedElementIds.has(e.id)),
      })),
      selectedElementIds: new Set(),
    });
  },

  setSelection: (ids) => set({ selectedElementIds: ids }),

  toggleSelection: (id) =>
    set((state) => {
      const s = new Set(state.selectedElementIds);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return { selectedElementIds: s };
    }),

  clearSelection: () => set({ selectedElementIds: new Set() }),

  setActivePage: (pageId) => set({ activePageId: pageId }),

  duplicateSelected: () => {
    const state = get();
    if (state.selectedElementIds.size === 0) return;
    const newIds = new Set<string>();
    const pages = state.pages.map((p) => {
      const newElements: PageElement[] = [];
      for (const el of p.elements) {
        if (state.selectedElementIds.has(el.id)) {
          const newId = generateId();
          newElements.push({
            ...el,
            id: newId,
            x: el.x + 40,
            y: el.y + 40,
          });
          newIds.add(newId);
        }
      }
      return { ...p, elements: [...p.elements, ...newElements] };
    });
    set({ pages, selectedElementIds: newIds });
  },

  alignElements: (alignment) => {
    const state = get();
    if (state.selectedElementIds.size < 2 && alignment !== 'equalWidth') return;
    const activePage = state.pages.find((p) => p.id === state.activePageId);
    if (!activePage) return;

    const selected = activePage.elements.filter((e) =>
      state.selectedElementIds.has(e.id)
    );
    if (selected.length < 2 && alignment !== 'equalWidth') return;

    let updates: Record<string, Partial<PageElement>> = {};

    switch (alignment) {
      case 'left': {
        const minX = Math.min(...selected.map((e) => e.x));
        for (const e of selected) updates[e.id] = { x: minX };
        break;
      }
      case 'centerH': {
        const centers = selected.map((e) => e.x + e.width / 2);
        const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
        for (const e of selected) updates[e.id] = { x: avgCenter - e.width / 2 };
        break;
      }
      case 'right': {
        const maxRight = Math.max(...selected.map((e) => e.x + e.width));
        for (const e of selected) updates[e.id] = { x: maxRight - e.width };
        break;
      }
      case 'top': {
        const minY = Math.min(...selected.map((e) => e.y));
        for (const e of selected) updates[e.id] = { y: minY };
        break;
      }
      case 'centerV': {
        const centers = selected.map((e) => e.y + e.height / 2);
        const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
        for (const e of selected) updates[e.id] = { y: avgCenter - e.height / 2 };
        break;
      }
      case 'bottom': {
        const maxBottom = Math.max(...selected.map((e) => e.y + e.height));
        for (const e of selected) updates[e.id] = { y: maxBottom - e.height };
        break;
      }
      case 'distributeV': {
        if (selected.length < 3) return;
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalHeight = sorted.reduce((s, e) => s + e.height, 0);
        const totalSpace = (last.y + last.height - first.y) - totalHeight;
        const gap = totalSpace / (sorted.length - 1);
        let currentY = first.y;
        for (const e of sorted) {
          updates[e.id] = { y: currentY };
          currentY += e.height + gap;
        }
        break;
      }
      case 'equalWidth': {
        if (selected.length < 2) return;
        const maxW = Math.max(...selected.map((e) => e.width));
        for (const e of selected) {
          const img = state.images.get(e.imageId);
          if (!img) continue;
          const aspect = img.width / img.height;
          updates[e.id] = { width: maxW, height: maxW / aspect };
        }
        break;
      }
    }

    set({
      pages: state.pages.map((p) =>
        p.id === state.activePageId
          ? {
              ...p,
              elements: p.elements.map((e) =>
                updates[e.id] ? { ...e, ...updates[e.id] } : e
              ),
            }
          : p
      ),
    });
  },

  bringToFront: () => {
    const state = get();
    if (state.selectedElementIds.size === 0 || !state.activePageId) return;
    set({
      pages: state.pages.map((p) =>
        p.id === state.activePageId
          ? {
              ...p,
              elements: [
                ...p.elements.filter((e) => !state.selectedElementIds.has(e.id)),
                ...p.elements.filter((e) => state.selectedElementIds.has(e.id)),
              ],
            }
          : p
      ),
    });
  },

  sendToBack: () => {
    const state = get();
    if (state.selectedElementIds.size === 0 || !state.activePageId) return;
    set({
      pages: state.pages.map((p) =>
        p.id === state.activePageId
          ? {
              ...p,
              elements: [
                ...p.elements.filter((e) => state.selectedElementIds.has(e.id)),
                ...p.elements.filter((e) => !state.selectedElementIds.has(e.id)),
              ],
            }
          : p
      ),
    });
  },

  setCropTarget: (elementId) => set({ cropTargetElementId: elementId }),

  applyCrop: (elementId, cropRect) => {
    const state = get();

    // Find the element and its page
    let targetPage: Page | undefined;
    let targetElement: PageElement | undefined;
    for (const page of state.pages) {
      const el = page.elements.find((e) => e.id === elementId);
      if (el) {
        targetPage = page;
        targetElement = el;
        break;
      }
    }
    if (!targetPage || !targetElement) return;

    const imgData = state.images.get(targetElement.imageId);
    if (!imgData) return;

    // Create offscreen canvas to crop the image
    const img = new window.Image();
    img.src = imgData.dataUrl;

    const offscreen = document.createElement('canvas');
    offscreen.width = cropRect.w;
    offscreen.height = cropRect.h;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img,
      cropRect.x, cropRect.y, cropRect.w, cropRect.h,
      0, 0, cropRect.w, cropRect.h
    );

    const croppedDataUrl = offscreen.toDataURL('image/png');

    // Overwrite the original image in-place
    const images = new Map(state.images);
    images.set(imgData.id, {
      ...imgData,
      dataUrl: croppedDataUrl,
      width: cropRect.w,
      height: cropRect.h,
    });

    // Compute new element dimensions keeping current display width
    const currentWidth = targetElement.width;
    const croppedAspect = cropRect.w / cropRect.h;
    const newHeight = currentWidth / croppedAspect;

    set({
      images,
      cropTargetElementId: null,
      pages: state.pages.map((p) =>
        p.id === targetPage!.id
          ? {
              ...p,
              elements: p.elements.map((e) =>
                e.id === elementId
                  ? { ...e, width: currentWidth, height: newHeight }
                  : e
              ),
            }
          : p
      ),
    });
  },
}));
