import { useState, useCallback, useLayoutEffect, useRef } from 'react'
import type { LiftId } from '../model/types'
import { useAppState } from '../hooks/useAppState'
import { useWakeLock } from '../hooks/useWakeLock'
import NavBar, { type TabId } from '../ui/NavBar'
import SplashScreen from './SplashScreen'
import Setup from './Setup'
import Today from './Today'
import History from './History'
import Progress from './Progress'
import Settings from './Settings'
import LiftDetail from './LiftDetail'

export default function App() {
  const app = useAppState()
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [showSplash, setShowSplash] = useState(true)
  // Held back until the splash finishes so the request doesn't compete with its animation
  useWakeLock(!showSplash)

  const dismissSplash = useCallback(() => setShowSplash(false), [])

  // The lift page is shown over the current tab, which stays mounted (hidden) so an
  // in-progress workout and its rest timer carry on underneath.
  const [openLift, setOpenLift] = useState<LiftId | null>(null)
  const savedScroll = useRef(0)

  const openLiftDetail = useCallback((liftId: LiftId) => {
    savedScroll.current = window.scrollY
    setOpenLift(liftId)
  }, [])

  useLayoutEffect(() => {
    window.scrollTo(0, openLift ? 0 : savedScroll.current)
  }, [openLift])

  function changeTab(tab: TabId) {
    savedScroll.current = 0
    setOpenLift(null)
    setActiveTab(tab)
  }

  if (showSplash) {
    return <SplashScreen onDone={dismissSplash} />
  }

  if (app.isSetupRequired || !app.state) {
    return <Setup onComplete={app.initializeApp} />
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20 safe-area-pt">
      <div hidden={openLift !== null}>
      {activeTab === 'today' && app.prescription && (
        <Today
          state={app.state}
          prescription={app.prescription}
          onCompleteWorkout={app.completeWorkout}
          onOpenLift={openLiftDetail}
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
        <Progress state={app.state} onOpenLift={openLiftDetail} />
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
      </div>
      {openLift && (
        <LiftDetail liftId={openLift} state={app.state} onBack={() => setOpenLift(null)} />
      )}
      <NavBar activeTab={activeTab} onTabChange={changeTab} />
    </div>
  )
}
