import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { CampaignStatType } from '../../data'

@Component({
  selector: 'app-campaign-widget',
  imports: [Icon],
  templateUrl: './campaign-widget.html',
  styles: ``,
})
export class CampaignWidget {
  @Input() item!: CampaignStatType
}
