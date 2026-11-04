import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { TableService } from '@/app/core/services/table.service'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { Observable } from 'rxjs'
import { projectData, ProjectType } from '../../data'

@Component({
  selector: 'app-ongoing-project',
  imports: [RouterLink, Icon, CommonModule, NgbDropdownModule, FormsModule, CustomPagination],
  providers: [TableService],
  templateUrl: './ongoing-project.html',
  styles: ``,
})
export class OngoingProject {
  projectData = projectData
  projectData$: Observable<ProjectType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<ProjectType>) {
    this.projectData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.projectData), 5)
  }
}
