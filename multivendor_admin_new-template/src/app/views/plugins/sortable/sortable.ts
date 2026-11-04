import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { SortableIconsLabel } from './components/sortable-icons-label/sortable-icons-label'
import { SortableIcons } from './components/sortable-icons/sortable-icons'
import { SortableListHandle } from './components/sortable-list-handle/sortable-list-handle'
import { SortableList } from './components/sortable-list/sortable-list'

@Component({
  selector: 'app-sortable',
  imports: [PageBreadcrumb, SortableList, SortableListHandle, SortableIcons, SortableIconsLabel],
  templateUrl: './sortable.html',
  styles: ``,
})
export class Sortable {}
