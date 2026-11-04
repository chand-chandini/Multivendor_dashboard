import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CreatePost2 } from './create-post2'

describe('CreatePost2', () => {
  let component: CreatePost2
  let fixture: ComponentFixture<CreatePost2>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePost2],
    }).compileComponents()

    fixture = TestBed.createComponent(CreatePost2)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
