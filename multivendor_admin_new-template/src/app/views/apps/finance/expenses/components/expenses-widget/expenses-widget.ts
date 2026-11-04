import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { CountUpDirective } from 'ngx-countup'
import { StatType } from '../../data'

@Component({
  selector: 'app-expenses-widget',
  imports: [Icon, CountUpDirective],
  templateUrl: './expenses-widget.html',
  styles: ``,
})
export class ExpensesWidget {
  @Input() stat!: StatType
}
