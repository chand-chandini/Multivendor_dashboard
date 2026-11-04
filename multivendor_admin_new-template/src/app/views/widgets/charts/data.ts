import { getColor } from '@/app/utils/string'
import { ApexOptions } from 'ng-apexcharts'

export type StatType = {
  title: string
  value: number
  suffix: string
  prefix?: string
  icon: string
  change: number
  label: string
  chartOptions?: () => ApexOptions
}

export const statData: StatType[] = [
  {
    title: 'Leads Generated',
    value: 48.2,
    suffix: 'k',
    icon: 'users',
    change: 5.12,
    label: '2.3k Up',
    chartOptions: () => ({
      chart: {
        type: 'area',
        height: 50,
        sparkline: {
          enabled: true,
        },
      },
      series: [
        {
          name: 'Leads',
          data: [25, 28, 32, 38, 43, 55, 60, 48, 42, 51, 35],
        },
      ],
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      markers: {
        size: 0,
      },
      colors: [getColor('chart-primary')],
      tooltip: {
        fixed: { enabled: false },
        x: { show: false },
        y: {
          title: {
            formatter: function () {
              return 'Leads'
            },
          },
        },
        marker: { show: false },
      },
      fill: {
        opacity: [1],
        type: ['gradient'],
        gradient: {
          type: 'vertical',
          inverseColors: false,
          opacityFrom: 0.5,
          opacityTo: 0,
          stops: [0, 100],
        },
      },
    }),
  },
  {
    title: 'Qualified Leads',
    value: 12.8,
    suffix: 'k',
    icon: 'user-check',
    change: -3.45,
    label: '0.4k Down',
    chartOptions: () => ({
      series: [70],
      chart: {
        type: 'radialBar',
        height: 90,
        width: 90,
      },
      stroke: {
        lineCap: 'round',
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '45%',
          },
          dataLabels: {
            show: false,
          },
        },
      },
      grid: {
        padding: {
          top: -20,
          bottom: -20,
          left: -20,
          right: -20,
        },
      },
      labels: ['Direct'],
      colors: [getColor('chart-primary')],
    }),
  },
  {
    title: 'Deals Closed',
    value: 9.75,
    suffix: 'k',
    icon: 'briefcase',
    change: 2.94,
    label: '1.1k Up',
    chartOptions: () => ({
      chart: {
        type: 'area',
        height: 50,
        sparkline: {
          enabled: true,
        },
      },
      series: [
        {
          name: 'Deals',
          data: [32, 45, 38, 52, 47, 66, 70, 64, 78, 72, 81],
        },
      ],
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      markers: {
        size: 0,
      },
      colors: [getColor('chart-primary'), getColor('chart-gamma'), getColor('chart-gray')],
      tooltip: {
        fixed: { enabled: false },
        x: { show: false },
        y: {
          title: {
            formatter: function () {
              return 'Leads'
            },
          },
        },
        marker: { show: false },
      },
      fill: {
        opacity: [1],
        type: ['gradient'],
        gradient: {
          type: 'vertical',
          //   shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.5,
          opacityTo: 0,
          stops: [0, 100],
        },
      },
    }),
  },
  {
    title: 'Revenue Generated',
    value: 5.63,
    prefix: '$',
    suffix: 'M',
    icon: 'currency-dollar',
    change: 4.21,
    label: '$32.4k Up',
    chartOptions: () => ({
      chart: {
        type: 'bar',
        height: 60,
        sparkline: {
          enabled: true,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 4,
        },
      },
      colors: [getColor('chart-primary')],
      series: [
        {
          name: 'Revenue',
          data: [47, 45, 74, 14, 56, 74, 14, 11, 7, 39, 82],
        },
      ],
      xaxis: {
        crosshairs: {
          width: 1,
        },
      },
      tooltip: {
        fixed: { enabled: false },
        x: { show: false },
        y: {
          formatter: (value: number): string => {
            return '$' + value
          },
          title: {
            formatter: function () {
              return 'Revenue'
            },
          },
        },
        marker: { show: false },
      },
    }),
  },
]

