import { Routes, Route } from 'react-router-dom'
import { useSimContext }  from './context/SimContext'
import { Header }         from './components/Header/Header'
import { RiskBanner }    from './components/RiskBanner/RiskBanner'
import { SensorCard }    from './components/SensorCard/SensorCard'
import { LEDPanel }      from './components/LEDPanel/LEDPanel'
import { AlertFeed }     from './components/AlertFeed/AlertFeed'
import { SvgChart }      from './components/SvgChart/SvgChart'
import { SerialLog }     from './components/SerialLog/SerialLog'
import { PaginaAlertas } from './pages/Alertas/PaginaAlertas'
import { PaginaRegistros } from './pages/Registros/PaginaRegistros'

function WaitingScreen({ wsStatus }: { wsStatus: 'connecting' | 'connected' | 'disconnected' }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
      {wsStatus === 'disconnected' ? (
        <>
          <span className="text-3xl">⚠</span>
          <p className="text-sm font-semibold text-gray-700">Bridge no disponible</p>
          <p className="text-xs text-gray-400 max-w-xs">
            Inicia el sistema con <code className="bg-gray-100 px-1 rounded">docker compose up -d</code> y recarga la página.
          </p>
        </>
      ) : (
        <>
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-700">Esperando señal del Arduino…</p>
          <p className="text-xs text-gray-400 max-w-xs">
            Conecta el Arduino por USB. Los datos aparecerán en cuanto el bridge detecte el puerto serie.
          </p>
        </>
      )}
    </div>
  )
}

function Dashboard() {
  const { uiState, logs, alerts, history, wsStatus, wsHasData } = useSimContext()
  const { sensors, leds, riskLevel } = uiState

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <Header />

      {!wsHasData ? (
        <WaitingScreen wsStatus={wsStatus} />
      ) : (
        <main className="flex-1 p-4 flex flex-col gap-4 max-w-[1440px] mx-auto w-full">
          <RiskBanner level={riskLevel} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SensorCard label="Humedad"     value={sensors.hum}  unit="%"  max={100}  barColor="bg-blue-500"    invalid={sensors.hum  <= 0} />
            <SensorCard label="Distancia"   value={sensors.dist} unit="cm" max={400}  barColor="bg-cyan-500"    invalid={sensors.dist <= 0} />
            <SensorCard label="Luminosidad" value={sensors.lux}  unit="lx" max={1000} barColor="bg-violet-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LEDPanel leds={leds} />
            <AlertFeed alerts={alerts} />
          </div>

          <SvgChart hum={history.hum} dist={history.dist} />
          <SerialLog logs={logs} />
        </main>
      )}

      <footer className="border-t border-gray-200 bg-white px-6 py-3 flex justify-between items-center">
        <span className="text-xs text-gray-400">Grupo 5 · BetaMentes · UCN 2025</span>
        <span className="text-xs text-gray-400">Ruta 5 Norte — La Serena / Coquimbo</span>
      </footer>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/"          element={<Dashboard />} />
      <Route path="/alertas"   element={<PaginaAlertas />} />
      <Route path="/registros" element={<PaginaRegistros />} />
    </Routes>
  )
}
