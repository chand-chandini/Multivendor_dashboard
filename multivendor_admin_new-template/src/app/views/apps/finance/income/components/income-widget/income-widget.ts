import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { CountUpDirective } from 'ngx-countup'
import { IncomeStatType } from '../../data'

@Component({
  selector: 'app-income-widget',
  imports: [Icon, CountUpDirective],
  templateUrl: './income-widget.html',
  styles: ``,
})
export class IncomeWidget {
  @Input() item!: IncomeStatType
}
