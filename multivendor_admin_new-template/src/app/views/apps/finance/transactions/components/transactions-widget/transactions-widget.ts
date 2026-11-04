import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { CountUpDirective } from 'ngx-countup'
import { StatType } from '../../data'

@Component({
  selector: 'app-transactions-widget',
  imports: [Icon, CountUpDirective],
  templateUrl: './transactions-widget.html',
  styles: ``,
})
export class TransactionsWidget {
  @Input() item!: StatType
}
