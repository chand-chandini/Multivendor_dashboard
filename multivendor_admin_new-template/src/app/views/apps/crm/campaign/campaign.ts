import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { CampaignTable } from './components/campaign-table/campaign-table'
import { CampaignWidget } from './components/campaign-widget/campaign-widget'
import { campaignStatData } from './data'

@Component({
  selector: 'app-campaign',
  imports: [PageBreadcrumb, CampaignTable, CampaignWidget],
  templateUrl: './campaign.html',
  styles: ``,
})
export class Campaign {
  campaignStatData = campaignStatData
}
