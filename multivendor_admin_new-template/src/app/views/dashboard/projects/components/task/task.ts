import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { TableService } from '@/app/core/services/table.service'
import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { Observable } from 'rxjs'
import { taskData, TaskType } from '../../data'

@Component({
  selector: 'app-task',
  imports: [RouterLink, Icon, NgbDropdownModule, CustomPagination, AsyncPipe, FormsModule],
  providers: [TableService],
  templateUrl: './task.html',
  styles: ``,
})
export class Task {
  taskData = taskData
  taskData$: Observable<TaskType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<TaskType>) {
    this.taskData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.taskData), 5)
  }

  protected readonly toPascalCase = toPascalCase
}
