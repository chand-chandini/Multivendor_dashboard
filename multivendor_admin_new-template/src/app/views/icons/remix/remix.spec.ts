import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Remix } from './remix'

describe('Remix', () => {
  let component: Remix
  let fixture: ComponentFixture<Remix>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Remix],
    }).compileComponents()

    fixture = TestBed.createComponent(Remix)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
