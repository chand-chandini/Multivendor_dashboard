import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-with-comments1',
  imports: [RouterLink, Icon, NgbDropdownModule],
  templateUrl: './post-with-comments1.html',
  styles: ``,
})
export class PostWithComments1 {
  liked = false

  toggleLike() {
    this.liked = !this.liked
  }
}
