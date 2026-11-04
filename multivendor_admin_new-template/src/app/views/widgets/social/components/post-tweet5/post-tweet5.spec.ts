import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostTweet5 } from './post-tweet5'

describe('PostTweet5', () => {
  let component: PostTweet5
  let fixture: ComponentFixture<PostTweet5>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostTweet5],
    }).compileComponents()

    fixture = TestBed.createComponent(PostTweet5)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
