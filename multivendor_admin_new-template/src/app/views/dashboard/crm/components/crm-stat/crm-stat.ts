import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { CrmStatType } from '../../data'

@Component({
  selector: 'app-crm-stat',
  imports: [Icon, CountUpDirective, Apexchart],
  templateUrl: './crm-stat.html',
  styles: ``,
})
export class CrmStat {
  @Input() item!: CrmStatType
  @Input() index!: number
  Number = Number
}
