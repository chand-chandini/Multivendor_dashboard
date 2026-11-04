import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-tweet2',
  imports: [RouterLink, Icon, NgbDropdownModule],
  templateUrl: './post-tweet2.html',
  styles: ``,
})
export class PostTweet2 {}
