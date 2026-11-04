import { ComponentFixture, TestBed } from '@angular/core/testing'
import { LeaveAdd } from './leave-add'

describe('LeaveAdd', () => {
  let component: LeaveAdd
  let fixture: ComponentFixture<LeaveAdd>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveAdd],
    }).compileComponents()

    fixture = TestBed.createComponent(LeaveAdd)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
