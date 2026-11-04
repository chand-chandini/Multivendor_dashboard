import { getColor } from '@/app/utils/string'
import { ApexOptions } from 'ng-apexcharts'

const categories: number[] = []
for (let i = 1; i <= 15; i++) {
  categories.push(i)
}

function getRandomOrders(length: number): number[] {
  const data: number[] = []
  for (let idx = 0; idx < length; idx++) {
    data.push(Math.floor(Math.random() * 90) + 30)
  }
  return data
}

function getRefundsFromOrders(orders: number[]): number[] {
  return orders.map((v) => {
    const percent = (Math.random() * (15 - 5) + 5) / 100
    return Math.round(v * percent)
  })
}

const ordersData: number[] = getRandomOrders(categories.length)
const refundsData: number[] = getRefundsFromOrders(ordersData)

export const totalOrdersChart: () => ApexOptions = () => ({
  chart: {
    height: 263,
    type: 'bar',
    stacked: true,
    toolbar: {
      show: false,
    },
  },

  plotOptions: {
    bar: {
      horizontal: false,
      endingShape: 'rounded',
      columnWidth: '35%',
    },
  },

  series: [
    {
      name: 'Orders',
      data: ordersData,
    },
    {
      name: 'Refunds',
      data: refundsData,
    },
  ],

  dataLabels: {
    enabled: false,
  },

  markers: {
    size: 0,
    style: 'hollow',
  },

  colors: [getColor('chart-primary'), getColor('chart-alpha')],
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: function (val: number) {
        return val.toString()
      },
    },
  },
  xaxis: {
    categories: categories,
    tickAmount: 6,
    labels: {
      rotate: 0,
      formatter: function (val) {
        return val + 'D'
      },
      style: {
        fontSize: '11px',
        whiteSpace: 'nowrap',
      },
    },
    tickPlacement: 'on',
  },
  legend: {
    offsetY: 15,
  },
  grid: {
    borderColor: getColor('chart-order-color'),
    padding: {
      top: -10,
      right: 0,
      bottom: -10,
      left: 10,
    },
  },
})
