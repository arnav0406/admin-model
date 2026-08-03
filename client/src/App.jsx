import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import AdminLogin from './components/AdminLogin'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import DocumentsTable from './components/DocumentsTable'
import UsersTable from './components/UsersTable'
import UserProfile from './components/UserProfile'
import AuditLog from './components/AuditLog'

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<AdminLogin />} />

                        <Route path="/" element={
                            <ProtectedRoute>
                                {(admin) => (
                                    <Layout admin={admin}>
                                        <Dashboard />
                                    </Layout>
                                )}
                            </ProtectedRoute>
                        } />

                        <Route path="/documents" element={
                            <ProtectedRoute>
                                {(admin) => (
                                    <Layout admin={admin}>
                                        <DocumentsTable />
                                    </Layout>
                                )}
                            </ProtectedRoute>
                        } />

                        <Route path="/users" element={
                            <ProtectedRoute>
                                {(admin) => (
                                    <Layout admin={admin}>
                                        <UsersTable />
                                    </Layout>
                                )}
                            </ProtectedRoute>
                        } />

                        <Route path="/users/:id" element={
                            <ProtectedRoute>
                                {(admin) => (
                                    <Layout admin={admin}>
                                        <UserProfile />
                                    </Layout>
                                )}
                            </ProtectedRoute>
                        } />

                        <Route path="/audit" element={
                            <ProtectedRoute>
                                {(admin) => (
                                    <Layout admin={admin}>
                                        <AuditLog />
                                    </Layout>
                                )}
                            </ProtectedRoute>
                        } />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </ThemeProvider>
    )
}

export default App
