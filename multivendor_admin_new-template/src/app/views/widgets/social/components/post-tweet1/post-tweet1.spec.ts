import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostTweet1 } from './post-tweet1'

describe('PostTweet1', () => {
  let component: PostTweet1
  let fixture: ComponentFixture<PostTweet1>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostTweet1],
    }).compileComponents()

    fixture = TestBed.createComponent(PostTweet1)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
