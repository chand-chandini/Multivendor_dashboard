import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AudienceInsights } from './audience-insights'

describe('AudienceInsights', () => {
  let component: AudienceInsights
  let fixture: ComponentFixture<AudienceInsights>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudienceInsights],
    }).compileComponents()

    fixture = TestBed.createComponent(AudienceInsights)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
