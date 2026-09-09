import './index.css'

// Space Grotesk: marca, títulos de tela, títulos de dialog e de cartão
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'

// IBM Plex Sans: interface e corpo
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'

// IBM Plex Mono: rótulos em caixa alta, ids, datas, contagens, iniciais de avatar
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Login from './pages/login.tsx'
import App from './App.tsx'
import { Toaster } from 'sonner'
import Projetos from './pages/projetos.tsx'
import MinhasTarefas from './pages/minhas-tarefas.tsx'
import Labels from './pages/labels.tsx'
import Usuarios from './pages/usuarios.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider>
    <Routes>
      <Route>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
          <App />
          </ProtectedRoute>
          } />

        <Route path="/minhas-tarefas" element={
          <ProtectedRoute>
            <MinhasTarefas />
          </ProtectedRoute>
        } />

        <Route path="/projetos" element={
          <ProtectedRoute>
            <Projetos />
          </ProtectedRoute>
        } />

        <Route path="/labels" element={
          <ProtectedRoute>
            <Labels />
          </ProtectedRoute>
        } />

        <Route path="/usuarios" element={
          <ProtectedRoute>
            <Usuarios />
          </ProtectedRoute>
        } />
        
      </Route>
    </Routes>
    </AuthProvider>
    </BrowserRouter>
    <Toaster />
  </StrictMode>
)
