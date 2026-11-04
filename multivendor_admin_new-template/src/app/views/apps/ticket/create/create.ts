import { Component } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-create',
  imports: [PageBreadcrumb, Icon],
  templateUrl: './create.html',
  styles: ``,
})
export class Create {}
