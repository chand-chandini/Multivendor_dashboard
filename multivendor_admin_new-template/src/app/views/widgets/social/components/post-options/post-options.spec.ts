import { ComponentFixture, TestBed } from '@angular/core/testing'
import { PostOptions } from './post-options'

describe('PostOptions', () => {
  let component: PostOptions
  let fixture: ComponentFixture<PostOptions>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostOptions],
    }).compileComponents()

    fixture = TestBed.createComponent(PostOptions)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
