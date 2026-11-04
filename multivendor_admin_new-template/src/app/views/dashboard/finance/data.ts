import { getColor } from '@/app/utils/string'
import { ApexOptions } from 'ng-apexcharts'

export type FinanceStatType = {
  icon: string
  value: number
  prefix: string
  suffix: string
  title: string
  change: number
  className: string
  chartOptions?: () => ApexOptions
}

export const financeStatData: FinanceStatType[] = [
  {
    icon: 'solar:leaf-bold-duotone',
    value: 51.68,
    prefix: '$',
    suffix: 'k',
    title: 'Total Income',
    change: 8.72,
    className: 'text-success',
    chartOptions: () => ({
      chart: {
        type: 'area',
        height: 51,
        sparkline: {
          enabled: true,
        },
      },
      series: [
        {
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
        fixed: {
          enabled: false,
        },
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function (seriesName) {
              return ''
            },
          },
        },
        marker: {
          show: false,
        },
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
    icon: 'solar:wallet-money-bold-duotone',
    value: 24.03,
    prefix: '$',
    suffix: 'k',
    title: 'Total Expenses',
    change: -3.28,
    className: 'text-info',
    chartOptions: () => ({
      chart: {
        type: 'area',
        height: 51,
        sparkline: {
          enabled: true,
        },
      },
      series: [
        {
          data: [10, 18, 25, 28, 35, 50, 48, 43, 20, 31, 15],
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
        fixed: {
          enabled: false,
        },
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function (seriesName) {
              return ''
            },
          },
        },
        marker: {
          show: false,
        },
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
    icon: 'solar:chart-2-bold-duotone',
    value: 48.21,
    prefix: '$',
    suffix: 'k',
    title: 'Investments',
    change: -5.69,
    className: 'text-warning',
    chartOptions: () => ({
      chart: {
        type: 'area',
        height: 51,
        sparkline: {
          enabled: true,
        },
      },
      series: [
        {
          data: [10, 14, 18, 22, 26, 30, 20, 10, 5, 25, 35],
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
        fixed: {
          enabled: false,
        },
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function (seriesName) {
              return ''
            },
          },
        },
        marker: {
          show: false,
        },
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
    icon: 'solar:hand-money-bold',
    value: 11.65,
    prefix: '$',
    suffix: 'k',
    title: 'Savings',
    change: 10.58,
    className: 'text-secondary',
    chartOptions: () => ({
      chart: {
        type: 'area',
        height: 51,
        sparkline: {
          enabled: true,
        },
      },
      series: [
        {
          data: [45, 38, 36, 22, 32, 36, 45, 55, 50, 42, 25],
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
        fixed: {
          enabled: false,
        },
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function (seriesName) {
              return ''
            },
          },
        },
        marker: {
          show: false,
        },
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
]

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
    height: 376,
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
  },
  plotOptions: {
    bar: {
      columnWidth: '50%',
      barHeight: '70%',
      borderRadius: 3,
    },
  },
  colors: [getColor('chart-primary'), getColor('chart-gamma'), getColor('chart-gray'), getColor('chart-secondary')],
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

export type UserType = {
  id: string
  name: string
  image: string
}

export const userData: UserType[] = [
  {
    id: 'rec1',
    name: 'Alexa Newsome',
    image: 'assets/images/users/user-4.jpg',
  },
  {
    id: 'rec2',
    name: 'Shelly Dorey',
    image: 'assets/images/users/user-5.jpg',
  },
  {
    id: 'rec3',
    name: 'Fredrick Arnett',
    image: 'assets/images/users/user-3.jpg',
  },
  {
    id: 'rec4',
    name: 'Barbara Frink',
    image: 'assets/images/users/user-8.jpg',
  },
  {
    id: 'rec5',
    name: 'Adam M',
    image: 'assets/images/users/user-2.jpg',
  },
]

export type TransactionType = {
  id: string
  user: {
    name: string
    image?: string
    className?: string
  }
  description: string
  amount: string
  date: string
  time: string
  type: 'credit' | 'debit'
  payment: {
    image: string
    name?: string
    lastDigit?: string
  }
  status: 'success' | 'pending' | 'failed' | 'processing'
}

export const transactionData: TransactionType[] = [
  {
    id: '#TX901',
    user: { name: 'Sophia Miller', image: 'assets/images/users/user-5.jpg' },
    description: 'Subscription Renewal',
    amount: '$299.00',
    date: '22 Nov,25',
    time: '08:24 am',
    type: 'credit',
    payment: {
      image: 'assets/images/cards/visa.svg',
      lastDigit: '*4321',
    },
    status: 'success',
  },
  {
    id: '#TX900',
    user: { name: 'James Carter', image: 'assets/images/users/user-2.jpg' },
    description: 'Refund Processed',
    amount: '$150.50',
    date: '21 Nov,25',
    time: '07:40 pm',
    type: 'debit',
    payment: {
      image: 'assets/images/cards/mastercard.svg',
      lastDigit: '*9333',
    },
    status: 'pending',
  },
  {
    id: '#TX899',
    user: {
      name: 'WavePay',
      className: 'bg-secondary-subtle text-secondary',
    },
    description: 'Wallet Top-Up',
    amount: '$620.00',
    date: '21 Nov,25',
    time: '03:12 pm',
    type: 'credit',
    payment: {
      image: 'assets/images/cards/paypal.svg',
      name: 'PayPal',
    },
    status: 'success',
  },
  {
    id: '#TX898',
    user: { name: 'Liam Thompson', image: 'assets/images/users/user-3.jpg' },
    description: 'Service Charge',
    amount: '$19.99',
    date: '20 Nov,25',
    time: '11:09 am',
    type: 'debit',
    payment: {
      image: 'assets/images/cards/stripe.svg',
      name: 'Stripe',
    },
    status: 'failed',
  },
  {
    id: '#TX897',
    user: { name: 'Emma Stone', image: 'assets/images/users/user-4.jpg' },
    description: 'Invoice #2112',
    amount: '€420.72',
    date: '18 Nov,25',
    time: '09:51 pm',
    type: 'credit',
    payment: {
      image: 'assets/images/cards/mastercard.svg',
      lastDigit: '*2112',
    },
    status: 'success',
  },
  {
    id: '#TX896',
    user: {
      name: 'StorePay',
      className: 'bg-warning-subtle text-warning',
    },
    description: 'Point of Sale payment',
    amount: '£15.00',
    date: '17 Nov,25',
    time: '02:10 pm',
    type: 'debit',
    payment: {
      image: 'assets/images/cards/unionpay.svg',
      lastDigit: '*5510',
    },
    status: 'success',
  },
  {
    id: '#TX895',
    user: { name: 'Olivia Brown', image: 'assets/images/users/user-8.jpg' },
    description: 'Personal Transfer',
    amount: '$250.00',
    date: '16 Nov,25',
    time: '07:48 am',
    type: 'credit',
    payment: {
      image: 'assets/images/cards/visa.svg',
      lastDigit: '*0244',
    },
    status: 'success',
  },
  {
    id: '#TX894',
    user: { name: 'David Chen', image: 'assets/images/users/user-1.jpg' },
    description: 'ATM Withdrawal',
    amount: '$180.00',
    date: '15 Nov,25',
    time: '04:33 pm',
    type: 'debit',
    payment: {
      image: 'assets/images/cards/mastercard.svg',
      lastDigit: '*7780',
    },
    status: 'processing',
  },
  {
    id: '#TX893',
    user: { name: 'Marcus Lee', image: 'assets/images/users/user-6.jpg' },
    description: 'Online Purchase',
    amount: '$65.49',
    date: '14 Nov,24',
    time: '02:09 pm',
    type: 'debit',
    payment: {
      image: 'assets/images/cards/stripe.svg',
      name: 'Stripe',
    },
    status: 'success',
  },
  {
    id: '#TX892',
    user: {
      name: 'Utility Co.',
      className: 'bg-danger-subtle text-danger',
    },
    description: 'Electricity Bill',
    amount: '£72.10',
    date: '12 Nov,24',
    time: '09:30 am',
    type: 'debit',
    payment: {
      image: 'assets/images/cards/visa.svg',
      lastDigit: '*1188',
    },
    status: 'success',
  },
  {
    id: '#TX891',
    user: { name: 'Henry Walker', image: 'assets/images/users/user-7.jpg' },
    description: 'Loan EMI payment',
    amount: '$320.00',
    date: '11 Nov,24',
    time: '04:55 pm',
    type: 'debit',
    payment: {
      image: 'assets/images/cards/mastercard.svg',
      lastDigit: '*9982',
    },
    status: 'success',
  },
  {
    id: '#TX890',
    user: {
      name: 'Google Services',
      className: 'bg-primary-subtle text-primary',
    },
    description: 'Cloud Subscription',
    amount: '$12.99',
    date: '10 Nov,24',
    time: '08:12 am',
    type: 'debit',
    payment: {
      image: 'assets/images/cards/stripe.svg',
      name: 'Stripe',
    },
    status: 'pending',
  },
  {
    id: '#TX889',
    user: { name: 'Emily Frost', image: 'assets/images/users/user-3.jpg' },
    description: 'Client Invoice #2455',
    amount: '$980.00',
    date: '09 Nov,24',
    time: '11:21 am',
    type: 'credit',
    payment: {
      image: 'assets/images/cards/paypal.svg',
      name: 'PayPal',
    },
    status: 'success',
  },
]

export type TargetType = {
  title: string
  value: number
  prefix: string
  icon: string
  image: string
  className: string
}

export const targetData: TargetType[] = [
  {
    title: 'New Car',
    value: 25000,
    prefix: '$',
    icon: 'solar:bus-bold-duotone',
    image: 'assets/images/stock/small-1.jpg',
    className: 'bg-primary',
  },
  {
    title: 'Vacation Trip',
    value: 7500,
    prefix: '$',
    icon: 'solar:globus-bold-duotone',
    image: 'assets/images/stock/small-2.jpg',
    className: 'bg-secondary',
  },
  {
    title: 'Education',
    value: 15200,
    prefix: '$',
    icon: 'solar:square-academic-cap-2-bold-duotone',
    image: 'assets/images/stock/small-3.jpg',
    className: 'bg-warning',
  },
  {
    title: 'New Home',
    value: 120000,
    prefix: '$',
    icon: 'solar:home-2-bold-duotone',
    image: 'assets/images/stock/small-4.jpg',
    className: 'bg-danger',
  },
  {
    title: 'Emergency Fund',
    value: 10000,
    prefix: '$',
    icon: 'solar:banknote-2-bold-duotone',
    image: 'assets/images/stock/small-5.jpg',
    className: 'bg-info',
  },
]
