const small6 = 'assets/images/stock/small-6.jpg'
const small7 = 'assets/images/stock/small-7.jpg'
const small8 = 'assets/images/stock/small-8.jpg'
const small9 = 'assets/images/stock/small-9.jpg'
const small10 = 'assets/images/stock/small-10.jpg'

const googleLogo = 'assets/images/logos/google.svg'
const instagramLogo = 'assets/images/logos/instagram.svg'
const linkedinLogo = 'assets/images/logos/linkedin.svg'
const dribbbleLogo = 'assets/images/logos/dribbble.svg'
const messengerLogo = 'assets/images/logos/messenger.svg'
const metaLogo = 'assets/images/logos/meta.svg'
const telegramLogo = 'assets/images/logos/telegram.svg'
const twitterXLogo = 'assets/images/logos/x.svg'
const whatsappLogo = 'assets/images/logos/whatsapp.svg'
const snapchatLogo = 'assets/images/logos/snapchat.svg'

const user5 = 'assets/images/users/user-5.jpg'
const user6 = 'assets/images/users/user-6.jpg'
const user7 = 'assets/images/users/user-7.jpg'
const user8 = 'assets/images/users/user-8.jpg'

const flagus = 'assets/images/flags/us.svg'
const flaggb = 'assets/images/flags/gb.svg'
const flagca = 'assets/images/flags/ca.svg'

const flowerBg = 'assets/images/flower-style.svg'

const inFlag = 'assets/images/flags/in.svg'
const deFlag = 'assets/images/flags/de.svg'
const frFlag = 'assets/images/flags/fr.svg'
const usFlag = 'assets/images/flags/us.svg'
const gbFlag = 'assets/images/flags/gb.svg'
const caFlag = 'assets/images/flags/ca.svg'
const jpFlag = 'assets/images/flags/jp.svg'
const auFlag = 'assets/images/flags/au.svg'

const user1 = 'assets/images/users/user-5.jpg'
const user2 = 'assets/images/users/user-2.jpg'

const meta = 'assets/images/logos/meta.svg'
const instagram = 'assets/images/logos/instagram.svg'
const linkedin = 'assets/images/logos/linkedin.svg'
const google = 'assets/images/logos/google.svg'
const twitter = 'assets/images/logos/x.svg'

export type TargetType = {
  image: string
  className: string
  icon: string
  label: string
  title: string
  value: number
  prefix: string
}

export const targetData: TargetType[] = [
  {
    image: small6,
    className: 'bg-primary',
    icon: 'solar:wallet-money-bold-duotone',
    label: 'Savings Target',
    title: 'Monthly Budget',
    value: 3200,
    prefix: '$',
  },
  {
    image: small7,
    className: 'bg-secondary',
    icon: 'solar:airbuds-bold-duotone',
    label: 'Goal',
    title: 'Gadgets Upgrade',
    value: 1800,
    prefix: '$',
  },
  {
    image: small8,
    className: 'bg-warning',
    icon: 'solar:medal-ribbons-star-bold-duotone',
    label: 'Milestone',
    title: 'Career Growth',
    value: 5000,
    prefix: '$',
  },
  {
    image: small9,
    className: 'bg-danger',
    icon: 'solar:heart-pulse-bold-duotone',
    label: 'Health Plan',
    title: 'Fitness Training',
    value: 2400,
    prefix: '$',
  },
  {
    image: small10,
    className: 'bg-info',
    icon: 'solar:lightbulb-bolt-bold-duotone',
    label: 'Innovation',
    title: 'Startup Idea',
    value: 15000,
    prefix: '$',
  },
]

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
    image: googleLogo,
    value: 87.8,
    progress: 72,
    variant: 'warning',
  },
  {
    name: 'Instagram',
    image: instagramLogo,
    value: 42.9,
    progress: 30,
    variant: 'danger',
  },
  {
    name: 'LinkedIn',
    image: linkedinLogo,
    value: 58.5,
    progress: 43,
    variant: 'info',
  },
  {
    name: 'Dribbble',
    image: dribbbleLogo,
    value: 2.85,
    progress: 12,
    variant: 'secondary',
  },
  {
    name: 'Messenger',
    image: messengerLogo,
    value: 9.08,
    progress: 18,
    variant: 'primary',
  },
  {
    name: 'Meta',
    image: metaLogo,
    value: 77.7,
    progress: 66,
    variant: 'primary',
  },
  {
    name: 'Telegram',
    image: telegramLogo,
    value: 31.5,
    progress: 46,
    variant: 'success',
  },
  {
    name: 'Twitter X',
    image: twitterXLogo,
    value: 22.6,
    progress: 29,
    variant: 'dark',
  },
  {
    name: 'WhatsApp',
    image: whatsappLogo,
    value: 3.1,
    progress: 18,
    variant: 'danger',
  },
  {
    name: 'Snapchat',
    image: snapchatLogo,
    value: 5.8,
    progress: 9,
    variant: 'warning',
  },
]

