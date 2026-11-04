import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostWithImages2 } from './post-with-images2'

describe('PostWithImages2', () => {
  let component: PostWithImages2
  let fixture: ComponentFixture<PostWithImages2>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostWithImages2],
    }).compileComponents()

    fixture = TestBed.createComponent(PostWithImages2)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
