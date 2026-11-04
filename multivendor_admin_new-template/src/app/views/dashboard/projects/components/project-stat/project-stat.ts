import { Icon } from '@/app/components/icon/icon'
import { Component, signal } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { projectStatData } from '../../data'

@Component({
  selector: 'app-project-stat',
  imports: [Icon, CountUpDirective],
  templateUrl: './project-stat.html',
  styles: ``,
})
export class ProjectStat {
  projectStatData = projectStatData
  Number = Number

  time = signal('05:30:57')
  isRunning = signal(false)
  private intervalId: any
  private currentSeconds = 0

  constructor() {
    this.currentSeconds = this.timeToSeconds(this.time())
  }

  toggleTracker(): void {
    if (this.isRunning()) {
      this.stopTracker()
    } else {
      this.startTracker()
    }
  }

  private startTracker() {
    this.isRunning.set(true)

    this.intervalId = setInterval(() => {
      this.currentSeconds++
      this.time.set(this.formatTime(this.currentSeconds))
    }, 1000)
  }

  private stopTracker() {
    this.isRunning.set(false)
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private timeToSeconds(timeStr: string): number {
    const [h, m, s] = timeStr.split(':').map(Number)
    return h * 3600 + m * 60 + s
  }

  private formatTime(seconds: number): string {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId)
  }
}
