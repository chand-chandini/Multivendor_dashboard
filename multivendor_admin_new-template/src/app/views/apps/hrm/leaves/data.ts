export type LeaveStatType = {
  icon: string
  title: string
  value: number
  change: number
  unit?: string
}

export const leaveStatData: LeaveStatType[] = [
  {
    icon: 'calendar',
    value: 128,
    change: 4.8,
    title: 'Total leave requests',
  },
  {
    icon: 'checks',
    value: 92,
    change: 2.3,
    title: 'Approved leaves',
  },
  {
    icon: 'hourglass',
    value: 21,
    change: 1.2,
    title: 'Pending approvals',
  },
  {
    icon: 'x',
    value: 15,
    change: -0.5,
    title: 'Rejected leaves',
  },
  {
    icon: 'clock',
    value: 2.3,
    change: 0.7,
    title: 'Average leave duration',
    unit: 'days/leave',
  },
]

export type LeaveType = {
  id: string
  name: string
  department: string
  dateFrom: string
  dateTo: string
  leaveType: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  appliedOn: string
  approvedBy?: {
    name: string
  }
}

export const leaveData: LeaveType[] = [
  {
    id: 'EMP-1024',
    name: 'Alex Johnson',
    department: 'Design',
    dateFrom: '24 Oct 2025',
    dateTo: '25 Oct 2025',
    leaveType: 'Sick Leave',
    reason: 'Flu and recovery',
    status: 'pending',
    appliedOn: '22 Oct 2025',
  },
  {
    id: 'EMP-1078',
    name: 'Maria Smith',
    department: 'HR',
    dateFrom: '10 Oct 2025',
    dateTo: '12 Oct 2025',
    leaveType: 'Casual Leave',
    reason: 'Family event',
    status: 'approved',
    appliedOn: '08 Oct 2025',
    approvedBy: { name: 'John Adams' },
  },
  {
    id: 'EMP-1091',
    name: 'David Lee',
    department: 'IT',
    dateFrom: '18 Sep 2025',
    dateTo: '19 Sep 2025',
    leaveType: 'Paid Leave',
    reason: 'Short vacation',
    status: 'rejected',
    appliedOn: '15 Sep 2025',
    approvedBy: { name: 'Maria Smith' },
  },
  {
    id: 'EMP-1115',
    name: 'Emma Davis',
    department: 'Finance',
    dateFrom: '02 Oct 2025',
    dateTo: '03 Oct 2025',
    leaveType: 'Casual Leave',
    reason: 'Personal errand',
    status: 'approved',
    appliedOn: '29 Sep 2025',
    approvedBy: { name: 'John Adams' },
  },
  {
    id: 'EMP-1156',
    name: 'Noah Wilson',
    department: 'Marketing',
    dateFrom: '07 Oct 2025',
    dateTo: '09 Oct 2025',
    leaveType: 'Sick Leave',
    reason: 'Fever',
    status: 'approved',
    appliedOn: '05 Oct 2025',
    approvedBy: { name: 'Maria Smith' },
  },
  {
    id: 'EMP-1182',
    name: 'Olivia Brown',
    department: 'Operations',
    dateFrom: '20 Sep 2025',
    dateTo: '22 Sep 2025',
    leaveType: 'Maternity Leave',
    reason: 'Pre-delivery care',
    status: 'pending',
    appliedOn: '18 Sep 2025',
  },
  {
    id: 'EMP-1199',
    name: 'Daniel Clark',
    department: 'Support',
    dateFrom: '05 Sep 2025',
    dateTo: '06 Sep 2025',
    leaveType: 'Casual Leave',
    reason: 'Family function',
    status: 'approved',
    appliedOn: '03 Sep 2025',
    approvedBy: { name: 'John Adams' },
  },
  {
    id: 'EMP-1210',
    name: 'Sarah Miller',
    department: 'Admin',
    dateFrom: '25 Aug 2025',
    dateTo: '26 Aug 2025',
    leaveType: 'Casual Leave',
    reason: 'Out of town',
    status: 'approved',
    appliedOn: '22 Aug 2025',
    approvedBy: { name: 'Maria Smith' },
  },
  {
    id: 'EMP-1225',
    name: 'Lucas Green',
    department: 'Sales',
    dateFrom: '15 Aug 2025',
    dateTo: '16 Aug 2025',
    leaveType: 'Paid Leave',
    reason: 'Wedding attendance',
    status: 'approved',
    appliedOn: '12 Aug 2025',
    approvedBy: { name: 'John Adams' },
  },
  {
    id: 'EMP-1242',
    name: 'Henry Walker',
    department: 'Logistics',
    dateFrom: '10 Jul 2025',
    dateTo: '12 Jul 2025',
    leaveType: 'Casual Leave',
    reason: 'Travel with family',
    status: 'approved',
    appliedOn: '08 Jul 2025',
    approvedBy: { name: 'Maria Smith' },
  },
]