export type OverviewType = {
  title: string
  description: string
  variant: string
  image: string
  actions: {
    icon: string
    label?: string
    href: string
  }[]
}

export const overviewData: OverviewType[] = [
  {
    title: 'Revenue Overview',
    description: 'Get a quick snapshot of your company’s financial performance.',
    variant: 'success',
    image: flowerBg,
    actions: [
      {
        icon: 'tabler:chart-bar',
        label: 'Report',
        href: '',
      },
      {
        icon: 'tabler:phone',
        href: '',
      },
      {
        icon: 'tabler:world',
        href: '',
      },
    ],
  },
  {
    title: 'Customer Insights',
    description: 'Analyze customer behavior and discover actionable trends.',
    variant: 'info',
    image: flowerBg,
    actions: [
      {
        icon: 'tabler:users',
        label: 'Insights',
        href: '',
      },
      {
        icon: 'tabler:mail',
        href: '',
      },
      {
        icon: 'tabler:message-circle',
        href: '',
      },
    ],
  },
  {
    title: 'Performance Alerts',
    description: 'Stay informed with real-time alerts for key business indicators.',
    variant: 'danger',
    image: flowerBg,
    actions: [
      {
        icon: 'tabler:bell',
        label: 'Alerts',
        href: '',
      },
      {
        icon: 'tabler:share',
        href: '',
      },
      {
        icon: 'tabler:layout-dashboard',
        href: '',
      },
    ],
  },
]

export type UserType = {
  user: { name: string; role: string; image: string }
  image: string
  position: string
  rating: number
  className: string
  updatedText: string
  website: string
  email: string
  phone: string
  location: string
}

export const userData: UserType[] = [
  {
    user: {
      name: 'Sophia Carter',
      role: 'Lead UI/UX Designer',
      image: user5,
    },
    image: flaggb,
    position: 'Admin',
    rating: 4.8,
    className: 'bg-warning',
    updatedText: 'Updated 30 min ago',
    email: 'sophia@designhub.com',
    phone: '+44 7911 123456',
    location: 'London, UK',
    website: 'www.sophiacarter.com',
  },
  {
    user: {
      name: 'Marcus Lee',
      role: 'Senior Developer',
      image: user6,
    },
    image: flagus,
    position: 'Team Lead',
    rating: 4,
    className: 'bg-success',
    updatedText: 'Updated 1 hour ago',
    email: 'marcus@devhub.com',
    phone: '+1 408-222-9876',
    location: 'Austin, TX',
    website: 'www.devhub.com',
  },
  {
    user: {
      name: 'Emily Davis',
      role: 'Marketing Strategist',
      image: user7,
    },
    image: flagus,
    position: 'Member',
    rating: 3.9,
    className: 'bg-danger',
    updatedText: 'Updated 10 min ago',
    email: 'emily@marketboost.com',
    phone: '+1 212-555-7890',
    location: 'New York, NY',
    website: 'www.marketboost.com',
  },
  {
    user: {
      name: 'Daniel Smith',
      role: 'Data Analyst',
      image: user8,
    },
    image: flagca,
    position: 'Contributor',
    rating: 4.3,
    className: 'bg-info',
    updatedText: 'Updated 45 min ago',
    email: 'daniel@analyticspro.io',
    phone: '+1 987-654-3210',
    location: 'Toronto, Canada',
    website: 'www.analyticspro.io',
  },
]

