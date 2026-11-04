import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostMedia } from './post-media'

describe('PostMedia', () => {
  let component: PostMedia
  let fixture: ComponentFixture<PostMedia>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostMedia],
    }).compileComponents()

    fixture = TestBed.createComponent(PostMedia)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
