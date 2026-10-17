import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installInteractionTracking } from './utils/analytics';

const stopInteractionTracking = installInteractionTracking();
if (import.meta.hot) import.meta.hot.dispose(stopInteractionTracking);

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
