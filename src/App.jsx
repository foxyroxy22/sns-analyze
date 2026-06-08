import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import SettingsButton from './components/SettingsButton'
import Dashboard     from './pages/Dashboard'
import InstagramPage from './pages/InstagramPage'
import YouTubePage   from './pages/YouTubePage'
import ComparePage   from './pages/ComparePage'
import ReportPage    from './pages/ReportPage'
import Settings      from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter basename="/SNS-ANALYZE">
      <div style={{ paddingBottom: 80 }}>
        <SettingsButton />
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/instagram" element={<InstagramPage />} />
          <Route path="/youtube"   element={<YouTubePage />} />
          <Route path="/compare"   element={<ComparePage />} />
          <Route path="/report"    element={<ReportPage />} />
          <Route path="/settings"  element={<Settings />} />
        </Routes>
      </div>
      <TabBar />
    </BrowserRouter>
  )
}
