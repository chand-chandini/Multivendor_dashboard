import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-tweet1',
  imports: [Icon, RouterLink, NgbDropdownModule],
  templateUrl: './post-tweet1.html',
  styles: ``,
})
export class PostTweet1 {}
