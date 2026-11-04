import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { Channels } from './components/channels/channels'
import { Chat } from './components/chat/chat'
import { ProjectCard } from './components/project-card/project-card'
import { Search } from './components/search/search'
import { StatisticCard1 } from './components/statistic-card1/statistic-card1'
import { StatisticCard2 } from './components/statistic-card2/statistic-card2'
import { Subscribers } from './components/subscribers/subscribers'
import { TopCountries } from './components/top-countries/top-countries'
import { TopTrafficSources } from './components/top-traffic-sources/top-traffic-sources'
import { TrafficSources } from './components/traffic-sources/traffic-sources'
import { UserCard } from './components/user-card/user-card'
import { Visitors } from './components/visitors/visitors'
import { overviewData, targetData, userData } from './data'

@Component({
  selector: 'app-mixed',
  imports: [PageBreadcrumb, StatisticCard1, Visitors, Subscribers, StatisticCard2, UserCard, Chat, TopCountries, TrafficSources, TopTrafficSources, Channels, Search, ProjectCard],
  templateUrl: './mixed.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Mixed {
  targetData = targetData
  overviewData = overviewData
  userData = userData
}
