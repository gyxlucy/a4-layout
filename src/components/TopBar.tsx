import { useState } from 'react';
import { useStore } from '../store';
import { exportPdf } from '../utils/exportPdf';

export function TopBar() {
  const selectedCount = useStore((s) => s.selectedElementIds.size);
  const alignElements = useStore((s) => s.alignElements);
  const bringToFront = useStore((s) => s.bringToFront);
  const sendToBack = useStore((s) => s.sendToBack);
  const addPage = useStore((s) => s.addPage);
  const [filename, setFilename] = useState('layout');

  return (
    <div className="topbar">
      <h1>A4 Layout</h1>
      <div className="topbar-actions">
        {selectedCount >= 1 && (
          <div className="alignment-toolbar">
            <button className="btn btn-small" onClick={bringToFront} title="Bring to front ( ] )">
              Front
            </button>
            <button className="btn btn-small" onClick={sendToBack} title="Send to back ( [ )">
              Back
            </button>
          </div>
        )}
        {selectedCount >= 2 && (
          <div className="alignment-toolbar">
            <button className="btn btn-small" onClick={() => alignElements('left')} title="Align left">
              L
            </button>
            <button className="btn btn-small" onClick={() => alignElements('centerH')} title="Align center horizontally">
              CH
            </button>
            <button className="btn btn-small" onClick={() => alignElements('right')} title="Align right">
              R
            </button>
            <button className="btn btn-small" onClick={() => alignElements('top')} title="Align top">
              T
            </button>
            <button className="btn btn-small" onClick={() => alignElements('centerV')} title="Align center vertically">
              CV
            </button>
            <button className="btn btn-small" onClick={() => alignElements('bottom')} title="Align bottom">
              B
            </button>
            <button className="btn btn-small" onClick={() => alignElements('distributeV')} title="Distribute vertically">
              DV
            </button>
            <button className="btn btn-small" onClick={() => alignElements('equalWidth')} title="Equal width">
              EW
            </button>
          </div>
        )}
        <button className="btn" onClick={addPage}>
          + Add Page
        </button>
        <input
          className="filename-input"
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="filename"
        />
        <button className="btn btn-primary" onClick={() => exportPdf(filename || 'layout')}>
          Export PDF
        </button>
      </div>
    </div>
  );
}
