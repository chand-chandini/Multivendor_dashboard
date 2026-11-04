const user5 = 'assets/images/users/user-5.jpg'
const user6 = 'assets/images/users/user-6.jpg'
const user8 = 'assets/images/users/user-8.jpg'
const user9 = 'assets/images/users/user-9.jpg'
const user3 = 'assets/images/users/user-3.jpg'
const user7 = 'assets/images/users/user-7.jpg'
const user4 = 'assets/images/users/user-4.jpg'
const user10 = 'assets/images/users/user-10.jpg'
const user1 = 'assets/images/users/user-1.jpg'

export type KanbanTaskType = {
  status: 'todo' | 'in-progress' | 'in-review' | 'done'
  priority: 'high' | 'normal' | 'medium' | 'urgent' | 'completed'
  title: string
  assignee: { name: string; image: string }
  stats: { time: string; task: number; link: number; messages: number }
}

export const kanbanTaskData: KanbanTaskType[] = [
  {
    status: 'todo',
    priority: 'high',
    title: 'Design onboarding flow for new user sign-up journey.',
    assignee: { name: 'Ava Mitchell', image: user5 },
    stats: { time: '4 Days', task: 3, link: 2, messages: 9 },
  },
  {
    status: 'todo',
    priority: 'normal',
    title: 'Create dark/light theme switcher with local storage.',
    assignee: { name: 'Mia Johnson', image: user8 },
    stats: { time: '2 Days', task: 4, link: 1, messages: 6 },
  },
  {
    status: 'todo',
    priority: 'medium',
    title: 'Write documentation for project setup and deployment.',
    assignee: { name: 'Emma Scott', image: user9 },
    stats: { time: '6 Days', task: 3, link: 1, messages: 10 },
  },
  {
    status: 'todo',
    priority: 'high',
    title: 'Fix payment failed callback issue in checkout API.',
    assignee: { name: 'Noah Parker', image: user3 },
    stats: { time: '1 Day', task: 5, link: 2, messages: 14 },
  },
  {
    status: 'todo',
    priority: 'urgent',
    title: 'Resolve server downtime and restore access logs.',
    assignee: { name: 'Lucas Martin', image: user7 },
    stats: { time: '8 Hours', task: 7, link: 3, messages: 18 },
  },
  {
    status: 'in-progress',
    priority: 'high',
    title: 'Implement role-based access control for admin panel.',
    assignee: { name: 'Sophia Wilson', image: user4 },
    stats: { time: '3 Days', task: 5, link: 4, messages: 11 },
  },
  {
    status: 'in-progress',
    priority: 'medium',
    title: 'Refactor project directory structure for clarity.',
    assignee: { name: 'Hannah Green', image: user7 },
    stats: { time: '5 Days', task: 3, link: 1, messages: 7 },
  },
  {
    status: 'in-progress',
    priority: 'urgent',
    title: 'Resolve 500 errors occurring on user authentication.',
    assignee: { name: 'Evelyn Clark', image: user9 },
    stats: { time: '6 Hours', task: 8, link: 5, messages: 21 },
  },
  {
    status: 'in-review',
    priority: 'medium',
    title: 'Add placeholder loading animations (skeleton screens).',
    assignee: { name: 'Benjamin Hill', image: user10 },
    stats: { time: '4 Days', task: 4, link: 0, messages: 8 },
  },
  {
    status: 'in-review',
    priority: 'normal',
    title: 'Improve success/error toast notification styles.',
    assignee: { name: 'Andrew Carter', image: user6 },
    stats: { time: '5 Days', task: 1, link: 0, messages: 3 },
  },
  {
    status: 'in-review',
    priority: 'high',
    title: 'Integrate analytics dashboard with real-time API data.',
    assignee: { name: 'Logan Brooks', image: user7 },
    stats: { time: '3 Days', task: 6, link: 3, messages: 12 },
  },
  {
    status: 'in-review',
    priority: 'medium',
    title: 'Add pagination support to activity feed task.',
    assignee: { name: 'Mark Evans', image: user1 },
    stats: { time: '4 Days', task: 3, link: 1, messages: 5 },
  },
  {
    status: 'done',
    priority: 'completed',
    title: 'Completed UI redesign for profile settings page.',
    assignee: { name: 'Harper Lee', image: user3 },
    stats: { time: 'Completed', task: 4, link: 1, messages: 3 },
  },
  {
    status: 'done',
    priority: 'completed',
    title: 'Launched new email notification templating system.',
    assignee: { name: 'Jacob Miller', image: user5 },
    stats: { time: 'Completed', task: 5, link: 0, messages: 2 },
  },
]
