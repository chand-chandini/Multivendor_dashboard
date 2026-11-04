import { ComponentFixture, TestBed } from '@angular/core/testing'
import { LeadSource } from './lead-source'

describe('LeadSource', () => {
  let component: LeadSource
  let fixture: ComponentFixture<LeadSource>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadSource],
    }).compileComponents()

    fixture = TestBed.createComponent(LeadSource)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
