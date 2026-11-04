import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { featureData } from '../../data'

@Component({
  selector: 'app-service',
  imports: [Icon, RouterLink],
  templateUrl: './service.html',
  styles: ``,
})
export class Service {
  featureData = featureData
}
