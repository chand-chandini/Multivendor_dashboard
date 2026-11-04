import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop'
import { Component } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { GroupedSortableDataType, groupedSortableWithLabelData } from '../../data'

@Component({
  selector: 'app-sortable-icons-label',
  imports: [Icon, DragDropModule],
  templateUrl: './sortable-icons-label.html',
  styles: ``,
})
export class SortableIconsLabel {
  sections: GroupedSortableDataType[] = groupedSortableWithLabelData

  drop<T>(event: CdkDragDrop<T[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex)
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex)
    }
  }
}
