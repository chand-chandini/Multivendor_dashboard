const amex = 'assets/images/cards/american-express.svg'
const mastercard = 'assets/images/cards/mastercard.svg'
const note = 'assets/images/cards/note.svg'
const paypal = 'assets/images/cards/paypal.svg'
const visa = 'assets/images/cards/visa.svg'
const user1 = 'assets/images/users/user-1.jpg'
const user10 = 'assets/images/users/user-10.jpg'
const user2 = 'assets/images/users/user-2.jpg'
const user3 = 'assets/images/users/user-3.jpg'
const user4 = 'assets/images/users/user-4.jpg'
const user5 = 'assets/images/users/user-5.jpg'
const user6 = 'assets/images/users/user-6.jpg'
const user7 = 'assets/images/users/user-7.jpg'
const user8 = 'assets/images/users/user-8.jpg'
const user9 = 'assets/images/users/user-9.jpg'

export type IncomeStatType = {
  icon: string
  className: string
  title: string
  value: number
  prefix: string
}

export const incomeStatData: IncomeStatType[] = [
  {
    icon: 'currency-dollar',
    className: 'bg-primary-subtle text-primary',
    value: 45280,
    title: 'Total Income',
    prefix: '$',
  },
  {
    icon: 'wallet',
    className: 'bg-success-subtle text-success',
    value: 38560,
    title: 'Received Income',
    prefix: '$',
  },
  {
    icon: 'hourglass',
    className: 'bg-warning-subtle text-warning',
    value: 4860,
    title: 'Pending Payments',
    prefix: '$',
  },
  {
    icon: 'credit-card-refund',
    className: 'bg-danger-subtle text-danger',
    value: 1120,
    title: 'Refunded Income',
    prefix: '$',
  },
]
export type IncomeType = {
  id: string
  title: string
  category: string
  paymentMethod: {
    image: string
    type: 'card' | 'other'
    name?: string
    number?: string
  }
  amount: string
  status: 'received' | 'pending' | 'refunded' | 'failed'
  date: string
  time: string
  receivedBy: {
    image: string
    name: string
  }
}

export const incomeData: IncomeType[] = [
  {
    id: '#INC-1001',
    title: 'Website Development Payment',
    category: 'Services',
    paymentMethod: {
      image: visa,
      type: 'card',
      number: '**** 3294',
    },
    amount: '$1,250.00',
    status: 'received',
    date: '03 Oct, 2025',
    time: '11:00 AM',
    receivedBy: {
      image: user3,
      name: 'Emily Clark',
    },
  },
  {
    id: '#INC-1002',
    title: 'Consulting Fees (Q3)',
    category: 'Consulting',
    paymentMethod: {
      image: mastercard,
      type: 'card',
      number: '**** 8712',
    },
    amount: '$780.00',
    status: 'pending',
    date: '01 Oct, 2025',
    time: '04:20 PM',
    receivedBy: {
      image: user7,
      name: 'Daniel Ray',
    },
  },
  {
    id: '#INC-1003',
    title: 'E-commerce Sales Revenue',
    category: 'Sales',
    paymentMethod: {
      image: mastercard,
      type: 'card',
      number: '**** 4511',
    },
    amount: '$2,430.00',
    status: 'received',
    date: '04 Oct, 2025',
    time: '02:35 PM',
    receivedBy: {
      image: user4,
      name: 'Emma Johnson',
    },
  },
  {
    id: '#INC-1004',
    title: 'Affiliate Payout - September',
    category: 'Affiliate',
    paymentMethod: {
      image: paypal,
      type: 'other',
      name: 'PayPal',
    },
    amount: '$645.25',
    status: 'received',
    date: '02 Oct, 2025',
    time: '09:30 AM',
    receivedBy: {
      image: user6,
      name: 'David Wilson',
    },
  },
  {
    id: '#INC-1005',
    title: 'Software License Renewal',
    category: 'Services',
    paymentMethod: {
      image: visa,
      type: 'card',
      number: '**** 9987',
    },
    amount: '$1,120.00',
    status: 'pending',
    date: '29 Sep, 2025',
    time: '01:15 PM',
    receivedBy: {
      image: user8,
      name: 'Lucas Martin',
    },
  },
  {
    id: '#INC-1006',
    title: 'Investment Dividend Q3',
    category: 'Investments',
    paymentMethod: {
      image: note,
      type: 'other',
      name: 'Bank Transfer',
    },
    amount: '$3,950.50',
    status: 'received',
    date: '27 Sep, 2025',
    time: '10:00 AM',
    receivedBy: {
      image: user9,
      name: 'Olivia Brown',
    },
  },
  {
    id: '#INC-1007',
    title: 'Advertising Revenue (Google Ads)',
    category: 'Affiliate',
    paymentMethod: {
      image: paypal,
      type: 'other',
      name: 'PayPal',
    },
    amount: '$870.75',
    status: 'received',
    date: '25 Sep, 2025',
    time: '08:10 PM',
    receivedBy: {
      image: user10,
      name: 'Ethan Brooks',
    },
  },
  {
    id: '#INC-1008',
    title: 'Monthly Retainer - Client A',
    category: 'Consulting',
    paymentMethod: {
      image: mastercard,
      type: 'card',
      number: '**** 4732',
    },
    amount: '$2,200.00',
    status: 'received',
    date: '22 Sep, 2025',
    time: '12:30 PM',
    receivedBy: {
      image: user7,
      name: 'Liam Davis',
    },
  },
  {
    id: '#INC-1009',
    title: 'Service Renewal - Hosting Plan',
    category: 'Services',
    paymentMethod: {
      image: visa,
      type: 'card',
      number: '**** 2318',
    },
    amount: '$399.00',
    status: 'pending',
    date: '20 Sep, 2025',
    time: '04:05 PM',
    receivedBy: {
      image: user1,
      name: 'Sophia Turner',
    },
  },
  {
    id: '#INC-1010',
    title: 'Refund - Cancelled Subscription',
    category: 'Other',
    paymentMethod: {
      image: amex,
      type: 'card',
      number: '**** 9812',
    },
    amount: '$125.00',
    status: 'refunded',
    date: '18 Sep, 2025',
    time: '05:45 PM',
    receivedBy: {
      image: user2,
      name: 'Noah Walker',
    },
  },
  {
    id: '#INC-1011',
    title: 'Project Completion Payment - Client B',
    category: 'Services',
    paymentMethod: {
      image: mastercard,
      type: 'other',
      name: 'Bank Transfer',
    },
    amount: '$3580.00',
    status: 'received',
    date: '15 Sep, 2025',
    time: '03:20 PM',
    receivedBy: {
      image: user4,
      name: 'Grace Miller',
    },
  },
  {
    id: '#INC-1012',
    title: 'Royalty Income - October',
    category: 'Other',
    paymentMethod: {
      image: mastercard,
      type: 'card',
      number: '**** 5454',
    },
    amount: '$940.00',
    status: 'received',
    date: '12 Sep, 2025',
    time: '11:55 AM',
    receivedBy: {
      image: user5,
      name: 'Chloe Adams',
    },
  },
]
