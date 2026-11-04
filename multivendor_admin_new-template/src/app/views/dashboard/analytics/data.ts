import { getColor } from '@/app/utils/string'
import { ApexOptions } from 'ng-apexcharts'

export type VisitorType = {
  title: string
  completed: number
  target: number
  progress: number
}

export const visitorData: VisitorType[] = [
  {
    title: 'Total Visitors',
    completed: 824300,
    target: 1000000,
    progress: 82,
  },
  {
    title: 'Mobile Traffic',
    completed: 41927,
    target: 60000,
    progress: 69,
  },
  {
    title: 'Desktop Traffic',
    completed: 18476,
    target: 30000,
    progress: 61,
  },
]

export type SubscriberType = {
  title: string
  value: number
  progress: number
  variant: string
}

export const subscriberData: SubscriberType[] = [
  {
    title: 'Email Marketing',
    value: 34920,
    progress: 27.41,
    variant: 'secondary',
  },
  {
    title: 'Social Marketing',
    value: 58775,
    progress: 46.13,
    variant: 'info',
  },
  {
    title: 'Direct',
    value: 33645,
    progress: 26.46,
    variant: 'success',
  },
]

export type SessionType = {
  tabId: 'users' | 'sessions' | 'bounce' | 'duration'
  title: string
  icon: string
  value: string
  change: number
}

export const sessionData: SessionType[] = [
  {
    tabId: 'users',
    title: 'Users',
    icon: 'users',
    value: '39.03k',
    change: 3.02,
  },
  {
    tabId: 'sessions',
    title: 'Sessions',
    icon: 'eye',
    value: '42.15k',
    change: -4.78,
  },
  {
    tabId: 'bounce',
    title: 'Bounce Rate',
    icon: 'trending-up',
    value: '21.20%',
    change: -31.39,
  },
  {
    tabId: 'duration',
    title: 'Session Duration',
    icon: 'clock',
    value: '3m 12s',
    change: 7.92,
  },
]

