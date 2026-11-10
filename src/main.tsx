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
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Login from './pages/login.tsx'
import Dashboard from './pages/dashboard.tsx'
import { Toaster } from 'sonner'
import Projetos from './pages/projetos.tsx'
import Projeto from './pages/projeto.tsx'
import MinhasTarefas from './pages/minhas-tarefas.tsx'
import Tarefas from './pages/tarefas.tsx'
import Tarefa from './pages/tarefa.tsx'
import Labels from './pages/labels.tsx'
import Usuarios from './pages/usuarios.tsx'
import Status from './pages/status.tsx'
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
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/minhas-tarefas" element={
              <ProtectedRoute>
                <MinhasTarefas />
              </ProtectedRoute>
            } />

            <Route path="/tarefas" element={
              <ProtectedRoute>
                <Tarefas />
              </ProtectedRoute>
            } />

            <Route path="/tarefas/:id" element={
              <ProtectedRoute>
                <Tarefa />
              </ProtectedRoute>
            } />

            <Route path="/projetos" element={
              <ProtectedRoute>
                <Projetos />
              </ProtectedRoute>
            } />

            <Route path="/projetos/:id" element={
              <ProtectedRoute>
                <Projeto />
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

            {/* cadastro de status: uma rota por tipo; o tipo vem da rota (RF-42) */}
            <Route path="/status/tarefa" element={
              <ProtectedRoute>
                <Status key="tarefa" tipo="tarefa" />
              </ProtectedRoute>
            } />

            <Route path="/status/projeto" element={
              <ProtectedRoute>
                <Status key="projeto" tipo="projeto" />
              </ProtectedRoute>
            } />

            <Route path="/status/*" element={<Navigate to="/status/tarefa" replace />} />

          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    <Toaster />
  </StrictMode>
)
