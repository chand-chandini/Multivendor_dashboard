import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-with-comments2',
  imports: [Icon, RouterLink, NgbDropdownModule],
  templateUrl: './post-with-comments2.html',
  styles: ``,
})
export class PostWithComments2 {
  liked = true

  toggleLike() {
    this.liked = !this.liked
  }
}
