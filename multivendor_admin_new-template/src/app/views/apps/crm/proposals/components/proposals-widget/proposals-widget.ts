import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { ProposalStatType } from '../../data'

@Component({
  selector: 'app-proposals-widget',
  imports: [Icon],
  templateUrl: './proposals-widget.html',
  styles: ``,
})
export class ProposalsWidget {
  @Input() item!: ProposalStatType
}
