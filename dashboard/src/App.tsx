import { Routes, Route } from 'react-router-dom'
import { useSimContext }  from './context/SimContext'
import { Header }         from './components/Header/Header'
import { RiskBanner }    from './components/RiskBanner/RiskBanner'
import { SensorCard }    from './components/SensorCard/SensorCard'
import { LEDPanel }      from './components/LEDPanel/LEDPanel'
import { Controls }      from './components/Controls/Controls'
import { AlertFeed }     from './components/AlertFeed/AlertFeed'
import { SvgChart }      from './components/SvgChart/SvgChart'
import { SerialLog }     from './components/SerialLog/SerialLog'
import { PaginaAlertas }    from './pages/Alertas/PaginaAlertas'
import { PaginaSimulacion } from './pages/Simulacion/PaginaSimulacion'

function Dashboard() {
  const { uiState, logs, alerts, history, setScene, toggleAuto, setSliders } = useSimContext()
  const { sensors, leds, riskLevel, autoMode } = uiState

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Header />

      <main className="flex-1 p-4 flex flex-col gap-4 max-w-[1440px] mx-auto w-full">
        <RiskBanner level={riskLevel} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SensorCard icon="💧" label="Humedad"     value={sensors.hum}  unit="%"  max={100}  barColor="bg-blue-500" />
          <SensorCard icon="📡" label="Distancia"   value={sensors.dist} unit="cm" max={400}  barColor="bg-cyan-500"   invalid={sensors.dist <= 0} />
          <SensorCard icon="🌡️" label="Temperatura" value={sensors.temp} unit="°C" max={50}   barColor="bg-orange-500" decimal />
          <SensorCard icon="☀️" label="Luminosidad" value={sensors.lux}  unit="lx" max={1000} barColor="bg-violet-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LEDPanel leds={leds} />
          <Controls
            autoMode={autoMode}
            sensors={sensors}
            onToggleAuto={toggleAuto}
            onScene={setScene}
            onSliders={setSliders}
          />
          <AlertFeed alerts={alerts} />
        </div>

        <SvgChart hum={history.hum} dist={history.dist} />
        <SerialLog logs={logs} />
      </main>

      <footer className="border-t border-zinc-800 px-6 py-3 flex justify-between items-center">
        <span className="text-xs text-zinc-600">Grupo 5 · BetaMentes · UCN 2025</span>
        <span className="text-xs text-zinc-600">Ruta 5 Norte — La Serena / Coquimbo</span>
      </footer>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/"           element={<Dashboard />} />
      <Route path="/alertas"    element={<PaginaAlertas />} />
      <Route path="/simulacion" element={<PaginaSimulacion />} />
    </Routes>
  )
}
