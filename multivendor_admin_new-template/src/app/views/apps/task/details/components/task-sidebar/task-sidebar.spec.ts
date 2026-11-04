import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TaskSidebar } from './task-sidebar'

describe('TaskSidebar', () => {
  let component: TaskSidebar
  let fixture: ComponentFixture<TaskSidebar>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskSidebar],
    }).compileComponents()

    fixture = TestBed.createComponent(TaskSidebar)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
