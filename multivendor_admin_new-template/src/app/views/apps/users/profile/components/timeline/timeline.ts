import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'

@Component({
  selector: 'app-timeline',
  imports: [RouterLink, Icon],
  templateUrl: './timeline.html',
  styles: ``,
})
export class Timeline {
  isLiked = false
  isLiked2 = true

  toggleLike() {
    this.isLiked = !this.isLiked
  }

  toggleLike2() {
    this.isLiked2 = !this.isLiked2
  }
}
