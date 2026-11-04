import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { NgbProgressbar } from '@ng-bootstrap/ng-bootstrap'
import { DealStatType } from '../../data'

@Component({
  selector: 'app-deals-widget',
  imports: [NgbProgressbar, Icon],
  templateUrl: './deals-widget.html',
  styles: ``,
})
export class DealsWidget {
  @Input() item!: DealStatType
}
