import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostMultiVideo } from './post-multi-video'

describe('PostMultiVideo', () => {
  let component: PostMultiVideo
  let fixture: ComponentFixture<PostMultiVideo>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostMultiVideo],
    }).compileComponents()

    fixture = TestBed.createComponent(PostMultiVideo)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
