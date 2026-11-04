import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { commentData } from '../../data'
import { FeedCard } from '../feed-card/feed-card'

@Component({
  selector: 'app-feeds',
  imports: [RouterLink, Icon, FeedCard],
  templateUrl: './feeds.html',
  styles: ``,
})
export class Feeds {
  commentData = commentData
}
