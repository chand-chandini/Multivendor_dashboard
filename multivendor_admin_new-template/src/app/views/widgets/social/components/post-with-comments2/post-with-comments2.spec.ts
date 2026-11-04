import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostWithComments2 } from './post-with-comments2'

describe('PostWithComments2', () => {
  let component: PostWithComments2
  let fixture: ComponentFixture<PostWithComments2>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostWithComments2],
    }).compileComponents()

    fixture = TestBed.createComponent(PostWithComments2)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
