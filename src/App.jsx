import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import SettingsButton from './components/SettingsButton'
import Dashboard     from './pages/Dashboard'
import InstagramPage from './pages/InstagramPage'
import YouTubePage   from './pages/YouTubePage'
import AnalyzePage   from './pages/AnalyzePage'
import ReportPage    from './pages/ReportPage'
import Settings      from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter basename="/sns-analyze">
      <div style={{ paddingBottom: 80 }}>
        <SettingsButton />
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/instagram" element={<InstagramPage />} />
          <Route path="/youtube"   element={<YouTubePage />} />
          <Route path="/analyze"   element={<AnalyzePage />} />
          <Route path="/report"    element={<ReportPage />} />
          <Route path="/settings"  element={<Settings />} />
        </Routes>
      </div>
      <TabBar />
    </BrowserRouter>
  )
}
