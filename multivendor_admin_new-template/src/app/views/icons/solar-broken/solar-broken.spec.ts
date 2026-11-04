import { ComponentFixture, TestBed } from '@angular/core/testing'
import { SolarBroken } from './solar-broken'

describe('SolarBroken', () => {
  let component: SolarBroken
  let fixture: ComponentFixture<SolarBroken>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolarBroken],
    }).compileComponents()

    fixture = TestBed.createComponent(SolarBroken)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
