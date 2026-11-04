import { Component, inject, TemplateRef } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { FlatpickrDirective } from 'angularx-flatpickr'
import { SimplebarAngularModule } from 'simplebar-angular'

@Component({
  selector: 'app-todo-sidebar',
  imports: [Icon, SimplebarAngularModule, FlatpickrDirective],
  templateUrl: './todo-sidebar.html',
  styles: ``,
})
export class TodoSidebar {
  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  flatPickrOptions = {
    dateFormat: 'F j, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }
}
