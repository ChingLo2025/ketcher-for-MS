import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// No StrictMode: Ketcher initialises imperatively and double-mounting creates duplicate editors.
createRoot(document.getElementById('root')!).render(<App />);
