import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostActivity } from './post-activity'

describe('PostActivity', () => {
  let component: PostActivity
  let fixture: ComponentFixture<PostActivity>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostActivity],
    }).compileComponents()

    fixture = TestBed.createComponent(PostActivity)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
