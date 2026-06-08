/**
 * Mirror of the Arduino logic in src/main.cpp
 * Same thresholds and detection algorithm.
 */

const UMBRAL_HUM  = 80.0   // % → fog detected → green LEDs ON
const UMBRAL_DIST = 150.0  // cm → vehicle in zone
const UMBRAL_DET  = 3.0    // cm → max variation to consider vehicle stopped
const N_HIST      = 5      // readings stored for stopped detection

export interface LogicResult {
  ledGreen: boolean
  ledYellow: boolean
  ledRed: boolean
  vehicleMoving: boolean
  vehicleStopped: boolean
}

export class ArduinoLogic {
  private distHist: number[] = new Array(N_HIST).fill(0)
  private dIdx = 0
  private dFull = false

  resetDistHist() {
    this.distHist.fill(0)
    this.dIdx = 0
    this.dFull = false
  }

  /** Force-fill history so next run() immediately detects stopped vehicle */
  forceReading(d: number) {
    this.distHist.fill(d)
    this.dIdx = 0
    this.dFull = true
  }

  private addDistReading(d: number) {
    this.distHist[this.dIdx] = d
    this.dIdx = (this.dIdx + 1) % N_HIST
    if (this.dIdx === 0) this.dFull = true
  }

  private isVehicleStopped(): boolean {
    if (!this.dFull) return false
    const min = Math.min(...this.distHist)
    const max = Math.max(...this.distHist)
    return (max - min) <= UMBRAL_DET
  }

  run(hum: number, dist: number): LogicResult {
    const ledGreen = hum > UMBRAL_HUM

    if (dist < 0 || dist > UMBRAL_DIST) {
      this.resetDistHist()
      return { ledGreen, ledYellow: false, ledRed: false, vehicleMoving: false, vehicleStopped: false }
    }

    this.addDistReading(dist)

    if (this.isVehicleStopped()) {
      return { ledGreen, ledYellow: false, ledRed: true, vehicleMoving: false, vehicleStopped: true }
    }

    return { ledGreen, ledYellow: true, ledRed: false, vehicleMoving: true, vehicleStopped: false }
  }
}
