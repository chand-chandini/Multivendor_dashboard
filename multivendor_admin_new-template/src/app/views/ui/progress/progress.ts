import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-progress',
  imports: [PageBreadcrumb, NgbProgressbarModule],
  templateUrl: './progress.html',
  styles: ``,
})
export class Progress {}
