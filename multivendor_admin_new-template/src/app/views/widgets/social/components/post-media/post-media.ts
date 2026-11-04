import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-media',
  imports: [Icon, RouterLink, NgbDropdownModule],
  templateUrl: './post-media.html',
  styles: ``,
})
export class PostMedia {
  liked = true

  toggleLike() {
    this.liked = !this.liked
  }
}
