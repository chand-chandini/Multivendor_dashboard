import { toPascalCase } from '@/app/utils/string'
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop'
import { Component, inject, TemplateRef } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbModal, NgbOffcanvas, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { SimplebarAngularModule } from 'simplebar-angular'
import { TodoSidebar } from './components/todo-sidebar/todo-sidebar'
import { taskData, TaskType } from './data'

@Component({
  selector: 'app-todo',
  imports: [PageBreadcrumb, Icon, SimplebarAngularModule, NgbTooltipModule, DragDropModule, RouterLink, TodoSidebar],
  templateUrl: './todo.html',
  styles: ``,
})
export class Todo {
  tasks: TaskType[] = taskData

  private modalService = inject(NgbModal)
  private offcanvasService = inject(NgbOffcanvas)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  openTaskModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  openSidebar(content: TemplateRef<any>) {
    this.offcanvasService.open(content, {
      position: 'start',
      panelClass: 'outlook-left-menu outlook-left-menu-lg',
      backdrop: true,
      scroll: true,
    })
  }

  drop(event: CdkDragDrop<TaskType[]>) {
    moveItemInArray(this.tasks, event.previousIndex, event.currentIndex)
  }

  protected readonly toPascalCase = toPascalCase
}