export const totalUserChart: () => ApexOptions = () => ({
  chart: {
    height: 160,
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
              return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
            },
          },
        },
      },
    },
  },
  series: [44, 55, 41],
  labels: ['Organic', 'Referral', 'Paid'],
  colors: [getColor('chart-primary'), getColor('chart-zeta'), getColor('chart-alpha')],
  dataLabels: {
    enabled: false,
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 180,
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

export type CountryType = {
  name: string
  image: string
  value: number
  progress: number
  variant: string
}

export const countryData: CountryType[] = [
  {
    name: 'United States',
    image: 'assets/images/flags/us.svg',
    value: 67.5,
    progress: 72.15,
    variant: 'secondary',
  },
  {
    name: 'India',
    image: 'assets/images/flags/in.svg',
    value: 7.92,
    progress: 28.65,
    variant: 'info',
  },
  {
    name: 'Brazil',
    image: 'assets/images/flags/br.svg',
    value: 89.05,
    progress: 62.5,
    variant: 'warning',
  },
  {
    name: 'Canada',
    image: 'assets/images/flags/ca.svg',
    value: 5.3,
    progress: 42.2,
    variant: 'success',
  },
]

export const getSessionByCountryChartOptions = () => ({
  map: 'world',
  zoomOnScroll: false,
  zoomButtons: true,

  regionStyle: {
    initial: {
      stroke: '#aab9d14d',
      strokeWidth: 0.25,
      fill: '#aab9d14d',
      fillOpacity: 1,
    },
    selected: {
      fill: getColor('primary'),
    },
  },

  selectedRegions: ['CA', 'US', 'RU', 'IN'],
})

export type TrafficSourceType = {
  name: string
  image: string
  value: number
  progress: number
  variant: string
}

export const trafficSourceData: TrafficSourceType[] = [
  {
    name: 'Google',
    image: 'assets/images/logos/google.svg',
    value: 87.8,
    progress: 72,
    variant: 'warning',
  },
  {
    name: 'Instagram',
    image: 'assets/images/logos/instagram.svg',
    value: 42.9,
    progress: 30,
    variant: 'danger',
  },
  {
    name: 'LinkedIn',
    image: 'assets/images/logos/linkedin.svg',
    value: 58.5,
    progress: 43,
    variant: 'info',
  },
  {
    name: 'Dribbble',
    image: 'assets/images/logos/dribbble.svg',
    value: 2.85,
    progress: 12,
    variant: 'secondary',
  },
  {
    name: 'Messenger',
    image: 'assets/images/logos/messenger.svg',
    value: 9.08,
    progress: 18,
    variant: 'primary',
  },
  {
    name: 'Meta',
    image: 'assets/images/logos/meta.svg',
    value: 77.7,
    progress: 66,
    variant: 'primary',
  },
  {
    name: 'Telegram',
    image: 'assets/images/logos/telegram.svg',
    value: 31.5,
    progress: 46,
    variant: 'success',
  },
  {
    name: 'Twitter X',
    image: 'assets/images/logos/x.svg',
    value: 22.6,
    progress: 29,
    variant: 'dark',
  },
  {
    name: 'WhatsApp',
    image: 'assets/images/logos/whatsapp.svg',
    value: 3.1,
    progress: 18,
    variant: 'danger',
  },
  {
    name: 'Snapchat',
    image: 'assets/images/logos/snapchat.svg',
    value: 5.8,
    progress: 9,
    variant: 'warning',
  },
]

export type BrowserType = {
  name: string
  image: string
  usage: number
  change: number
}

export const browserData: BrowserType[] = [
  {
    name: 'Chrome',
    image: 'assets/images/browsers/chrome.svg',
    usage: 62.5,
    change: -5.06,
  },
  {
    name: 'Firefox',
    image: 'assets/images/browsers/firefox.svg',
    usage: 12.3,
    change: -1.5,
  },
  {
    name: 'Safari',
    image: 'assets/images/browsers/safari.svg',
    usage: 9.86,
    change: 1.03,
  },
  {
    name: 'Brave',
    image: 'assets/images/browsers/brave.svg',
    usage: 3.15,
    change: -0.3,
  },
  {
    name: 'Opera',
    image: 'assets/images/browsers/opera.svg',
    usage: 3.01,
    change: 1.58,
  },
  {
    name: 'Tor',
    image: 'assets/images/browsers/tor.svg',
    usage: 2.8,
    change: 0.01,
  },
  {
    name: 'Edge',
    image: 'assets/images/browsers/edge.svg',
    usage: 4.25,
    change: 0.75,
  },
  {
    name: 'Other',
    image: 'assets/images/browsers/globe.svg',
    usage: 6.38,
    change: 3.6,
  },
]

export type AnalyticType = {
  pagePath: string
  source: string
  views: number
  duration: string
  bounceRate: number
  conversionRate: number
}

export const analyticData: AnalyticType[] = [
  {
    pagePath: '/dashboard',
    source: 'Direct',
    views: 3980,
    duration: '02m:12s',
    bounceRate: 19.5,
    conversionRate: 4.3,
  },
  {
    pagePath: '/pricing',
    source: 'Google',
    views: 1742,
    duration: '01m:49s',
    bounceRate: 22.1,
    conversionRate: 6.7,
  },
  {
    pagePath: '/features',
    source: 'LinkedIn',
    views: 2310,
    duration: '02m:05s',
    bounceRate: 17.8,
    conversionRate: 5.4,
  },
  {
    pagePath: '/blog/how-to-boost-sales',
    source: 'Twitter',
    views: 1128,
    duration: '03m:14s',
    bounceRate: 14.9,
    conversionRate: 2.2,
  },
  {
    pagePath: '/docs/get-started',
    source: 'Reddit',
    views: 2540,
    duration: '04m:01s',
    bounceRate: 11.2,
    conversionRate: 7.9,
  },
  {
    pagePath: '/signup',
    source: 'Newsletter',
    views: 3780,
    duration: '02m:29s',
    bounceRate: 28.5,
    conversionRate: 9.1,
  },
  {
    pagePath: '/account/settings',
    source: 'Instagram',
    views: 1690,
    duration: '01m:36s',
    bounceRate: 16.3,
    conversionRate: 3.9,
  },
  {
    pagePath: '/reports/weekly-performance',
    source: 'Direct',
    views: 2245,
    duration: '02m:08s',
    bounceRate: 17.2,
    conversionRate: 4.1,
  },
  {
    pagePath: '/help/faq',
    source: 'Google',
    views: 3015,
    duration: '01m:23s',
    bounceRate: 23.9,
    conversionRate: 2.8,
  },
  {
    pagePath: '/products',
    source: 'Instagram',
    views: 4680,
    duration: '02m:51s',
    bounceRate: 18.4,
    conversionRate: 6.3,
  },
  {
    pagePath: '/downloads',
    source: 'Referral',
    views: 1395,
    duration: '03m:22s',
    bounceRate: 13.6,
    conversionRate: 7.4,
  },
  {
    pagePath: '/contact',
    source: 'Facebook',
    views: 2920,
    duration: '01m:41s',
    bounceRate: 21.7,
    conversionRate: 3.6,
  },
]
