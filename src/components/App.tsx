import { useState, useCallback } from 'react'
import { useAppState } from '../hooks/useAppState'
import { useWakeLock } from '../hooks/useWakeLock'
import NavBar, { type TabId } from '../ui/NavBar'
import SplashScreen from './SplashScreen'
import Setup from './Setup'
import Today from './Today'
import History from './History'
import Progress from './Progress'
import Settings from './Settings'

export default function App() {
  const app = useAppState()
  useWakeLock()
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [showSplash, setShowSplash] = useState(true)

  const dismissSplash = useCallback(() => setShowSplash(false), [])

  if (showSplash) {
    return <SplashScreen onDone={dismissSplash} />
  }

  if (app.isSetupRequired || !app.state) {
    return <Setup onComplete={app.initializeApp} />
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20 safe-area-pt">
      {activeTab === 'today' && app.prescription && (
        <Today
          state={app.state}
          prescription={app.prescription}
          onCompleteWorkout={app.completeWorkout}
        />
      )}
      {activeTab === 'history' && (
        <History
          state={app.state}
          onEditWorkout={app.editWorkout}
          onDeleteWorkout={app.deleteWorkout}
        />
      )}
      {activeTab === 'progress' && (
        <Progress state={app.state} />
      )}
      {activeTab === 'settings' && (
        <Settings
          state={app.state}
          onUpdateSettings={app.updateSettings}
          onUpdateLiftWeight={app.updateLiftWeight}
          onConvertUnits={app.convertUnits}
          onExport={app.exportState}
          onReplaceState={app.replaceState}
          onReset={app.resetApp}
        />
      )}
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
