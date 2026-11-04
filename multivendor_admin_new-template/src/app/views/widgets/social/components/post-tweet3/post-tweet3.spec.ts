import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostTweet3 } from './post-tweet3'

describe('PostTweet3', () => {
  let component: PostTweet3
  let fixture: ComponentFixture<PostTweet3>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostTweet3],
    }).compileComponents()

    fixture = TestBed.createComponent(PostTweet3)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
