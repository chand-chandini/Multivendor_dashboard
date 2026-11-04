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
const auFlag = 'assets/images/flags/au.svg'
const caFlag = 'assets/images/flags/ca.svg'
const chFlag = 'assets/images/flags/ch.svg'
const deFlag = 'assets/images/flags/de.svg'
const esFlag = 'assets/images/flags/es.svg'
const frFlag = 'assets/images/flags/fr.svg'
const gbFlag = 'assets/images/flags/gb.svg'
const ieFlag = 'assets/images/flags/ie.svg'
const itFlag = 'assets/images/flags/it.svg'
const nlFlag = 'assets/images/flags/nl.svg'
const ptFlag = 'assets/images/flags/pt.svg'
const sgFlag = 'assets/images/flags/sg.svg'
const usFlag = 'assets/images/flags/us.svg'

export type StaffType = {
  id: string
  member: {
    image: string
    name: string
    email: string
  }
  phone: string
  country: {
    code: string
    flag: string
  }
  joinedDate: string
  role: string
  department: string
  status: 'active' | 'on-leave' | 'suspended' | 'probation' | 'review-pending'
}

export const staffListData: StaffType[] = [
  {
    id: 'STF-001',
    member: {
      image: user3,
      name: 'Samantha Green',
      email: 'samantha.green@company.com',
    },
    phone: '+1 202 555 0147',
    country: { code: 'US', flag: usFlag },
    joinedDate: 'Feb 10, 2024',
    role: 'HR Manager',
    department: 'Human Resources',
    status: 'active',
  },
  {
    id: 'STF-002',
    member: {
      image: user5,
      name: 'Liam Johnson',
      email: 'liam.johnson@company.com',
    },
    phone: '+44 7700 900123',
    country: { code: 'UK', flag: gbFlag },
    joinedDate: 'Jan 25, 2024',
    role: 'Software Engineer',
    department: 'IT Department',
    status: 'on-leave',
  },
  {
    id: 'STF-003',
    member: {
      image: user7,
      name: 'Noah Martinez',
      email: 'noah.martinez@company.com',
    },
    phone: '+61 401 222 890',
    country: { code: 'AU', flag: auFlag },
    joinedDate: 'Mar 05, 2024',
    role: 'Project Coordinator',
    department: 'Operations',
    status: 'suspended',
  },
  {
    id: 'STF-004',
    member: {
      image: user8,
      name: 'Emily Davis',
      email: 'emily.davis@company.com',
    },
    phone: '+1 303 555 0172',
    country: { code: 'CA', flag: caFlag },
    joinedDate: 'Apr 18, 2024',
    role: 'Marketing Lead',
    department: 'Marketing',
    status: 'active',
  },
  {
    id: 'STF-005',
    member: {
      image: user9,
      name: 'Lucas Brown',
      email: 'lucas.brown@company.com',
    },
    phone: '+49 1512 345678',
    country: { code: 'GE', flag: deFlag },
    joinedDate: 'May 12, 2024',
    role: 'Financial Analyst',
    department: 'Finance',
    status: 'active',
  },
  {
    id: 'STF-006',
    member: {
      image: user10,
      name: 'Olivia Wilson',
      email: 'olivia.wilson@company.com',
    },
    phone: '+33 6 12 34 56 78',
    country: { code: 'FR', flag: frFlag },
    joinedDate: 'Jun 02, 2024',
    role: 'UX Designer',
    department: 'Design',
    status: 'probation',
  },
  {
    id: 'STF-007',
    member: {
      image: user1,
      name: 'Isabella Moore',
      email: 'isabella.moore@company.com',
    },
    phone: '+34 612 345 678',
    country: { code: 'SP', flag: esFlag },
    joinedDate: 'Jul 21, 2024',
    role: 'Data Analyst',
    department: 'Analytics',
    status: 'active',
  },
  {
    id: 'STF-008',
    member: {
      image: user2,
      name: 'Ethan Clark',
      email: 'ethan.clark@company.com',
    },
    phone: '+39 347 123 4567',
    country: { code: 'IT', flag: itFlag },
    joinedDate: 'Aug 08, 2024',
    role: 'QA Tester',
    department: 'Quality Assurance',
    status: 'review-pending',
  },
  {
    id: 'STF-009',
    member: {
      image: user4,
      name: 'Charlotte Turner',
      email: 'charlotte.turner@company.com',
    },
    phone: '+41 79 123 4567',
    country: { code: 'SW', flag: chFlag },
    joinedDate: 'Sep 15, 2024',
    role: 'Legal Advisor',
    department: 'Legal',
    status: 'active',
  },
  {
    id: 'STF-010',
    member: {
      image: user9,
      name: 'Amelia Walker',
      email: 'amelia.walker@company.com',
    },
    phone: '+65 8123 4567',
    country: { code: 'SI', flag: sgFlag },
    joinedDate: 'Oct 04, 2024',
    role: 'Sales Executive',
    department: 'Sales',
    status: 'probation',
  },
  {
    id: 'STF-011',
    member: {
      image: user7,
      name: 'Benjamin Scott',
      email: 'benjamin.scott@company.com',
    },
    phone: '+31 6 12 34 56 78',
    country: { code: 'NE', flag: nlFlag },
    joinedDate: 'Nov 11, 2024',
    role: 'Network Administrator',
    department: 'IT Department',
    status: 'active',
  },
  {
    id: 'STF-012',
    member: {
      image: user6,
      name: 'Henry Lewis',
      email: 'henry.lewis@company.com',
    },
    phone: '+353 86 123 4567',
    country: { code: 'IR', flag: ieFlag },
    joinedDate: 'Dec 02, 2024',
    role: 'Content Strategist',
    department: 'Marketing',
    status: 'review-pending',
  },
  {
    id: 'STF-013',
    member: {
      image: user1,
      name: 'Grace Adams',
      email: 'grace.adams@company.com',
    },
    phone: '+351 912 345 678',
    country: { code: 'PO', flag: ptFlag },
    joinedDate: 'Dec 18, 2024',
    role: 'Product Manager',
    department: 'Product',
    status: 'active',
  },
]
