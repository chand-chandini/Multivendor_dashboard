import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-tweet4',
  imports: [Icon, RouterLink, NgbDropdownModule],
  templateUrl: './post-tweet4.html',
  styles: ``,
})
export class PostTweet4 {
  liked = true

  toggleLike() {
    this.liked = !this.liked
  }
}