function generateRandomData(length = 12, min = 10, max = 100) {
  const data = []
  for (let i = 0; i < length; i++) {
    data.push(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return data
}

const revenueData = generateRandomData(12)
const expensesData = generateRandomData(12)
const profitData = generateRandomData(12)
const cashflowData = generateRandomData(12)

export type RevenueStatisticType = {
  title: string
  value: number
  prefix: string
  suffix: string
  label: string
  change: string
  className: string
  chartOptions?: () => ApexOptions
  reverse?: boolean
}

export const revenueStatisticData: RevenueStatisticType[] = [
  {
    title: 'Total Revenue',
    value: 1240,
    prefix: '$',
    suffix: 'K',
    label: 'This Quarter',
    change: '8.2%',
    className: 'bg-success-subtle text-success',
    chartOptions: () => ({
      chart: {
        type: 'bar',
        height: 60,
        sparkline: { enabled: true },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 4,
        },
      },
      colors: [getColor('chart-primary')],
      series: [
        {
          name: 'Revenue',
          data: revenueData,
        },
      ],
      tooltip: {
        x: { show: false },
        y: { formatter: (value: number): string => '$' + value },
      },
    }),
  },
  {
    title: 'Total Expenses',
    value: 840,
    prefix: '$',
    suffix: 'K',
    label: 'This Quarter',
    change: '-2.1%',
    className: 'bg-danger-subtle text-danger',
    chartOptions: () => ({
      chart: {
        type: 'line',
        height: 60,
        sparkline: { enabled: true },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 4,
        },
      },
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      colors: [getColor('chart-beta')],
      series: [
        {
          name: 'Expenses',
          data: expensesData,
        },
      ],
      tooltip: {
        x: { show: false },
        y: { formatter: (value: number): string => '$' + value },
      },
    }),
  },
  {
    title: 'Net Profit',
    value: 400,
    prefix: '$',
    suffix: 'K',
    label: 'This Quarter',
    change: 'Stable',
    className: 'bg-info-subtle text-info',
    chartOptions: () => ({
      chart: {
        type: 'bar',
        height: 60,
        sparkline: { enabled: true },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 4,
        },
      },
      colors: [getColor('chart-secondary')],
      series: [
        {
          name: 'Net Profit',
          data: profitData,
        },
      ],
      tooltip: {
        x: { show: false },
        y: { formatter: (value: number): string => '$' + value },
      },
    }),
  },
  {
    title: 'Cash Flow',
    value: 720,
    prefix: '$',
    suffix: 'K',
    label: 'This Quarter',
    change: '5.6%',
    className: 'bg-warning-subtle text-warning',
    chartOptions: () => ({
      chart: {
        type: 'area',
        height: 60,
        sparkline: { enabled: true },
      },
      colors: [getColor('chart-gamma')],
      series: [
        {
          name: 'Cash Flow',
          data: cashflowData,
        },
      ],
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      tooltip: {
        x: { show: false },
        y: { formatter: (value: number): string => '$' + value },
      },
    }),
  },
]

export const statusChart: () => ApexOptions = () => ({
  chart: {
    height: 341,
    type: 'radialBar',
  },
  plotOptions: {
    circle: {
      dataLabels: {
        showOn: 'hover',
      },
    },
    radialBar: {
      track: {
        margin: 22,
        background: 'rgba(170,184,197, 0.2)',
      },
      hollow: {
        size: '1%',
      },
      dataLabels: {
        name: {
          show: true,
        },
        value: {
          show: true,
        },
      },
    },
  },
  stroke: {
    lineCap: 'round',
  },
  colors: [getColor('chart-primary'), getColor('chart-gamma'), getColor('chart-secondary'), getColor('chart-beta')],
  series: [44, 55, 67, 22],
  labels: ['Completed', 'In Progress', 'Yet to Start', 'Cancelled'],
  responsive: [
    {
      breakpoint: 380,
      options: {
        chart: {
          height: 260,
        },
      },
    },
  ],
})

export const dashProjectsOverviewChart: () => ApexOptions = () => ({
  series: [
    {
      name: 'Project Revenue',
      type: 'area',
      data: [30, 35, 40, 45, 50, 58, 62, 68, 72, 78, 80, 70], // Jan–Dec
    },
    {
      name: 'Project Orders',
      type: 'line',
      data: [20, 24, 28, 30, 33, 35, 38, 40, 42, 45, 48, 50], // Jan–Dec
    },
    {
      name: 'Project Users',
      type: 'bar',
      data: [15, 18, 22, 25, 28, 30, 35, 38, 40, 45, 48, 50], // Jan–Dec
    },
    {
      name: 'Active Projects Count',
      type: 'bar',
      data: [10, 12, 15, 18, 20, 24, 26, 28, 30, 35, 38, 40], // Jan–Dec
    },
  ],
  chart: {
    type: 'line',
    height: 321,
    toolbar: {
      show: false,
    },
    offsetX: 0,
  },
  stroke: {
    width: [2, 2, 0, 0],
    curve: 'smooth',
    dashArray: [0, 3, 0, 0],
  },
  colors: [getColor('chart-gray'), getColor('chart-gamma'), getColor('chart-primary'), getColor('chart-zeta')],
  grid: {
    strokeDashArray: 1,
  },
  zoom: {
    enabled: false,
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    type: 'category',
    axisBorder: {
      show: false,
    },
    labels: {
      offsetY: 1,
    },
  },

  yaxis: {
    min: 0,
    labels: {
      formatter: function (val) {
        return val + 'k'
      },
      offsetX: -10,
    },
    axisBorder: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '50%',
      borderRadius: 3,
    },
  },
  legend: {
    show: false,
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 0,
  },
  fill: {
    opacity: [0.2, 1, 1, 1],
  },
  tooltip: {
    y: {
      formatter: function (value, { seriesIndex }) {
        return '$' + value + 'k'
      },
    },
  },
})

