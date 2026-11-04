import { Component } from '@angular/core'
import { Apexchart } from '@app/components/apexchart/apexchart'
import { getSellerChartOptions } from '../../data'

@Component({
  selector: 'app-seller-overview',
  imports: [Apexchart],
  templateUrl: './seller-overview.html',
  styles: ``,
})
export class SellerOverview {
  getSellerChartOptions = getSellerChartOptions
}
