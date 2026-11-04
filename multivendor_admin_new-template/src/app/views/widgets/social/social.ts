import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { AchievementUnlocked } from './components/achievement-unlocked/achievement-unlocked'
import { Congratulations } from './components/congratulations/congratulations'
import { CreatePost1 } from './components/create-post1/create-post1'
import { CreatePost2 } from './components/create-post2/create-post2'
import { PostActivity } from './components/post-activity/post-activity'
import { PostMedia } from './components/post-media/post-media'
import { PostMultiVideo } from './components/post-multi-video/post-multi-video'
import { PostOptions } from './components/post-options/post-options'
import { PostTweet1 } from './components/post-tweet1/post-tweet1'
import { PostTweet2 } from './components/post-tweet2/post-tweet2'
import { PostTweet3 } from './components/post-tweet3/post-tweet3'
import { PostTweet4 } from './components/post-tweet4/post-tweet4'
import { PostTweet5 } from './components/post-tweet5/post-tweet5'
import { PostVideo } from './components/post-video/post-video'
import { PostWeather } from './components/post-weather/post-weather'
import { PostWithComments1 } from './components/post-with-comments1/post-with-comments1'
import { PostWithComments2 } from './components/post-with-comments2/post-with-comments2'
import { PostWithFeedQuote } from './components/post-with-feed-quote/post-with-feed-quote'
import { PostWithImages1 } from './components/post-with-images1/post-with-images1'
import { PostWithImages2 } from './components/post-with-images2/post-with-images2'

@Component({
  selector: 'app-social',
  imports: [
    PageBreadcrumb,
    CreatePost1,
    CreatePost2,
    Congratulations,
    PostWithImages1,
    PostWithComments1,
    PostVideo,
    PostTweet1,
    PostTweet2,
    PostTweet3,
    PostTweet4,
    PostWeather,
    PostActivity,
    AchievementUnlocked,
    PostWithImages2,
    PostWithComments2,
    PostOptions,
    PostTweet5,
    PostMedia,
    PostWithFeedQuote,
    PostMultiVideo,
  ],
  templateUrl: './social.html',
  styles: ``,
})
export class Social {
  username = META_DATA.username
}
