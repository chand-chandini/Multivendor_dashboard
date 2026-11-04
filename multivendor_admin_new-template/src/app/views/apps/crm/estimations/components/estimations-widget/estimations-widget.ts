import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { EstimationStatType } from '../../data'

@Component({
  selector: 'app-estimations-widget',
  imports: [Icon],
  templateUrl: './estimations-widget.html',
  styles: ``,
})
export class EstimationsWidget {
  @Input() item!: EstimationStatType
}
