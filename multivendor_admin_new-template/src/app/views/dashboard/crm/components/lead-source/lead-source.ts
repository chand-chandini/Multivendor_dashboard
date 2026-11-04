import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { mostLeadsChart } from '../../data'

@Component({
  selector: 'app-lead-source',
  imports: [RouterLink, Icon, Apexchart],
  templateUrl: './lead-source.html',
  styles: ``,
})
export class LeadSource {
  mostLeadsChart = mostLeadsChart
}
