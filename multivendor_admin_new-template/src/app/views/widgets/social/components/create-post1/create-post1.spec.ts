import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CreatePost1 } from './create-post1'

describe('CreatePost1', () => {
  let component: CreatePost1
  let fixture: ComponentFixture<CreatePost1>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePost1],
    }).compileComponents()

    fixture = TestBed.createComponent(CreatePost1)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
