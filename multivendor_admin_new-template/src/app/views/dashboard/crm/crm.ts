import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { Component } from '@angular/core'
import { CrmStat } from './components/crm-stat/crm-stat'
import { DealStatus } from './components/deal-status/deal-status'
import { LeadSource } from './components/lead-source/lead-source'
import { LocationSession } from './components/location-session/location-session'
import { Overview } from './components/overview/overview'
import { RecentActivity } from './components/recent-activity/recent-activity'
import { TopPerforming } from './components/top-performing/top-performing'
import { crmStatData } from './data'

@Component({
  selector: 'app-crm',
  imports: [PageBreadcrumb, CrmStat, Overview, LeadSource, DealStatus, TopPerforming, LocationSession, RecentActivity],
  templateUrl: './crm.html',
  styles: ``,
})
export class Crm {
  crmStatData = crmStatData
}