export type PerformanceType = {
  title: string
  value: number
  prefix?: string
  suffix?: string
}

export const performanceData: PerformanceType[] = [
  {
    title: 'Number of Projects',
    value: 7845,
  },
  {
    title: 'Active Projects',
    value: 289,
  },
  {
    title: 'Revenue',
    value: 982.5,
    prefix: '$',
    suffix: 'k',
  },
  {
    title: 'Working Hours',
    value: 12559,
    prefix: '~',
    suffix: 'h',
  },
]

export const totalSalesChart: () => ApexOptions = () => ({
  chart: {
    height: 204,
    type: 'donut',
  },
  legend: {
    show: false,
  },
  stroke: {
    width: 0,
  },

  plotOptions: {
    pie: {
      donut: {
        size: '75%',
        labels: {
          show: true,
          total: {
            showAlways: true,
            show: true,
            formatter: function (w) {
              return w.globals.seriesTotals.reduce((a: number, b: number) => {
                return a + b
              }, 0)
            },
          },
        },
      },
    },
  },
  series: [44, 55, 41],
  labels: ['Direct', 'Affiliate', 'Sponsored'],
  colors: [getColor('chart-primary'), getColor('chart-alpha'), getColor('chart-gray')],
  dataLabels: {
    enabled: false,
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 160,
        },
      },
    },
  ],
})

export type InsightType = {
  pageLink: string
  views: number
  rate: number
}

export const insightData: InsightType[] = [
  {
    pageLink: '/dashboard-analytics',
    views: 25,
    rate: 87.5,
  },
  {
    pageLink: '/dashboard-crm',
    views: 15,
    rate: 21.48,
  },
  {
    pageLink: '/dashboard',
    views: 10,
    rate: 63.59,
  },
]

