import { ComponentFixture, TestBed } from '@angular/core/testing'
import { LeavesWidget } from './leaves-widget'

describe('LeavesWidget', () => {
  let component: LeavesWidget
  let fixture: ComponentFixture<LeavesWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeavesWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(LeavesWidget)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
