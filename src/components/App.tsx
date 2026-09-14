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
import BodyWeightDetail from './BodyWeightDetail'
import ReviewsDetail from './ReviewsDetail'

type DetailPage = { type: 'lift'; liftId: LiftId } | { type: 'bodyWeight' } | { type: 'reviews' }

export default function App() {
  const app = useAppState()
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [showSplash, setShowSplash] = useState(true)
  // Held back until the splash finishes so the request doesn't compete with its animation
  useWakeLock(!showSplash)

  const dismissSplash = useCallback(() => setShowSplash(false), [])

  // Detail pages are shown over the current tab, which stays mounted (hidden) so an
  // in-progress workout and its rest timer carry on underneath.
  const [detail, setDetail] = useState<DetailPage | null>(null)
  const savedScroll = useRef(0)
  const isDetailOpen = detail !== null

  const openDetail = useCallback((page: DetailPage) => {
    savedScroll.current = window.scrollY
    setDetail(page)
  }, [])
  const openLiftDetail = useCallback((liftId: LiftId) => openDetail({ type: 'lift', liftId }), [openDetail])
  const openBodyWeight = useCallback(() => openDetail({ type: 'bodyWeight' }), [openDetail])
  const openReviews = useCallback(() => openDetail({ type: 'reviews' }), [openDetail])
  const closeDetail = useCallback(() => setDetail(null), [])

  useLayoutEffect(() => {
    window.scrollTo(0, isDetailOpen ? 0 : savedScroll.current)
  }, [isDetailOpen])

  function changeTab(tab: TabId) {
    savedScroll.current = 0
    setDetail(null)
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
      <div hidden={isDetailOpen}>
      {activeTab === 'today' && app.prescription && (
        <Today
          state={app.state}
          prescription={app.prescription}
          onCompleteWorkout={app.completeWorkout}
          onCompleteFunctionalWorkout={app.completeFunctionalWorkout}
          onOpenLift={openLiftDetail}
          onOpenBodyWeight={openBodyWeight}
          onSaveBodyWeight={app.saveBodyWeight}
        />
      )}
      {activeTab === 'history' && (
        <History
          state={app.state}
          onEditWorkout={app.editWorkout}
          onDeleteWorkout={app.deleteWorkout}
          onEditFunctionalWorkout={app.editFunctionalWorkout}
          onDeleteFunctionalWorkout={app.deleteFunctionalWorkout}
        />
      )}
      {activeTab === 'progress' && (
        <Progress
          state={app.state}
          onOpenLift={openLiftDetail}
          onOpenBodyWeight={openBodyWeight}
          onSaveBodyWeight={app.saveBodyWeight}
          onOpenReviews={openReviews}
        />
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
      {detail?.type === 'lift' && (
        <LiftDetail liftId={detail.liftId} state={app.state} onBack={closeDetail} />
      )}
      {detail?.type === 'bodyWeight' && (
        <BodyWeightDetail
          state={app.state}
          onSave={app.saveBodyWeight}
          onDelete={app.deleteBodyWeight}
          onBack={closeDetail}
        />
      )}
      {detail?.type === 'reviews' && (
        <ReviewsDetail
          state={app.state}
          onSave={app.saveReview}
          onDelete={app.deleteReview}
          onBack={closeDetail}
        />
      )}
      <NavBar activeTab={activeTab} onTabChange={changeTab} />
    </div>
  )
}
