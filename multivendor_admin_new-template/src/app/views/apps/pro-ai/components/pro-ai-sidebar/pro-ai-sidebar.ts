import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { SimplebarAngularModule } from 'simplebar-angular'

type MenuType = {
  icon?: string
  label: string
  href: string
  active?: boolean
}

@Component({
  selector: 'app-pro-ai-sidebar',
  imports: [RouterLink, SimplebarAngularModule, Icon],
  templateUrl: './pro-ai-sidebar.html',
  styles: ``,
})
export class ProAiSidebar {
  mainMenuData: MenuType[] = [
    { icon: 'message-circle', label: 'Start Chat', href: '', active: true },
    { icon: 'search', label: 'Find Threads', href: '' },
    { icon: 'archive', label: 'Saved Sessions', href: '' },
    { icon: 'cpu', label: 'AI Tools', href: '' },
    { icon: 'video', label: 'AI Vision', href: '' },
    { icon: 'grid-pattern', label: 'Explore Models', href: '' },
  ]

  workspaceData: MenuType[] = [
    { icon: 'folder-plus', label: 'New Workspace', href: '' },
    { icon: 'folder', label: 'Marketing', href: '' },
    { icon: 'folder', label: 'Design Team', href: '' },
    { icon: 'folder', label: 'DevOps', href: '' },
    { icon: 'folder', label: 'Legal', href: '' },
    { icon: 'folder', label: 'Freelancers', href: '' },
  ]

  conversationData: MenuType[] = [
    { label: 'Website Redesign Brief', href: '' },
    { label: 'Sprint Planning Q2', href: '' },
    { label: 'Client Onboarding Script', href: '' },
    { label: 'Legal Agreement Review', href: '' },
    { label: 'Product Launch Sequence', href: '' },
    { label: 'Budget Automation Draft', href: '' },
  ]
}
