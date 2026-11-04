import { META_DATA } from '@/app/constants'
import { Component, inject, TemplateRef } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbOffcanvas, NgbTooltip } from '@ng-bootstrap/ng-bootstrap'
import { SimplebarAngularModule } from 'simplebar-angular'
import { ProAiSidebar } from './components/pro-ai-sidebar/pro-ai-sidebar'

type FeatureType = {
  icon: string
  title: string
  href: string
}

@Component({
  selector: 'app-pro-ai',
  imports: [PageBreadcrumb, Icon, RouterLink, SimplebarAngularModule, ProAiSidebar, NgbTooltip],
  templateUrl: './pro-ai.html',
  styles: ``,
})
export class ProAi {
  username = META_DATA.username

  private offcanvasService = inject(NgbOffcanvas)

  openSidebar(content: TemplateRef<any>) {
    this.offcanvasService.open(content, {
      position: 'start',
      panelClass: 'outlook-left-menu rounded-start-4',
      backdrop: true,
      scroll: true,
    })
  }

  featureData: FeatureType[] = [
    {
      icon: 'brain',
      title: 'Generate AI-powered insights from customer reviews',
      href: '',
    },
    {
      icon: 'robot',
      title: 'Create chatbot responses for common support questions',
      href: '',
    },
    {
      icon: 'text-recognition',
      title: 'Summarize lengthy documents using AI',
      href: '',
    },
  ]
}
