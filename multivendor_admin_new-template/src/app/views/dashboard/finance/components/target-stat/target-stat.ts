import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { TargetType } from '../../data'

@Component({
  selector: 'app-target-stat',
  imports: [CountUpDirective, CommonModule],
  templateUrl: './target-stat.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TargetStat {
  @Input() target!: TargetType
}
