import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostWithFeedQuote } from './post-with-feed-quote'

describe('PostWithFeedQuote', () => {
  let component: PostWithFeedQuote
  let fixture: ComponentFixture<PostWithFeedQuote>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostWithFeedQuote],
    }).compileComponents()

    fixture = TestBed.createComponent(PostWithFeedQuote)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
