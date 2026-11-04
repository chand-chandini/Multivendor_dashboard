import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostWithImages1 } from './post-with-images1'

describe('PostWithImages1', () => {
  let component: PostWithImages1
  let fixture: ComponentFixture<PostWithImages1>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostWithImages1],
    }).compileComponents()

    fixture = TestBed.createComponent(PostWithImages1)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
