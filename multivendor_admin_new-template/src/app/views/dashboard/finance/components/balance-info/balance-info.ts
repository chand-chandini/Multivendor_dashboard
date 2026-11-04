import { Icon } from '@/app/components/icon/icon'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'

@Component({
  selector: 'app-balance-info',
  imports: [RouterLink, Icon, NgbDropdownModule, CountUpDirective],
  templateUrl: './balance-info.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BalanceInfo {
  showBalance = true

  toggleBalance() {
    this.showBalance = !this.showBalance
  }
}
