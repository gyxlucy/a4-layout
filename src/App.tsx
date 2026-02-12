import './App.css';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CanvasArea } from './components/CanvasArea';
import { CropModal } from './components/CropModal';

export default function App() {
  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <Sidebar />
        <CanvasArea />
      </div>
      <CropModal />
    </div>
  );
}
