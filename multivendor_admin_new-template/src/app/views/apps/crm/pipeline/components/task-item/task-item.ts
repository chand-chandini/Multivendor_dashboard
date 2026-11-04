import { toPascalCase } from '@/app/utils/string'
import { Component, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { PipelineType } from '../../data'

@Component({
  selector: 'app-task-item',
  imports: [NgbDropdownModule, RouterLink, Icon],
  templateUrl: './task-item.html',
  styles: ``,
})
export class TaskItem {
  @Input() item!: PipelineType
  protected readonly toPascalCase = toPascalCase
}
