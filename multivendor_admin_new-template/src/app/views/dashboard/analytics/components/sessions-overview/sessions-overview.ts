import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { getColor } from '@/app/utils/string'
import { Component, ViewChild } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { ApexOptions } from 'ng-apexcharts'
import { sessionData, SessionType } from '../../data'

@Component({
  selector: 'app-sessions-overview',
  imports: [Icon, RouterLink, NgbNavModule, Apexchart],
  templateUrl: './sessions-overview.html',
  styles: ``,
})
export class SessionsOverview {
  @ViewChild(Apexchart) apex!: Apexchart

  sessionData = sessionData

  activeTab: SessionType['tabId'] = 'users'

  chartData = (() => {
    const initialData = this.generateRandomSeries(30)
    return {
      visitors: initialData.map((item) => item - 4),
      views: initialData,
    }
  })()

  formatters: Partial<Record<SessionType['tabId'], (val: number) => string>> = {
    users: (val) => `${val}k`,
    sessions: (val) => `${val}k`,
    bounce: (val) => `${val}%`,
    duration: (val) => {
      const mins = Math.floor(val / 60)
      const secs = val % 60
      return `${mins}m ${secs}s`
    },
  }

  generateRandomSeries(length: number, min = 18, max = 24): number[] {
    const data: number[] = []
    for (let i = 0; i < length; i++) {
      data.push(Math.floor(Math.random() * (max - min + 1)) + min)
    }
    return data
  }

  sessionsOverviewChart = (): ApexOptions => {
    return {
      series: [
        {
          name: 'Visitors',
          data: this.chartData.visitors,
        },
        {
          name: 'Page Views',
          data: this.chartData.views,
        },
      ],

      chart: {
        type: 'area',
        height: 328,
        toolbar: { show: false },
      },

      stroke: {
        width: [2, 2],
        dashArray: [0, 5],
        curve: 'smooth',
      },

      colors: [getColor('chart-primary'), getColor('chart-gamma')],

      grid: {
        strokeDashArray: 7,
      },

      xaxis: {
        type: 'category',
        axisBorder: { show: false },
        labels: { offsetY: 2 },
      },

      yaxis: {
        tickAmount: 3,
        min: 0,
        labels: {
          formatter: (val: number) => this.formatters[this.activeTab]?.(val) ?? val.toString(),
          offsetX: -10,
        },
      },

      legend: { show: false },

      dataLabels: { enabled: false },

      tooltip: {
        y: {
          formatter: (val: number) => this.formatters[this.activeTab]?.(val) ?? val.toString(),
        },
      },

      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0,
          stops: [0, 95],
        },
      },
    }
  }

  handleTabChange(tab: SessionType['tabId']) {
    if (tab === this.activeTab) return

    this.activeTab = tab
    const data = this.generateRandomSeries(30)

    this.chartData = {
      visitors: data.map((item) => item - 4),
      views: data,
    }
    this.apex.updateSeries([
      { name: 'Visitors', data: this.chartData.visitors },
      { name: 'Page Views', data: this.chartData.views },
    ])
  }
}
