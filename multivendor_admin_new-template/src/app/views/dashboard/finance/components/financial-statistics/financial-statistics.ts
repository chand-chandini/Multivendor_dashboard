import { Icon } from '@/app/components/icon/icon'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { userData } from '../../data'

@Component({
  selector: 'app-financial-statistics',
  imports: [RouterLink, NgbTooltipModule, Icon, NgbDropdownModule],
  templateUrl: './financial-statistics.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FinancialStatistics {
  userData = userData
}
