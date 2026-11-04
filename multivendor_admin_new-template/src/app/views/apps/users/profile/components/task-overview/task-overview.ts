import { toPascalCase } from '@/app/utils/string'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { taskData } from '../../data'

@Component({
  selector: 'app-task-overview',
  imports: [Icon, RouterLink],
  templateUrl: './task-overview.html',
  styles: ``,
})
export class TaskOverview {
  taskData = taskData
  protected readonly toPascalCase = toPascalCase
}
