import { getColor } from '@/app/utils/string'
import { ApexOptions } from 'ng-apexcharts'

export type ProjectStatType = {
  title: string
  icon: string
  className: string
  value: number
  prefix?: string
  suffix?: string
  change: number
}

export const projectStatData: ProjectStatType[] = [
  {
    title: 'Total Projects',
    icon: 'briefcase',
    className: 'bg-secondary-subtle text-secondary',
    value: 6847,
    change: -9.19,
  },
  {
    title: 'Total Tasks',
    icon: 'invoice',
    className: 'bg-primary-subtle text-primary',
    value: 9.6,
    suffix: 'k',
    change: 26.87,
  },
  {
    title: 'Avg. Project Earnings',
    icon: 'wallet',
    className: 'bg-warning-subtle text-warning',
    value: 98.24,
    prefix: '$',
    suffix: 'k',
    change: 3.51,
  },
  {
    title: 'Productivity',
    icon: 'trending-up',
    className: 'bg-success-subtle text-success',
    value: 87.84,
    suffix: '%',
    change: -1.05,
  },
]

export const projectStatusChart: () => ApexOptions = () => ({
  chart: {
    height: 329,
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

export const dashProjectsOverview: () => ApexOptions = () => ({
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
    height: 309,
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

export type ScheduleType = {
  time: string
  title: string
  icon: string
  className: string
}

export const scheduleData: ScheduleType[] = [
  {
    time: '08:00 AM - 09:30 AM',
    title: 'Project Kickoff Meeting',
    icon: 'briefcase',
    className: 'bg-soft-primary text-primary',
  },
  {
    time: '10:00 AM - 11:15 AM',
    title: 'UI/UX Review Session',
    icon: 'brand-figma',
    className: 'bg-soft-info text-info',
  },
  {
    time: '04:00 PM - 05:30 PM',
    title: 'Team Collaboration Session',
    icon: 'users',
    className: 'bg-soft-secondary text-secondary',
  },
]

export type ProjectType = {
  company: string
  name: string
  deadline: string
  budget: string
  user: {
    name: string
    role: string
    image: string
  }
  status: {
    label: string
    className: string
  }
}

export const projectData: ProjectType[] = [
  {
    company: 'Google',
    name: 'New Dashboard',
    deadline: '17 Aug, 26',
    budget: '$8,950',
    user: {
      name: 'Sean Kemper',
      role: 'UI/UX Team',
      image: 'assets/images/users/user-2.jpg',
    },
    status: { label: 'Early Stage', className: 'text-info' },
  },
  {
    company: 'Microsoft',
    name: 'Azure Migration',
    deadline: '05 Sep, 26',
    budget: '$12,500',
    user: {
      name: 'Emily Carter',
      role: 'Cloud Team',
      image: 'assets/images/users/user-3.jpg',
    },
    status: { label: 'In Progress', className: 'text-warning' },
  },
  {
    company: 'Amazon',
    name: 'E-Commerce Redesign',
    deadline: '29 Oct, 26',
    budget: '$18,200',
    user: {
      name: 'Jacob Wilson',
      role: 'Frontend Team',
      image: 'assets/images/users/user-4.jpg',
    },
    status: { label: 'On Track', className: 'text-success' },
  },
  {
    company: 'Spotify',
    name: 'Music Analytics Tool',
    deadline: '11 Nov, 26',
    budget: '$9,750',
    user: {
      name: 'Laura Chen',
      role: 'Analytics Team',
      image: 'assets/images/users/user-5.jpg',
    },
    status: { label: 'Delayed', className: 'text-danger' },
  },
  {
    company: 'Tesla',
    name: 'EV Monitoring System',
    deadline: '06 Dec, 26',
    budget: '$21,300',
    user: {
      name: 'Daniel Foster',
      role: 'Tech Team',
      image: 'assets/images/users/user-6.jpg',
    },
    status: { label: 'On Schedule', className: 'text-success' },
  },
  {
    company: 'Meta',
    name: 'Social Feed Optimization',
    deadline: '21 Jan, 26',
    budget: '$14,680',
    user: {
      name: 'Chloe Martin',
      role: 'AI Team',
      image: 'assets/images/users/user-7.jpg',
    },
    status: { label: 'Planning', className: 'text-info' },
  },
]

export type TaskType = {
  dueInfo: string
  title: string
  dueDate: string
  assignedTo: {
    name: string
    image: string
  }
  status: 'in-progress' | 'completed' | 'pending' | 'blocked' | 'reviewing'
  time: string
}

export const taskData: TaskType[] = [
  {
    dueInfo: 'Due in 2 days',
    title: 'Fix Homepage Layout Issues',
    dueDate: '14 Sep, 26',
    assignedTo: { name: 'Mia Turner', image: 'assets/images/users/user-5.jpg' },
    status: 'in-progress',
    time: '1h 45min',
  },
  {
    dueInfo: 'Due in 1 day',
    title: 'Update User Profile API',
    dueDate: '15 Sep, 26',
    assignedTo: {
      name: 'Oliver Knight',
      image: 'assets/images/users/user-6.jpg',
    },
    status: 'completed',
    time: '4h 10min',
  },
  {
    dueInfo: 'Due in 5 days',
    title: 'Create Dashboard Widgets',
    dueDate: '19 Sep, 26',
    assignedTo: { name: 'Sofia Reed', image: 'assets/images/users/user-7.jpg' },
    status: 'pending',
    time: '0h 00min',
  },
  {
    dueInfo: 'Due in 7 days',
    title: 'Fix Login Authentication Bug',
    dueDate: '21 Sep, 26',
    assignedTo: {
      name: 'Henry Adams',
      image: 'assets/images/users/user-8.jpg',
    },
    status: 'blocked',
    time: '1h 05min',
  },
  {
    dueInfo: 'Due today',
    title: 'Write Release Notes for v2.1',
    dueDate: '14 Sep, 26',
    assignedTo: {
      name: 'Chloe Martin',
      image: 'assets/images/users/user-9.jpg',
    },
    status: 'reviewing',
    time: '45min',
  },
  {
    dueInfo: 'Due in 4 days',
    title: 'Design New Notification Icons',
    dueDate: '18 Sep, 26',
    assignedTo: {
      name: 'Victoria Mills',
      image: 'assets/images/users/user-10.jpg',
    },
    status: 'completed',
    time: '2h 30min',
  },
]
