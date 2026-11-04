import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CreateSalarySlip } from './create-salary-slip'

describe('CreateSalarySlip', () => {
  let component: CreateSalarySlip
  let fixture: ComponentFixture<CreateSalarySlip>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSalarySlip],
    }).compileComponents()

    fixture = TestBed.createComponent(CreateSalarySlip)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
