import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostTweet2 } from './post-tweet2'

describe('PostTweet2', () => {
  let component: PostTweet2
  let fixture: ComponentFixture<PostTweet2>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostTweet2],
    }).compileComponents()

    fixture = TestBed.createComponent(PostTweet2)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
