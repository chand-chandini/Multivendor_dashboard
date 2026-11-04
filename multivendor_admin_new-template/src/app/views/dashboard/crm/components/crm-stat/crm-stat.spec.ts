import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CrmStat } from './crm-stat'

describe('CrmStat', () => {
  let component: CrmStat
  let fixture: ComponentFixture<CrmStat>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrmStat],
    }).compileComponents()

    fixture = TestBed.createComponent(CrmStat)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
