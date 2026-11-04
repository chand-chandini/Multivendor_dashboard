import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-post-options',
  imports: [Icon, RouterLink, NgbDropdownModule],
  templateUrl: './post-options.html',
  styles: ``,
})
export class PostOptions {}
