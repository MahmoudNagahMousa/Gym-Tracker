import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { AppProvider } from './context/AppContext.jsx'
import PlanEditorPage from './pages/PlanEditorPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import TimerPage from './pages/TimerPage.jsx'
import WorkoutPage from './pages/WorkoutPage.jsx'

/**
 * HashRouter (مش BrowserRouter) لأن GitHub Pages مابيعرفش يعمل rewrite للروابط،
 * فأي refresh على /workout هيرجع 404. الـ hash (#/workout) بيشتغل دايماً.
 */
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ProfilePage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/plan" element={<PlanEditorPage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
