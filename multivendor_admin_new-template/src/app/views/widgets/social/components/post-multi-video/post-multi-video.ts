import { Icon } from '@/app/components/icon/icon'
import { META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-multi-video',
  imports: [RouterLink, Icon, NgbDropdownModule],
  templateUrl: './post-multi-video.html',
  styles: ``,
})
export class PostMultiVideo {
  username = META_DATA.username
  liked = true

  toggleLike() {
    this.liked = !this.liked
  }
}
