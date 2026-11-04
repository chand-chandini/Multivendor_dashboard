import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap'
import { commentData } from '../../data'
@Component({
  selector: 'app-comments',
  imports: [Icon, RouterLink, NgbPaginationModule],
  templateUrl: './comments.html',
  styles: ``,
})
export class Comments {
  commentData = commentData
  page = 1
}
