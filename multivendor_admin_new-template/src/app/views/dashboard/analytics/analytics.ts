import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { Component } from '@angular/core'
import { AnalyticsOverview } from './components/analytics-overview/analytics-overview'
import { AudienceInsights } from './components/audience-insights/audience-insights'
import { BrowserSession } from './components/browser-session/browser-session'
import { SessionsOverview } from './components/sessions-overview/sessions-overview'
import { TotalOrder } from './components/total-order/total-order'
import { TotalSubscribers } from './components/total-subscribers/total-subscribers'
import { TotalVisitors } from './components/total-visitors/total-visitors'
import { TrafficSources } from './components/traffic-sources/traffic-sources'
import { UserGeography } from './components/user-geography/user-geography'

@Component({
  selector: 'app-analytics',
  imports: [PageBreadcrumb, TotalOrder, TotalVisitors, TotalSubscribers, SessionsOverview, AudienceInsights, UserGeography, TrafficSources, BrowserSession, AnalyticsOverview],
  templateUrl: './analytics.html',
  styles: ``,
})
export class Analytics {}
