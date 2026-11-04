import { formatBytes } from '@/app/utils/string'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { fileData, teamMemberData } from '../../data'

@Component({
  selector: 'app-task-sidebar',
  imports: [Icon, RouterLink],
  templateUrl: './task-sidebar.html',
  styles: ``,
})
export class TaskSidebar {
  teamMemberData = teamMemberData
  fileData = fileData
  protected readonly formatBytes = formatBytes
}
