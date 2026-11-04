import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostTweet4 } from './post-tweet4'

describe('PostTweet4', () => {
  let component: PostTweet4
  let fixture: ComponentFixture<PostTweet4>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostTweet4],
    }).compileComponents()

    fixture = TestBed.createComponent(PostTweet4)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
