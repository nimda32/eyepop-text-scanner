import { createRoot } from 'react-dom/client'
import { createApp } from './base.jsx'
import './components/eyepop.min.js';

const root = createRoot(document.getElementById('root'))
root.render(createApp())
