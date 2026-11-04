import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-with-feed-quote',
  imports: [RouterLink, Icon, NgbDropdownModule],
  templateUrl: './post-with-feed-quote.html',
  styles: ``,
})
export class PostWithFeedQuote {
  liked = false

  toggleLike() {
    this.liked = !this.liked
  }
}
