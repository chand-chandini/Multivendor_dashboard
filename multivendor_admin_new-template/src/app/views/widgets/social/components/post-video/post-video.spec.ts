import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostVideo } from './post-video'

describe('PostVideo', () => {
  let component: PostVideo
  let fixture: ComponentFixture<PostVideo>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostVideo],
    }).compileComponents()

    fixture = TestBed.createComponent(PostVideo)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
