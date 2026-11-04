const amex = 'assets/images/cards/american-express.svg'
const mastercard = 'assets/images/cards/mastercard.svg'
const paypal = 'assets/images/cards/paypal.svg'
const visa = 'assets/images/cards/visa.svg'
const user1 = 'assets/images/users/user-1.jpg'
const user2 = 'assets/images/users/user-2.jpg'
const user3 = 'assets/images/users/user-3.jpg'
const user4 = 'assets/images/users/user-4.jpg'
const user5 = 'assets/images/users/user-5.jpg'
const user6 = 'assets/images/users/user-6.jpg'
const user7 = 'assets/images/users/user-7.jpg'
const user8 = 'assets/images/users/user-8.jpg'
const user9 = 'assets/images/users/user-9.jpg'

export type StatType = {
  icon: string
  className: string
  title: string
  value: number
  prefix: string
}

export const transactionStatData: StatType[] = [
  {
    icon: 'currency-dollar',
    className: 'bg-primary-subtle text-primary',
    value: 56240,
    title: 'Total Income',
    prefix: '$',
  },
  {
    icon: 'wallet',
    className: 'bg-success-subtle text-success',
    value: 48920,
    title: 'Received Income',
    prefix: '$',
  },
  {
    icon: 'hourglass',
    className: 'bg-warning-subtle text-warning',
    value: 6530,
    title: 'Pending Payments',
    prefix: '$',
  },
  {
    icon: 'credit-card-refund',
    className: 'bg-danger-subtle text-danger',
    value: 1790,
    title: 'Refunded Income',
    prefix: '$',
  },
]

export type TransactionType = {
  id: string
  description: string
  type: 'credit' | 'debit' | 'refund' | 'adjustment'
  paymentMethod: {
    image: string
    type: 'card' | 'other'
    name?: string
    number?: string
  }
  amount: string
  balance: string
  status: 'completed' | 'pending' | 'refunded' | 'failed'
  date: string
  time: string
  processedBy: {
    image: string
    name: string
  }
}

export const transactionData: TransactionType[] = [
  {
    id: '#TRX-2001',
    description: 'Product Sale - Online Store',
    type: 'credit',
    paymentMethod: {
      image: mastercard,
      type: 'card',
      number: '**** 5623',
    },
    amount: '+$450.00',
    balance: '$5,240.00',
    status: 'completed',
    date: '10 Oct, 2025',
    time: '01:20 PM',
    processedBy: {
      image: user4,
      name: 'Emma Johnson',
    },
  },
  {
    id: '#TRX-2002',
    description: 'Office Supplies Purchase',
    type: 'debit',
    paymentMethod: {
      image: visa,
      type: 'card',
      number: '**** 9381',
    },
    amount: '−$120.00',
    balance: '$5,120.00',
    status: 'pending',
    date: '09 Oct, 2025',
    time: '04:10 PM',
    processedBy: {
      image: user6,
      name: 'David Wilson',
    },
  },
  {
    id: '#TRX-2003',
    description: 'Refund – Order #7845 (Return)',
    type: 'refund',
    paymentMethod: {
      image: paypal,
      type: 'other',
      name: 'PayPal',
    },
    amount: '+$89.99',
    balance: '$5,209.99',
    status: 'completed',
    date: '08 Oct, 2025',
    time: '02:45 PM',
    processedBy: {
      image: user7,
      name: 'Sophia Lee',
    },
  },
  {
    id: '#TRX-2004',
    description: 'Balance Adjustment (Manual)',
    type: 'adjustment',
    paymentMethod: {
      image: amex,
      type: 'card',
      number: '**** 3478',
    },
    amount: '+$150.00',
    balance: '$5,359.99',
    status: 'refunded',
    date: '07 Oct, 2025',
    time: '11:10 AM',
    processedBy: {
      image: user2,
      name: 'Daniel Ray',
    },
  },
  {
    id: '#TRX-2005',
    description: 'Subscription Renewal Attempt',
    type: 'debit',
    paymentMethod: {
      image: mastercard,
      type: 'card',
      number: '**** 4412',
    },
    amount: '−$49.99',
    balance: '$5,310.00',
    status: 'failed',
    date: '06 Oct, 2025',
    time: '08:35 AM',
    processedBy: {
      image: user9,
      name: 'Liam Brown',
    },
  },
  {
    id: '#TRX-2006',
    description: 'Client Payment – Project Alpha',
    type: 'credit',
    paymentMethod: {
      image: visa,
      type: 'card',
      number: '**** 8890',
    },
    amount: '+$2,000.00',
    balance: '$7,310.00',
    status: 'completed',
    date: '05 Oct, 2025',
    time: '05:00 PM',
    processedBy: {
      image: user5,
      name: 'John Miller',
    },
  },
  {
    id: '#TRX-2007',
    description: 'Software Subscription Payment',
    type: 'debit',
    paymentMethod: {
      image: visa,
      type: 'card',
      number: '**** 2311',
    },
    amount: '−$120.00',
    balance: '$7,190.00',
    status: 'pending',
    date: '04 Oct, 2025',
    time: '09:15 AM',
    processedBy: {
      image: user1,
      name: 'Olivia Green',
    },
  },
  {
    id: '#TRX-2008',
    description: 'Freelance Payment – UI Design Project',
    type: 'credit',
    paymentMethod: {
      image: mastercard,
      type: 'card',
      number: '**** 7654',
    },
    amount: '+$1,500.00',
    balance: '$8,690.00',
    status: 'completed',
    date: '03 Oct, 2025',
    time: '04:25 PM',
    processedBy: {
      image: user8,
      name: 'Mason Carter',
    },
  },
  {
    id: '#TRX-2009',
    description: 'Monthly Internet Bill',
    type: 'debit',
    paymentMethod: {
      image: visa,
      type: 'card',
      number: '**** 5582',
    },
    amount: '−$80.00',
    balance: '$8,610.00',
    status: 'pending',
    date: '02 Oct, 2025',
    time: '01:10 PM',
    processedBy: {
      image: user3,
      name: 'Emily Clark',
    },
  },
  {
    id: '#TRX-2010',
    description: 'Refund – Cancelled Workshop Ticket',
    type: 'refund',
    paymentMethod: {
      image: paypal,
      type: 'other',
      name: 'PayPal',
    },
    amount: '+$120.00',
    balance: '$8,730.00',
    status: 'completed',
    date: '01 Oct, 2025',
    time: '03:35 PM',
    processedBy: {
      image: user9,
      name: 'Liam Brown',
    },
  },
  {
    id: '#TRX-2011',
    description: 'Bank Service Fee Reversal',
    type: 'adjustment',
    paymentMethod: {
      image: amex,
      type: 'card',
      number: '**** 9012',
    },
    amount: '+$30.00',
    balance: '$8,760.00',
    status: 'refunded',
    date: '30 Sep, 2025',
    time: '10:25 AM',
    processedBy: {
      image: user7,
      name: 'Sophia Lee',
    },
  },
  {
    id: '#TRX-2012',
    description: 'Travel Expense – Client Meeting',
    type: 'debit',
    paymentMethod: {
      image: mastercard,
      type: 'card',
      number: '**** 5534',
    },
    amount: '−$260.00',
    balance: '$8,500.00',
    status: 'completed',
    date: '29 Sep, 2025',
    time: '06:40 PM',
    processedBy: {
      image: user1,
      name: 'Olivia Green',
    },
  },
]
