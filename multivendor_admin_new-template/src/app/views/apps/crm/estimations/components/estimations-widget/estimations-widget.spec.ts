import { ComponentFixture, TestBed } from '@angular/core/testing'
import { EstimationsWidget } from './estimations-widget'

describe('EstimationsWidget', () => {
  let component: EstimationsWidget
  let fixture: ComponentFixture<EstimationsWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstimationsWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(EstimationsWidget)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
