import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import PolicyPage from './pages/PolicyPage.tsx'
import PrivacyPage from './pages/PrivacyPage.tsx'
import TermsPage from './pages/TermsPage.tsx'
import AdminPage from './pages/admin/AdminPage.tsx'
import SuccessPage from './pages/SuccessPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/politique" element={<PolicyPage />} />
        <Route path="/confidentialite" element={<PrivacyPage />} />
        <Route path="/conditions" element={<TermsPage />} />
        <Route path="/0x" element={<AdminPage />} />
        <Route path="/merci" element={<SuccessPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
