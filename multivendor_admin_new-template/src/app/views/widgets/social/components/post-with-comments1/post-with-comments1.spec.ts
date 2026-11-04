import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostWithComments1 } from './post-with-comments1'

describe('PostWithComments1', () => {
  let component: PostWithComments1
  let fixture: ComponentFixture<PostWithComments1>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostWithComments1],
    }).compileComponents()

    fixture = TestBed.createComponent(PostWithComments1)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
