import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { Chat } from './components/chat/chat'
import { Detail } from './components/detail/detail'

@Component({
  selector: 'app-details',
  imports: [PageBreadcrumb, Detail, Chat],
  templateUrl: './details.html',
  styles: ``,
})
export class Details {}
