const user1 = 'assets/images/users/user-1.jpg'
const user2 = 'assets/images/users/user-2.jpg'
const user3 = 'assets/images/users/user-3.jpg'
const user4 = 'assets/images/users/user-4.jpg'
const user5 = 'assets/images/users/user-5.jpg'
const user6 = 'assets/images/users/user-6.jpg'
const user7 = 'assets/images/users/user-7.jpg'
const user8 = 'assets/images/users/user-8.jpg'
const user9 = 'assets/images/users/user-9.jpg'

export type FeatureType = {
  title: string
  description: string
  icon: string
}

export const featureData: FeatureType[] = [
  {
    title: 'Strategic Consulting',
    description: 'We help businesses define clear digital goals and create custom strategies that align with long-term success. From planning to execution.',
    icon: 'device-desktop',
  },
  {
    title: 'SEO & Traffic Growth',
    description: 'Boost your search visibility and drive organic traffic with our comprehensive SEO services — including keyword strategy, technical audits, etc.',
    icon: 'layout',
  },
  {
    title: 'Social Media Management',
    description: "Elevate your brand's presence with targeted content, community engagement, and performance analytics across platforms like Instagram, Facebook, etc.",
    icon: 'brush',
  },
  {
    title: 'Custom Web Development',
    description: 'We build modern, scalable websites and applications tailored to your business needs — optimized for speed, mobile responsiveness.',
    icon: 'code',
  },
  {
    title: 'Brand Identity & Design',
    description: 'From logos to full brand systems, we create memorable visual identities that express your values and connect with your target audience.',
    icon: 'rocket',
  },
  {
    title: 'Analytics & Insights',
    description: 'Turn data into decisions with real-time dashboards, performance reports, and analytics solutions that help you measure success.',
    icon: 'palette',
  },
]

export type TeamMemberType = {
  name: string
  role: string
  image: string
}

export const teamMemberData: TeamMemberType[] = [
  { name: 'Emily Carter', role: 'Chief Executive Officer', image: user1 },
  { name: 'Michael Lee', role: 'Head of Development', image: user2 },
  { name: 'Sophia Gomez', role: 'Marketing Director', image: user3 },
  { name: 'Daniel Kim', role: 'UI/UX Lead', image: user4 },
  { name: 'Hannah White', role: 'Product Manager', image: user8 },
  { name: 'Liam Smith', role: 'Frontend Developer', image: user5 },
  { name: 'Chloe Brown', role: 'Data Analyst', image: user6 },
  { name: 'Ethan Ross', role: 'QA Specialist', image: user7 },
  { name: 'Lena Marshall', role: 'UI/UX Designer', image: user9 },
]
