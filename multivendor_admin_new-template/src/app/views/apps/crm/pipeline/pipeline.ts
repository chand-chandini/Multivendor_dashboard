import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop'
import { Component, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { SimplebarAngularModule } from 'simplebar-angular'
import { TaskItem } from './components/task-item/task-item'
import { pipelineData, PipelineType } from './data'

@Component({
  selector: 'app-pipeline',
  imports: [PageBreadcrumb, CdkDropListGroup, CdkDropList, CdkDrag, SimplebarAngularModule, RouterLink, TaskItem, Icon],
  templateUrl: './pipeline.html',
  styles: ``,
})
export class Pipeline implements OnInit {
  leads: PipelineType[] = []
  negotiations: PipelineType[] = []
  won: PipelineType[] = []
  lost: PipelineType[] = []

  pipelineData = pipelineData

  ngOnInit(): void {
    this.leads = this.pipelineData.filter((t) => t.status === 'lead')
    this.negotiations = this.pipelineData.filter((t) => t.status === 'negotiation')
    this.won = this.pipelineData.filter((t) => t.status === 'won')
    this.lost = this.pipelineData.filter((t) => t.status === 'lost')
  }

  drop(event: CdkDragDrop<PipelineType[], any, any>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex)
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex)
    }
  }
}
