const user1 = 'assets/images/users/user-1.jpg'
const user2 = 'assets/images/users/user-2.jpg'
const user3 = 'assets/images/users/user-3.jpg'
const user4 = 'assets/images/users/user-4.jpg'
const user7 = 'assets/images/users/user-7.jpg'
const user8 = 'assets/images/users/user-8.jpg'
const user9 = 'assets/images/users/user-9.jpg'
const user10 = 'assets/images/users/user-10.jpg'
const caFlag = 'assets/images/flags/ca.svg'
const cnFlag = 'assets/images/flags/cn.svg'
const esFlag = 'assets/images/flags/es.svg'
const gbFlag = 'assets/images/flags/gb.svg'
const itFlag = 'assets/images/flags/it.svg'
const jpFlag = 'assets/images/flags/jp.svg'
const egFlag = 'assets/images/flags/eg.svg'
const usFlag = 'assets/images/flags/us.svg'

export type ContactType = {
  user: {
    name: string
    image: string
    username: string
  }
  flag: string
  role: string
  badge: { label: string; variant: string }
  website: string
  stats: { posts: number; followers: string; followings: number }
  updatedTime: string
}

export const contactData: ContactType[] = [
  {
    user: {
      name: 'Sophia Carter',
      image: user1,
      username: '@Founder',
    },
    flag: gbFlag,
    role: 'Lead UI/UX Designer',
    badge: { label: 'Admin', variant: 'secondary' },
    website: 'sophiacarter.com',
    stats: { posts: 134, followers: '29.8k', followings: 1125 },
    updatedTime: '1 hour ago',
  },
  {
    user: {
      name: 'Daniel Lee',
      image: user2,
      username: '@danielpm',
    },
    flag: usFlag,
    role: 'Product Manager',
    badge: { label: 'Verified', variant: 'success' },
    website: 'daniellee.com',
    stats: { posts: 98, followers: '12.5k', followings: 860 },
    updatedTime: '2 hours ago',
  },
  {
    user: {
      name: 'Maria Rodriguez',
      image: user3,
      username: '@maria',
    },
    flag: esFlag,
    role: 'Marketing Head',
    badge: { label: 'Team Lead', variant: 'info' },
    website: 'mariaworks.es',
    stats: { posts: 205, followers: '18.4k', followings: 1432 },
    updatedTime: '3 hours ago',
  },
  {
    user: {
      name: 'Liam Zhang',
      image: user4,
      username: '@liamdev',
    },
    flag: cnFlag,
    role: 'Frontend Developer',
    badge: { label: 'Contributor', variant: 'warning' },
    website: 'liamzhang.cn',
    stats: { posts: 67, followers: '9.3k', followings: 540 },
    updatedTime: '10 mins ago',
  },
  {
    user: {
      name: 'Ethan Wright',
      image: user7,
      username: '@DevOps',
    },
    flag: caFlag,
    role: 'Senior Backend Engineer',
    badge: { label: 'Moderator', variant: 'primary' },
    website: 'ethanwright.dev',
    stats: { posts: 89, followers: '16.4k', followings: 734 },
    updatedTime: '45 mins ago',
  },
  {
    user: {
      name: 'Isabella Moretti',
      image: user8,
      username: '@isamoretti',
    },
    flag: itFlag,
    role: 'Content Strategist',
    badge: { label: 'Top Creator', variant: 'danger' },
    website: 'moretti.io',
    stats: { posts: 162, followers: '24.7k', followings: 921 },
    updatedTime: '2 hours ago',
  },
  {
    user: {
      name: 'Kenji Tanaka',
      image: user9,
      username: '@kenjicode',
    },
    flag: jpFlag,
    role: 'Full Stack Developer',
    badge: { label: 'Contributor', variant: 'info' },
    website: 'kenjitanaka.dev',
    stats: { posts: 113, followers: '13.9k', followings: 678 },
    updatedTime: '30 mins ago',
  },
  {
    user: {
      name: 'Amira El-Sayed',
      image: user10,
      username: '@amira.codes',
    },
    flag: egFlag,
    role: 'Data Scientist',
    badge: { label: 'Analyst', variant: 'warning' },
    website: 'amira-ai.tech',
    stats: { posts: 176, followers: '21.1k', followings: 998 },
    updatedTime: '20 mins ago',
  },
]
