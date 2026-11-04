import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-tweet5',
  imports: [RouterLink, Icon, NgbDropdownModule],
  templateUrl: './post-tweet5.html',
  styles: ``,
})
export class PostTweet5 {}
