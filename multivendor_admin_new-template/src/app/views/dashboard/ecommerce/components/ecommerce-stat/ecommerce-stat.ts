import { Icon } from '@/app/components/icon/icon'
import { Component, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { StateType } from '../../data'

@Component({
  selector: 'app-ecommerce-stat',
  imports: [Icon, CountUpDirective],
  templateUrl: './ecommerce-stat.html',
  styles: ``,
})
export class EcommerceStat {
  @Input() state!: StateType
  Number = Number
}