export const salesReportChart: () => ApexOptions = () => ({
  series: [
    {
      name: 'Total Revenue',
      type: 'area',
      data: [21, 21, 21, 35, 35, 35, 44, 44, 44, 54, 54, 54, 48, 48, 76, 76, 95, 95, 76, 76, 32, 32, 46, 48, 48],
    },
    {
      name: 'Orders',
      type: 'line',
      data: [40, 40, 40, 50, 50, 35, 27, 27, 27, 15, 15, 27, 27, 36, 36, 33, 33, 34, 35, 33, 50, 50, 55, 55, 55],
    },
  ],
  chart: {
    type: 'line',
    height: 348,
    toolbar: {
      show: false,
    },
    offsetX: 0,
  },
  stroke: {
    width: [3, 2],
    curve: 'smooth',
    dashArray: [0, 8],
  },
  colors: [getColor('chart-secondary'), getColor('chart-gamma')],
  grid: {
    strokeDashArray: 7,
  },
  zoom: {
    enabled: false,
  },
  xaxis: {
    axisBorder: {
      show: false,
    },
    labels: {
      offsetY: 2,
    },
  },
  yaxis: {
    tickAmount: 4,
    min: 0,
    max: 100,
    labels: {
      show: true,
      formatter: function (value) {
        return value + 'k'
      },
      offsetX: -10,
    },
    axisBorder: {
      show: false,
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 0,
    style: 'hollow',
  },
  legend: {
    show: true,
    horizontalAlign: 'center',
    offsetX: 0,
    offsetY: 10,
    markers: {
      // width: 9,
      // height: 9,
      // radius: 6,
    },
    itemMargin: {
      horizontal: 10,
      vertical: 0,
    },
  },
  tooltip: {
    x: {
      format: 'dd MMM yyyy',
    },
    y: {
      formatter: function (val) {
        return '$' + val + 'k'
      },
    },
  },
  fill: {
    opacity: [1, 0.5],
    type: ['gradient', 'solid'],
    gradient: {
      type: 'vertical',
      //   shadeIntensity: 1,
      inverseColors: false,
      opacityFrom: 0.5,
      opacityTo: 0,
      stops: [0, 70],
    },
  },
})

export type SalesReportType = {
  title: string
  value: number
  icon: string
  prefix?: string
  suffix?: string
}

export const salesReportData: SalesReportType[] = [
  {
    title: 'Revenue',
    value: 78224.68,
    icon: 'wallet',
    prefix: '$',
  },
  {
    title: 'Orders',
    value: 8541,
    icon: 'basket',
  },
  {
    title: 'Growth Rate',
    value: 25.3,
    icon: 'trending-up',
    suffix: '%',
  },
]

export const financialOverviewChart: () => ApexOptions = () => ({
  series: [
    {
      name: 'Total Income',
      type: 'bar',
      data: [89.25, 98.58, 68.74, 108.87, 77.54, 84.03, 51.24, 28.57, 92.57, 42.36, 88.51, 36.57],
    },
    {
      name: 'Total Expenses',
      type: 'bar',
      data: [22.25, 24.58, 36.74, 22.87, 19.54, 25.03, 29.24, 10.57, 24.57, 35.36, 20.51, 17.57],
    },
    {
      name: 'Investments',
      type: 'area',
      data: [34, 65, 46, 68, 49, 61, 42, 44, 78, 52, 63, 67],
    },
    {
      name: 'Savings',
      type: 'line',
      data: [8, 12, 7, 17, 21, 11, 5, 9, 7, 29, 12, 35],
    },
  ],
  chart: {
    height: 348,
    type: 'line',
    toolbar: {
      show: false,
    },
  },
  stroke: {
    dashArray: [0, 0, 0, 8],
    width: [0, 0, 2, 2],
    curve: 'smooth',
  },
  fill: {
    opacity: [1, 1, 0.1, 1],
    type: ['gradient', 'solid', 'solid', 'solid'],
    gradient: {
      type: 'vertical',
      //   shadeIntensity: 1,
      inverseColors: false,
      opacityFrom: 0.5,
      opacityTo: 0,
      stops: [0, 70],
    },
  },
  markers: {
    size: [0, 0, 0, 0],
    strokeWidth: 2,
    hover: {
      size: 4,
    },
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    axisTicks: {
      show: false,
    },
    axisBorder: {
      show: false,
    },
  },
  yaxis: {
    min: 0,
    labels: {
      formatter: function (val) {
        return val + 'k'
      },
    },
    axisBorder: {
      show: false,
    },
  },
  grid: {
    show: true,
    xaxis: {
      lines: {
        show: false,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
    padding: {
      top: 0,
      right: -2,
      bottom: 15,
      left: 10,
    },
  },
  legend: {
    show: true,
    horizontalAlign: 'center',
    offsetX: 0,
    offsetY: -5,
    markers: {
      // width: 9,
      // height: 9,
      // radius: 6,
    },
    itemMargin: {
      horizontal: 10,
      vertical: 0,
    },
  },
  plotOptions: {
    bar: {
      columnWidth: '50%',
      barHeight: '70%',
      borderRadius: 3,
    },
  },
  colors: [getColor('chart-secondary'), getColor('chart-alpha'), getColor('chart-delta'), getColor('chart-gamma')],
  tooltip: {
    shared: true,
    y: [
      {
        formatter: function (y) {
          if (typeof y !== 'undefined') {
            return '$' + y.toFixed(2) + 'k'
          }
          return y
        },
      },
      {
        formatter: function (y) {
          if (typeof y !== 'undefined') {
            return '$' + y.toFixed(2) + 'k'
          }
          return y
        },
      },
      {
        formatter: function (y) {
          if (typeof y !== 'undefined') {
            return '$' + y.toFixed(2) + 'k'
          }
          return y
        },
      },
      {
        formatter: function (y) {
          if (typeof y !== 'undefined') {
            return '$' + y.toFixed(2) + 'k'
          }
          return y
        },
      },
    ],
  },
})

export type OverviewType = {
  title: string
  icon: string
  value: number
  prefix: string
  suffix: string
  className?: string
}

export const overviewData: OverviewType[] = [
  {
    title: 'Revenue',
    icon: 'tabler:square-rounded-arrow-down',
    value: 29.56,
    prefix: '$',
    suffix: 'k',
    className: 'text-success',
  },
  {
    title: 'Expenses',
    icon: 'tabler:square-rounded-arrow-up',
    value: 15.08,
    prefix: '$',
    suffix: 'k',
    className: 'text-danger',
  },
  {
    title: 'Investment',
    icon: 'tabler:chart-infographic',
    value: 3.67,
    prefix: '$',
    suffix: 'k',
  },
  {
    title: 'Savings',
    icon: 'tabler:pig',
    value: 6.72,
    prefix: '$',
    suffix: 'k',
  },
]
