import { ComponentFixture, TestBed } from '@angular/core/testing'
import { SolarDuotone } from './solar-duotone'

describe('SolarDuotone', () => {
  let component: SolarDuotone
  let fixture: ComponentFixture<SolarDuotone>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolarDuotone],
    }).compileComponents()

    fixture = TestBed.createComponent(SolarDuotone)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