export type ChatUser = {
  name: string
  image: string
}

export type ChatMessageType = {
  message: string
  time: string
  user: ChatUser
}

export const chatUser: ChatUser[] = [
  { name: 'Carlos Méndez', image: user1 },
  { name: 'Sophie Laurent', image: user2 },
]

export const chatMessageData: ChatMessageType[] = [
  {
    message: 'Hey! Are you available for a quick call? 📞',
    time: '08:55 am',
    user: chatUser[0],
  },
  {
    message: 'Sure, give me 5 minutes. Just wrapping something up.',
    time: '08:57 am',
    user: chatUser[1],
  },
  {
    message: "Perfect. Let me know when you're ready 👍",
    time: '08:58 am',
    user: chatUser[0],
  },
  {
    message: 'Ready now. Calling you!',
    time: '09:00 am',
    user: chatUser[1],
  },
  {
    message: 'Thanks for your time earlier!',
    time: '09:45 am',
    user: chatUser[0],
  },
  {
    message: 'Of course! It was a productive discussion.',
    time: '09:46 am',
    user: chatUser[1],
  },
  {
    message: 'I’ll send over the updated files by noon.',
    time: '09:50 am',
    user: chatUser[0],
  },
]

export type TrafficType = {
  pageLink: string
  views: number
  unique: number
}

export const trafficData: TrafficType[] = [
  {
    pageLink: '/dashboard',
    views: 9.8,
    unique: 8.5,
  },
  {
    pageLink: '/ecommerce-index',
    views: 8.2,
    unique: 7.1,
  },
  {
    pageLink: '/apps/projects-overview',
    views: 7.6,
    unique: 6.2,
  },
  {
    pageLink: '/pages/contact',
    views: 5.9,
    unique: 4.8,
  },
  {
    pageLink: '/support/faq',
    views: 5.2,
    unique: 4.3,
  },
]

export type TopCountryType = {
  name: string
  image: string
  population: string
  visitors: number
  change: number
}

export const topCountryData: TopCountryType[] = [
  {
    name: 'India',
    image: inFlag,
    population: '1.43B',
    visitors: 14217,
    change: 3.2,
  },
  {
    name: 'Germany',
    image: deFlag,
    population: '83.2M',
    visitors: 10412,
    change: 1.5,
  },
  {
    name: 'France',
    image: frFlag,
    population: '67.5M',
    visitors: 8934,
    change: -0.8,
  },
  {
    name: 'United States',
    image: usFlag,
    population: '339.9M',
    visitors: 18522,
    change: 2.1,
  },
  {
    name: 'United Kingdom',
    image: gbFlag,
    population: '67.3M',
    visitors: 7614,
    change: -1.2,
  },
  {
    name: 'Canada',
    image: caFlag,
    population: '39.6M',
    visitors: 6221,
    change: 0.9,
  },
  {
    name: 'Japan',
    image: jpFlag,
    population: '123.3M',
    visitors: 5785,
    change: 0.0,
  },
  {
    name: 'Australia',
    image: auFlag,
    population: '26.8M',
    visitors: 4918,
    change: 1.1,
  },
]

export type ChannelType = {
  name: string
  image: string
  progress: number
}

export const channelData: ChannelType[] = [
  {
    name: 'Facebook',
    image: meta,
    progress: 78,
  },
  {
    name: 'Instagram',
    image: instagram,
    progress: 54,
  },
  {
    name: 'LinkedIn',
    image: linkedin,
    progress: 39,
  },
  {
    name: 'Google Search',
    image: google,
    progress: 22,
  },
  {
    name: 'Twitter / X',
    image: twitter,
    progress: 31,
  },
]
