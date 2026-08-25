import './index.css'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/minhas-tarefas" element={<MinhasTarefas />} />
        <Route path="/projetos" element={<Projetos />} />
        <Route path="/labels" element={<Labels />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Route>
    </Routes>
    </BrowserRouter>
    <Toaster />
  </StrictMode>
)
