import { Component, inject, TemplateRef } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-offcanvas',
  imports: [PageBreadcrumb],
  templateUrl: './offcanvas.html',
  styles: ``,
})
export class Offcanvas {
  private offcanvasService = inject(NgbOffcanvas)

  openTop(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { position: 'top' })
  }
  openStart(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.dismiss()
    this.offcanvasService.open(content, { position: 'start' })
  }

  openBottom(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { position: 'bottom' })
  }
  openEnd(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { position: 'end' })
  }

  openNoBackdrop(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { backdrop: false, scroll: true })
  }

  openScroll(scroll: TemplateRef<any>) {
    this.offcanvasService.open(scroll, { scroll: true })
  }

  openDark(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, {
      position: 'start',
      panelClass: 'text-bg-dark',
    })
  }
}
