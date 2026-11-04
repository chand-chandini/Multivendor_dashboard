import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { SimplebarAngularModule } from 'simplebar-angular'
import { activityData } from '../../data'

@Component({
  selector: 'app-recent-activity',
  imports: [Icon, RouterLink, SimplebarAngularModule, NgbDropdownModule],
  templateUrl: './recent-activity.html',
  styles: ``,
})
export class RecentActivity {
  activityData = activityData
}
