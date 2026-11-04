import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbCarouselConfig, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-carousel',
  imports: [PageBreadcrumb, NgbCarouselModule],
  templateUrl: './carousel.html',
  styles: ``,
})
export class Carousel {
  constructor(config: NgbCarouselConfig) {
    config.showNavigationArrows = true
    config.showNavigationIndicators = true
  }
}
