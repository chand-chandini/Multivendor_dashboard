import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-tweet3',
  imports: [Icon, RouterLink, NgbDropdownModule],
  templateUrl: './post-tweet3.html',
  styles: ``,
})
export class PostTweet3 {
  liked = false

  toggleLike() {
    this.liked = !this.liked
  }
}
