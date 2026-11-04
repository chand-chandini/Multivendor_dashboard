import { Component, Input } from '@angular/core'
import { NgbProgressbarModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { AppType } from '../../data'

@Component({
  selector: 'app-integration-cards',
  imports: [NgbTooltipModule, NgbProgressbarModule],
  templateUrl: './integration-cards.html',
  styles: ``,
})
export class IntegrationCards {
  @Input() card!: AppType
}
