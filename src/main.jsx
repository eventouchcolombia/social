import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'aframe'
import 'mind-ar/dist/mindar-face-aframe.prod.js'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
