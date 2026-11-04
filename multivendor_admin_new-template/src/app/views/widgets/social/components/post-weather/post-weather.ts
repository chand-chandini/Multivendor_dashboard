import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-weather',
  imports: [Icon, RouterLink, NgbDropdownModule],
  templateUrl: './post-weather.html',
  styles: ``,
})
export class PostWeather {
  liked = false

  toggleLike() {
    this.liked = !this.liked
  }
}
