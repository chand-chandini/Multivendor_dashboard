import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-with-images1',
  imports: [RouterLink, Icon, NgbDropdownModule],
  templateUrl: './post-with-images1.html',
  styles: ``,
})
export class PostWithImages1 {
  liked = true

  toggleLike() {
    this.liked = !this.liked
  }
}
