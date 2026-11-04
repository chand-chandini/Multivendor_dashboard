import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-activity',
  imports: [RouterLink, Icon, NgbDropdownModule],
  templateUrl: './post-activity.html',
  styles: ``,
})
export class PostActivity {
  liked = true

  toggleLike() {
    this.liked = !this.liked
  }
}
